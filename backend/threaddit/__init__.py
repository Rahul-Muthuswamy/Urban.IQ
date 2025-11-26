from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from marshmallow import ValidationError
import cloudinary
from flask_login import LoginManager
from flask_cors import CORS
from threaddit.config import (
    DATABASE_URI,
    SECRET_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_API_KEY,
    CLOUDINARY_NAME,
)

app = Flask(
    __name__,
    static_folder="../../frontend/threaddit/dist",
    static_url_path="/",
)


CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
)

# Only configure Cloudinary if credentials are provided
if CLOUDINARY_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
    )
    app.config["CLOUDINARY_NAME"] = CLOUDINARY_NAME
    app.config["CLOUDINARY_ENABLED"] = True
else:
    app.config["CLOUDINARY_NAME"] = None
    app.config["CLOUDINARY_ENABLED"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URI
app.config["SECRET_KEY"] = SECRET_KEY


app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = False 
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_NAME"] = "session"  
app.config["SESSION_COOKIE_DOMAIN"] = None  
app.config["PERMANENT_SESSION_LIFETIME"] = 86400  

db = SQLAlchemy(app)
login_manager = LoginManager(app)
ma = Marshmallow(app)


@login_manager.unauthorized_handler
def callback():
    return jsonify({"message": "Unauthorized"}), 401


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    return app.send_static_file("index.html")


@app.errorhandler(ValidationError)
def handle_marshmallow_validation(err):
    return jsonify({"errors": err.messages}), 400


@app.errorhandler(404)
def not_found(e):
    return app.send_static_file("index.html")


from threaddit.users.routes import user
from threaddit.subthreads.routes import threads
from threaddit.posts.routes import posts
from threaddit.comments.routes import comments
from threaddit.reactions.routes import reactions
from threaddit.messages.routes import messages
from threaddit.auth.routes import auth
from threaddit.auth.oauth_routes import oauth
from threaddit.reports.routes import reports
from threaddit.moderation.routes import moderation
from threaddit.chatbot.routes import chatbot

app.register_blueprint(user)
app.register_blueprint(threads)
app.register_blueprint(posts)
app.register_blueprint(comments)
app.register_blueprint(reactions)
app.register_blueprint(messages)
app.register_blueprint(auth)
app.register_blueprint(oauth)
app.register_blueprint(reports)
app.register_blueprint(moderation)
app.register_blueprint(chatbot)
