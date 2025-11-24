@echo off
REM Start script for frontend_new development (Windows)
REM This script checks if backend is running and starts the frontend

echo 🚀 Starting Urban.IQ Frontend (New)...

REM Check if backend is running
echo 📡 Checking backend connection...
curl -s http://localhost:5000/api/user >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is running on http://localhost:5000
) else (
    echo ⚠️  Backend not detected on http://localhost:5000
    echo    Please start the backend first:
    echo    cd backend ^&^& python run.py
    echo.
    set /p continue="Continue anyway? (y/n) "
    if /i not "%continue%"=="y" exit /b 1
)

REM Start frontend
echo 🎨 Starting frontend development server...
npm run dev


