@echo off
setlocal
title TaskPulse Launcher
cd /d "%~dp0"

echo Starting TaskPulse Desktop App...

:: Check if Node is available to start the local disk-sync server
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting local background sync server on port 4321...
    start /b "" node server.js >nul 2>&1
    :: Wait a brief moment for the server to bind
    timeout /t 1 /nobreak >nul
    set "APP_URL=http://127.0.0.1:4321"
) else (
    echo Node.js not detected; launching in standalone offline mode...
    set "APP_URL=file:///%~dp0index.html"
)

:: Locate Microsoft Edge or Google Chrome to launch in dedicated desktop App Window mode
set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_EXE%" set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

if exist "%EDGE_EXE%" (
    start "" "%EDGE_EXE%" --app="%APP_URL%" --window-size=1200,820
    goto :done
)

if exist "%CHROME_EXE%" (
    start "" "%CHROME_EXE%" --app="%APP_URL%" --window-size=1200,820
    goto :done
)

:: Fallback: default system browser
start "" "%APP_URL%"

:done
exit
