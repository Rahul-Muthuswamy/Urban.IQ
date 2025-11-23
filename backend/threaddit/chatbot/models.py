from threaddit import db
from datetime import datetime
from sqlalchemy import Index
import json


class ChatHistory(db.Model):
    """
    ChatHistory model for storing AI Assistant chat history.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to users table (nullable for guest users)
        ip_address: IP address of the user (for guest tracking)
        query: The user's query/question
        answer: The AI's response
        sources: JSON array of sources used for the answer
        is_political: Boolean flag indicating if query contains political content
        response_time_ms: Response time in milliseconds
        created_at: Timestamp when the chat entry was created
    """
    __tablename__ = "chat_history"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 max length
    query = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    sources = db.Column(db.JSON, nullable=True)  # Store sources as JSON
    is_political = db.Column(db.Boolean, default=False, nullable=False)
    response_time_ms = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    
    # Relationships
    user = db.relationship("User", foreign_keys=[user_id], backref="chat_history")
    
    # Indexes
    __table_args__ = (
        Index("idx_chat_history_user_id", "user_id"),
        Index("idx_chat_history_created_at", "created_at"),
    )
    
    def __init__(self, user_id=None, ip_address=None, query="", answer="", sources=None, is_political=False, response_time_ms=None):
        """
        Initialize a new ChatHistory instance.
        
        Args:
            user_id: ID of the user (None for guests)
            ip_address: IP address of the user
            query: The user's query
            answer: The AI's response
            sources: List of source dictionaries
            is_political: Whether query contains political content
            response_time_ms: Response time in milliseconds
        """
        self.user_id = user_id
        self.ip_address = ip_address
        self.query = query
        self.answer = answer
        self.sources = sources if sources else []
        self.is_political = is_political
        self.response_time_ms = response_time_ms
    
    def to_dict(self):
        """
        Convert chat history entry to dictionary format for JSON serialization.
        
        Returns:
            dict: Chat history data
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "query": self.query,
            "answer": self.answer,
            "sources": self.sources if self.sources else [],
            "is_political": self.is_political,
            "response_time_ms": self.response_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }



