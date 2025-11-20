from threaddit.subthreads.models import Subthread, SubthreadInfo, Subscription, SubthreadCreateValidator
from flask_login import current_user, login_required
import re
from threaddit.users.models import User
from flask import Blueprint, jsonify, request
from threaddit.models import UserRole
from threaddit import db
from threaddit.auth.decorators import auth_role
from threaddit.posts.models import PostInfo
from marshmallow import ValidationError as MarshmallowValidationError

threads = Blueprint("threads", __name__, url_prefix="/api")
thread_name_regex = re.compile(r"^\w{3,}$")


@threads.route("/threads", methods=["GET"])
def get_subthreads():
    limit = request.args.get("limit", default=10, type=int)
    offset = request.args.get("offset", default=0, type=int)
    cur_user = current_user.id if current_user.is_authenticated else None
    subscribed_threads = []
    if current_user.is_authenticated:
        subscribed_threads = [
            subscription.subthread.as_dict(cur_user)
            for subscription in Subscription.query.filter_by(user_id=current_user.id).limit(limit).offset(offset).all()
        ]
    all_threads = [
        subinfo.as_dict()
        for subinfo in SubthreadInfo.query.filter(SubthreadInfo.members_count.is_not(None))
        .order_by(SubthreadInfo.members_count.desc())
        .limit(limit)
        .offset(offset)
        .all()
    ]
    popular_threads = [
        subinfo.as_dict()
        for subinfo in SubthreadInfo.query.filter(SubthreadInfo.posts_count.is_not(None))
        .order_by(SubthreadInfo.posts_count.desc())
        .limit(limit)
        .offset(offset)
        .all()
    ]
    return (
        jsonify(
            {
                "subscribed": subscribed_threads,
                "all": all_threads,
                "popular": popular_threads,
            }
        ),
        200,
    )


@threads.route("/threads/search", methods=["GET"])
def subthread_search():
    thread_name = request.args.get("name", default="", type=str)
    thread_name = f"%{thread_name}%"
    subthread_list = [
        subthread.as_dict() for subthread in SubthreadInfo.query.filter(SubthreadInfo.name.ilike(thread_name)).all()
    ]
    return jsonify(subthread_list), 200


@threads.route("/threads/get/all")
def get_all_thread():
    threads = Subthread.query.order_by(Subthread.name).all()
    return jsonify([t.as_dict() for t in threads]), 200


@threads.route("/subthread/all", methods=["GET"])
def get_all_subthreads():
    """Get all communities with minimal info (name, logo, title)"""
    subthreads = Subthread.query.order_by(Subthread.created_at.desc()).all()
    return jsonify([s.as_dict_minimal() for s in subthreads]), 200


@threads.route("/subthread/<name>", methods=["GET"])
def get_subthread_by_name(name):
    """Get full community details by name"""
    # Ensure name starts with t/
    if not name.startswith("t/"):
        name = f"t/{name.lower()}"
    else:
        name = name.lower()
    
    subthread = Subthread.query.filter_by(name=name).first()
    if not subthread:
        return jsonify({"message": "Community not found"}), 404
    
    cur_user_id = current_user.id if current_user.is_authenticated else None
    
    # Get posts for this subthread
    posts = PostInfo.query.filter_by(thread_id=subthread.id).order_by(PostInfo.created_at.desc()).limit(20).all()
    posts_data = [p.as_dict(cur_user_id) for p in posts]
    
    return jsonify({
        "subthread": subthread.as_dict(cur_user_id=cur_user_id, include_full=True),
        "posts": posts_data,
    }), 200


@threads.route("/threads/<thread_name>")
def get_thread_by_name(thread_name):
    """Legacy endpoint - kept for backward compatibility"""
    thread_info = SubthreadInfo.query.filter_by(name=f"t/{thread_name}").first()
    subthread = Subthread.query.filter_by(name=f"t/{thread_name}").first()
    if not thread_info and subthread:
        return jsonify({"message": "Thread not found"}), 404
    return (
        jsonify(
            {
                "threadData": thread_info.as_dict()
                | subthread.as_dict(current_user.id if current_user.is_authenticated else None)
            }
        ),
        200,
    )


@threads.route("threads/subscription/<tid>", methods=["POST"])
@login_required
def new_subscription(tid):
    Subscription.add(tid, current_user.id)
    return jsonify({"message": "Subscribed"}), 200


@threads.route("threads/subscription/<tid>", methods=["DELETE"])
@login_required
def del_subscription(tid):
    subscription = Subscription.query.filter_by(user_id=current_user.id, subthread_id=tid).first()
    if subscription:
        Subscription.query.filter_by(user_id=current_user.id, subthread_id=tid).delete()
        db.session.commit()
    else:
        return jsonify({"message": "Invalid Subscription"}), 400
    return jsonify({"message": "UnSubscribed"}), 200


