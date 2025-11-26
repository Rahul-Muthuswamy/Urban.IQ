from flask import Blueprint, request, jsonify
from threaddit import db
from threaddit.users.models import (
    UserLoginValidator,
    UserRegisterValidator,
    User,
)
from threaddit.auth.decorators import auth_role
from bcrypt import hashpw, checkpw, gensalt
from flask_login import login_user, logout_user, current_user, login_required

user = Blueprint("users", __name__, url_prefix="/api")


@user.route("/user/login", methods=["POST"])
def user_login():
    if current_user.is_authenticated:
        return jsonify({"message": "Already logged in"}), 409
    if login_form := request.json:
        UserLoginValidator().load(login_form)
        user_info = User.query.filter_by(email=login_form.get("email")).first()
        # Check if user exists and has a password (not OAuth-only)
        if user_info and user_info.password_hash:
            if checkpw(login_form.get("password").encode(), user_info.password_hash.encode()):
                login_user(user_info, remember=True)  # remember=True ensures longer session
                return jsonify(user_info.as_dict()), 200
    return jsonify({"message": "Invalid credentials"}), 401


@user.route("/user/logout")
@login_required
def user_logout():
    logout_user()
    return jsonify({"message": "Successfully logged out"}), 200


@user.route("/user/register", methods=["POST"])
def user_register():
    if current_user.is_authenticated:
        return jsonify({"message": "Already logged in"}), 409
    if register_form := request.json:
        UserRegisterValidator().load(register_form)
        new_user = User(
            register_form.get("username"),
            register_form.get("email"),
            hashpw(register_form.get("password").encode(), gensalt()).decode("utf-8"),
        )
        new_user.add()
        return jsonify(new_user.as_dict()), 201
    return jsonify({"message": "Invalid credentials"}), 401


@user.route("/user", methods=["PATCH"])
@login_required
def user_patch():
    try:
        image = request.files.get("avatar")
        form_data = request.form.to_dict()
        
        print(f"[User Patch] Updating user {current_user.username}")
        print(f"[User Patch] Form data keys: {list(form_data.keys())}")
        print(f"[User Patch] Form data values: {form_data}")
        print(f"[User Patch] Has avatar file: {image is not None}")
        if image:
            print(f"[User Patch] Avatar filename: {image.filename}, content_type: {image.content_type}")
        
        # Ensure user is in the session
        if current_user not in db.session:
            db.session.add(current_user)
        
        # Update user
        current_user.patch(image=image, form_data=form_data)
        
        # Refresh the user object to ensure we have the latest data from database
        db.session.refresh(current_user)
        
        # Get updated user data
        updated_user = current_user.as_dict()
        
        print(f"[User Patch] Updated user data:")
        print(f"  - username: {updated_user.get('username')}")
        print(f"  - bio: {updated_user.get('bio')}")
        print(f"  - first_name: {updated_user.get('first_name')}")
        print(f"  - last_name: {updated_user.get('last_name')}")
        print(f"  - phone_number: {updated_user.get('phone_number')}")
        print(f"  - avatar: {updated_user.get('avatar')}")
        
        return jsonify(updated_user), 200
    except Exception as e:
        import traceback
        print(f"[User Patch] Error updating user: {str(e)}")
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"message": f"Error updating profile: {str(e)}"}), 500


@user.route("/user", methods=["DELETE"])
@login_required
def user_delete():
    current_user.delete_avatar()
    User.query.filter_by(id=current_user.id).delete()
    logout_user()
    db.session.commit()
    return jsonify({"message": "Successfully deleted"}), 200


@user.route("/user", methods=["GET"])
@login_required
def user_get():
    return jsonify(current_user.as_dict()), 200


@user.route("/user/<user_name>", methods=["GET"])
def user_get_by_username(user_name):
    user = User.query.filter_by(username=user_name).first()
    if user:
        return (
            jsonify(user.as_dict(include_all=False)),
            200,
        )
    else:
        return jsonify({"message": "User not found"}), 404


@user.route("/users", methods=["GET"])
@login_required
@auth_role(["admin"])
def users_get():
    return jsonify(User.get_all()), 200


@user.route("/user/search/<search>")
@login_required
def get_user(search):
    users = User.query.filter(User.username.ilike(f"%{search}%"))
    return jsonify([user.as_dict() for user in users]), 200
