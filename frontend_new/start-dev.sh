#!/bin/bash

# Start script for frontend_new development
# This script checks if backend is running and starts the frontend

echo "🚀 Starting Urban.IQ Frontend (New)..."

# Check if backend is running
echo "📡 Checking backend connection..."
if curl -s http://localhost:5000/api/user > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:5000"
else
    echo "⚠️  Backend not detected on http://localhost:5000"
    echo "   Please start the backend first:"
    echo "   cd backend && python run.py"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Start frontend
echo "🎨 Starting frontend development server..."
npm run dev


