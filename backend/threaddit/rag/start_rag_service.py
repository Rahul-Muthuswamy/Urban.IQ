#!/usr/bin/env python3
"""
Startup script for the RAG service.
Run this to start the FastAPI RAG service on port 8000.
"""
import uvicorn
import os
import sys

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Starting RAG Service on http://127.0.0.1:8000")
    print("API Documentation: http://127.0.0.1:8000/docs")
    print("Health Check: http://127.0.0.1:8000/health")
    print("\nPress CTRL+C to stop the service\n")
    
    uvicorn.run(
        "app_main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )



















