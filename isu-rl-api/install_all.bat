@echo off
setlocal EnableExtensions
set EXIT_CODE=0

REM ISU RL API - one-click installer for Windows
REM Installs Python (if missing), creates venv, installs backend deps,
REM and builds Overwolf app deps. Keeps window open for errors.

cd /d "%~dp0"

set "PYTHON_EXE="

echo [1/6] Finding Python executable...
where py >nul 2>nul
if %errorlevel% equ 0 (
  set "PYTHON_EXE=py -3"
  echo Found Python launcher: py
  goto python_ready
)

where python >nul 2>nul
if %errorlevel% equ 0 (
  set "PYTHON_EXE=python"
  echo Found Python executable: python
  goto python_ready
)

echo Python not found in PATH.
echo Attempting to install Python 3 via winget...
where winget >nul 2>nul
if %errorlevel% neq 0 (
  echo ERROR: winget is not available, so Python cannot be auto-installed.
  echo Install Python 3.10+ manually, then run this script again.
  set EXIT_CODE=1
  goto end
)

winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
if %errorlevel% neq 0 (
  echo ERROR: winget Python install failed.
  echo Install Python manually from https://www.python.org/downloads/ and rerun.
  set EXIT_CODE=1
  goto end
)

REM Refresh detection after install
where py >nul 2>nul
if %errorlevel% equ 0 (
  set "PYTHON_EXE=py -3"
  echo Python installed and detected via py launcher.
  goto python_ready
)
where python >nul 2>nul
if %errorlevel% equ 0 (
  set "PYTHON_EXE=python"
  echo Python installed and detected via python executable.
  goto python_ready
)

echo ERROR: Python installed but not found in current shell PATH.
echo Close this window, open a new terminal, and rerun install_all.bat.
set EXIT_CODE=1
goto end

:python_ready
echo [2/6] Creating virtual environment (server\.venv)...
if not exist "server\.venv\Scripts\python.exe" (
  call %PYTHON_EXE% -m venv "server\.venv"
  if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment.
    set EXIT_CODE=1
    goto end
  )
) else (
  echo Existing virtual environment found.
)

echo [3/6] Installing backend requirements into server\.venv...
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

echo [4/6] Preparing .env files...
if not exist "server\.env" copy /y "server\.env.example" "server\.env" >nul
if not exist "overwolf-app\.env" copy /y "overwolf-app\.env.example" "overwolf-app\.env" >nul

echo [5/6] Installing Overwolf app dependencies...
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

echo [6/6] Install steps complete.

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
