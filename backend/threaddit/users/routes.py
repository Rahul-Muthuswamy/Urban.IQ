from flask import Blueprint, request, jsonify
from threaddit import db
from threaddit.users.models import (
    UserLoginValidator,
    UserRegisterValidator,
    User,
)
from threaddit.auth.decorators import auth_role
from bcrypt import hashpw, checkpw, gensalt
from flask_login import login_user, logout_user, current_user, login_required
from threaddit.posts.models import Posts, PostInfo, SavedPosts
from threaddit.comments.models import Comments, CommentInfo
from threaddit.subthreads.models import Subscription
from threaddit.reports.models import Report
from threaddit.moderation.models import DeletionHistory
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta

user = Blueprint("users", __name__, url_prefix="/api")


@user.route("/user/login", methods=["POST"])
def user_login():
    if current_user.is_authenticated:
        return jsonify({"message": "Already logged in"}), 409
    if login_form := request.json:
        UserLoginValidator().load(login_form)
        user_info = User.query.filter_by(email=login_form.get("email")).first()
        # Check if user exists and has a password (not OAuth-only)
        if user_info and user_info.password_hash:
            if checkpw(login_form.get("password").encode(), user_info.password_hash.encode()):
                login_user(user_info, remember=True)  # remember=True ensures longer session
                return jsonify(user_info.as_dict()), 200
    return jsonify({"message": "Invalid credentials"}), 401


@user.route("/user/logout")
@login_required
def user_logout():
    logout_user()
    return jsonify({"message": "Successfully logged out"}), 200


@user.route("/user/register", methods=["POST"])
def user_register():
    if current_user.is_authenticated:
        return jsonify({"message": "Already logged in"}), 409
    if register_form := request.json:
        UserRegisterValidator().load(register_form)
        new_user = User(
            register_form.get("username"),
            register_form.get("email"),
            hashpw(register_form.get("password").encode(), gensalt()).decode("utf-8"),
        )
        new_user.add()
        return jsonify(new_user.as_dict()), 201
    return jsonify({"message": "Invalid credentials"}), 401


@user.route("/user", methods=["PATCH"])
@login_required
def user_patch():
    try:
        image = request.files.get("avatar")
        form_data = request.form.to_dict()
        
        print(f"[User Patch] Updating user {current_user.username}")
        print(f"[User Patch] Form data keys: {list(form_data.keys())}")
        print(f"[User Patch] Form data values: {form_data}")
        print(f"[User Patch] Has avatar file: {image is not None}")
        if image:
            print(f"[User Patch] Avatar filename: {image.filename}, content_type: {image.content_type}")
        
        # Ensure user is in the session
        if current_user not in db.session:
            db.session.add(current_user)
        
        # Update user
        current_user.patch(image=image, form_data=form_data)
        
        # Refresh the user object to ensure we have the latest data from database
        db.session.refresh(current_user)
        
        # Get updated user data
        updated_user = current_user.as_dict()
        
        print(f"[User Patch] Updated user data:")
        print(f"  - username: {updated_user.get('username')}")
        print(f"  - bio: {updated_user.get('bio')}")
        print(f"  - first_name: {updated_user.get('first_name')}")
        print(f"  - last_name: {updated_user.get('last_name')}")
        print(f"  - phone_number: {updated_user.get('phone_number')}")
        print(f"  - avatar: {updated_user.get('avatar')}")
        
        return jsonify(updated_user), 200
    except Exception as e:
        import traceback
        print(f"[User Patch] Error updating user: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error updating profile: {str(e)}"}), 500


@user.route("/user", methods=["DELETE"])
@login_required
def user_delete():
    current_user.delete_avatar()
    User.query.filter_by(id=current_user.id).delete()
    logout_user()
    db.session.commit()
    return jsonify({"message": "Successfully deleted"}), 200


@user.route("/user", methods=["GET"])
@login_required
def user_get():
    return jsonify(current_user.as_dict()), 200


@user.route("/user/<user_name>", methods=["GET"])
def user_get_by_username(user_name):
    user = User.query.filter_by(username=user_name).first()
    if user:
        return (
            jsonify(user.as_dict(include_all=False)),
            200,
        )
    else:
        return jsonify({"message": "User not found"}), 404


@user.route("/users", methods=["GET"])
@login_required
@auth_role(["admin"])
def users_get():
    return jsonify(User.get_all()), 200


@user.route("/user/search/<search>")
@login_required
def get_user(search):
    users = User.query.filter(User.username.ilike(f"%{search}%"))
    return jsonify([user.as_dict() for user in users]), 200


