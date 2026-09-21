@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "start-server.ps1"
pause
