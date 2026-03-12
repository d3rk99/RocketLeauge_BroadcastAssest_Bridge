@echo off
setlocal EnableExtensions
set EXIT_CODE=0

REM ISU RL API - one-click runner for Windows
REM Starts backend API and static web host in separate terminal windows.
REM Uses venv Python to avoid depending on py launcher.

cd /d "%~dp0"

if not exist "server\.venv\Scripts\python.exe" (
  echo ERROR: Missing server virtualenv. Run install_all.bat first.
  set EXIT_CODE=1
  goto end
)

if not exist "server\.env" (
  echo server\.env not found. Copying from .env.example
  copy /y "server\.env.example" "server\.env" >nul
)

echo Starting backend on http://localhost:8000 ...
start "ISU RL API - Backend" cmd /k "cd /d %~dp0server && call .venv\Scripts\activate.bat && uvicorn app:app --host 0.0.0.0 --port 8000 --reload"

echo Starting static host on http://localhost:5500 using venv Python ...
start "ISU RL API - Web Host" cmd /k "cd /d %~dp0 && server\.venv\Scripts\python.exe -m http.server 5500"

echo.
echo Services launched.
echo Overlay URL: http://localhost:5500/web/overlay/index.html?base=http://localhost:8000
echo Admin URL:   http://localhost:5500/web/admin/index.html
echo.
echo Note: Open Overwolf dev tools and load overwolf-app\manifest.json.
echo Backend/Web windows were started with cmd /k so they remain open.

:end
echo.
if "%EXIT_CODE%"=="0" (
  echo Launcher script finished successfully.
) else (
  echo Launcher script finished with errors. Review messages above.
)
pause
exit /b %EXIT_CODE%