@user.route("/user/activity", methods=["GET"])
@login_required
def get_user_activity():
    """
    Get comprehensive user activity data including:
    - Posts count, Comments count, Communities joined, Saved posts count
    - Recent posts and comments
    - Activity timeline
    """
    try:
        user_id = current_user.id
        
        # Get counts
        posts_count = Posts.query.filter_by(user_id=user_id).count()
        comments_count = Comments.query.filter_by(user_id=user_id).count()
        subscriptions_count = Subscription.query.filter_by(user_id=user_id).count()
        saved_posts_count = SavedPosts.query.filter_by(user_id=user_id).count()
        
        # Get recent posts (last 5)
        try:
            recent_posts = PostInfo.query.filter(PostInfo.user_id == user_id)\
                .order_by(desc(PostInfo.created_at))\
                .limit(5)\
                .all()
        except Exception as e:
            print(f"[User Activity] Error fetching posts: {str(e)}")
            recent_posts = []
        
        recent_posts_data = []
        for post in recent_posts:
            if post:
                content = post.content or ""
                recent_posts_data.append({
                    "id": post.post_id,
                    "title": post.title or "Untitled",
                    "content": content[:100] + "..." if len(content) > 100 else content,
                    "community": post.thread_name or "Unknown",
                    "karma": post.post_karma or 0,
                    "comments_count": post.comments_count or 0,
                    "created_at": post.created_at.isoformat() if post.created_at else None,
                    "url": f"/posts/{post.post_id}"
                })
        
        # Get recent comments (last 5) - need to join with Comments and PostInfo
        from sqlalchemy.orm import joinedload
        try:
            recent_comments = db.session.query(CommentInfo, PostInfo, Comments)\
                .join(Comments, CommentInfo.comment_id == Comments.id)\
                .outerjoin(PostInfo, CommentInfo.post_id == PostInfo.post_id)\
                .filter(Comments.user_id == user_id)\
                .order_by(desc(CommentInfo.created_at))\
                .limit(5)\
                .all()
        except Exception as e:
            print(f"[User Activity] Error fetching comments: {str(e)}")
            recent_comments = []
        
        recent_comments_data = []
        for comment_info, post_info, comment in recent_comments:
            if comment_info:
                content = comment_info.content or ""
                recent_comments_data.append({
                    "id": comment_info.comment_id,
                    "content": content[:100] + "..." if len(content) > 100 else content,
                    "post_id": comment_info.post_id,
                    "post_title": post_info.title if post_info else "Unknown Post",
                    "karma": comment_info.comment_karma or 0,
                    "created_at": comment_info.created_at.isoformat() if comment_info.created_at else None,
                    "url": f"/posts/{comment_info.post_id}#comment-{comment_info.comment_id}"
                })
        
        # Get subscriptions (communities joined)
        try:
            subscriptions = Subscription.query.filter_by(user_id=user_id)\
                .order_by(desc(Subscription.created_at))\
                .limit(10)\
                .all()
        except Exception as e:
            print(f"[User Activity] Error fetching subscriptions: {str(e)}")
            subscriptions = []
        
        communities_data = []
        for sub in subscriptions:
            if sub and sub.subthread:
                subthread = sub.subthread
                subthread_info = subthread.subthread_info[0] if subthread.subthread_info else None
                communities_data.append({
                    "id": subthread.id,
                    "name": subthread.name or "Unknown",
                    "title": subthread.title or "Unknown",
                    "logo": subthread.logo,
                    "members_count": subthread_info.members_count if subthread_info else 0,
                    "joined_at": sub.created_at.isoformat() if sub.created_at else None,
                    "url": f"/t/{subthread.name.replace('t/', '')}" if subthread.name else "#"
                })
        
        # Get saved posts (last 5)
        try:
            saved_posts = SavedPosts.query.filter_by(user_id=user_id)\
                .order_by(desc(SavedPosts.created_at))\
                .limit(5)\
                .all()
        except Exception as e:
            print(f"[User Activity] Error fetching saved posts: {str(e)}")
            saved_posts = []
        
        saved_posts_data = []
        for saved in saved_posts:
            if saved and saved.post:
                post_info = saved.post.post_info[0] if saved.post.post_info else None
                if post_info:
                    content = post_info.content or ""
                    saved_posts_data.append({
                        "id": post_info.post_id,
                        "title": post_info.title or "Untitled",
                        "content": content[:100] + "..." if len(content) > 100 else content,
                        "community": post_info.thread_name or "Unknown",
                        "karma": post_info.post_karma or 0,
                        "saved_at": saved.created_at.isoformat() if saved.created_at else None,
                        "url": f"/posts/{post_info.post_id}"
                    })
                else:
                    saved_posts_data.append({
                        "id": None,
                        "title": "Deleted Post",
                        "content": "",
                        "community": None,
                        "karma": 0,
                        "saved_at": saved.created_at.isoformat() if saved.created_at else None,
                        "url": None
                    })
        
        # Create activity timeline (combine posts and comments, sorted by date)
        timeline_items = []
        
        for post in recent_posts[:3]:  # Last 3 posts
            content = post.content or ""
            timeline_items.append({
                "type": "post",
                "id": post.post_id,
                "title": post.title,
                "content": content[:80] + "..." if len(content) > 80 else content,
                "community": post.thread_name,
                "created_at": post.created_at.isoformat() if post.created_at else None,
                "url": f"/posts/{post.post_id}"
            })
        
        # Get post titles for timeline comments
        for comment_info, post_info, comment in recent_comments[:3]:  # Last 3 comments
            content = comment_info.content or ""
            timeline_items.append({
                "type": "comment",
                "id": comment_info.comment_id,
                "content": content[:80] + "..." if len(content) > 80 else content,
                "post_title": post_info.title if post_info else "Unknown Post",
                "post_id": comment_info.post_id,
                "created_at": comment_info.created_at.isoformat() if comment_info.created_at else None,
                "url": f"/posts/{comment_info.post_id}#comment-{comment_info.comment_id}"
            })
        
        # Sort timeline by created_at (most recent first)
        timeline_items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        timeline_items = timeline_items[:5]  # Top 5 most recent
        
        return jsonify({
            "stats": {
                "posts_count": posts_count,
                "comments_count": comments_count,
                "communities_joined": subscriptions_count,
                "saved_posts_count": saved_posts_count,
            },
            "recent_posts": recent_posts_data,
            "recent_comments": recent_comments_data,
            "communities": communities_data,
            "saved_posts": saved_posts_data,
            "timeline": timeline_items
        }), 200
        
    except Exception as e:
        import traceback
        print(f"[User Activity] Error fetching activity: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error fetching activity: {str(e)}"}), 500


