# EstateIQ - Start Backend & Frontend
# This script starts both the backend server and frontend dev server

Write-Host "================================" -ForegroundColor Green
Write-Host "EstateIQ - Starting Both Apps" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Colors for output
$backendColor = "Cyan"
$frontendColor = "Magenta"

# Start backend
Write-Host "[Backend] Starting server on http://localhost:5000..." -ForegroundColor $backendColor
$backend = Start-Process -NoNewWindow -PassThru -FileName "node" -ArgumentList "server/app.js" -WorkingDirectory $PSScriptRoot

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend
Write-Host "[Frontend] Starting Angular dev server on http://localhost:4200..." -ForegroundColor $frontendColor
$frontend = Start-Process -NoNewWindow -PassThru -FileName "cmd" -ArgumentList "/c cd frontend && npm start" -WorkingDirectory $PSScriptRoot

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✓ Both apps are starting!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor $backendColor
Write-Host "Frontend: http://localhost:4200" -ForegroundColor $frontendColor
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop." -ForegroundColor Yellow
Write-Host ""

# Wait for both processes
$backend | Wait-Process
$frontend | Wait-Process
