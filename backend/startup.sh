#!/bin/bash
# Azure App Service startup script for Urban.IQ Backend
# This script starts Gunicorn with the Flask application

# Change to the application directory
cd /home/site/wwwroot

# Install dependencies if needed (Azure usually does this, but just in case)
pip install -r requirements.txt --quiet

# Start Gunicorn
# Azure App Service sets PORT environment variable automatically
# Use 0.0.0.0 to bind to all interfaces
# Default to port 8000 if PORT is not set
gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 4 --timeout 120 --access-logfile - --error-logfile - threaddit:app

