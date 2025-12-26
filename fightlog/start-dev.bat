@echo off
echo Starting Fightlog Development Servers...
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080
echo.
echo Press Ctrl+C to stop the servers
echo.

start "Fightlog Backend" cmd /k "cd /d %~dp0backend && php -S localhost:8080"
start "Fightlog Frontend" cmd /k "cd /d %~dp0frontend && php -S localhost:3000"

echo Servers started in separate windows!
pause
