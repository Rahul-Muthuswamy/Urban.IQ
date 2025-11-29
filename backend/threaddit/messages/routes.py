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
    try:
        if not request.is_json:
            return jsonify({"message": "Content-Type must be application/json"}), 400
        if not request.json:
            return jsonify({"message": "Request body is required"}), 400

        form_data = request.json
        receiver_username = form_data.get("receiver")
        content = form_data.get("content", "").strip()

        if not receiver_username:
            return jsonify({"message": "Receiver username is required"}), 400
        if not content:
            return jsonify({"message": "Message content cannot be empty"}), 400
        if receiver_username == current_user.username:
            return jsonify({"message": "You cannot send a message to yourself"}), 400

        receiver = User.query.filter_by(username=receiver_username).first()
        if not receiver:
            return jsonify({"message": f"User '{receiver_username}' not found"}), 404

        new_message = Messages(
            sender_id=current_user.id,
            receiver_id=receiver.id,
            content=content,
        )
        db.session.add(new_message)
        db.session.commit()

        db.session.refresh(new_message)

        if not new_message.user_sender:
            db.session.refresh(new_message, ["user_sender"])
        if not new_message.user_receiver:
            db.session.refresh(new_message, ["user_receiver"])

        try:
            message_dict = new_message.as_dict()
            message_dict["is_sent"] = True
            return jsonify(message_dict), 200
        except Exception:
            return jsonify({
                "message_id": new_message.id,
                "content": new_message.content,
                "created_at": new_message.created_at.isoformat() if new_message.created_at else None,
                "is_sent": True,
                "sender": {"username": current_user.username},
                "receiver": {"username": receiver_username},
            }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error sending message: {str(e)}"}), 500

@messages.route("/messages/inbox")
@login_required
def get_inbox():
    try:
        inbox_data = Messages.get_inbox(current_user.id)

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
        return jsonify({"message": f"Error fetching inbox: {str(e)}"}), 500

@messages.route("/messages/all/<user_name>")
@login_required
def get_messages(user_name):
    try:
        other_user = User.query.filter_by(username=user_name).first()
        if not other_user:
            return jsonify({"message": "User not found"}), 404

        if other_user.id == current_user.id:
            return jsonify({"message": "Cannot get messages with yourself"}), 400

        conversation_messages = Messages.query.filter(
            or_(
                and_(Messages.sender_id == current_user.id, Messages.receiver_id == other_user.id),
                and_(Messages.sender_id == other_user.id, Messages.receiver_id == current_user.id)
            )
        ).order_by(Messages.created_at.asc()).all()

        has_unread = False
        for message in conversation_messages:
            if message.receiver_id == current_user.id and not message.seen:
                message.seen = True
                message.seen_at = func.now()
                has_unread = True

        if has_unread:
            db.session.commit()

        messages_list = []
        for msg in conversation_messages:
            try:
                msg_dict = msg.as_dict()
                msg_dict["is_sent"] = msg.sender_id == current_user.id
                msg_dict["created_at"] = msg.created_at.isoformat() if msg.created_at else None
                msg_dict["seen_at"] = msg.seen_at.isoformat() if msg.seen_at else None
                messages_list.append(msg_dict)
            except Exception:
                continue

        return jsonify(messages_list), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error fetching messages: {str(e)}"}), 500

@messages.route("/messages/unread/count")
@login_required
def get_unread_count():
    try:
        unread_count = Messages.query.filter(
            and_(
                Messages.receiver_id == current_user.id,
                Messages.seen == False
            )
        ).count()
        return jsonify({"unread_count": unread_count}), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching unread count: {str(e)}"}), 500

@messages.route("/messages/<int:message_id>/read", methods=["PUT"])
@login_required
def mark_message_read(message_id):
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
        db.session.rollback()
        return jsonify({"message": f"Error marking message as read: {str(e)}"}), 500