@user.route("/users/activity", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def get_all_users_activity():
    """
    Get activity data for all users (moderator/admin only).
    Includes suspicious activity detection.
    """
    try:
        # Get query parameters
        limit = request.args.get("limit", default=50, type=int)
        offset = request.args.get("offset", default=0, type=int)
        search = request.args.get("search", default="", type=str)
        
        # Base query for all users
        users_query = User.query
        
        # Filter by search if provided
        if search:
            users_query = users_query.filter(
                User.username.ilike(f"%{search}%")
            )
        
        # Get users with pagination
        users = users_query.limit(limit).offset(offset).all()
        
        # Calculate suspicious activity for each user
        users_activity = []
        from datetime import timezone
        now = datetime.now(timezone.utc)
        one_hour_ago = now - timedelta(hours=1)
        one_day_ago = now - timedelta(days=1)
        seven_days_ago = now - timedelta(days=7)
        
        for user in users:
            user_id = user.id
            
            # Get basic stats
            posts_count = Posts.query.filter_by(user_id=user_id).count()
            comments_count = Comments.query.filter_by(user_id=user_id).count()
            subscriptions_count = Subscription.query.filter_by(user_id=user_id).count()
            
            # Get recent activity counts (using func.now() for timezone-aware comparison)
            posts_last_hour = Posts.query.filter(
                and_(
                    Posts.user_id == user_id,
                    Posts.created_at >= func.now() - timedelta(hours=1)
                )
            ).count()
            
            comments_last_hour = Comments.query.filter(
                and_(
                    Comments.user_id == user_id,
                    Comments.created_at >= func.now() - timedelta(hours=1)
                )
            ).count()
            
            posts_last_day = Posts.query.filter(
                and_(
                    Posts.user_id == user_id,
                    Posts.created_at >= func.now() - timedelta(days=1)
                )
            ).count()
            
            comments_last_day = Comments.query.filter(
                and_(
                    Comments.user_id == user_id,
                    Comments.created_at >= func.now() - timedelta(days=1)
                )
            ).count()
            
            # Get reports on user's posts
            user_posts = Posts.query.filter_by(user_id=user_id).all()
            post_ids = [p.id for p in user_posts]
            reports_count = Report.query.filter(Report.post_id.in_(post_ids)).count() if post_ids else 0
            pending_reports = Report.query.filter(
                and_(Report.post_id.in_(post_ids), Report.status == "pending")
            ).count() if post_ids else 0
            
            # Get deleted posts count
            deleted_posts_count = DeletionHistory.query.filter_by(original_author_id=user_id).count()
            
            # Get karma info
            karma_info = user.user_karma[0] if user.user_karma else None
            total_karma = karma_info.user_karma if karma_info else 0
            posts_karma = karma_info.posts_karma if karma_info else 0
            comments_karma = karma_info.comments_karma if karma_info else 0
            
            # Calculate suspicious activity score
            suspicious_flags = []
            suspicious_score = 0
            
            # Flag 1: Rapid posting (more than 10 posts in 1 hour)
            if posts_last_hour > 10:
                suspicious_flags.append({
                    "type": "rapid_posting",
                    "severity": "high",
                    "message": f"User posted {posts_last_hour} posts in the last hour",
                    "value": posts_last_hour
                })
                suspicious_score += 30
            
            # Flag 2: Rapid commenting (more than 20 comments in 1 hour)
            if comments_last_hour > 20:
                suspicious_flags.append({
                    "type": "rapid_commenting",
                    "severity": "medium",
                    "message": f"User made {comments_last_hour} comments in the last hour",
                    "value": comments_last_hour
                })
                suspicious_score += 20
            
            # Flag 3: High number of reports
            if reports_count > 5:
                suspicious_flags.append({
                    "type": "high_reports",
                    "severity": "high",
                    "message": f"User's posts have {reports_count} reports ({pending_reports} pending)",
                    "value": reports_count,
                    "pending": pending_reports
                })
                suspicious_score += 25
            
            # Flag 4: Many deleted posts
            if deleted_posts_count > 3:
                suspicious_flags.append({
                    "type": "deleted_posts",
                    "severity": "medium",
                    "message": f"User has {deleted_posts_count} deleted posts",
                    "value": deleted_posts_count
                })
                suspicious_score += 15
            
            # Flag 5: Negative karma trend
            if total_karma < -10:
                suspicious_flags.append({
                    "type": "negative_karma",
                    "severity": "low",
                    "message": f"User has negative karma: {total_karma}",
                    "value": total_karma
                })
                suspicious_score += 10
            
            # Flag 6: Very high activity in last day
            if posts_last_day > 50 or comments_last_day > 100:
                suspicious_flags.append({
                    "type": "excessive_activity",
                    "severity": "medium",
                    "message": f"User posted {posts_last_day} posts and {comments_last_day} comments in last 24 hours",
                    "value": {"posts": posts_last_day, "comments": comments_last_day}
                })
                suspicious_score += 20
            
            # Determine overall suspicious status
            is_suspicious = suspicious_score >= 30
            suspicious_level = "none"
            if suspicious_score >= 60:
                suspicious_level = "high"
            elif suspicious_score >= 40:
                suspicious_level = "medium"
            elif suspicious_score >= 30:
                suspicious_level = "low"
            
            # Get recent posts (last 3)
            recent_posts = PostInfo.query.filter(PostInfo.user_id == user_id)\
                .order_by(desc(PostInfo.created_at))\
                .limit(3)\
                .all()
            
            recent_posts_data = [
                {
                    "id": post.post_id,
                    "title": post.title,
                    "community": post.thread_name,
                    "karma": post.post_karma or 0,
                    "created_at": post.created_at.isoformat() if post.created_at else None,
                }
                for post in recent_posts
            ]
            
            users_activity.append({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "avatar": user.avatar,
                    "registration_date": user.registration_date.isoformat() if user.registration_date else None,
                },
                "stats": {
                    "posts_count": posts_count,
                    "comments_count": comments_count,
                    "communities_joined": subscriptions_count,
                    "total_karma": total_karma,
                    "posts_karma": posts_karma,
                    "comments_karma": comments_karma,
                },
                "recent_activity": {
                    "posts_last_hour": posts_last_hour,
                    "comments_last_hour": comments_last_hour,
                    "posts_last_day": posts_last_day,
                    "comments_last_day": comments_last_day,
                },
                "moderation": {
                    "reports_count": reports_count,
                    "pending_reports": pending_reports,
                    "deleted_posts_count": deleted_posts_count,
                },
                "suspicious_activity": {
                    "is_suspicious": is_suspicious,
                    "score": suspicious_score,
                    "level": suspicious_level,
                    "flags": suspicious_flags,
                },
                "recent_posts": recent_posts_data,
            })
        
        # Sort by suspicious score (highest first)
        users_activity.sort(key=lambda x: x["suspicious_activity"]["score"], reverse=True)
        
        # Get total count for pagination
        total_users = User.query.count()
        if search:
            total_users = User.query.filter(User.username.ilike(f"%{search}%")).count()
        
        return jsonify({
            "users": users_activity,
            "pagination": {
                "total": total_users,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total_users,
            },
            "summary": {
                "total_users": total_users,
                "suspicious_users": len([u for u in users_activity if u["suspicious_activity"]["is_suspicious"]]),
                "high_risk_users": len([u for u in users_activity if u["suspicious_activity"]["level"] == "high"]),
            }
        }), 200
        
    except Exception as e:
        import traceback
        print(f"[Users Activity] Error fetching all users activity: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error fetching users activity: {str(e)}"}), 500
