# PowerShell script to start backend and frontend

Write-Host "Starting Tap to Pay System..." -ForegroundColor Cyan

# Start backend in a new window
Write-Host "
Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in a new window
Write-Host "Starting Frontend Dashboard..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "
 Services started in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3001" -ForegroundColor White
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
