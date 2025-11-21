from dotenv import dotenv_values
import os

# Load environment variables from .env file
env_vars = dotenv_values()

# Get environment variables with fallback to None
DATABASE_URI = env_vars.get("DATABASE_URI") or os.getenv("DATABASE_URI")
SECRET_KEY = env_vars.get("SECRET_KEY") or os.getenv("SECRET_KEY")
CLOUDINARY_NAME = env_vars.get("CLOUDINARY_NAME") or os.getenv("CLOUDINARY_NAME")
CLOUDINARY_API_KEY = env_vars.get("CLOUDINARY_API_KEY") or os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = env_vars.get("CLOUDINARY_API_SECRET") or os.getenv("CLOUDINARY_API_SECRET")

# Validate required variables
if not DATABASE_URI:
    raise ValueError("DATABASE_URI environment variable is required. Please set it in .env file or environment.")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required. Please set it in .env file or environment.")

# Cloudinary is optional - warn if not configured but don't fail
if not all([CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    print("⚠️  WARNING: Cloudinary credentials not configured. Image uploads will not work.")
    print("   To enable image uploads, set CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file")
    print("   Community creation will still work with URL-based images.")
