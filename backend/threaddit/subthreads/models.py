from threaddit import db, app, ma
import cloudinary.uploader as uploader
import uuid
from datetime import datetime
from flask_marshmallow.fields import fields
from marshmallow.exceptions import ValidationError
from sqlalchemy import func
import re


class Subthread(db.Model):
    __tablename__ = "subthreads"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Text, nullable=False, unique=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    rules = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=db.func.now(), onupdate=db.func.now())
    logo = db.Column(db.Text)
    banner_url = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User", back_populates="subthread")
    user_role = db.relationship("UserRole", back_populates="subthread")
    subscription = db.relationship("Subscription", back_populates="subthread")
    subthread_info = db.relationship("SubthreadInfo", back_populates="subthread")
    post = db.relationship("Posts", back_populates="subthread")
    post_info = db.relationship("PostInfo", back_populates="subthread")

    @classmethod
    def add(cls, form_data, logo_image, banner_image, created_by):
        name = form_data.get("name")
        if not name.startswith("t/"):
            name = f"t/{name.lower()}"
        else:
            name = name.lower()
        
        new_sub = Subthread(
            name=name,
            title=form_data.get("title"),
            description=form_data.get("description"),
            rules=form_data.get("rules"),
            created_by=created_by,
        )
        new_sub.handle_logo(form_data.get("logo_content_type"), logo_image, form_data.get("logo_url"))
        new_sub.handle_banner(form_data.get("banner_content_type"), banner_image, form_data.get("banner_url"))
        db.session.add(new_sub)
        db.session.commit()
        return new_sub

    def patch(self, form_data, logo_image, banner_image):
        self.handle_logo(form_data.get("logo_content_type"), logo_image, form_data.get("logo_url"))
        self.handle_banner(form_data.get("banner_content_type"), banner_image, form_data.get("banner_url"))
        if form_data.get("description"):
            self.description = form_data.get("description")
        if form_data.get("title"):
            self.title = form_data.get("title")
        if form_data.get("rules") is not None:
            self.rules = form_data.get("rules")
        self.updated_at = db.func.now()
        db.session.commit()

    def handle_logo(self, content_type, image=None, url=None):
        if content_type == "image" and image:
            if not app.config.get("CLOUDINARY_ENABLED"):
                raise ValueError("Cloudinary is not configured. Please use URL-based images or configure Cloudinary credentials in .env file.")
            self.delete_logo()
            image_data = uploader.upload(image, public_id=f"{uuid.uuid4().hex}_{image.filename.rsplit('.')[0]}")
            url = f"https://res.cloudinary.com/{app.config['CLOUDINARY_NAME']}/image/upload/f_auto,q_auto/{image_data.get('public_id')}"
            self.logo = url
        elif content_type == "url" and url:
            self.logo = url

    def handle_banner(self, content_type, image=None, url=None):
        if content_type == "image" and image:
            if not app.config.get("CLOUDINARY_ENABLED"):
                raise ValueError("Cloudinary is not configured. Please use URL-based images or configure Cloudinary credentials in .env file.")
            self.delete_banner()
            image_data = uploader.upload(image, public_id=f"{uuid.uuid4().hex}_{image.filename.rsplit('.')[0]}")
            url = f"https://res.cloudinary.com/{app.config['CLOUDINARY_NAME']}/image/upload/f_auto,q_auto/{image_data.get('public_id')}"
            self.banner_url = url
        elif content_type == "url" and url:
            self.banner_url = url

    def delete_logo(self):
        if app.config.get("CLOUDINARY_ENABLED") and self.logo and app.config.get("CLOUDINARY_NAME") and self.logo.startswith(f"https://res.cloudinary.com/{app.config['CLOUDINARY_NAME']}"):
            res = uploader.destroy(self.logo.split("/")[-1])
            print(f"Cloudinary Image Destroy Response for {self.name}: ", res)

    def delete_banner(self):
        if app.config.get("CLOUDINARY_ENABLED") and self.banner_url and app.config.get("CLOUDINARY_NAME") and self.banner_url.startswith(f"https://res.cloudinary.com/{app.config['CLOUDINARY_NAME']}"):
            res = uploader.destroy(self.banner_url.split("/")[-1])
            print(f"Cloudinary Banner Destroy Response for {self.name}: ", res)

    def as_dict(self, cur_user_id=None, include_full=False):
        data = {
            "id": self.id,
            "name": self.name,
            "title": self.title,
            "description": self.description,
            "rules": self.rules,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "logo": self.logo,
            "banner_url": self.banner_url,
            "PostsCount": len(self.post),
            "CommentsCount": sum([len(p.comment) for p in self.post]),
            "created_by": self.user.username if self.user else None,
            "subscriberCount": len(self.subscription),
            "modList": [r.user.username for r in self.user_role if r.role.slug == "mod"],
        }
        if include_full and self.user:
            data["creator_info"] = {
                "username": self.user.username,
                "avatar": self.user.avatar,
            }
        if cur_user_id:
            data["has_subscribed"] = bool(
                Subscription.query.filter_by(user_id=cur_user_id, subthread_id=self.id).first()
            )
        return data

    def as_dict_minimal(self):
        return {
            "id": self.id,
            "name": self.name,
            "title": self.title,
            "logo": self.logo,
        }

    def __init__(self, **kwargs):
        # Allow SQLAlchemy to handle initialization properly
        # This ensures compatibility with SQLAlchemy's model creation
        super().__init__(**kwargs)


