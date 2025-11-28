"""
Events Routes
This module handles all API endpoints for the Events/Meetups feature.
"""
from flask import Blueprint, jsonify, request
from threaddit import db
from flask_login import current_user, login_required
from threaddit.events.models import Event, EventRSVP, EventValidator, EventRSVPValidator
from threaddit.subthreads.models import Subthread
from threaddit.auth.decorators import auth_role
from datetime import datetime, timezone
from marshmallow.exceptions import ValidationError as MarshmallowValidationError


events = Blueprint("events", __name__, url_prefix="/api/events")


# ==================== PUBLIC ROUTES ====================

@events.route("", methods=["GET"])
def list_events():
    """
    List all published events.
    Query params:
    - status: filter by status (default: published)
    - community_id: filter by community
    - limit: number of results (default: 20)
    - offset: pagination offset (default: 0)
    """
    try:
        status_filter = request.args.get("status", default="published", type=str)
        community_id = request.args.get("community_id", type=int)
        limit = request.args.get("limit", default=20, type=int)
        offset = request.args.get("offset", default=0, type=int)
        
        # Build query
        query = Event.query
        
        # Filter by status
        if status_filter:
            query = query.filter(Event.status == status_filter)
        
        # Filter by community
        if community_id:
            query = query.filter(Event.community_id == community_id)
        
        # Order by start_time (upcoming first)
        query = query.order_by(Event.start_time.asc())
        
        # Paginate
        events_list = query.limit(limit).offset(offset).all()
        
        # Get current user ID for RSVP status
        current_user_id = current_user.id if current_user.is_authenticated else None
        
        # Convert to dict
        events_data = [event.as_dict(current_user_id) for event in events_list]
        
        return jsonify(events_data), 200
        
    except Exception as e:
        print(f"[Events] Error listing events: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error fetching events: {str(e)}"}), 500


@events.route("/<int:event_id>", methods=["GET"])
def get_event(event_id):
    """
    Get a single event by ID.
    """
    try:
        event = Event.query.filter_by(id=event_id).first()
        
        if not event:
            return jsonify({"message": "Event not found"}), 404
        
        # Get current user ID for RSVP status
        current_user_id = current_user.id if current_user.is_authenticated else None
        
        return jsonify(event.as_dict(current_user_id)), 200
        
    except Exception as e:
        print(f"[Events] Error getting event {event_id}: {str(e)}")
        return jsonify({"message": f"Error fetching event: {str(e)}"}), 500


# ==================== AUTHENTICATED ROUTES ====================

