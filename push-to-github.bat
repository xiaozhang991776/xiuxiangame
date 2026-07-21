@echo off
setlocal EnableDelayedExpansion

REM === locate git (user has it on E:) ===
set "GIT="
if exist "E:\Git\cmd\git.exe" (set "GIT=E:\Git\cmd\git.exe") else (set "GIT=git")

REM === go to the script's own folder ===
cd /d "%~dp0"

set "USER=xiaozhang991776"

echo ============================================
echo   Push xiuxian-game to GitHub Pages
echo ============================================
echo.
echo Account: %USER%
echo.

REM === only ask for PAT (avoid pasting token into username field) ===
set "PAT="
set /p PAT="Paste your GitHub PAT token (ghp_...): "
if "%PAT%"=="" (
  echo.
  echo ERROR: PAT is empty. Run again and paste the token.
  echo To create/revoke tokens: github.com/settings/tokens
  pause
  exit /b 1
)

REM === stage + commit any pending changes ===
"%GIT%" add -A
"%GIT%" commit -m "update" >nul 2>&1

REM === set remote URL with token, push, then wipe token from config ===
"%GIT%" remote set-url origin https://%USER%:%PAT%@github.com/xiaozhang991776/xiuxiangame.git
echo.
echo Pushing to GitHub...
"%GIT%" push -u origin main 2>&1
set "PUSHERR=%errorlevel%"
"%GIT%" remote set-url origin https://github.com/xiaozhang991776/xiuxiangame.git

echo.
if %PUSHERR%==0 (
  echo *** PUSH OK ***
  echo Site: https://xiaozhang991776.github.io/xiuxiangame/
  echo (Wait ~1 minute, then refresh)
) else (
  echo *** PUSH FAILED (code %PUSHERR%) ***
  echo Common causes:
  echo   1. PAT wrong / expired / missing "repo" scope
  echo   2. Network reset: try again, or turn on your proxy/VPN for GitHub
  echo   3. Remote has conflicting history
)
echo.
pause