@threads.route("/subthread/create", methods=["POST"])
@login_required
def create_subthread():
    """Create a new community/subthread with full details"""
    try:
        logo_image = request.files.get("logo")
        banner_image = request.files.get("banner")
        form_data = request.form.to_dict()
        
        # Validate required fields using Marshmallow
        validator = SubthreadCreateValidator()
        validated_data = validator.load({
            "name": form_data.get("name"),
            "title": form_data.get("title"),
            "description": form_data.get("description"),
            "rules": form_data.get("rules"),
        })
        
        # Prepare form_data with content types
        if logo_image:
            form_data["logo_content_type"] = "image"
            form_data["logo_url"] = None
        elif form_data.get("logo_url"):
            form_data["logo_content_type"] = "url"
        else:
            form_data["logo_content_type"] = None
        
        if banner_image:
            form_data["banner_content_type"] = "image"
            form_data["banner_url"] = None
        elif form_data.get("banner_url"):
            form_data["banner_content_type"] = "url"
        else:
            form_data["banner_content_type"] = None
        
        # Create subthread
        subthread = Subthread.add(form_data, logo_image, banner_image, current_user.id)
        
        # Auto-add creator as moderator
        UserRole.add_moderator(current_user.id, subthread.id)
        
        return jsonify({
            "message": "Community created successfully",
            "subthread": subthread.as_dict(cur_user_id=current_user.id)
        }), 201
        
    except MarshmallowValidationError as e:
        error_messages = e.messages
        if isinstance(error_messages, dict):
            first_error = list(error_messages.values())[0]
            if isinstance(first_error, list):
                error_message = first_error[0]
            else:
                error_message = str(first_error)
        else:
            error_message = str(error_messages)
        return jsonify({"message": error_message}), 400
    except Exception as e:
        return jsonify({"message": f"Error creating community: {str(e)}"}), 500


@threads.route("/thread", methods=["POST"])
@login_required
def new_thread():
    """Legacy endpoint - kept for backward compatibility"""
    image = request.files.get("media")
    form_data = request.form.to_dict()
    if not (name := form_data.get("name")) or not thread_name_regex.match(name):
        return jsonify({"message": "Thread name is required"}), 400
    
    # Convert legacy format to new format
    form_data["title"] = form_data.get("title") or form_data.get("name")
    form_data["description"] = form_data.get("description") or ""
    form_data["logo_content_type"] = "image" if image else None
    form_data["logo_url"] = form_data.get("content_url")
    form_data["banner_content_type"] = None
    
    subthread = Subthread.add(form_data, image, None, current_user.id)
    if subthread:
        UserRole.add_moderator(current_user.id, subthread.id)
        return jsonify({"message": "Thread created"}), 200
    return jsonify({"message": "Something went wrong"}), 500


@threads.route("/thread/<tid>", methods=["PATCH"])
@login_required
@auth_role(["admin", "mod"])
def update_thread(tid):
    thread = Subthread.query.filter_by(id=tid).first()
    if not thread:
        return jsonify({"message": "Invalid Thread"}), 400
    logo_image = request.files.get("logo") or request.files.get("media")  # Support legacy "media"
    banner_image = request.files.get("banner")
    form_data = request.form.to_dict()
    
    # Handle legacy format
    if request.files.get("media") and not logo_image:
        form_data["logo_content_type"] = "image"
        form_data["logo_url"] = form_data.get("content_url")
    elif form_data.get("content_type"):
        form_data["logo_content_type"] = form_data.get("content_type")
        form_data["logo_url"] = form_data.get("content_url")
    
    thread.patch(form_data, logo_image, banner_image)
    return (
        jsonify(
            {
                "message": "Thread updated",
                "new_data": {"threadData": thread.as_dict(current_user.id if current_user.is_authenticated else None)},
            }
        ),
        200,
    )


@threads.route("/thread/mod/<tid>/<username>", methods=["PUT"])
@login_required
@auth_role(["admin", "mod"])
def new_mod(tid, username):
    user = User.query.filter_by(username=username).first()
    if user:
        UserRole.add_moderator(user.id, tid)
        return jsonify({"message": "Moderator added"}), 200
    return jsonify({"message": "Invalid User"}), 400


@threads.route("/thread/mod/<tid>/<username>", methods=["DELETE"])
@login_required
@auth_role(["admin", "mod"])
def delete_mod(tid, username):
    user = User.query.filter_by(username=username).first()
    thread = Subthread.query.filter_by(id=tid).first()
    if user and thread:
        if thread.created_by == user.id and not current_user.has_role("admin"):
            return jsonify({"message": "Cannot Remove Thread Creator"}), 400
        UserRole.query.filter_by(user_id=user.id, subthread_id=tid).delete()
        db.session.commit()
        return jsonify({"message": "Moderator deleted"}), 200
    return jsonify({"message": "Invalid User"}), 400
