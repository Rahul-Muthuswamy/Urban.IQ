#!/bin/bash
# Container Verification Script for Urban.IQ Backend
# Run inside container: docker exec -it <container-id> bash < verify-container.sh

echo "=========================================="
echo "Urban.IQ Backend Container Verification"
echo "=========================================="
echo ""

# 1. Check working directory
echo "1. Working Directory:"
pwd
echo "Expected: /app"
echo ""

# 2. Check Python version
echo "2. Python Version:"
python --version
echo "Expected: Python 3.11.x"
echo ""

# 3. Check if threaddit module exists
echo "3. Threaddit Module:"
if [ -d "/app/threaddit" ]; then
    echo "✅ threaddit/ directory exists"
    if [ -f "/app/threaddit/__init__.py" ]; then
        echo "✅ threaddit/__init__.py exists"
    else
        echo "❌ threaddit/__init__.py MISSING"
    fi
else
    echo "❌ threaddit/ directory MISSING"
fi
echo ""

# 4. Check if app object is importable
echo "4. App Object Import:"
python -c "from threaddit import app; print('✅ App object imported successfully'); print(f'App type: {type(app)}')" 2>&1
if [ $? -eq 0 ]; then
    echo "✅ threaddit:app is valid"
else
    echo "❌ Failed to import app object"
fi
echo ""

# 5. Check if gunicorn is installed
echo "5. Gunicorn Installation:"
python -c "import gunicorn; print(f'✅ Gunicorn version: {gunicorn.__version__}')" 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Gunicorn not installed"
fi
echo ""

# 6. Check for unwanted directories
echo "6. Unwanted Directories Check:"
if [ -d "/app/venv" ]; then
    echo "⚠️  WARNING: /app/venv exists (should be excluded)"
else
    echo "✅ venv/ correctly excluded"
fi

if [ -d "/app/threaddit/rag/venv" ]; then
    echo "⚠️  WARNING: /app/threaddit/rag/venv exists (should be excluded)"
else
    echo "✅ threaddit/rag/venv/ correctly excluded"
fi

if [ -d "/app/threaddit/rag/docs" ]; then
    echo "⚠️  WARNING: /app/threaddit/rag/docs exists (should be excluded)"
else
    echo "✅ threaddit/rag/docs/ correctly excluded"
fi
echo ""

# 7. Check environment variables
echo "7. Required Environment Variables:"
if [ -z "$DATABASE_URI" ]; then
    echo "❌ DATABASE_URI not set"
else
    echo "✅ DATABASE_URI is set"
fi

if [ -z "$SECRET_KEY" ]; then
    echo "❌ SECRET_KEY not set"
else
    echo "✅ SECRET_KEY is set"
fi
echo ""

# 8. Test gunicorn command
echo "8. Gunicorn Command Test:"
gunicorn --check-config --bind 0.0.0.0:8080 threaddit:app 2>&1 | head -5
if [ $? -eq 0 ]; then
    echo "✅ Gunicorn configuration is valid"
else
    echo "❌ Gunicorn configuration error"
fi
echo ""

# 9. List key files
echo "9. Key Files:"
ls -la /app/ | grep -E "(threaddit|requirements|run.py)"
echo ""

# 10. Check port binding
echo "10. Port Configuration:"
echo "Expected: 8080"
netstat -tlnp 2>/dev/null | grep 8080 || echo "Port 8080 not listening (container may not be running)"
echo ""

echo "=========================================="
echo "Verification Complete"
echo "=========================================="


