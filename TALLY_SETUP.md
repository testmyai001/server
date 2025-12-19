# Tally Prime Integration Setup Guide

This guide covers setting up the AutoTally AI app to connect to Tally Prime on port 9000.

## Prerequisites

- **Tally Prime** installed and running on your computer
- **Ngrok** (optional, for remote connections)
- AutoTally AI app configured and running

## Quick Setup (Local Connection)

### Step 1: Start Tally Prime

1. Open Tally Prime on your computer
2. It will run on **http://127.0.0.1:9000** by default
3. Keep Tally Prime open while using AutoTally AI

### Step 2: Configure Environment Variables

Edit `.env.local` in your project root:

```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_TALLY_API_URL=http://127.0.0.1:9000
```

**Or set in PowerShell:**
```powershell
$env:VITE_TALLY_API_URL = "http://127.0.0.1:9000"
npm run dev
```

### Step 3: Start the Dev Server

```bash
npm run dev
```

The dev server will start with a **built-in proxy** on `/tally` that forwards requests to port 9000.

### Step 4: Test the Connection

1. Open the app at http://localhost:3001
2. Go to **Settings** → **Test Tally Connection**
3. You should see: ✅ **"Tally Prime is connected"**

If connection fails, check:
- Tally Prime is running (`http://127.0.0.1:9000`)
- No firewall blocking port 9000
- `.env.local` has correct URL

---

## Remote Setup (Using Ngrok)

If you want to access Tally Prime from a different machine:

### Step 1: Install Ngrok

Download from [https://ngrok.com/download](https://ngrok.com/download)

### Step 2: Start Ngrok Tunnel to Tally Prime

```bash
ngrok http 9000
```

You'll see output like:
```
Forwarding                    https://abc123-xyz.ngrok-free.dev -> http://127.0.0.1:9000
```

**Copy the forwarding URL** (https URL with ngrok-free.dev)

### Step 3: Update Environment Variable

Edit `.env.local`:

```env
VITE_GEMINI_API_KEY=your_api_key_here
VITE_TALLY_API_URL=https://abc123-xyz.ngrok-free.dev
```

Or in PowerShell:
```powershell
$env:VITE_TALLY_API_URL = "https://abc123-xyz.ngrok-free.dev"
npm run dev
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

### Step 5: Test Connection

1. Go to app **Settings** → **Test Tally Connection**
2. Should show: ✅ **"Tally Prime is connected"**

---

## Troubleshooting

### ❌ "Connection Failed" or "Cannot reach Tally"

**Solution 1: Check Tally Prime is Running**
- Open Tally Prime manually
- Verify it shows port 9000 in the status bar
- Keep it open while using AutoTally

**Solution 2: Check Port 9000 is Available**
```powershell
# Windows PowerShell - Check what's using port 9000
Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
```

**Solution 3: Disable Windows Firewall Temporarily**
- Press `Win + R`, type `firewall.cpl`
- Click "Turn Windows Defender Firewall On or Off"
- Turn off temporarily to test
- If it works, add Tally Prime to firewall exceptions

**Solution 4: Verify Environment Variable is Set**
```powershell
# Check if env var is loaded
$env:VITE_TALLY_API_URL
# Should output: http://127.0.0.1:9000
```

### ❌ "Ngrok connection not working"

**Solution 1: Ngrok Tunnel Expired**
- Ngrok free tier sessions expire after 2 hours
- Run `ngrok http 9000` again to get a new URL
- Update `.env.local` with new URL

**Solution 2: Internet Connectivity**
- Check you have internet access
- Ngrok requires active internet connection

**Solution 3: Tally Prime Still on Port 9000**
- Verify Tally Prime is still running
- Ngrok just creates a tunnel; Tally must be active

### ❌ "Ngrok: Invalid authorization token"

- Sign up for free account at https://ngrok.com
- Run `ngrok config add-authtoken YOUR_TOKEN` 
- Get token from Dashboard → Auth → Your Authtoken

### ❌ "CORS Error: Access Denied"

- The dev server has a built-in proxy at `/tally` to handle CORS
- Make sure proxy is configured in `vite.config.ts`
- Restart dev server: `npm run dev`

---

## How Tally Connection Works

### Local Connection (Port 9000)
```
Browser (http://localhost:3001)
    ↓
Vite Dev Server (Proxy: /tally → http://127.0.0.1:9000)
    ↓
Tally Prime (http://127.0.0.1:9000)
```

### Remote Connection (Ngrok)
```
Browser (http://localhost:3001)
    ↓
AutoTally AI (.env.local: VITE_TALLY_API_URL)
    ↓
Ngrok Tunnel (https://abc123-xyz.ngrok-free.dev)
    ↓
Your Local Tally Prime (http://127.0.0.1:9000)
```

---

## Tally XML Protocol

The app sends XML requests to Tally Prime:

### Request Format
```xml
<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE RequestType="Command">
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Import</TALLYREQUEST>
    <TYPE>Data</TYPE>
  </HEADER>
  <BODY>
    <IMPORTLIST></IMPORTLIST>
  </BODY>
</ENVELOPE>
```

### Response Format
```xml
<?xml version="1.0" encoding="utf-8"?>
<RESPONSE>
  <LINEERROR>0</LINEERROR>
  <CREATED>1</CREATED>
</RESPONSE>
```

---

## Tally Data Sync Features

Once connected, AutoTally AI can:

✅ **Push Invoices to Tally**
- Automatically generates XML vouchers
- Supports Purchase, Sales, Payment, Receipt, Contra
- Calculates GST automatically (CGST, SGST, IGST, Cess)

✅ **Fetch Ledgers from Tally**
- Retrieves existing ledgers for auto-complete
- Validates party names before import
- Prevents duplicate entries

✅ **Check Tally Connection**
- Real-time connection status
- Shows active company info
- Health check in Settings

✅ **Generate Tax Ledgers**
- Auto-creates GST ledger accounts if missing
- Supports all tax rates (5%, 12%, 18%, 28%)
- Inter-state vs Intra-state calculations

---

## Performance Tips

1. **Keep Tally Prime Open** – Don't close it while syncing data
2. **Use Local Connection** – Local (port 9000) is faster than Ngrok
3. **Batch Import** – Use Excel bulk import for multiple invoices
4. **Check Connection First** – Test Tally connection before pushing data

---

## Security Notes

- ⚠️ **Never expose Tally Prime** directly to the internet without authentication
- 🔒 **Use Ngrok's Basic Auth** for remote access: `ngrok http 9000 --basic-auth username:password`
- 🔐 **Firewall Rules** – Restrict port 9000 access to trusted IPs only
- 📝 **No Data Stored** – All data stays locally; nothing sent to our servers

---

## Support & Debugging

### Enable Debug Logging
1. Open Browser DevTools (`F12`)
2. Go to **Console** tab
3. Watch for Tally API errors
4. Check **Network** tab for request/response details

### Check Dev Server Logs
- Terminal where you ran `npm run dev`
- Look for Tally proxy messages
- Errors will show here first

### Verify Tally Prime is Listening
```powershell
# Test connection in PowerShell
Invoke-WebRequest -Uri "http://127.0.0.1:9000" -ErrorAction SilentlyContinue
# If successful, you'll see response (may have error but port is open)
```

---

## Next Steps

1. ✅ Install and start Tally Prime
2. ✅ Set `VITE_TALLY_API_URL` in `.env.local`
3. ✅ Start dev server: `npm run dev`
4. ✅ Test connection in Settings
5. ✅ Upload your first invoice!

---

**Last Updated:** December 18, 2025  
**AutoTally AI v0.0.0**
