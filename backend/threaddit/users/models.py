from sqlalchemy import func
import cloudinary.uploader as uploader
import uuid
from threaddit import db, login_manager, app
from flask_login import UserMixin
from threaddit import ma, app
from flask_marshmallow.fields import fields
from marshmallow.exceptions import ValidationError


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)


class User(db.Model, UserMixin):
    __tablename__: str = "users"
    id: int = db.Column(db.Integer, primary_key=True)
    username: str = db.Column(db.Text, unique=True, nullable=False)
    email: str = db.Column(db.Text, unique=True, nullable=False)
    password_hash: str = db.Column(db.Text, nullable=True)  # Nullable for OAuth users
    github_id: str = db.Column(db.Text, unique=True, nullable=True)  # GitHub user ID
    oauth_provider: str = db.Column(db.Text, nullable=True)  # e.g., 'github'
    avatar: str = db.Column(db.Text)
    bio: str = db.Column(db.Text)
    first_name: str = db.Column(db.Text)
    last_name: str = db.Column(db.Text)
    phone_number: str = db.Column(db.Text)
    address_line1: str = db.Column(db.Text)
    address_line2: str = db.Column(db.Text)
    city: str = db.Column(db.Text)
    state: str = db.Column(db.Text)
    pincode: str = db.Column(db.Text)
    registration_date = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    subthread = db.relationship("Subthread", back_populates="user")
    user_role = db.relationship("UserRole", back_populates="user")
    subscription = db.relationship("Subscription", back_populates="user")
    user_karma = db.relationship("UsersKarma", back_populates="user")
    post = db.relationship("Posts", back_populates="user")
    post_info = db.relationship("PostInfo", back_populates="user")
    comment = db.relationship("Comments", back_populates="user")
    reaction = db.relationship("Reactions", back_populates="user")
    saved_post = db.relationship("SavedPosts", back_populates="user")
    sender = db.relationship("Messages", back_populates="user_sender", foreign_keys="Messages.sender_id")
    receiver = db.relationship("Messages", back_populates="user_receiver", foreign_keys="Messages.receiver_id")

    def __init__(self, username: str, email: str, password_hash: str = None, github_id: str = None, oauth_provider: str = None):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.github_id = github_id
        self.oauth_provider = oauth_provider

    def get_id(self):
        return str(self.id)

    def add(self):
        db.session.add(self)
        db.session.commit()

    def patch(self, image, form_data):
        print(f"[User.patch] Updating user {self.username}")
        print(f"[User.patch] Form data received: {form_data}")
        print(f"[User.patch] Has image: {image is not None}")
        
        # Handle avatar update
        if form_data.get("content_type") == "image" and image:
            if not app.config.get("CLOUDINARY_ENABLED"):
                raise ValueError("Cloudinary is not configured. Please configure Cloudinary credentials in .env file to upload images.")
            self.delete_avatar()
            try:
                filename = image.filename or "avatar"
                image_data = uploader.upload(image, public_id=f"{uuid.uuid4().hex}_{filename.rsplit('.')[0]}")
                url = f"https://res.cloudinary.com/{app.config['CLOUDINARY_NAME']}/image/upload/f_auto,q_auto/{image_data.get('public_id')}"
                self.avatar = url
                print(f"[User.patch] Avatar updated to: {url}")
            except Exception as e:
                print(f"[User.patch] Error uploading avatar: {str(e)}")
                raise ValueError(f"Failed to upload image to Cloudinary: {str(e)}")
        elif form_data.get("content_type") == "url":
            self.avatar = form_data.get("content_url")
            print(f"[User.patch] Avatar set to URL: {form_data.get('content_url')}")
        
        # Handle bio update
        if "bio" in form_data:
            old_bio = self.bio
            self.bio = form_data.get("bio") or None
            print(f"[User.patch] Bio updated: '{old_bio}' -> '{self.bio}'")
        
        # Handle profile fields (allow empty strings to clear fields)
        if "first_name" in form_data:
            old_value = self.first_name
            self.first_name = form_data.get("first_name") or None
            print(f"[User.patch] first_name updated: '{old_value}' -> '{self.first_name}'")
        if "last_name" in form_data:
            old_value = self.last_name
            self.last_name = form_data.get("last_name") or None
            print(f"[User.patch] last_name updated: '{old_value}' -> '{self.last_name}'")
        if "phone_number" in form_data:
            old_value = self.phone_number
            self.phone_number = form_data.get("phone_number") or None
            print(f"[User.patch] phone_number updated: '{old_value}' -> '{self.phone_number}'")
        if "address_line1" in form_data:
            old_value = self.address_line1
            self.address_line1 = form_data.get("address_line1") or None
            print(f"[User.patch] address_line1 updated: '{old_value}' -> '{self.address_line1}'")
        if "address_line2" in form_data:
            old_value = self.address_line2
            self.address_line2 = form_data.get("address_line2") or None
            print(f"[User.patch] address_line2 updated: '{old_value}' -> '{self.address_line2}'")
        if "city" in form_data:
            old_value = self.city
            self.city = form_data.get("city") or None
            print(f"[User.patch] city updated: '{old_value}' -> '{self.city}'")
        if "state" in form_data:
            old_value = self.state
            self.state = form_data.get("state") or None
            print(f"[User.patch] state updated: '{old_value}' -> '{self.state}'")
        if "pincode" in form_data:
            old_value = self.pincode
            self.pincode = form_data.get("pincode") or None
            print(f"[User.patch] pincode updated: '{old_value}' -> '{self.pincode}'")
        
        try:
            db.session.commit()
            print(f"[User.patch] Changes committed to database for user {self.username}")
        except Exception as e:
            print(f"[User.patch] Error committing changes: {str(e)}")
            db.session.rollback()
            raise

    def delete_avatar(self):
        if app.config.get("CLOUDINARY_ENABLED") and self.avatar and app.config.get("CLOUDINARY_NAME") and self.avatar.startswith(f"https://res.cloudinary.com/{app.config['CLOUDINARY_NAME']}"):
            try:
                # Extract public_id from URL
                # URL format: https://res.cloudinary.com/{cloud_name}/image/upload/f_auto,q_auto/{public_id}
                url_parts = self.avatar.split("/")
                public_id = url_parts[-1]  # Get the last part which is the public_id
                res = uploader.destroy(public_id)
                print(f"Cloudinary Image Destroy Response for {self.username}: ", res)
            except Exception as e:
                print(f"Error destroying Cloudinary image for {self.username}: {str(e)}")

    def change_password(self, old_password: str, new_password: str) -> tuple[bool, str]:

        from bcrypt import checkpw, hashpw, gensalt
        
        if not checkpw(old_password.encode(), self.password_hash.encode()):
            return False, "Incorrect old password"
        
        self.password_hash = hashpw(new_password.encode(), gensalt()).decode("utf-8")
        db.session.commit()
        return True, "Password changed successfully"

    def has_role(self, role):
        return role in {r.role.slug for r in self.user_role}

    @classmethod
    def get_all(cls):
        all_users: list[dict] = []
        for user in cls.query.all():
            all_users.append(user.as_dict(include_all=True))
        return all_users

    def as_dict(self, include_all=False) -> dict:
        base_dict = {
            "username": self.username,
            "avatar": self.avatar,
            "bio": self.bio,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone_number": self.phone_number,
            "address_line1": self.address_line1,
            "address_line2": self.address_line2,
            "city": self.city,
            "state": self.state,
            "pincode": self.pincode,
            "registrationDate": self.registration_date.isoformat() if self.registration_date else None,
            "roles": list({r.role.slug for r in self.user_role}),
            "karma": self.user_karma[0].as_dict() if self.user_karma and len(self.user_karma) > 0 else {
                "user_karma": 0,
                "comments_count": 0,
                "comments_karma": 0,
                "posts_count": 0,
                "posts_karma": 0,
            },
            "mod_in": [r.subthread_id for r in self.user_role if r.role.slug == "mod"],
        }
        
        if include_all:
            base_dict["id"] = self.id
            base_dict["email"] = self.email
        
        return base_dict


