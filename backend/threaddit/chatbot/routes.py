from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from threaddit import db
from threaddit.rag_adapter import rag_query, RAGServiceError
from threaddit.chatbot.models import ChatHistory
from threaddit.chatbot.config import (
    POLITICAL_KEYWORDS,
    PII_PATTERNS,
    ILLEGAL_PATTERNS,
    SOURCE_REDACTION_KEYWORDS,
    RATE_LIMIT_PER_MINUTE_IP,
    RATE_LIMIT_PER_MINUTE_USER
)
import re
import time
import logging
from typing import Dict, List, Tuple
from collections import defaultdict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

chatbot = Blueprint("chatbot", __name__, url_prefix="/api/chat")

_rate_limit_ips: Dict[str, List[float]] = defaultdict(list)
_rate_limit_users: Dict[int, List[float]] = defaultdict(list)

_analytics_counters = {
    "total_requests": 0,
    "blocked_requests": 0,
    "response_times": [],
    "query_keywords": defaultdict(int),
    "source_hits": defaultdict(int),
    "last_7_days": defaultdict(int)
}


def _check_rate_limit(identifier: str, is_user: bool = False) -> Tuple[bool, str]:
    now = time.time()
    limit = RATE_LIMIT_PER_MINUTE_USER if is_user else RATE_LIMIT_PER_MINUTE_IP
    storage = _rate_limit_users if is_user else _rate_limit_ips
    
    storage[identifier] = [t for t in storage[identifier] if now - t < 60]
    
    if len(storage[identifier]) >= limit:
        return False, f"You are sending messages too quickly. Please wait a moment."
    
    storage[identifier].append(now)
    return True, ""


def _check_content_safety(query: str) -> Tuple[bool, str]:
    query_lower = query.lower()
    
    for pattern in PII_PATTERNS:
        if re.search(pattern, query, re.IGNORECASE):
            return False, "Your query contains potentially sensitive information. Please remove personal details and try again."
    
    for pattern in ILLEGAL_PATTERNS:
        if re.search(pattern, query_lower):
            return False, "Your query contains inappropriate content. Please rephrase your question."
    
    return True, ""


def _check_political_content(query: str) -> bool:
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in POLITICAL_KEYWORDS)


def _sanitize_sources(sources: List[Dict]) -> Tuple[List[Dict], bool]:
    sanitized = []
    redacted = False
    
    for source in sources:
        snippet = source.get("snippet", "")
        title = source.get("title", "")
        
        should_redact = False
        for keyword in SOURCE_REDACTION_KEYWORDS:
            if keyword.lower() in snippet.lower() or keyword.lower() in title.lower():
                should_redact = True
                redacted = True
                break
        
        if should_redact:
            sanitized.append({
                "title": "[Redacted]",
                "snippet": "This source has been redacted for privacy reasons.",
                "url": None,
                "score": source.get("score")
            })
        else:
            sanitized.append(source)
    
    return sanitized, redacted


def _extract_keywords(query: str) -> List[str]:
    words = re.findall(r'\b[a-z]{4,}\b', query.lower())
    stop_words = {"what", "when", "where", "who", "why", "how", "the", "and", "or", "but", "for", "with", "from", "this", "that", "these", "those"}
    keywords = [w for w in words if w not in stop_words]
    return keywords[:5]  


@chatbot.route("/query", methods=["POST"])
def query():
    start_time = time.time()
    
    try:
        if not request.json:
            return jsonify({"message": "Request body is required"}), 400
        
        query_text = request.json.get("query", "").strip()
        k = request.json.get("k", 5)
        
        if not query_text:
            return jsonify({"message": "Query cannot be empty"}), 400
        
        if k < 1 or k > 20:
            return jsonify({"message": "k must be between 1 and 20"}), 400
        
        user_id = None
        identifier = request.remote_addr  # IP address
        is_user = False
        
        if current_user.is_authenticated:
            user_id = current_user.id
            identifier = f"user_{user_id}"
            is_user = True
        
        allowed, rate_limit_msg = _check_rate_limit(identifier, is_user)
        if not allowed:
            _analytics_counters["blocked_requests"] += 1
            return jsonify({"message": rate_limit_msg}), 429
        
        is_safe, safety_reason = _check_content_safety(query_text)
        if not is_safe:
            _analytics_counters["blocked_requests"] += 1
            return jsonify({"message": safety_reason}), 400
        
        is_political = _check_political_content(query_text)
        
        try:
            result = rag_query(query_text, k=k, user_id=user_id)
        except RAGServiceError as e:
            error_msg = str(e)
            if "unavailable" in error_msg.lower() or "connection" in error_msg.lower():
                return jsonify({"message": "AI Assistant is temporarily unavailable. Please try again later."}), 503
            return jsonify({"message": error_msg}), 503
        except ValueError as e:
            return jsonify({"message": str(e)}), 400
        
        sanitized_sources, redacted = _sanitize_sources(result.get("sources", []))
        
        response_time_ms = (time.time() - start_time) * 1000
        
        try:
            chat_entry = ChatHistory(
                user_id=user_id,
                ip_address=request.remote_addr if not user_id else None,
                query=query_text,
                answer=result.get("answer", "No answer available."),
                sources=sanitized_sources,
                is_political=is_political,
                response_time_ms=round(response_time_ms, 2)
            )
            db.session.add(chat_entry)
            db.session.commit()
        except Exception as e:
            logger.error(f"Error saving chat history: {str(e)}")
            db.session.rollback()
        
        _analytics_counters["total_requests"] += 1
        _analytics_counters["response_times"].append(response_time_ms)
        if len(_analytics_counters["response_times"]) > 1000:
            _analytics_counters["response_times"] = _analytics_counters["response_times"][-1000:]
        
        keywords = _extract_keywords(query_text)
        for keyword in keywords:
            _analytics_counters["query_keywords"][keyword] += 1
        
        for source in sanitized_sources:
            source_title = source.get("title", "Unknown")
            _analytics_counters["source_hits"][source_title] += 1
        
        today = datetime.now().date().isoformat()
        _analytics_counters["last_7_days"][today] += 1
        
        return jsonify({
            "answer": result.get("answer", "No answer available."),
            "sources": sanitized_sources,
            "meta": {
                "is_political": is_political,
                "response_time_ms": round(response_time_ms, 2)
            },
            "redacted_sources": redacted
        }), 200
        
    except Exception as e:
        logger.error(f"Error in chatbot query endpoint: {str(e)}")
        return jsonify({"message": "An error occurred processing your query"}), 500


