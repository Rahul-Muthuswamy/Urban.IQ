from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from marshmallow import ValidationError as MarshmallowValidationError
from threaddit.users.models import PasswordChangeValidator, User

auth = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth.route("/change-password", methods=["POST"])
@login_required
def change_password():
    """
    Change user password endpoint.
    Requires authentication and validates old password before updating.
    """
    if not request.json:
        return jsonify({"message": "Request body is required"}), 400

    try:
        # Validate request data
        validated_data = PasswordChangeValidator().load(request.json)
        old_password = validated_data.get("old_password")
        new_password = validated_data.get("new_password")

        # Change password using User model method
        success, message = current_user.change_password(old_password, new_password)

        if success:
            return jsonify({"message": message}), 200
        else:
            return jsonify({"message": message}), 400

    except MarshmallowValidationError as e:
        # Handle marshmallow validation errors
        error_messages = e.messages
        if isinstance(error_messages, dict):
            # Get first error message
            first_error = list(error_messages.values())[0]
            if isinstance(first_error, list):
                error_message = first_error[0]
            else:
                error_message = str(first_error)
        else:
            error_message = str(error_messages)
        return jsonify({"message": error_message}), 400
    except Exception as e:
        # Handle other errors
        error_message = str(e)
        return jsonify({"message": error_message}), 400

