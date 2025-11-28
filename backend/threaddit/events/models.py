"""
Events Models
This module defines the Event and EventRSVP database models for the Events/Meetups feature.
"""
from threaddit import db, ma
from datetime import datetime
from marshmallow import validate, ValidationError
from flask_marshmallow.fields import fields


class Event(db.Model):
    """
    Event model - represents a community event or meetup.
    
    Fields:
    - id: Primary key
    - title: Event title (required)
    - description: Event description (required)
    - start_time: When the event starts (required)
    - end_time: When the event ends (required)
    - pincode: Location pincode (optional, for maps)
    - address: Full address (optional)
    - community_id: Which community this event belongs to (required)
    - organizer_id: User who created the event (required)
    - status: pending/published (default: pending)
    - created_at: When the event was created
    """
    __tablename__ = "events"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_time = db.Column(db.DateTime(timezone=True), nullable=False)
    end_time = db.Column(db.DateTime(timezone=True), nullable=False)
    pincode = db.Column(db.Text, nullable=True)
    address = db.Column(db.Text, nullable=True)
    community_id = db.Column(db.Integer, db.ForeignKey("subthreads.id", ondelete="CASCADE"), nullable=False)
    organizer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending, published, rejected
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    
    # Relationships
    community = db.relationship("Subthread", backref="events")
    organizer = db.relationship("User", backref="organized_events")
    rsvps = db.relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")
    
    def __init__(self, title, description, start_time, end_time, community_id, organizer_id, 
                 pincode=None, address=None, status="pending"):
        self.title = title
        self.description = description
        self.start_time = start_time
        self.end_time = end_time
        self.community_id = community_id
        self.organizer_id = organizer_id
        self.pincode = pincode
        self.address = address
        self.status = status
    
    def as_dict(self, current_user_id=None):
        """
        Convert event to dictionary for JSON response.
        Includes RSVP counts and user's RSVP status if current_user_id is provided.
        """
        # Count RSVPs
        going_count = EventRSVP.query.filter_by(event_id=self.id, status="going").count()
        interested_count = EventRSVP.query.filter_by(event_id=self.id, status="interested").count()
        
        # Get user's RSVP status
        user_rsvp = None
        if current_user_id:
            rsvp = EventRSVP.query.filter_by(event_id=self.id, user_id=current_user_id).first()
            if rsvp:
                user_rsvp = rsvp.status
        
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "pincode": self.pincode,
            "address": self.address,
            "community_id": self.community_id,
            "community": {
                "id": self.community.id if self.community else None,
                "name": self.community.name if self.community else None,
                "title": self.community.title if self.community else None,
            } if self.community else None,
            "organizer_id": self.organizer_id,
            "organizer": {
                "id": self.organizer.id if self.organizer else None,
                "username": self.organizer.username if self.organizer else None,
                "avatar": self.organizer.avatar if self.organizer else None,
            } if self.organizer else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "rsvp_counts": {
                "going": going_count,
                "interested": interested_count,
                "total": going_count + interested_count,
            },
            "user_rsvp": user_rsvp,  # "going", "interested", or None
        }
    
    def validate_times(self):
        """Validate that end_time is after start_time."""
        if self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time")


class EventRSVP(db.Model):
    """
    EventRSVP model - tracks user RSVPs for events.
    
    Fields:
    - id: Primary key
    - event_id: Which event (required)
    - user_id: Which user (required)
    - status: going/interested (required)
    - created_at: When the RSVP was created
    """
    __tablename__ = "event_rsvps"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # going, interested
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    
    # Relationships
    event = db.relationship("Event", back_populates="rsvps")
    user = db.relationship("User", backref="event_rsvps")
    
    # Unique constraint: one RSVP per user per event
    __table_args__ = (db.UniqueConstraint("event_id", "user_id", name="unique_event_user_rsvp"),)
    
    def __init__(self, event_id, user_id, status):
        if status not in ["going", "interested"]:
            raise ValidationError("RSVP status must be 'going' or 'interested'")
        self.event_id = event_id
        self.user_id = user_id
        self.status = status
    
    def as_dict(self):
        """Convert RSVP to dictionary for JSON response."""
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "user": {
                "id": self.user.id if self.user else None,
                "username": self.user.username if self.user else None,
                "avatar": self.user.avatar if self.user else None,
            } if self.user else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Marshmallow Schemas for Validation
class EventValidator(ma.SQLAlchemySchema):
    """Schema for validating event creation/update data."""
    
    class Meta:
        model = Event
    
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    description = fields.Str(required=True, validate=validate.Length(min=1, max=5000))
    # Use DateTime field which accepts ISO format strings and converts to datetime objects
    start_time = fields.DateTime(required=True, format="iso")
    end_time = fields.DateTime(required=True, format="iso")
    pincode = fields.Str(required=False, allow_none=True, validate=validate.Length(max=20))
    address = fields.Str(required=False, allow_none=True, validate=validate.Length(max=500))
    community_id = fields.Int(required=True)
    status = fields.Str(required=False, validate=validate.OneOf(["pending", "published", "rejected"]))


class EventRSVPValidator(ma.SQLAlchemySchema):
    """Schema for validating RSVP data."""
    
    class Meta:
        model = EventRSVP
    
    event_id = fields.Int(required=True)
    status = fields.Str(required=True, validate=validate.OneOf(["going", "interested"]))