@events.route("", methods=["POST"])
@login_required
def create_event():
    """
    Create a new event.
    Status will be set to 'pending' for moderation.
    """
    try:
        if not request.is_json:
            return jsonify({"message": "Request must be JSON"}), 400
        
        data = request.get_json()
        print(f"[Events] Create event request received from user {current_user.id}: {data}")
        
        # Validate data
        try:
            validated_data = EventValidator().load(data)
            print(f"[Events] Validated data: {validated_data}")
        except MarshmallowValidationError as e:
            print(f"[Events] Validation error: {e.messages}")
            return jsonify({"message": "Validation error", "errors": e.messages}), 400
        
        # Check if community exists
        community = Subthread.query.filter_by(id=validated_data["community_id"]).first()
        if not community:
            return jsonify({"message": "Community not found"}), 400
        
        # Parse datetime - EventValidator may have already converted to datetime objects
        try:
            start_time_value = validated_data["start_time"]
            end_time_value = validated_data["end_time"]
            
            # If already datetime objects (from Marshmallow), use them directly
            if isinstance(start_time_value, datetime):
                start_time = start_time_value
                # Ensure timezone-aware
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
            else:
                # Parse from string
                start_time_str = str(start_time_value)
                if "T" in start_time_str and len(start_time_str) == 16:
                    # datetime-local format (YYYY-MM-DDTHH:mm) - no timezone
                    start_time = datetime.fromisoformat(start_time_str).replace(tzinfo=timezone.utc)
                else:
                    # ISO format with timezone
                    start_time_str = start_time_str.replace("Z", "+00:00")
                    start_time = datetime.fromisoformat(start_time_str)
                    if start_time.tzinfo is None:
                        start_time = start_time.replace(tzinfo=timezone.utc)
            
            if isinstance(end_time_value, datetime):
                end_time = end_time_value
                # Ensure timezone-aware
                if end_time.tzinfo is None:
                    end_time = end_time.replace(tzinfo=timezone.utc)
            else:
                # Parse from string
                end_time_str = str(end_time_value)
                if "T" in end_time_str and len(end_time_str) == 16:
                    # datetime-local format (YYYY-MM-DDTHH:mm) - no timezone
                    end_time = datetime.fromisoformat(end_time_str).replace(tzinfo=timezone.utc)
                else:
                    # ISO format with timezone
                    end_time_str = end_time_str.replace("Z", "+00:00")
                    end_time = datetime.fromisoformat(end_time_str)
                    if end_time.tzinfo is None:
                        end_time = end_time.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError, TypeError) as e:
            print(f"[Events] Error parsing datetime: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"message": f"Invalid date format: {str(e)}"}), 400
        
        # Validate times
        if end_time <= start_time:
            return jsonify({"message": "End time must be after start time"}), 400
        
        # Create event (always starts as pending)
        new_event = Event(
            title=validated_data["title"],
            description=validated_data["description"],
            start_time=start_time,
            end_time=end_time,
            community_id=validated_data["community_id"],
            organizer_id=current_user.id,
            pincode=validated_data.get("pincode"),
            address=validated_data.get("address"),
            status="pending"  # Always pending until moderator approves
        )
        
        db.session.add(new_event)
        db.session.commit()
        
        print(f"[Events] Event created successfully: ID={new_event.id}, Title='{new_event.title}', by user {current_user.id}")
        return jsonify({
            "message": "Event created successfully. It will be published after moderator approval.",
            "event": new_event.as_dict()
        }), 201
        
        return jsonify({
            "message": "Event created successfully. It will be published after moderator approval.",
            "event": new_event.as_dict(current_user.id)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[Events] Error creating event: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": f"Error creating event: {str(e)}"}), 500


@events.route("/<int:event_id>", methods=["PATCH"])
@login_required
def update_event(event_id):
    """
    Update an event. Only the organizer can update.
    """
    try:
        event = Event.query.filter_by(id=event_id).first()
        
        if not event:
            return jsonify({"message": "Event not found"}), 404
        
        # Check if user is the organizer
        if event.organizer_id != current_user.id:
            return jsonify({"message": "Only the event organizer can update this event"}), 403
        
        # Can't update published events (only pending/rejected can be updated)
        if event.status == "published":
            return jsonify({"message": "Published events cannot be updated. Please create a new event."}), 400
        
        if not request.is_json:
            return jsonify({"message": "Request must be JSON"}), 400
        
        data = request.get_json()
        
        # Validate data
        try:
            validated_data = EventValidator().load(data, partial=True)
        except MarshmallowValidationError as e:
            return jsonify({"message": "Validation error", "errors": e.messages}), 400
        
        # Update fields
        if "title" in validated_data:
            event.title = validated_data["title"]
        if "description" in validated_data:
            event.description = validated_data["description"]
        if "start_time" in validated_data:
            try:
                start_time_str = validated_data["start_time"]
                if "T" in start_time_str and len(start_time_str) == 16:
                    event.start_time = datetime.fromisoformat(start_time_str).replace(tzinfo=timezone.utc)
                else:
                    event.start_time = datetime.fromisoformat(start_time_str.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                return jsonify({"message": "Invalid start_time format"}), 400
        if "end_time" in validated_data:
            try:
                end_time_str = validated_data["end_time"]
                if "T" in end_time_str and len(end_time_str) == 16:
                    event.end_time = datetime.fromisoformat(end_time_str).replace(tzinfo=timezone.utc)
                else:
                    event.end_time = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                return jsonify({"message": "Invalid end_time format"}), 400
        if "pincode" in validated_data:
            event.pincode = validated_data.get("pincode")
        if "address" in validated_data:
            event.address = validated_data.get("address")
        if "community_id" in validated_data:
            # Verify community exists
            community = Subthread.query.filter_by(id=validated_data["community_id"]).first()
            if not community:
                return jsonify({"message": "Community not found"}), 400
            event.community_id = validated_data["community_id"]
        
        # Validate times
        if event.end_time <= event.start_time:
            return jsonify({"message": "End time must be after start time"}), 400
        
        # Reset status to pending if event was rejected
        if event.status == "rejected":
            event.status = "pending"
        
        db.session.commit()
        
        print(f"[Events] Event updated: {event_id} by user {current_user.id}")
        
        return jsonify({
            "message": "Event updated successfully",
            "event": event.as_dict(current_user.id)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Events] Error updating event {event_id}: {str(e)}")
        return jsonify({"message": f"Error updating event: {str(e)}"}), 500


@events.route("/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(event_id):
    """
    Delete an event. Only the organizer or moderators/admins can delete.
    """
    try:
        event = Event.query.filter_by(id=event_id).first()
        
        if not event:
            return jsonify({"message": "Event not found"}), 404
        
        # Check permissions
        is_organizer = event.organizer_id == current_user.id
        is_moderator = current_user.has_role("mod") or current_user.has_role("admin")
        
        if not (is_organizer or is_moderator):
            return jsonify({"message": "Unauthorized to delete this event"}), 403
        
        db.session.delete(event)
        db.session.commit()
        
        print(f"[Events] Event deleted: {event_id} by user {current_user.id}")
        
        return jsonify({"message": "Event deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Events] Error deleting event {event_id}: {str(e)}")
        return jsonify({"message": f"Error deleting event: {str(e)}"}), 500


# ==================== RSVP ROUTES ====================

@events.route("/<int:event_id>/rsvp", methods=["POST"])
@login_required
def create_rsvp(event_id):
    """
    Create or update an RSVP for an event.
    Body: { "status": "going" | "interested" }
    """
    try:
        event = Event.query.filter_by(id=event_id).first()
        
        if not event:
            return jsonify({"message": "Event not found"}), 404
        
        # Only published events can be RSVP'd
        if event.status != "published":
            return jsonify({"message": "Only published events can be RSVP'd"}), 400
        
        if not request.is_json:
            return jsonify({"message": "Request must be JSON"}), 400
        
        data = request.get_json()
        status = data.get("status")
        
        if status not in ["going", "interested"]:
            return jsonify({"message": "Status must be 'going' or 'interested'"}), 400
        
        # Check if RSVP already exists
        existing_rsvp = EventRSVP.query.filter_by(event_id=event_id, user_id=current_user.id).first()
        
        if existing_rsvp:
            # Update existing RSVP
            existing_rsvp.status = status
            db.session.commit()
            print(f"[Events] RSVP updated: event {event_id}, user {current_user.id}, status {status}")
        else:
            # Create new RSVP
            new_rsvp = EventRSVP(
                event_id=event_id,
                user_id=current_user.id,
                status=status
            )
            db.session.add(new_rsvp)
            db.session.commit()
            print(f"[Events] RSVP created: event {event_id}, user {current_user.id}, status {status}")
        
        return jsonify({
            "message": f"RSVP set to '{status}'",
            "rsvp": existing_rsvp.as_dict() if existing_rsvp else new_rsvp.as_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Events] Error creating RSVP: {str(e)}")
        return jsonify({"message": f"Error creating RSVP: {str(e)}"}), 500


@events.route("/<int:event_id>/rsvp", methods=["DELETE"])
@login_required
def delete_rsvp(event_id):
    """
    Remove an RSVP for an event.
    """
    try:
        rsvp = EventRSVP.query.filter_by(event_id=event_id, user_id=current_user.id).first()
        
        if not rsvp:
            return jsonify({"message": "RSVP not found"}), 404
        
        db.session.delete(rsvp)
        db.session.commit()
        
        print(f"[Events] RSVP deleted: event {event_id}, user {current_user.id}")
        
        return jsonify({"message": "RSVP removed successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Events] Error deleting RSVP: {str(e)}")
        return jsonify({"message": f"Error deleting RSVP: {str(e)}"}), 500


# ==================== MODERATOR ROUTES ====================

@events.route("/pending", methods=["GET"])
@login_required
@auth_role(["admin", "mod"])
def list_pending_events():
    """
    List all pending events (for moderators).
    """
    try:
        limit = request.args.get("limit", default=20, type=int)
        offset = request.args.get("offset", default=0, type=int)
        
        events_list = Event.query.filter_by(status="pending").order_by(Event.created_at.desc()).limit(limit).offset(offset).all()
        
        events_data = [event.as_dict(current_user.id) for event in events_list]
        
        return jsonify(events_data), 200
        
    except Exception as e:
        print(f"[Events] Error listing pending events: {str(e)}")
        return jsonify({"message": f"Error fetching pending events: {str(e)}"}), 500


@events.route("/<int:event_id>/approve", methods=["POST"])
@login_required
@auth_role(["admin", "mod"])
def approve_event(event_id):
    """
    Approve an event (moderator only).
    Changes status from 'pending' to 'published'.
    """
    try:
        event = Event.query.filter_by(id=event_id).first()
        
        if not event:
            return jsonify({"message": "Event not found"}), 404
        
        if event.status != "pending":
            return jsonify({"message": f"Event is not pending (current status: {event.status})"}), 400
        
        event.status = "published"
        db.session.commit()
        
        print(f"[Events] Event approved: {event_id} by moderator {current_user.id}")
        
        return jsonify({
            "message": "Event approved and published successfully",
            "event": event.as_dict(current_user.id)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Events] Error approving event {event_id}: {str(e)}")
        return jsonify({"message": f"Error approving event: {str(e)}"}), 500


@events.route("/<int:event_id>/reject", methods=["POST"])
@login_required
@auth_role(["admin", "mod"])
def reject_event(event_id):
    """
    Reject an event (moderator only).
    Changes status from 'pending' to 'rejected'.
    """
    try:
        event = Event.query.filter_by(id=event_id).first()
        
        if not event:
            return jsonify({"message": "Event not found"}), 404
        
        if event.status != "pending":
            return jsonify({"message": f"Event is not pending (current status: {event.status})"}), 400
        
        event.status = "rejected"
        db.session.commit()
        
        print(f"[Events] Event rejected: {event_id} by moderator {current_user.id}")
        
        return jsonify({
            "message": "Event rejected successfully",
            "event": event.as_dict(current_user.id)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Events] Error rejecting event {event_id}: {str(e)}")
        return jsonify({"message": f"Error rejecting event: {str(e)}"}), 500

