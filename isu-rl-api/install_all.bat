@echo off
setlocal EnableExtensions EnableDelayedExpansion
set EXIT_CODE=0

REM ISU RL API - one-click installer for Windows
REM Installs Python (if missing), creates venv, installs backend deps,
REM and builds Overwolf app deps. Keeps window open for errors.

cd /d "%~dp0"

set "PYTHON_EXE="
set "PYTHON_ARGS="

echo [1/6] Finding a working Python executable...
call :set_python_command
if "%PYTHON_EXE%"=="" (
  echo No working Python runtime found in PATH.
  echo Attempting to install Python 3 via winget...
  where winget >nul 2>nul
  if !errorlevel! neq 0 (
    echo ERROR: winget is not available, so Python cannot be auto-installed.
    echo Install Python 3.10+ manually, disable MS Store app aliases for python.exe if needed,
    echo then rerun this script.
    set EXIT_CODE=1
    goto end
  )

  winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
  if !errorlevel! neq 0 (
    echo ERROR: winget Python install failed.
    echo Install Python manually from https://www.python.org/downloads/ and rerun.
    set EXIT_CODE=1
    goto end
  )

  REM Refresh detection after install
  call :set_python_command
  if "%PYTHON_EXE%"=="" (
    echo ERROR: Python installed but not usable in this terminal yet.
    echo Close this window, open a NEW terminal, and rerun install_all.bat.
    set EXIT_CODE=1
    goto end
  )
)

echo Using Python command: %PYTHON_EXE% %PYTHON_ARGS%

echo [2/6] Creating virtual environment (server\.venv)...
if not exist "server\.venv\Scripts\python.exe" (
  call %PYTHON_EXE% %PYTHON_ARGS% -m venv "server\.venv"
  if !errorlevel! neq 0 (
    echo ERROR: Failed to create virtual environment.
    set EXIT_CODE=1
    goto end
  )
) else (
  echo Existing virtual environment found.
)

if not exist "server\.venv\Scripts\python.exe" (
  echo ERROR: Virtual environment creation did not produce server\.venv\Scripts\python.exe
  echo This usually means Python command was not actually usable.
  set EXIT_CODE=1
  goto end
)

echo [3/6] Installing backend requirements into server\.venv...
call "server\.venv\Scripts\activate.bat"
if !errorlevel! neq 0 (
  echo ERROR: Failed to activate virtual environment.
  set EXIT_CODE=1
  goto end
)
python -m pip install --upgrade pip
if !errorlevel! neq 0 (
  echo ERROR: pip upgrade failed.
  set EXIT_CODE=1
  goto end
)
pip install -r "server\requirements.txt"
if !errorlevel! neq 0 (
  echo ERROR: backend dependency install failed.
  set EXIT_CODE=1
  goto end
)

echo [4/6] Preparing .env files...
if not exist "server\.env" copy /y "server\.env.example" "server\.env" >nul
if not exist "overwolf-app\.env" copy /y "overwolf-app\.env.example" "overwolf-app\.env" >nul

echo [5/6] Installing Overwolf app dependencies...
where npm >nul 2>nul
if !errorlevel! neq 0 (
  echo WARNING: npm not found. Skipping overwolf-app npm install/build.
  echo Install Node.js LTS, then run:
  echo   cd overwolf-app ^&^& npm install ^&^& npm run build
  goto done
)

pushd "overwolf-app"
call npm install
if !errorlevel! neq 0 (
  echo ERROR: npm install failed.
  popd
  set EXIT_CODE=1
  goto end
)
call npm run build
if !errorlevel! neq 0 (
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

goto end

:set_python_command
set "PYTHON_EXE="
set "PYTHON_ARGS="

REM Prefer py launcher when present and working.
where py >nul 2>nul
if !errorlevel! equ 0 (
  py -3 --version >nul 2>nul
  if !errorlevel! equ 0 (
    set "PYTHON_EXE=py"
    set "PYTHON_ARGS=-3"
    goto :eof
  )
)

REM Check python command and reject broken Microsoft Store alias.
where python >nul 2>nul
if !errorlevel! equ 0 (
  python --version >nul 2>nul
  if !errorlevel! equ 0 (
    set "PYTHON_EXE=python"
    set "PYTHON_ARGS="
    goto :eof
  )
)

REM Check common direct install path if PATH not refreshed.
if exist "%LocalAppData%\Programs\Python\Python312\python.exe" (
  "%LocalAppData%\Programs\Python\Python312\python.exe" --version >nul 2>nul
  if !errorlevel! equ 0 (
    set "PYTHON_EXE=""%LocalAppData%\Programs\Python\Python312\python.exe"""
    set "PYTHON_ARGS="
    goto :eof
  )
)

if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
  "%LocalAppData%\Programs\Python\Python311\python.exe" --version >nul 2>nul
  if !errorlevel! equ 0 (
    set "PYTHON_EXE=""%LocalAppData%\Programs\Python\Python311\python.exe"""
    set "PYTHON_ARGS="
    goto :eof
  )
)

goto :eof

:end
echo.
if "%EXIT_CODE%"=="0" (
  echo Script finished successfully.
) else (
  echo Script finished with errors. Review messages above.
)
pause
exit /b %EXIT_CODE%
