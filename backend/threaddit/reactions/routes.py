from flask import Blueprint, jsonify, request
from threaddit import db
from threaddit.reactions.models import Reactions
from flask_login import current_user, login_required

reactions = Blueprint("reactions", __name__, url_prefix="/api")


@reactions.route("/reactions/post/<post_id>", methods=["PATCH"])
@login_required
def update_reaction_post(post_id):
    try:
        if not request.json:
            return jsonify({"message": "Invalid Request"}), 400
        
        update_reaction = Reactions.query.filter_by(post_id=post_id, user_id=current_user.id).first()
        if not update_reaction:
            return jsonify({"message": "Reaction not found"}), 404
        
        is_upvote = request.json.get("is_upvote")
        if is_upvote is None:
            return jsonify({"message": "is_upvote is required"}), 400
        
        update_reaction.is_upvote = bool(is_upvote)
        db.session.commit()
        
        print(f"[Reactions] Updated reaction for post {post_id} by user {current_user.id}: is_upvote={is_upvote}")
        return jsonify({"message": "Reaction updated"}), 200
    except Exception as e:
        import traceback
        print(f"[Reactions] Error updating reaction: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error updating reaction: {str(e)}"}), 500


@reactions.route("/reactions/post/<post_id>", methods=["PUT"])
@login_required
def add_reaction_post(post_id):
    try:
        if not request.json:
            return jsonify({"message": "Invalid Request"}), 400
        
        is_upvote = request.json.get("is_upvote")
        if is_upvote is None:
            return jsonify({"message": "is_upvote is required"}), 400
        
        # Check if reaction already exists
        existing_reaction = Reactions.query.filter_by(post_id=post_id, user_id=current_user.id).first()
        if existing_reaction:
            return jsonify({"message": "Reaction already exists. Use PATCH to update."}), 409
        
        Reactions.add(user_id=current_user.id, is_upvote=bool(is_upvote), post_id=post_id)
        
        print(f"[Reactions] Added reaction for post {post_id} by user {current_user.id}: is_upvote={is_upvote}")
        return jsonify({"message": "Reaction added"}), 200
    except Exception as e:
        import traceback
        print(f"[Reactions] Error adding reaction: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error adding reaction: {str(e)}"}), 500


@reactions.route("/reactions/post/<post_id>", methods=["DELETE"])
@login_required
def delete_reaction_post(post_id):
    try:
        reaction = Reactions.query.filter_by(post_id=post_id, user_id=current_user.id).first()
        if not reaction:
            return jsonify({"message": "Reaction not found"}), 404
        
        Reactions.query.filter_by(post_id=post_id, user_id=current_user.id).delete()
        db.session.commit()
        
        print(f"[Reactions] Deleted reaction for post {post_id} by user {current_user.id}")
        return jsonify({"message": "Reaction deleted"}), 200
    except Exception as e:
        import traceback
        print(f"[Reactions] Error deleting reaction: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error deleting reaction: {str(e)}"}), 500


@reactions.route("/reactions/comment/<comment_id>", methods=["PATCH"])
@login_required
def update_reaction_comment(comment_id):
    try:
        if not request.json:
            return jsonify({"message": "Invalid Request"}), 400
        
        is_upvote = request.json.get("is_upvote")
        if is_upvote is None:
            return jsonify({"message": "is_upvote is required"}), 400
        
        reaction = Reactions.query.filter_by(comment_id=comment_id, user_id=current_user.id).first()
        if not reaction:
            return jsonify({"message": "Reaction not found"}), 404
        
        reaction.patch(bool(is_upvote))
        
        print(f"[Reactions] Updated reaction for comment {comment_id} by user {current_user.id}: is_upvote={is_upvote}")
        return jsonify({"message": "Reaction updated"}), 200
    except Exception as e:
        import traceback
        print(f"[Reactions] Error updating comment reaction: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error updating reaction: {str(e)}"}), 500


@reactions.route("/reactions/comment/<comment_id>", methods=["PUT"])
@login_required
def add_reaction_comment(comment_id):
    try:
        if not request.json:
            return jsonify({"message": "Invalid Request"}), 400
        
        is_upvote = request.json.get("is_upvote")
        if is_upvote is None:
            return jsonify({"message": "is_upvote is required"}), 400
        
        # Check if reaction already exists
        existing_reaction = Reactions.query.filter_by(comment_id=comment_id, user_id=current_user.id).first()
        if existing_reaction:
            return jsonify({"message": "Reaction already exists. Use PATCH to update."}), 409
        
        Reactions.add(user_id=current_user.id, is_upvote=bool(is_upvote), comment_id=comment_id)
        
        print(f"[Reactions] Added reaction for comment {comment_id} by user {current_user.id}: is_upvote={is_upvote}")
        return jsonify({"message": "Reaction added"}), 200
    except Exception as e:
        import traceback
        print(f"[Reactions] Error adding comment reaction: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error adding reaction: {str(e)}"}), 500


@reactions.route("/reactions/comment/<comment_id>", methods=["DELETE"])
@login_required
def delete_reaction_comment(comment_id):
    try:
        reaction = Reactions.query.filter_by(comment_id=comment_id, user_id=current_user.id).first()
        if not reaction:
            return jsonify({"message": "Reaction not found"}), 404
        
        Reactions.query.filter_by(comment_id=comment_id, user_id=current_user.id).delete()
        db.session.commit()
        
        print(f"[Reactions] Deleted reaction for comment {comment_id} by user {current_user.id}")
        return jsonify({"message": "Reaction deleted"}), 200
    except Exception as e:
        import traceback
        print(f"[Reactions] Error deleting comment reaction: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error deleting reaction: {str(e)}"}), 500
