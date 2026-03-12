@echo off
setlocal EnableExtensions EnableDelayedExpansion
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

echo Waiting for backend readiness...
set /a WAIT_COUNT=0
:wait_backend
set /a WAIT_COUNT+=1
if %WAIT_COUNT% gtr 20 goto backend_timeout

where curl >nul 2>nul
if %errorlevel% equ 0 (
  curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8000/ > "%TEMP%\isu_rl_api_status.tmp"
  set /p STATUS_CODE=<"%TEMP%\isu_rl_api_status.tmp"
  del "%TEMP%\isu_rl_api_status.tmp" >nul 2>nul
) else (
  powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/ -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
  if !errorlevel! equ 0 (
    set "STATUS_CODE=200"
  ) else (
    set "STATUS_CODE=000"
  )
)

if "%STATUS_CODE%"=="200" goto backend_ready
if "%STATUS_CODE%"=="000" (
  timeout /t 1 >nul
  goto wait_backend
)

timeout /t 1 >nul
goto wait_backend

:backend_ready
echo Backend is responding on http://localhost:8000

goto post_launch

:backend_timeout
echo WARNING: Backend did not report ready within timeout.
echo Keep the backend window open and check startup logs.

:post_launch
echo.
echo Services launched.
echo Overlay URL: http://localhost:5500/web/overlay/index.html?base=http://localhost:8000
echo Admin URL:   http://localhost:5500/web/admin/index.html
echo.

if exist "overwolf-app\manifest.json" (
  echo Opening Overwolf app folder to simplify loading manifest...
  start "ISU RL API - Overwolf Folder" explorer "%~dp0overwolf-app"
)

echo Note: In Overwolf dev tools, load overwolf-app\manifest.json.
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
