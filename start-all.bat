@echo off
echo Starting Tap to Pay System...
echo.

echo Starting Backend Server...
start "Backend" powershell -NoExit -Command "cd backend; npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend Dashboard...
start "Frontend" powershell -NoExit -Command "cd frontend; npm run dev"

echo.
echo Services started in separate windows!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
pause

