import requests
import logging
from typing import Dict, Optional, Any
from threaddit.chatbot.config import RAG_SERVICE_URL, RAG_SERVICE_TIMEOUT

logger = logging.getLogger(__name__)


class RAGServiceError(Exception):
    pass


def rag_query(query: str, k: int = 5, user_id: Optional[int] = None) -> Dict[str, Any]:
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")
    
    if k < 1 or k > 20:
        raise ValueError("k must be between 1 and 20")
    
    try:
        payload = {
            "query": query.strip(),
            "k": k
        }
        
        logger.info(f"Calling RAG service: query='{query[:50]}...', k={k}, user_id={user_id}")
        
        response = requests.post(
            RAG_SERVICE_URL,
            json=payload,
            timeout=RAG_SERVICE_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()
        
        result = response.json()
        
        answer = result.get("answer", "No answer available.")
        
        sources = []
        retrieved = result.get("retrieved", [])
        
        for doc in retrieved:
            source = {
                "title": doc.get("source", "Unknown Source"),
                "snippet": doc.get("text", "")[:200] + "..." if len(doc.get("text", "")) > 200 else doc.get("text", ""),
                "url": None, 
                "score": doc.get("score", 0.0) if "score" in doc else None
            }
            sources.append(source)
        
        return {
            "answer": answer,
            "sources": sources,
            "status": result.get("status", "success"),
            "retrieved": retrieved  
        }
        
    except requests.exceptions.Timeout:
        logger.error(f"RAG service timeout after {RAG_SERVICE_TIMEOUT}s")
        raise RAGServiceError("RAG service timed out. Please try again later.")
    
    except requests.exceptions.ConnectionError:
        logger.error("RAG service connection error - service may be down")
        raise RAGServiceError("RAG service is currently unavailable. Please try again later.")
    
    except requests.exceptions.HTTPError as e:
        logger.error(f"RAG service HTTP error: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 400:
            error_detail = e.response.json().get("detail", "Invalid request")
            raise RAGServiceError(f"Invalid query: {error_detail}")
        raise RAGServiceError(f"RAG service error: {e.response.status_code}")
    
    except requests.exceptions.RequestException as e:
        logger.error(f"RAG service request error: {str(e)}")
        raise RAGServiceError(f"Error communicating with RAG service: {str(e)}")
    
    except Exception as e:
        logger.error(f"Unexpected error in RAG adapter: {str(e)}")
        raise RAGServiceError(f"Unexpected error: {str(e)}")



