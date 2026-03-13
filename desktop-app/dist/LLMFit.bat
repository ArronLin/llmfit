@echo off
chcp 65001 >nul
title LLMFit

echo Starting LLMFit...
echo.

REM Get the directory where this batch file is located
set "APP_DIR=%~dp0"

REM Start the backend
start /min "LLMFit Backend" "%APP_DIR%backend\llmfit-backend.exe" --port 8000

REM Wait for backend to start
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

REM Open browser
echo Opening LLMFit in your browser...
start http://127.0.0.1:8000

echo.
echo LLMFit is running at http://127.0.0.1:8000
echo Press any key to stop LLMFit...
pause >nul

REM Stop the backend
taskkill /F /IM llmfit-backend.exe >nul 2>&1

echo LLMFit stopped.
