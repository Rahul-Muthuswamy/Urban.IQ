from flask import Blueprint, jsonify, request
from threaddit import db
from flask_login import current_user, login_required
from threaddit.posts.models import (
    PostInfo,
    Posts,
    PostValidator,
    get_filters,
    SavedPosts,
)
from threaddit.subthreads.models import Subscription, SubthreadInfo

posts = Blueprint("posts", __name__, url_prefix="/api")


@posts.route("/posts/<feed_name>", methods=["GET"])
def get_posts(feed_name):
    limit = request.args.get("limit", default=20, type=int)
    offset = request.args.get("offset", default=0, type=int)
    sortby = request.args.get("sortby", default="top", type=str)
    duration = request.args.get("duration", default="alltime", type=str)
    try:
        sortBy, durationBy = get_filters(sortby=sortby, duration=duration)
    except Exception:
        return jsonify({"message": "Invalid Request"}), 400
    if feed_name == "home" and current_user.is_authenticated:
        threads = [subscription.subthread.id for subscription in Subscription.query.filter_by(user_id=current_user.id)]
    elif feed_name == "all":
        threads = (thread.id for thread in SubthreadInfo.query.order_by(SubthreadInfo.members_count.desc()).limit(25))
    elif feed_name == "popular":
        threads = (thread.id for thread in SubthreadInfo.query.order_by(SubthreadInfo.posts_count.desc()).limit(25))
    else:
        return jsonify({"message": "Invalid Request"}), 400
    post_list = [
        pinfo.as_dict(cur_user=current_user.id if current_user.is_authenticated else None)
        for pinfo in PostInfo.query.filter(PostInfo.thread_id.in_(threads))
        .order_by(sortBy)
        .filter(durationBy)
        .limit(limit)
        .offset(offset)
        .all()
    ]
    return jsonify(post_list), 200


@posts.route("/post/<pid>", methods=["GET"])
def get_post(pid):
    post_info = PostInfo.query.filter_by(post_id=pid).first()
    if post_info:
        cur_user = current_user.id if current_user.is_authenticated else None
        return (
            jsonify({"post": post_info.as_dict(cur_user=cur_user)}),
            200,
        )
    return jsonify({"message": "Invalid Post"}), 400


@posts.route("/post", methods=["POST"])
@login_required
def new_post():
    image = request.files.get("media")
    form_data = request.form.to_dict()
    PostValidator().load(
        {
            "subthread_id": form_data.get("subthread_id"),
            "title": form_data.get("title"),
            "content": form_data.get("content"),
        }
    )
    Posts.add(form_data, image, current_user.id)
    return jsonify({"message": "Post created"}), 200


@posts.route("/post/<pid>", methods=["PATCH"])
@login_required
def update_post(pid):
    try:
        print(f"[Posts] PATCH /api/post/{pid} - Request received from user {current_user.id}")
        print(f"[Posts] Request content-type: {request.content_type}")
        print(f"[Posts] Request form data: {request.form.to_dict()}")
        print(f"[Posts] Request files: {list(request.files.keys())}")
        
        # Get the post first to check existence and ownership
        update_post = Posts.query.filter_by(id=pid).first()
        if not update_post:
            print(f"[Posts] Post {pid} not found")
            return jsonify({"message": "Invalid Post"}), 400
        
        if update_post.user_id != current_user.id:
            print(f"[Posts] Unauthorized: User {current_user.id} tried to update post {pid} owned by {update_post.user_id}")
            return jsonify({"message": "Unauthorized"}), 401
        
        # Get form data and file
        image = request.files.get("media")
        form_data = request.form.to_dict()
        
        print(f"[Posts] Form data received: {form_data}")
        print(f"[Posts] Media file present: {image is not None}")
        if image:
            print(f"[Posts] Media file name: {image.filename}, content-type: {image.content_type}")
        
        # Validate title if provided (required field)
        title = form_data.get("title", "").strip()
        if not title:
            print(f"[Posts] Validation failed: Title is required")
            return jsonify({"message": "Title is required"}), 400
        
        # Validate title length (matching frontend maxLength)
        if len(title) > 300:
            print(f"[Posts] Validation failed: Title too long ({len(title)} chars, max 300)")
            return jsonify({"message": "Title must be 300 characters or less"}), 400
        
        # Validate title minimum length
        if len(title) < 1:
            print(f"[Posts] Validation failed: Title is empty")
            return jsonify({"message": "Title is required"}), 400
        
        # Use existing subthread_id for validation (subthread shouldn't change on update)
        # Only validate if subthread_id is provided (optional for updates)
        if form_data.get("subthread_id"):
            try:
                PostValidator().load(
                    {
                        "subthread_id": form_data.get("subthread_id"),
                        "title": title,
                        "content": form_data.get("content", ""),
                    }
                )
            except Exception as e:
                print(f"[Posts] Validation error: {str(e)}")
                return jsonify({"message": f"Validation error: {str(e)}"}), 400
        
        # Update the post
        print(f"[Posts] Updating post {pid}...")
        update_post.patch(form_data, image)
        
        # Refresh the post to get updated data
        db.session.refresh(update_post)
        
        # Get updated post info
        post_info = PostInfo.query.filter_by(post_id=pid).first()
        if not post_info:
            print(f"[Posts] Warning: PostInfo not found for post {pid}")
            return jsonify({"message": "Post updated but info not found"}), 500
        
        print(f"[Posts] Post {pid} updated successfully")
        return (
            jsonify(
                {
                    "message": "Post updated",
                    "new_data": post_info.as_dict(current_user.id),
                }
            ),
            200,
        )
    except Exception as e:
        print(f"[Posts] Error updating post {pid}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error updating post: {str(e)}"}), 500


