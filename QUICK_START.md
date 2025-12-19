# 🚀 Quick Start Guide

## 1️⃣ Start Tally Prime
```
Click on Tally Prime icon on your desktop
Wait for it to load (usually shows "Tally Prime - Company" in title bar)
Keep it open
```

## 2️⃣ Start React App (Dev Mode)
```bash
npm run dev
```
**Result:**
```
VITE v6.4.1 ready in 206 ms
➜  Local:   http://localhost:3000/
```

## 3️⃣ Open Browser
- Go to: **http://localhost:3000**
- App will load with Dashboard

## 4️⃣ Test Tally Connection
```
Settings (bottom left menu)
  ↓
Test Tally Connection button
  ↓
Should show: ✅ "Tally Prime Connected"
```

## 5️⃣ Upload Invoice
```
Dashboard Tab
  ↓
Click "Upload Invoice" button
  ↓
Select invoice image/PDF from computer
  ↓
Wait for AI processing from backend
```

## 6️⃣ Push to Tally
```
Review extracted data
  ↓
Click "Push to Tally" button
  ↓
Voucher created in Tally Prime
  ↓
Check Tally for new entry
```

---

## ✅ Success Indicators

| Step | Success Sign |
|------|-------------|
| React starts | Port 3000 opens in browser |
| Tally detected | Settings shows connected status |
| Invoice uploaded | Data appears in editor |
| Tally receives | Voucher number returned |
| Tally saved | Entry visible in Tally Prime |

---

## ⚠️ Common Issues & Fixes

### "Cannot reach Tally"
```
1. Check if Tally Prime is running
2. Verify port 9000 is not blocked
3. Restart dev server: npm run dev
4. Try again
```

### "AI Processing failed"
```
1. Check image quality
2. Try different invoice
3. Check browser console (F12) for details
```

### "Blank Dashboard"
```
1. Refresh browser (F5)
2. Check browser console for errors
3. Restart dev server: npm run dev
```

---

## 📱 System Requirements

✅ **Met if you have:**
- Windows/Mac/Linux computer
- Tally Prime installed
- Node.js v18+ installed
- Browser (Chrome, Firefox, Edge, Safari)
- Internet connection

---

## 🎯 What Happens Behind the Scenes

```
You: Upload Invoice
    ↓
React App: Sends to Backend AI
    ↓
Backend: Analyzes image, extracts data
    ↓
React: Receives structured invoice data
    ↓
React: Converts to Tally XML format
    ↓
React: Sends XML to Local Tally (port 9000)
    ↓
Tally Prime: Creates Purchase/Sales Voucher
    ↓
Tally: Returns success
    ↓
React: Shows confirmation message
    ↓
You: Invoice now in Tally
```

---

## 🔑 Key Ports & URLs

| Service | URL | Port | Status |
|---------|-----|------|--------|
| React App | http://localhost:3000 | 3000 | Running |
| Tally Prime | http://127.0.0.1:9000 | 9000 | Running |
| Backend API | https://autotally-backend.onrender.com | 443 | Online |

---

## 💡 Pro Tips

1. **Multiple Invoices:** Keep uploading for batch processing
2. **Error Details:** Check browser console (Press F12)
3. **Tally Logs:** View all pushes in "Tally Logs" tab
4. **Local History:** All uploads saved in browser IndexedDB
5. **Offline:** App works offline, syncs when internet returns

---

## 🛑 Stop Services

**To stop React dev server:**
```bash
Press Ctrl + C in terminal
```

**To stop Tally Prime:**
```
File → Exit in Tally Menu
```

---

**Ready? Start with Step 1: "Start Tally Prime"** ✅