def username_validator(username: str):
    if db.session.query(User).filter(func.lower(User.username) == username.lower()).first():
        raise ValidationError("Username already exists")


def email_validator(email: str):
    if User.query.filter_by(email=email).first():
        raise ValidationError("Email already exists")


class UserLoginValidator(ma.SQLAlchemySchema):
    class Meta:
        model = User

    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=[fields.validate.Length(min=8)])


class UserRegisterValidator(ma.SQLAlchemySchema):
    class Meta:
        model = User

    username = fields.Str(
        required=True,
        validate=[
            fields.validate.Length(min=4, max=15, error="Username must be between 1 and 50 characters"),
            fields.validate.Regexp(
                "^[a-zA-Z][a-zA-Z0-9_]*$",
                error="Username must start with a letter, and contain only \
                letters, numbers, and underscores.",
            ),
            username_validator,
        ],
    )
    email = fields.Email(required=True, validate=[email_validator])
    password = fields.Str(required=True, validate=[fields.validate.Length(min=8)])


def password_strength_validator(password: str):
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    if not any(char.isdigit() for char in password):
        raise ValidationError("Password must contain at least one number")
    if not any(char.isalpha() for char in password):
        raise ValidationError("Password must contain at least one letter")


class PasswordChangeValidator(ma.SQLAlchemySchema):
    class Meta:
        model = User

    old_password = fields.Str(required=True, validate=[fields.validate.Length(min=8)])
    new_password = fields.Str(required=True, validate=[fields.validate.Length(min=8), password_strength_validator])


class UsersKarma(db.Model):
    __tablename__: str = "user_info"
    user_id: int = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, primary_key=True)
    user_karma: int = db.Column(db.Integer, nullable=False)
    comments_count: int = db.Column(db.Integer, nullable=False)
    comments_karma: int = db.Column(db.Integer, nullable=False)
    posts_count: int = db.Column(db.Integer, nullable=False)
    posts_karma: int = db.Column(db.Integer, nullable=False)
    user = db.relationship("User", back_populates="user_karma")

    def as_dict(self) -> dict:
        return {
            "user_karma": self.user_karma,
            "comments_count": self.comments_count,
            "comments_karma": self.comments_karma,
            "posts_count": self.posts_count,
            "posts_karma": self.posts_karma,
        }
