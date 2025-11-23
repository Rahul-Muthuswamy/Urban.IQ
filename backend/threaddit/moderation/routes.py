from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from threaddit import db
from threaddit.posts.models import Posts, PostInfo
from threaddit.moderation.models import DeletionHistory
from threaddit.reports.models import Report
from threaddit.users.models import User
from threaddit.auth.decorators import auth_role
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from sqlalchemy.sql import cast
from sqlalchemy.types import Date


moderation = Blueprint("moderation", __name__, url_prefix="/api/mod")


@moderation.route("/posts/<int:post_id>", methods=["DELETE"])
@login_required
@auth_role(["admin", "mod"])
def delete_post(post_id):
    try:
        post = Posts.query.get(post_id)
        if not post:
            return jsonify({"message": "Post not found"}), 404
        
        report_id = request.args.get("report_id", type=int)
        
        reason = None
        if request.json:
            reason = request.json.get("reason")
        
        original_author_id = post.user_id
        original_author_username = None
        if post.user:
            original_author_username = post.user.username
        
        deletion_history = DeletionHistory(
            post_id=post_id,
            deleted_by=current_user.id,
            reason=reason,
            original_title=post.title,
            original_content=post.content,
            original_media=post.media,
            original_author_id=original_author_id,
            original_author_username=original_author_username,
            created_at=post.created_at,
            report_id=report_id
        )
        
        try:
            db.session.add(deletion_history)
            db.session.flush()  
            
            db.session.delete(post)
            db.session.commit()
            
            return jsonify({
                "success": True,
                "post_id": post_id,
                "deletion_id": deletion_history.id
            }), 200
            
        except Exception as e:
            db.session.rollback()
            raise e
        
    except Exception as e:
        return jsonify({"message": f"Error deleting post: {str(e)}"}), 500


@moderation.route("/analytics/summary", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def analytics_summary():
    try:
        total_reports = Report.query.count()
        pending_reports = Report.query.filter_by(status="pending").count()
        resolved_reports = Report.query.filter_by(status="resolved").count()
        
        total_deletions = DeletionHistory.query.count()
        
        seven_days_ago = datetime.now() - timedelta(days=7)
        deletions_last_7_days = db.session.query(
            cast(DeletionHistory.deleted_at, Date).label("date"),
            func.count(DeletionHistory.id).label("count")
        ).filter(
            DeletionHistory.deleted_at >= seven_days_ago
        ).group_by(
            cast(DeletionHistory.deleted_at, Date)
        ).order_by("date").all()
        
        deletions_last_7_days_data = [
            {"date": row.date.isoformat(), "count": row.count}
            for row in deletions_last_7_days
        ]
        
        reports_last_7_days = db.session.query(
            cast(Report.created_at, Date).label("date"),
            func.count(Report.id).label("count")
        ).filter(
            Report.created_at >= seven_days_ago
        ).group_by(
            cast(Report.created_at, Date)
        ).order_by("date").all()
        
        reports_last_7_days_data = [
            {"date": row.date.isoformat(), "count": row.count}
            for row in reports_last_7_days
        ]
        
        return jsonify({
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "resolved_reports": resolved_reports,
            "total_deletions": total_deletions,
            "deletions_last_7_days": deletions_last_7_days_data,
            "reports_last_7_days": reports_last_7_days_data
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching analytics: {str(e)}"}), 500


@moderation.route("/analytics/top_reported_posts", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def top_reported_posts():
    try:
        limit = request.args.get("limit", default=10, type=int)
        
        top_reported = db.session.query(
            Report.post_id,
            func.count(Report.id).label("report_count")
        ).group_by(
            Report.post_id
        ).order_by(
            func.count(Report.id).desc()
        ).limit(limit).all()
        
        result = []
        for row in top_reported:
            post_info = PostInfo.query.filter_by(post_id=row.post_id).first()
            if post_info:
                result.append({
                    "post_id": row.post_id,
                    "title": post_info.title,
                    "report_count": row.report_count
                })
            else:
                post = Posts.query.get(row.post_id)
                if post:
                    result.append({
                        "post_id": row.post_id,
                        "title": post.title,
                        "report_count": row.report_count
                    })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching top reported posts: {str(e)}"}), 500


@moderation.route("/analytics/top_reporters", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def top_reporters():
    try:
        limit = request.args.get("limit", default=10, type=int)
        
        top_reporters = db.session.query(
            Report.reporter_id,
            func.count(Report.id).label("reports_count")
        ).group_by(
            Report.reporter_id
        ).order_by(
            func.count(Report.id).desc()
        ).limit(limit).all()
        
        result = []
        for row in top_reporters:
            user = User.query.get(row.reporter_id)
            if user:
                result.append({
                    "reporter_id": row.reporter_id,
                    "username": user.username,
                    "reports_count": row.reports_count
                })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching top reporters: {str(e)}"}), 500


@moderation.route("/deletions", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def get_deletions():
    try:
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=20, type=int)
        from_date = request.args.get("from_date", type=str)
        to_date = request.args.get("to_date", type=str)
        reporter_id = request.args.get("reporter_id", type=int)
        author_id = request.args.get("author_id", type=int)
        
        query = DeletionHistory.query
        
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                query = query.filter(DeletionHistory.deleted_at >= from_dt)
            except ValueError:
                pass
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                query = query.filter(DeletionHistory.deleted_at <= to_dt)
            except ValueError:
                pass
        
        if author_id:
            query = query.filter(DeletionHistory.original_author_id == author_id)
        
        if reporter_id:
            query = query.filter(DeletionHistory.report_id.isnot(None))
            query = query.join(Report, DeletionHistory.report_id == Report.id)
            query = query.filter(Report.reporter_id == reporter_id)
        
        query = query.order_by(DeletionHistory.deleted_at.desc())
        
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        deletions_data = [dh.to_dict() for dh in paginated.items]
        
        return jsonify({
            "deletions": deletions_data,
            "total": paginated.total,
            "page": page,
            "per_page": per_page,
            "pages": paginated.pages
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching deletions: {str(e)}"}), 500


@moderation.route("/reports", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def get_reports_with_details():
    try:
        from threaddit.reports.schemas import ReportSchema
        
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=20, type=int)
        status = request.args.get("status", default="pending", type=str)
        
        reports_query = Report.query.filter_by(status=status).order_by(Report.created_at.desc())
        
        paginated_reports = reports_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        reports_data = []
        for report in paginated_reports.items:
            report_dict = {
                "id": report.id,
                "post_id": report.post_id,
                "reporter": {
                    "id": report.reporter.id,
                    "username": report.reporter.username,
                },
                "reason": report.reason,
                "status": report.status,
                "created_at": report.created_at.isoformat() if report.created_at else None,
                "updated_at": report.updated_at.isoformat() if report.updated_at else None,
            }
            
            post_info = PostInfo.query.filter_by(post_id=report.post_id).first()
            if post_info:
                report_dict["post"] = {
                    "title": post_info.title,
                    "author_username": post_info.user_name,
                }
            else:
                post = Posts.query.get(report.post_id)
                if post and post.user:
                    report_dict["post"] = {
                        "title": post.title,
                        "author_username": post.user.username,
                    }
            
            reports_data.append(report_dict)
        
        return jsonify({
            "reports": reports_data,
            "total": paginated_reports.total,
            "page": page,
            "per_page": per_page,
            "pages": paginated_reports.pages
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching reports: {str(e)}"}), 500

