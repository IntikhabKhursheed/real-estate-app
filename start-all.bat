@echo off
REM EstateIQ - Start Backend & Frontend (Windows Batch Script)

echo.
echo ================================
echo EstateIQ - Starting Both Apps
echo ================================
echo.

REM Start backend in one window
echo [Backend] Starting server on http://localhost:5000...
start "EstateIQ Backend" cmd /k "node server/app.js"

REM Wait for backend to start
timeout /t 2 /nobreak

REM Start frontend in another window
echo [Frontend] Starting Angular dev server on http://localhost:4200...
start "EstateIQ Frontend" cmd /k "cd frontend && npm start"

echo.
echo ================================
echo Starting apps...
echo ================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:4200
echo.
echo Close each window to stop the apps.
echo.