@chatbot.route("/feedback", methods=["POST"])
@login_required
def feedback():
    try:
        if not request.json:
            return jsonify({"message": "Request body is required"}), 400
        
        rating = request.json.get("rating", "").lower()
        
        if rating not in ["helpful", "not_helpful"]:
            return jsonify({"message": "Rating must be 'helpful' or 'not_helpful'"}), 400
        
        if "feedback_counters" not in _analytics_counters:
            _analytics_counters["feedback_counters"] = {"helpful": 0, "not_helpful": 0}
        
        _analytics_counters["feedback_counters"][rating] += 1
        
        return jsonify({"message": "Feedback received"}), 200
        
    except Exception as e:
        logger.error(f"Error in feedback endpoint: {str(e)}")
        return jsonify({"message": "Error processing feedback"}), 500


@chatbot.route("/history", methods=["GET"])
@login_required
def get_chat_history():
    try:
        if not current_user.is_authenticated:
            return jsonify({"message": "Authentication required"}), 401
        
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=20, type=int)
        limit = request.args.get("limit", type=int)
        
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20
        
        query = ChatHistory.query.filter_by(user_id=current_user.id)
        
        query = query.order_by(ChatHistory.created_at.desc())
        
        if limit:
            if limit < 1 or limit > 1000:
                limit = 50
            history_items = query.limit(limit).all()
            history_data = [h.to_dict() for h in history_items]
            return jsonify({
                "history": history_data,
                "total": len(history_data),
                "page": 1,
                "per_page": len(history_data),
                "pages": 1
            }), 200
        
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        history_data = [h.to_dict() for h in paginated.items]
        
        return jsonify({
            "history": history_data,
            "total": paginated.total,
            "page": page,
            "per_page": per_page,
            "pages": paginated.pages
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        return jsonify({"message": "Error fetching chat history"}), 500


@chatbot.route("/history/<int:history_id>", methods=["DELETE"])
@login_required
def delete_chat_history(history_id):
    try:
        if not current_user.is_authenticated:
            return jsonify({"message": "Authentication required"}), 401
        
        chat_entry = ChatHistory.query.get(history_id)
        
        if not chat_entry:
            return jsonify({"message": "Chat history entry not found"}), 404
        
        if chat_entry.user_id != current_user.id:
            return jsonify({"message": "Forbidden"}), 403
        
        db.session.delete(chat_entry)
        db.session.commit()
        
        return jsonify({"message": "Chat history deleted successfully"}), 200
        
    except Exception as e:
        logger.error(f"Error deleting chat history: {str(e)}")
        db.session.rollback()
        return jsonify({"message": "Error deleting chat history"}), 500


@chatbot.route("/history/clear", methods=["DELETE"])
@login_required
def clear_all_chat_history():
    try:
        if not current_user.is_authenticated:
            return jsonify({"message": "Authentication required"}), 401
        
        deleted_count = ChatHistory.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        
        return jsonify({
            "message": "All chat history cleared successfully",
            "deleted_count": deleted_count
        }), 200
        
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        db.session.rollback()
        return jsonify({"message": "Error clearing chat history"}), 500


@chatbot.route("/analytics/summary", methods=["GET"])
@login_required
def analytics_summary():
    from threaddit.auth.decorators import auth_role
    
    if not current_user.is_authenticated:
        return jsonify({"message": "Unauthorized"}), 401
    
    if not (current_user.has_role("admin") or current_user.has_role("mod")):
        return jsonify({"message": "Unauthorized"}), 401
    
    try:
        response_times = _analytics_counters.get("response_times", [])
        avg_response_time_ms = sum(response_times) / len(response_times) if response_times else 0
        
        last_7_days_data = []
        for i in range(7):
            date = (datetime.now() - timedelta(days=i)).date().isoformat()
            count = _analytics_counters["last_7_days"].get(date, 0)
            last_7_days_data.append({"date": date, "count": count})
        last_7_days_data.reverse()  
        
        top_keywords = sorted(
            _analytics_counters["query_keywords"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        top_queries_by_keyword = [{"keyword": k, "count": v} for k, v in top_keywords]
        
        top_sources = sorted(
            _analytics_counters["source_hits"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        top_sources_hit = [{"source": s, "count": c} for s, c in top_sources]
        
        feedback_counters = _analytics_counters.get("feedback_counters", {"helpful": 0, "not_helpful": 0})
        
        return jsonify({
            "total_requests_last_7_days": sum(_analytics_counters["last_7_days"].values()),
            "blocked_requests_count": _analytics_counters["blocked_requests"],
            "avg_response_time_ms": round(avg_response_time_ms, 2),
            "top_queries_by_keyword": top_queries_by_keyword,
            "top_sources_hit": top_sources_hit,
            "requests_last_7_days": last_7_days_data,
            "feedback": feedback_counters
        }), 200
        
    except Exception as e:
        logger.error(f"Error in analytics endpoint: {str(e)}")
        return jsonify({"message": "Error fetching analytics"}), 500
