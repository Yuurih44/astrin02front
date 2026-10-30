@echo off
cd /d "%~dp0"
echo Astro Security: http://localhost:4180/?motion=full
node server.mjs
pause
