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
    """
    Delete a post and log deletion in audit history.
    
    Requires authentication and moderator/admin role.
    
    Query Parameters:
        report_id: Optional report ID that triggered this deletion
    
    Request Body (optional):
        reason: Optional moderator note/reason for deletion
    
    Returns:
        200: Post deleted successfully with deletion log ID
        404: Post not found
        401: Unauthorized (not mod/admin)
        500: Server error
    """
    try:
        # Get post
        post = Posts.query.get(post_id)
        if not post:
            return jsonify({"message": "Post not found"}), 404
        
        # Get optional report_id from query params
        report_id = request.args.get("report_id", type=int)
        
        # Get optional reason from request body
        reason = None
        if request.json:
            reason = request.json.get("reason")
        
        # Get post author info
        original_author_id = post.user_id
        original_author_username = None
        if post.user:
            original_author_username = post.user.username
        
        # Create deletion history record BEFORE deleting post
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
        
        # Use transaction to ensure atomicity
        try:
            db.session.add(deletion_history)
            db.session.flush()  # Get the deletion_history.id
            
            # Delete the post (this will cascade delete reports)
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
    """
    Get moderation analytics summary.
    
    Requires authentication and moderator/admin role.
    
    Returns:
        200: Analytics summary with counts and trends
        401: Unauthorized (not mod/admin)
        500: Server error
    """
    try:
        # Total reports
        total_reports = Report.query.count()
        pending_reports = Report.query.filter_by(status="pending").count()
        resolved_reports = Report.query.filter_by(status="resolved").count()
        
        # Total deletions
        total_deletions = DeletionHistory.query.count()
        
        # Deletions last 7 days
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
        
        # Reports last 7 days
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
    """
    Get top reported posts.
    
    Requires authentication and moderator/admin role.
    
    Query Parameters:
        limit: Number of results (default: 10)
    
    Returns:
        200: List of top reported posts
        401: Unauthorized (not mod/admin)
        500: Server error
    """
    try:
        limit = request.args.get("limit", default=10, type=int)
        
        # Get top reported posts
        top_reported = db.session.query(
            Report.post_id,
            func.count(Report.id).label("report_count")
        ).group_by(
            Report.post_id
        ).order_by(
            func.count(Report.id).desc()
        ).limit(limit).all()
        
        # Get post titles from PostInfo view or Posts table
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
                # Fallback to Posts table if PostInfo doesn't exist
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
    """
    Get top reporters (users who report most).
    
    Requires authentication and moderator/admin role.
    
    Query Parameters:
        limit: Number of results (default: 10)
    
    Returns:
        200: List of top reporters
        401: Unauthorized (not mod/admin)
        500: Server error
    """
    try:
        limit = request.args.get("limit", default=10, type=int)
        
        # Get top reporters
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
    """
    Get paginated deletion history with filters.
    
    Requires authentication and moderator/admin role.
    
    Query Parameters:
        page: Page number (default: 1)
        per_page: Items per page (default: 20)
        from_date: Filter deletions from this date (ISO format)
        to_date: Filter deletions to this date (ISO format)
        reporter_id: Filter by reporter ID (if report_id exists)
        author_id: Filter by original author ID
    
    Returns:
        200: Paginated deletion history
        401: Unauthorized (not mod/admin)
        500: Server error
    """
    try:
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=20, type=int)
        from_date = request.args.get("from_date", type=str)
        to_date = request.args.get("to_date", type=str)
        reporter_id = request.args.get("reporter_id", type=int)
        author_id = request.args.get("author_id", type=int)
        
        # Build query
        query = DeletionHistory.query
        
        # Apply filters
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
            # Filter by reporter_id through report_id
            # Join with reports table to filter by reporter_id
            # Only include deletions that have a report_id and match the reporter
            query = query.filter(DeletionHistory.report_id.isnot(None))
            query = query.join(Report, DeletionHistory.report_id == Report.id)
            query = query.filter(Report.reporter_id == reporter_id)
        
        # Order by deleted_at DESC
        query = query.order_by(DeletionHistory.deleted_at.desc())
        
        # Paginate
        paginated = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Serialize
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
    """
    Get reports with additional post and author details.
    
    Requires authentication and moderator/admin role.
    
    Query Parameters:
        page: Page number (default: 1)
        per_page: Items per page (default: 20)
        status: Filter by status ('pending' or 'resolved', default: 'pending')
    
    Returns:
        200: Paginated reports with post details
        401: Unauthorized (not mod/admin)
        500: Server error
    """
    try:
        from threaddit.reports.schemas import ReportSchema
        
        page = request.args.get("page", default=1, type=int)
        per_page = request.args.get("per_page", default=20, type=int)
        status = request.args.get("status", default="pending", type=str)
        
        # Query reports
        reports_query = Report.query.filter_by(status=status).order_by(Report.created_at.desc())
        
        # Paginate
        paginated_reports = reports_query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Serialize with additional details
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
            
            # Add post details if available
            post_info = PostInfo.query.filter_by(post_id=report.post_id).first()
            if post_info:
                report_dict["post"] = {
                    "title": post_info.title,
                    "author_username": post_info.user_name,
                }
            else:
                # Fallback to Posts table
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

