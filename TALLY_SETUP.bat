@echo off
REM AutoTally AI - Tally Prime Quick Setup Script
REM This script helps you quickly configure and start the app

echo.
echo ===== AutoTally AI - Tally Setup =====
echo.

REM Check if Tally Prime is running on port 9000
echo Checking Tally Prime connection...
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:9000' -TimeoutSec 2 -ErrorAction SilentlyContinue; if ($response) { Write-Host 'OK' } } catch { Write-Host 'NOT FOUND' }"

echo.
echo Instructions:
echo.
echo 1. TALLY PRIME SETUP:
echo    - Open Tally Prime manually (it runs on port 9000)
echo    - Keep it open while using AutoTally AI
echo.
echo 2. ENVIRONMENT CONFIGURATION:
echo    - Edit .env.local and set:
echo      VITE_TALLY_API_URL=http://127.0.0.1:9000
echo.
echo 3. START DEV SERVER:
echo    - npm run dev
echo.
echo 4. TEST CONNECTION:
echo    - Go to app Settings
echo    - Click "Test Tally Connection"
echo    - Should show connected status
echo.
echo 5. PUSH DATA TO TALLY:
echo    - Upload invoice or Excel file
echo    - Click "Push to Tally"
echo    - Check Tally for new entry
echo.
echo ===== FOR REMOTE SETUP (Ngrok) =====
echo.
echo 1. Install Ngrok: https://ngrok.com/download
echo.
echo 2. Start Ngrok tunnel:
echo    ngrok http 9000
echo.
echo 3. Copy the https URL from Ngrok output
echo.
echo 4. Update .env.local:
echo    VITE_TALLY_API_URL=https://your-ngrok-url.ngrok-free.dev
echo.
echo 5. Restart dev server:
echo    npm run dev
echo.
echo ===== TROUBLESHOOTING =====
echo.
echo Q: "Tally connection failed"
echo A: Make sure Tally Prime is open and running on port 9000
echo.
echo Q: "Port 9000 already in use"
echo A: Kill the process on port 9000 or change Tally Prime port settings
echo.
echo Q: "Ngrok tunnel expired"
echo A: Ngrok free sessions expire after 2 hours. Run ngrok http 9000 again
echo.
pause
