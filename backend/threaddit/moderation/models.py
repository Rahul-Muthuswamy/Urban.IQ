from threaddit import db
from datetime import datetime
from sqlalchemy import Index


class DeletionHistory(db.Model):
    """
    DeletionHistory model for storing audit log of deleted posts.
    
    Attributes:
        id: Primary key
        post_id: ID of the deleted post
        deleted_by: Foreign key to users table (moderator/admin who deleted)
        reason: Optional moderator note/reason for deletion
        original_title: Title of the post before deletion
        original_content: Content of the post before deletion
        original_media: Media URL of the post before deletion
        original_author_id: ID of the post author
        original_author_username: Username of the post author
        created_at: Original post creation timestamp
        deleted_at: Timestamp when deletion occurred
        report_id: Optional linked report ID that triggered deletion
    """
    __tablename__ = "deletion_history"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    post_id = db.Column(db.Integer, nullable=False)
    deleted_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    reason = db.Column(db.Text, nullable=True)
    original_title = db.Column(db.Text, nullable=True)
    original_content = db.Column(db.Text, nullable=True)
    original_media = db.Column(db.Text, nullable=True)
    original_author_id = db.Column(db.Integer, nullable=True)
    original_author_username = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    report_id = db.Column(db.Integer, nullable=True)
    
    # Relationships
    deleted_by_user = db.relationship("User", foreign_keys=[deleted_by], backref="deletions")
    
    # Indexes
    __table_args__ = (
        Index("idx_deletion_history_deleted_at", "deleted_at"),
        Index("idx_deletion_history_post_id", "post_id"),
    )
    
    def __init__(self, post_id, deleted_by, reason=None, original_title=None, 
                 original_content=None, original_media=None, original_author_id=None,
                 original_author_username=None, created_at=None, report_id=None):
        """
        Initialize a new DeletionHistory instance.
        
        Args:
            post_id: ID of the deleted post
            deleted_by: ID of the moderator/admin who deleted
            reason: Optional reason for deletion
            original_title: Original post title
            original_content: Original post content
            original_media: Original post media URL
            original_author_id: Original author ID
            original_author_username: Original author username
            created_at: Original post creation time
            report_id: Optional linked report ID
        """
        self.post_id = post_id
        self.deleted_by = deleted_by
        self.reason = reason
        self.original_title = original_title
        self.original_content = original_content
        self.original_media = original_media
        self.original_author_id = original_author_id
        self.original_author_username = original_author_username
        if created_at:
            self.created_at = created_at
        self.report_id = report_id
    
    def to_dict(self):
        """
        Convert deletion history to dictionary format for JSON serialization.
        
        Returns:
            dict: Deletion history data
        """
        return {
            "id": self.id,
            "post_id": self.post_id,
            "deleted_by": self.deleted_by,
            "deleted_by_username": self.deleted_by_user.username if self.deleted_by_user else None,
            "reason": self.reason,
            "original_title": self.original_title,
            "original_content": self.original_content,
            "original_media": self.original_media,
            "original_author_id": self.original_author_id,
            "original_author_username": self.original_author_username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "deleted_at": self.deleted_at.isoformat() if self.deleted_at else None,
            "report_id": self.report_id,
        }

