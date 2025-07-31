@echo off
setlocal enabledelayedexpansion

:: === CONFIGURATION ===
set "API_URL=http://localhost:3000/api/check"
set "API_KEY=13278912391823714-ROG-X"
set "SHORTLINK=sad"
set "IP=8.8.8.8"
set "UA=Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
set "REQUESTS=20"

echo.
echo ===============================
echo  ROG ANTIBOT API TEST BEGIN
echo  Sending %REQUESTS% requests to: %API_URL%
echo ===============================
echo.

for /L %%i in (1,1,%REQUESTS%) do (
    echo [%%i] Sending request...
    curl -s -X POST %API_URL% ^
      -H "Content-Type: application/json" ^
      -d "{\"apiKey\":\"%API_KEY%\",\"ip\":\"%IP%\",\"userAgent\":\"%UA%\",\"shortlink\":\"%SHORTLINK%\",\"honeypot\":\"\"}"
    echo.
    timeout /t 1 >nul
)

echo.
echo ===============================
echo  TEST COMPLETE — CHECK LOGS
echo ===============================
pause
