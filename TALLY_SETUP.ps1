#!/usr/bin/env powershell

# AutoTally AI - Tally Prime Quick Setup Script
# Configures and starts the app for Tally integration on port 9000

Write-Host "`n===== AutoTally AI - Tally Prime Setup =====" -ForegroundColor Cyan
Write-Host ""

# Check if Tally Prime is running on port 9000
Write-Host "Checking Tally Prime on port 9000..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:9000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✓ Tally Prime is running on port 9000!" -ForegroundColor Green
} catch {
    Write-Host "✗ Tally Prime not found on port 9000" -ForegroundColor Red
    Write-Host "  Make sure Tally Prime is open and running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===== QUICK START (Local Connection) =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ensure Tally Prime is open (runs on port 9000)" -ForegroundColor White
Write-Host "2. Check/update .env.local with:" -ForegroundColor White
Write-Host "   VITE_TALLY_API_URL=http://127.0.0.1:9000" -ForegroundColor Gray
Write-Host "3. Start dev server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host "4. Test connection in Settings" -ForegroundColor White
Write-Host ""

# Optional: Prompt to set environment variable
$setupChoice = Read-Host "Set VITE_TALLY_API_URL now? (Y/N)"
if ($setupChoice -eq "Y" -or $setupChoice -eq "y") {
    $env:VITE_TALLY_API_URL = "http://127.0.0.1:9000"
    Write-Host "✓ Set: VITE_TALLY_API_URL = http://127.0.0.1:9000" -ForegroundColor Green
    Write-Host "  (This is for current session only. Add to .env.local for persistence)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===== REMOTE SETUP (Using Ngrok) =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Install Ngrok: https://ngrok.com/download" -ForegroundColor White
Write-Host "2. Start tunnel: ngrok http 9000" -ForegroundColor Gray
Write-Host "3. Copy https URL from Ngrok output" -ForegroundColor White
Write-Host "4. Update VITE_TALLY_API_URL in .env.local" -ForegroundColor White
Write-Host "5. Restart dev server: npm run dev" -ForegroundColor Gray
Write-Host ""

# Optional: Start dev server
$startServer = Read-Host "Start dev server now? (Y/N)"
if ($startServer -eq "Y" -or $startServer -eq "y") {
    Write-Host ""
    Write-Host "Starting dev server..." -ForegroundColor Cyan
    npm run dev
} else {
    Write-Host "To start later, run: npm run dev" -ForegroundColor Gray
}
