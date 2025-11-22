from threaddit import db
from datetime import datetime
from sqlalchemy import Index


class Report(db.Model):
    """
    Report model for storing post reports.
    
    Attributes:
        id: Primary key
        post_id: Foreign key to posts table (CASCADE DELETE, CASCADE UPDATE)
        reporter_id: Foreign key to users table (CASCADE DELETE)
        reason: Text reason for reporting (required)
        status: String status ('pending' or 'resolved', default 'pending')
        created_at: Timestamp when report was created
        updated_at: Timestamp when report was last updated
    """
    __tablename__ = "reports"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now(), onupdate=db.func.now())
    
    # Relationships
    post = db.relationship("Posts", backref="reports")
    reporter = db.relationship("User", foreign_keys=[reporter_id], backref="reports")
    
    # Index on post_id for faster queries
    __table_args__ = (
        Index("idx_reports_post_id", "post_id"),
    )
    
    def __init__(self, post_id, reporter_id, reason, status="pending"):
        """
        Initialize a new Report instance.
        
        Args:
            post_id: ID of the post being reported
            reporter_id: ID of the user reporting
            reason: Reason for reporting
            status: Status of the report (default 'pending')
        """
        self.post_id = post_id
        self.reporter_id = reporter_id
        self.reason = reason
        self.status = status
    
    def mark_resolved(self):
        """
        Mark this report as resolved.
        Updates status to 'resolved' and refreshes updated_at timestamp.
        """
        self.status = "resolved"
        self.updated_at = db.func.now()
        db.session.commit()
    
    def to_dict(self):
        """
        Convert report to dictionary format for JSON serialization.
        
        Returns:
            dict: Report data with nested reporter information
        """
        return {
            "id": self.id,
            "post_id": self.post_id,
            "reporter": {
                "id": self.reporter.id,
                "username": self.reporter.username,
            },
            "reason": self.reason,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

