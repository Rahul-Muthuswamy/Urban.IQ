from threaddit import db
from sqlalchemy import case, func, and_


class Messages(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    content = db.Column(db.Text, nullable=False)
    seen = db.Column(db.Boolean, default=False)
    seen_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    user_sender = db.relationship("User", back_populates="sender", primaryjoin="Messages.sender_id == User.id")
    user_receiver = db.relationship(
        "User",
        back_populates="receiver",
        primaryjoin="Messages.receiver_id == User.id",
    )

    def __init__(self, sender_id, receiver_id, content):
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.content = content

    def as_dict(self):
        """Convert message to dictionary format."""
        try:
            return {
                "message_id": self.id,
                "sender": {
                    "id": self.user_sender.id if self.user_sender else None,
                    "username": self.user_sender.username if self.user_sender else None,
                    "avatar": self.user_sender.avatar if self.user_sender else None,
                },
                "receiver": {
                    "id": self.user_receiver.id if self.user_receiver else None,
                    "username": self.user_receiver.username if self.user_receiver else None,
                    "avatar": self.user_receiver.avatar if self.user_receiver else None,
                },
                "content": self.content or "",
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "seen": self.seen if self.seen is not None else False,
                "seen_at": self.seen_at.isoformat() if self.seen_at else None,
            }
        except Exception as e:
            print(f"[Messages.as_dict] Error converting message to dict: {str(e)}")
            # Return minimal dict if there's an error
            return {
                "message_id": self.id,
                "content": self.content or "",
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "seen": False,
            }

    @classmethod
    def get_inbox(cls, user_id):
        """Get inbox with all conversations, showing the latest message from each contact."""
        try:
            my_case = case(
                (Messages.sender_id == user_id, Messages.receiver_id),
                else_=Messages.sender_id,
            ).label("contact_id")
            my_max = func.max(Messages.id).label("latest_id")
            my_subquery = (
                db.session.query(my_case, my_max)
                .filter((Messages.sender_id == user_id) | (Messages.receiver_id == user_id))
                .group_by("contact_id")
                .subquery()
            )
            messages = (
                Messages.query.join(my_subquery, my_subquery.c.latest_id == Messages.id)
                .order_by(Messages.created_at.desc())
                .all()
            )
            messages_list = []
            for message in messages:
                if not message:
                    continue
                    
                # Determine the contact (the other user in the conversation)
                contact = message.user_receiver if message.sender_id == user_id else message.user_sender
                if not contact:
                    continue
                
                # Get unread count for this conversation
                unread_count = Messages.query.filter(
                    and_(
                        Messages.sender_id == contact.id,
                        Messages.receiver_id == user_id,
                        Messages.seen == False
                    )
                ).count()
                
                msg_dict = message.as_dict()
                messages_list.append({
                    **msg_dict,
                    "contact": {
                        "id": contact.id,
                        "username": contact.username,
                        "avatar": contact.avatar,
                    },
                    "latest_message": {
                        "content": message.content,
                        "created_at": message.created_at.isoformat() if message.created_at else None,
                        "is_from_me": message.sender_id == user_id,
                    },
                    "unread_count": unread_count,
                    "latest_from_user": message.sender_id == user_id,
                })
            return messages_list
        except Exception as e:
            print(f"[Messages.get_inbox] Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return []
