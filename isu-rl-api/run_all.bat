@echo off
setlocal EnableExtensions

REM ISU RL API - one-click runner for Windows
REM Starts backend API and static web host in separate terminal windows.

cd /d "%~dp0"

if not exist "server\.venv\Scripts\python.exe" (
  echo ERROR: Missing server virtualenv. Run install_all.bat first.
  exit /b 1
)

if not exist "server\.env" (
  echo server\.env not found. Copying from .env.example
  copy /y "server\.env.example" "server\.env" >nul
)

echo Starting backend on http://localhost:8000 ...
start "ISU RL API - Backend" cmd /k "cd /d %~dp0server && call .venv\Scripts\activate.bat && uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

echo Starting static host on http://localhost:5500 ...
start "ISU RL API - Web Host" cmd /k "cd /d %~dp0 && py -3 -m http.server 5500"

echo.
echo Services launched.
echo Overlay URL: http://localhost:5500/web/overlay/index.html?base=http://localhost:8000
echo Admin URL:   http://localhost:5500/web/admin/index.html
echo.
echo Note: Load overwolf-app\manifest.json in Overwolf developer tools.
exit /b 0
