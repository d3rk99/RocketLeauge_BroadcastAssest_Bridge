@echo off
setlocal EnableExtensions
set EXIT_CODE=0

REM ISU RL API - one-click installer for Windows
REM Installs Python backend dependencies and Overwolf app npm deps.
REM Keeps window open at end so errors can be read.

cd /d "%~dp0"

echo [1/5] Checking Python availability...
where py >nul 2>nul
if %errorlevel% neq 0 (
  echo ERROR: Python launcher 'py' not found. Install Python 3.10+ and ensure 'py' is on PATH.
  set EXIT_CODE=1
  goto end
)

echo [2/5] Creating virtual environment (server\.venv)...
if not exist "server\.venv\Scripts\python.exe" (
  py -3 -m venv "server\.venv"
  if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment.
    set EXIT_CODE=1
    goto end
  )
) else (
  echo Existing virtual environment found.
)

echo [3/5] Installing backend requirements...
call "server\.venv\Scripts\activate.bat"
python -m pip install --upgrade pip
if %errorlevel% neq 0 (
  echo ERROR: pip upgrade failed.
  set EXIT_CODE=1
  goto end
)
pip install -r "server\requirements.txt"
if %errorlevel% neq 0 (
  echo ERROR: backend dependency install failed.
  set EXIT_CODE=1
  goto end
)

echo [4/5] Preparing .env files...
if not exist "server\.env" copy /y "server\.env.example" "server\.env" >nul
if not exist "overwolf-app\.env" copy /y "overwolf-app\.env.example" "overwolf-app\.env" >nul

echo [5/5] Installing Overwolf app dependencies...
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo WARNING: npm not found. Skipping overwolf-app npm install/build.
  echo Install Node.js LTS, then run:
  echo   cd overwolf-app ^&^& npm install ^&^& npm run build
  goto done
)

pushd "overwolf-app"
call npm install
if %errorlevel% neq 0 (
  echo ERROR: npm install failed.
  popd
  set EXIT_CODE=1
  goto end
)
call npm run build
if %errorlevel% neq 0 (
  echo ERROR: npm build failed.
  popd
  set EXIT_CODE=1
  goto end
)
popd

:done
echo.
echo Install complete.
echo Next step: run run_all.bat

:end
echo.
if "%EXIT_CODE%"=="0" (
  echo Script finished successfully.
) else (
  echo Script finished with errors. Review messages above.
)
pause
exit /b %EXIT_CODE%