class Subscription(db.Model):
    __tablename__ = "subscriptions"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    subthread_id = db.Column(db.Integer, db.ForeignKey("subthreads.id"), nullable=False)
    user = db.relationship("User", back_populates="subscription")
    subthread = db.relationship("Subthread", back_populates="subscription")

    @classmethod
    def add(cls, thread_id, user_id):
        new_sub = Subscription(user_id=user_id, subthread_id=thread_id)
        db.session.add(new_sub)
        db.session.commit()

    def __init__(self, user_id, subthread_id):
        self.user_id = user_id
        self.subthread_id = subthread_id


class SubthreadInfo(db.Model):
    __tablename__ = "subthread_info"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.Integer, db.ForeignKey("subthreads.name"))
    logo = db.Column(db.Text)
    members_count = db.Column(db.Integer)
    posts_count = db.Column(db.Integer)
    comments_count = db.Column(db.Integer)
    subthread = db.relationship("Subthread", back_populates="subthread_info")

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "logo": self.logo,
            "subscriberCount": self.members_count or 0,
            "PostsCount": self.posts_count or 0,
            "CommentsCount": self.comments_count or 0,
        }


def validate_subthread_name(name):
    if not name:
        raise ValidationError("Subthread name is required")
    
    clean_name = name.replace("t/", "").lower()
    
    if len(clean_name) < 3:
        raise ValidationError("Subthread name must be at least 3 characters long")
    if len(clean_name) > 21:
        raise ValidationError("Subthread name must be at most 21 characters long")
    
    if not re.match(r"^[a-z0-9-]+$", clean_name):
        raise ValidationError("Subthread name can only contain lowercase letters, numbers, and hyphens")
    
    existing = Subthread.query.filter(func.lower(Subthread.name) == func.lower(f"t/{clean_name}")).first()
    if existing:
        raise ValidationError("Subthread name already exists")


class SubthreadCreateValidator(ma.SQLAlchemySchema):
    class Meta:
        model = Subthread
    
    name = fields.Str(required=True, validate=validate_subthread_name)
    title = fields.Str(required=True, validate=fields.validate.Length(min=1, max=200))
    description = fields.Str(required=True, validate=fields.validate.Length(min=10, max=5000))
    rules = fields.Str(required=False, allow_none=True, validate=fields.validate.Length(max=10000))