@posts.route("/post/<pid>", methods=["DELETE"])
@login_required
def delete_post(pid):
    post = Posts.query.filter_by(id=pid).first()
    if not post:
        return jsonify({"message": "Invalid Post"}), 400
    elif post.user_id == current_user.id or current_user.has_role("admin"):
        post.delete_media()
        Posts.query.filter_by(id=pid).delete()
        db.session.commit()
        return jsonify({"message": "Post deleted"}), 200
    current_user_mod_in = [r.subthread_id for r in current_user.user_role if r.role.slug == "mod"]
    if post.subthread_id in current_user_mod_in:
        post.delete_media()
        Posts.query.filter_by(id=pid).delete()
        db.session.commit()
        return jsonify({"message": "Post deleted"}), 200
    return jsonify({"message": "Unauthorized"}), 401


@posts.route("/posts/thread/<tid>", methods=["GET"])
def get_posts_of_thread(tid):
    limit = request.args.get("limit", default=20, type=int)
    offset = request.args.get("offset", default=0, type=int)
    sortby = request.args.get("sortby", default="top", type=str)
    duration = request.args.get("duration", default="alltime", type=str)
    try:
        sortBy, durationBy = get_filters(sortby=sortby, duration=duration)
    except Exception:
        return jsonify({"message": "Invalid Request"}), 400
    post_list = [
        pinfo.as_dict(current_user.id if current_user.is_authenticated else None)
        for pinfo in PostInfo.query.filter(PostInfo.thread_id == tid)
        .order_by(sortBy)
        .filter(durationBy)
        .limit(limit)
        .offset(offset)
        .all()
    ]
    return jsonify(post_list), 200


@posts.route("/posts/user/<user_name>", methods=["GET"])
def get_posts_of_user(user_name):
    limit = request.args.get("limit", default=20, type=int)
    offset = request.args.get("offset", default=0, type=int)
    sortby = request.args.get("sortby", default="top", type=str)
    duration = request.args.get("duration", default="alltime", type=str)
    try:
        sortBy, durationBy = get_filters(sortby=sortby, duration=duration)
    except Exception:
        return jsonify({"message": "Invalid Request"}), 400
    post_list = [
        pinfo.as_dict(current_user.id if current_user.is_authenticated else None)
        for pinfo in PostInfo.query.filter(PostInfo.user_name == user_name)
        .order_by(sortBy)
        .filter(durationBy)
        .limit(limit)
        .offset(offset)
        .all()
    ]
    return jsonify(post_list), 200


@posts.route("/posts/saved", methods=["GET"])
@login_required
def get_saved():
    limit = request.args.get("limit", default=20, type=int)
    offset = request.args.get("offset", default=0, type=int)
    saved_posts = SavedPosts.query.filter(SavedPosts.user_id == current_user.id).offset(offset).limit(limit).all()
    post_infos = [PostInfo.query.filter_by(post_id=pid.post_id) for pid in saved_posts]
    return (
        jsonify([p.first().as_dict(current_user.id) for p in post_infos]),
        200,
    )


@posts.route("/posts/saved/<pid>", methods=["DELETE"])
@login_required
def delete_saved(pid):
    saved_post = SavedPosts.query.filter_by(user_id=current_user.id, post_id=pid).first()
    if not saved_post:
        return jsonify({"message": "Invalid Post ID"}), 400
    SavedPosts.query.filter_by(user_id=current_user.id, post_id=pid).delete()
    db.session.commit()
    return jsonify({"message": "Saved Post deleted"}), 200


@posts.route("/posts/saved/<pid>", methods=["PUT"])
@login_required
def new_saved(pid):
    new_saved = SavedPosts(user_id=current_user.id, post_id=pid)
    db.session.add(new_saved)
    db.session.commit()
    return jsonify({"message": "Saved"}), 200
