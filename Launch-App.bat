@echo off
setlocal
title TaskPulse
cd /d "%~dp0"

:: Launch pure cloud app in dedicated desktop window
set "APP_URL=https://asho1085.github.io/taskpulse-app/"

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
