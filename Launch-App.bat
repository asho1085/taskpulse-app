@echo off
setlocal
title TaskPulse Launcher
cd /d "%~dp0"

:: Start node server directly in background if not already running
tasklist /fi "imagename eq node.exe" | findstr /i "node.exe" >nul
if %errorlevel% neq 0 (
    start "" /b "C:\Program Files\nodejs\node.exe" server.js
    timeout /t 1 /nobreak >nul
)

set "APP_URL=http://127.0.0.1:4321"

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

start "" "%APP_URL%"

:done
exit
