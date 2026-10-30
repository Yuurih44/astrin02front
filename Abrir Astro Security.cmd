@echo off
setlocal
cd /d "%~dp0"
node dev-local.mjs 4180
pause
endlocal
