from threaddit.messages.models import Messages
from flask import Blueprint, jsonify, request
from threaddit import db
from sqlalchemy import and_, or_
from threaddit.users.models import User
from flask_login import login_required, current_user
from sqlalchemy import func

messages = Blueprint("messages", __name__, url_prefix="/api")


@messages.route("/messages", methods=["POST"])
@login_required
def new_message():
    """Send a new message to a user."""
    try:
        # Check if request has JSON data
        if not request.is_json:
            return jsonify({"message": "Content-Type must be application/json"}), 400
        
        if not request.json:
            return jsonify({"message": "Request body is required"}), 400
        
        form_data = request.json
        receiver_username = form_data.get("receiver")
        content = form_data.get("content", "").strip()
        
        # Validate receiver username
        if not receiver_username:
            return jsonify({"message": "Receiver username is required"}), 400
        
        # Validate content
        if not content:
            return jsonify({"message": "Message content cannot be empty"}), 400
        
        # Prevent self-messaging
        if receiver_username == current_user.username:
            return jsonify({"message": "You cannot send a message to yourself"}), 400
        
        # Find receiver user
        receiver = User.query.filter_by(username=receiver_username).first()
        if not receiver:
            return jsonify({"message": f"User '{receiver_username}' not found"}), 404
        
        # Create new message
        new_message = Messages(
            sender_id=current_user.id,
            receiver_id=receiver.id,
            content=content,
        )
        db.session.add(new_message)
        db.session.commit()
        
        # Refresh to get the created_at timestamp and relationships
        db.session.refresh(new_message)
        
        # Ensure relationships are loaded
        if not new_message.user_sender:
            db.session.refresh(new_message, ["user_sender"])
        if not new_message.user_receiver:
            db.session.refresh(new_message, ["user_receiver"])
        
        # Return message data with is_sent flag for frontend
        try:
            message_dict = new_message.as_dict()
            message_dict["is_sent"] = True
            print(f"[Messages] Message sent successfully: {current_user.username} -> {receiver_username}, Message ID: {new_message.id}")
            return jsonify(message_dict), 200
        except Exception as dict_error:
            print(f"[Messages] Error converting message to dict: {str(dict_error)}")
            # Return minimal response if as_dict fails
            return jsonify({
                "message_id": new_message.id,
                "content": new_message.content,
                "created_at": new_message.created_at.isoformat() if new_message.created_at else None,
                "is_sent": True,
                "sender": {"username": current_user.username},
                "receiver": {"username": receiver_username},
            }), 200
        
    except Exception as e:
        print(f"[Messages] Error sending message: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": f"Error sending message: {str(e)}"}), 500


@messages.route("/messages/inbox")
@login_required
def get_inbox():
    """Get inbox with all conversations and unread counts."""
    try:
        inbox_data = Messages.get_inbox(current_user.id)
        
        # Calculate unread counts for each conversation
        for conversation in inbox_data:
            contact_username = conversation.get("sender", {}).get("username")
            if contact_username:
                contact = User.query.filter_by(username=contact_username).first()
                if contact:
                    unread_count = Messages.query.filter(
                        and_(
                            Messages.sender_id == contact.id,
                            Messages.receiver_id == current_user.id,
                            Messages.seen == False
                        )
                    ).count()
                    conversation["unread_count"] = unread_count
        
        return jsonify(inbox_data), 200
    except Exception as e:
        print(f"[Messages] Error fetching inbox: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error fetching inbox: {str(e)}"}), 500


@messages.route("/messages/all/<user_name>")
@login_required
def get_messages(user_name):
    """Get all messages in a conversation with a specific user."""
    try:
        other_user = User.query.filter_by(username=user_name).first()
        if not other_user:
            return jsonify({"message": "User not found"}), 404
        
        # Get all messages between current user and other user
        conversation_messages = Messages.query.filter(
            or_(
                and_(Messages.sender_id == current_user.id, Messages.receiver_id == other_user.id),
                and_(Messages.sender_id == other_user.id, Messages.receiver_id == current_user.id)
            )
        ).order_by(Messages.created_at.asc()).all()
        
        # Mark messages as seen (only messages sent to current user)
        for message in conversation_messages:
            if message.receiver_id == current_user.id and not message.seen:
                message.seen = True
                message.seen_at = func.now()
        
        db.session.commit()
        
        # Format messages for response
        messages_list = []
        for msg in conversation_messages:
            msg_dict = msg.as_dict()
            msg_dict["is_sent"] = msg.sender_id == current_user.id
            msg_dict["created_at"] = msg.created_at.isoformat() if msg.created_at else None
            msg_dict["seen_at"] = msg.seen_at.isoformat() if msg.seen_at else None
            messages_list.append(msg_dict)
        
        return jsonify(messages_list), 200
    except Exception as e:
        print(f"[Messages] Error fetching messages: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"message": f"Error fetching messages: {str(e)}"}), 500


@messages.route("/messages/unread/count")
@login_required
def get_unread_count():
    """Get total unread messages count for current user."""
    try:
        unread_count = Messages.query.filter(
            and_(
                Messages.receiver_id == current_user.id,
                Messages.seen == False
            )
        ).count()
        
        return jsonify({"unread_count": unread_count}), 200
    except Exception as e:
        print(f"[Messages] Error fetching unread count: {str(e)}")
        return jsonify({"message": f"Error fetching unread count: {str(e)}"}), 500


@messages.route("/messages/<int:message_id>/read", methods=["PUT"])
@login_required
def mark_message_read(message_id):
    """Mark a specific message as read."""
    try:
        message = Messages.query.filter_by(id=message_id).first()
        if not message:
            return jsonify({"message": "Message not found"}), 404
        
        if message.receiver_id != current_user.id:
            return jsonify({"message": "Unauthorized"}), 403
        
        if not message.seen:
            message.seen = True
            message.seen_at = func.now()
            db.session.commit()
        
        return jsonify({"message": "Message marked as read"}), 200
    except Exception as e:
        print(f"[Messages] Error marking message as read: {str(e)}")
        db.session.rollback()
        return jsonify({"message": f"Error marking message as read: {str(e)}"}), 500
