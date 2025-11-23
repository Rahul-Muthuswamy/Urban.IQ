from threaddit import db
from datetime import datetime
from sqlalchemy import Index


class Report(db.Model):

    __tablename__ = "reports"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    reporter_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now(), onupdate=db.func.now())
    
    post = db.relationship("Posts", backref="reports")
    reporter = db.relationship("User", foreign_keys=[reporter_id], backref="reports")
    
    __table_args__ = (
        Index("idx_reports_post_id", "post_id"),
    )
    
    def __init__(self, post_id, reporter_id, reason, status="pending"):

        self.post_id = post_id
        self.reporter_id = reporter_id
        self.reason = reason
        self.status = status
    
    def mark_resolved(self):

        self.status = "resolved"
        self.updated_at = db.func.now()
        db.session.commit()
    
    def to_dict(self):

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

