from flask import Blueprint, request, jsonify, redirect, session, url_for
from flask_login import login_user
import requests
import secrets
import os
from threaddit import db
from threaddit.users.models import User, UsersKarma
from threaddit.config import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI,
)

# Frontend URL for redirects (can be overridden by env var)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174")

oauth = Blueprint("oauth", __name__, url_prefix="/api/auth")

# GitHub OAuth endpoints
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_API_URL = "https://api.github.com/user"


@oauth.route("/github", methods=["GET"])
def github_login():
    """
    Initiates GitHub OAuth flow.
    Redirects user to GitHub authorization page.
    """
    if not GITHUB_CLIENT_ID:
        return jsonify({"message": "GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file."}), 500

    # Generate a random state token for CSRF protection
    state = secrets.token_urlsafe(32)
    session["oauth_state"] = state

    # Build GitHub authorization URL
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "user:email",  # Request email access
        "state": state,
    }

    auth_url = f"{GITHUB_AUTHORIZE_URL}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    
    # Return redirect URL for frontend to handle
    return jsonify({"auth_url": auth_url}), 200


@oauth.route("/github/callback", methods=["GET"])
def github_callback():
    """
    Handles GitHub OAuth callback.
    Exchanges authorization code for access token and fetches user data.
    """
    # Verify state parameter to prevent CSRF attacks
    state = request.args.get("state")
    stored_state = session.get("oauth_state")
    
    if not state or state != stored_state:
        # Redirect to frontend with error
        frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error=invalid_state"
        return redirect(frontend_url)
    
    # Clear state from session
    session.pop("oauth_state", None)
    
    # Get authorization code from callback
    code = request.args.get("code")
    error = request.args.get("error")
    
    if error:
        frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error={error}"
        return redirect(frontend_url)
    
    if not code:
        frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error=no_code"
        return redirect(frontend_url)
    
    try:
        # Exchange authorization code for access token
        token_response = requests.post(
            GITHUB_TOKEN_URL,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            json={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            timeout=10,
        )
        
        if token_response.status_code != 200:
            print(f"[GitHub OAuth] Token exchange failed: {token_response.status_code} - {token_response.text}")
            frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error=token_exchange_failed"
            return redirect(frontend_url)
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            error_description = token_data.get("error_description", "Unknown error")
            print(f"[GitHub OAuth] No access token: {error_description}")
            frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error={error_description}"
            return redirect(frontend_url)
        
        # Fetch user information from GitHub
        user_response = requests.get(
            GITHUB_USER_API_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=10,
        )
        
        if user_response.status_code != 200:
            print(f"[GitHub OAuth] User API call failed: {user_response.status_code} - {user_response.text}")
            frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error=user_fetch_failed"
            return redirect(frontend_url)
        
        github_user = user_response.json()
        github_id = str(github_user.get("id"))
        github_username = github_user.get("login")
        github_email = github_user.get("email")
        github_avatar = github_user.get("avatar_url")
        github_name = github_user.get("name", "")
        github_bio = github_user.get("bio")
        
        # If email is not public, fetch from emails endpoint
        if not github_email:
            emails_response = requests.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
                timeout=10,
            )
            if emails_response.status_code == 200:
                emails = emails_response.json()
                # Find primary email or first verified email
                primary_email = next((e.get("email") for e in emails if e.get("primary")), None)
                verified_email = next((e.get("email") for e in emails if e.get("verified")), None)
                github_email = primary_email or verified_email or (emails[0].get("email") if emails else None)
        
        if not github_email:
            print("[GitHub OAuth] No email found for GitHub user")
            frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error=no_email"
            return redirect(frontend_url)
        
        # Check if user exists by GitHub ID
        user = User.query.filter_by(github_id=github_id).first()
        
        if not user:
            # Check if user exists by email (account linking)
            existing_user = User.query.filter_by(email=github_email).first()
            
            if existing_user:
                # Link GitHub account to existing user
                existing_user.github_id = github_id
                existing_user.oauth_provider = "github"
                if github_avatar and not existing_user.avatar:
                    existing_user.avatar = github_avatar
                db.session.commit()
                user = existing_user
            else:
                # Create new user
                # Generate a unique username from GitHub username
                base_username = github_username.lower().replace("-", "_")
                username = base_username
                counter = 1
                
                # Ensure username is unique
                while User.query.filter_by(username=username).first():
                    username = f"{base_username}_{counter}"
                    counter += 1
                
                # Split name if available
                name_parts = github_name.split(" ", 1) if github_name else [None, None]
                first_name = name_parts[0] if name_parts else None
                last_name = name_parts[1] if len(name_parts) > 1 else None
                
                # Create new user without password (OAuth user)
                user = User(
                    username=username,
                    email=github_email,
                    password_hash=None,  # OAuth users don't have passwords
                    github_id=github_id,
                    oauth_provider="github",
                )
                
                # Set additional profile information from GitHub
                if github_avatar:
                    user.avatar = github_avatar
                if first_name:
                    user.first_name = first_name
                if last_name:
                    user.last_name = last_name
                if github_bio:
                    user.bio = github_bio
                
                user.add()
                
                print(f"[GitHub OAuth] Created new user: {user.username} ({user.email})")
        else:
            # Update existing user's info from GitHub (in case they changed it)
            if github_avatar and not user.avatar:
                user.avatar = github_avatar
            
            # Update name if not set
            if github_name and not user.first_name:
                name_parts = github_name.split(" ", 1)
                user.first_name = name_parts[0] if name_parts else None
                user.last_name = name_parts[1] if len(name_parts) > 1 else None
            
            # Update bio if not set
            if github_bio and not user.bio:
                user.bio = github_bio
            
            db.session.commit()
        
        # Log the user in
        login_user(user, remember=True)
        
        # Redirect to frontend with success
        frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/home"
        return redirect(frontend_url)
        
    except requests.RequestException as e:
        print(f"[GitHub OAuth] Request error: {str(e)}")
        frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error=request_error"
        return redirect(frontend_url)
    except Exception as e:
        print(f"[GitHub OAuth] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        frontend_url = request.args.get("frontend_redirect") or f"{FRONTEND_URL}/signin?error=unexpected_error"
        return redirect(frontend_url)

