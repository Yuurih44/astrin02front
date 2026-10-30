@echo off
setlocal
cd /d "%~dp0"
set "ASTRO_HOST=127.0.0.1"
set "ASTRO_PORT=4182"
set "ASTRO_ENABLE_INTAKE=1"
echo Astro Security demo local: http://localhost:4182/?motion=full#contato
node server.mjs
pause
endlocal
