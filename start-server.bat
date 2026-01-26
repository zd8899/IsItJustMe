@echo off
title IsItJustMe Dev Server
cd /d D:\source\repos\zekeriyademir\IsItJustMe
echo ==========================================
echo   IsItJustMe Development Server
echo ==========================================
echo.
echo Killing any existing process on port 3000...
call npx kill-port 3000 2>nul
echo.
echo Starting Next.js dev server on port 3000...
echo Press Ctrl+C to stop the server
echo.
call npm run dev
