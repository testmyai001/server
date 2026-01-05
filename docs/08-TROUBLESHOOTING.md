# AutoTallyAI - Troubleshooting & FAQs

## Table of Contents
1. [Common Frontend Issues](#common-frontend-issues)
2. [Backend & API Issues](#backend--api-issues)
3. [Tally Integration Issues](#tally-integration-issues)
4. [Database Issues](#database-issues)
5. [Performance Issues](#performance-issues)
6. [Security & Authentication](#security--authentication)
7. [Desktop App Issues](#desktop-app-issues)
8. [FAQs](#faqs)

---

## Common Frontend Issues

### Issue: "Cannot connect to backend API"

**Error Message:**
```
Failed to fetch from http://localhost:8000/invoices
```

**Root Causes:**
1. Backend server not running
2. Wrong API URL in `.env.local`
3. Firewall blocking port 8000
4. Backend listening on different port

**Solution Steps:**

```powershell
# 1. Check if backend is running
Test-NetConnection -ComputerName localhost -Port 8000

# 2. Verify .env.local has correct URL
cat .env.local | findstr VITE_API_BASE_URL

# 3. Restart backend in new terminal
cd backend
python main.py

# 4. Try accessing health endpoint directly
Invoke-WebRequest -Uri "http://localhost:8000/health"

# 5. Check firewall
Get-NetFirewallRule -DisplayName "Python*" | Format-List
```

**Long-term Fix:**
- Verify `VITE_API_BASE_URL` in `.env.local` matches backend URL
- Ensure backend is started before frontend
- Document backend URL for team

---

### Issue: "Hot reload (HMR) not working"

**Symptoms:**
- Changes to `.tsx` files don't reflect in browser
- Need to manually refresh page

**Root Cause:** Vite HMR configuration issue

**Solution:**

```bash
# Clear Vite cache
rmdir -r .vite/cache
npm run dev

# Or add to vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws'
    }
  }
})
```

---

### Issue: "404 Not Found" errors in console

**Error Message:**
```
GET /src/components/MyComponent.tsx 404 (Not Found)
```

**Root Cause:** Incorrect import path

**Solution:**
```typescript
// ❌ Wrong
import MyComponent from 'components/MyComponent';

// ✅ Correct
import MyComponent from './components/MyComponent';
```

**Verification:**
1. Check file path is correct
2. Verify capitalization matches
3. Ensure file exists in specified location

---

### Issue: "Uncaught TypeError: Cannot read property 'map' of undefined"

**Symptoms:**
- White screen or partial rendering
- Error in component rendering

**Root Cause:** Accessing array/object properties before data loads

**Solution:**
```typescript
// ❌ Unsafe
const MyComponent = ({ items }) => (
  <div>{items.map(i => i.name)}</div>  // Error if items undefined
);

// ✅ Safe - Check first
const MyComponent = ({ items = [] }) => (
  <div>
    {items && items.length > 0 ? (
      items.map(i => <span key={i.id}>{i.name}</span>)
    ) : (
      <p>No items found</p>
    )}
  </div>
);

// ✅ Safe - Use optional chaining
const MyComponent = ({ items }) => (
  <div>
    {items?.map(i => (
      <span key={i.id}>{i.name}</span>
    ))}
  </div>
);
```

---

### Issue: "CSS styles not applying"

**Symptoms:**
- Tailwind classes not showing effect
- Styles seem missing

**Root Causes:**
1. Tailwind CSS not compiled
2. CSS file not imported
3. Specificity issue
4. Vite not bundling CSS

**Solution:**

```typescript
// Check index.tsx imports CSS
import './index.css';

// Verify tailwind.config.js content array
// tailwind.config.js
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
}

// Force rebuild
npm run build
npm run dev
```

---

## Backend & API Issues

### Issue: "ModuleNotFoundError: No module named 'fastapi'"

**Error Message:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Root Cause:** Python dependencies not installed

**Solution:**

```powershell
# In backend directory
pip install -r requirements.txt

# Or install individually
pip install fastapi uvicorn sqlalchemy pydantic python-multipart

# Verify installation
python -c "import fastapi; print(fastapi.__version__)"
```

---

### Issue: "CORS error: Access-Control-Allow-Origin"

**Error Message:**
```
Access to XMLHttpRequest at 'http://localhost:8000/invoices' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Root Cause:** Frontend origin not in backend CORS allowed list

**Solution:**

```python
# In backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Add frontend URL
        "http://localhost:3000",
        "https://yourdomain.com"      # Production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Alternative (Vite Proxy):**

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

---

### Issue: "uvicorn not found" or "python -m uvicorn not working"

**Error:**
```
'uvicorn' is not recognized as an internal or external command
```

**Solution:**

```powershell
# Install uvicorn
pip install uvicorn

# Run with python module
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or ensure virtual environment is activated
.\venv\Scripts\Activate
uvicorn main:app --reload
```

---

### Issue: "Request body parse error"

**Error:**
```json
{
  "detail": [{"loc": ["body"], "msg": "Request body is not valid JSON", ...}]
}
```

**Root Cause:** Invalid JSON in request

**Solution:**

```typescript
// ✅ Correct - Stringify object
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ field1: 'value', field2: 123 })
});

// ❌ Wrong - Object without stringify
body: { field1: 'value' }  // Not valid JSON
```

---

### Issue: "413 Payload Too Large"

**Error:**
```
413 Payload Too Large
```

**Root Cause:** File size exceeds backend limit

**Solution:**

```python
# Increase upload limit in main.py
from fastapi import FastAPI

app = FastAPI()

# Default is usually 16MB, increase to 100MB
# Configure at server level or use streaming

@app.post("/upload-invoice")
async def upload_invoice(file: UploadFile):
    # Check file size
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=413, detail="File too large")
    # Process file...
```

---

### Issue: "timeout error" or "connection reset"

**Error:**
```
TimeoutError: Request timeout after 30 seconds
ConnectionResetError: Connection reset by peer
```

**Root Causes:**
1. Backend processing too slow
2. Network issue
3. Large file processing
4. Database query timeout

**Solution:**

```python
# Increase timeout in backend
import uvicorn

uvicorn.run(
    app,
    host="0.0.0.0",
    port=8000,
    timeout_keep_alive=300  # 5 minutes
)

# Or use async processing for heavy operations
@app.post("/process-invoice")
async def process_invoice(file: UploadFile):
    # Offload to background task
    background_tasks.add_task(process_heavy_file, file)
    return {"status": "processing"}
```

---

## Tally Integration Issues

### Issue: "Cannot connect to Tally Prime"

**Error Message:**
```
ConnectionError: Failed to connect to 127.0.0.1:9000
Cannot connect to Tally Prime on 127.0.0.1:9000
```

**Root Causes:**
1. Tally Prime not running
2. Tally listening on different port
3. Firewall blocking port 9000
4. Tally XML API not enabled

**Solution Steps:**

```powershell
# 1. Check if Tally is running
Test-NetConnection -ComputerName 127.0.0.1 -Port 9000

# 2. Start Tally Prime
# Open Tally application

# 3. Enable XML API in Tally
# Gateway > F11 (Setup) > Netwoks/Connectivity > Enable XML API
# Set port to 9000 (default)

# 4. Test connection manually
$tallyUrl = "http://127.0.0.1:9000"
try {
  $response = Invoke-WebRequest -Uri $tallyUrl -TimeoutSec 5
  Write-Host "✓ Tally is accessible"
} catch {
  Write-Host "✗ Cannot connect to Tally"
}
```

**If Still Not Working:**
- Restart Tally Prime
- Check Tally license is active
- Verify Tally version supports XML API
- Check Windows Firewall rules

---

### Issue: "Tally XML validation error"

**Error:**
```
FATAL: Invalid Voucher Data
FATAL: Company Not Found
```

**Root Cause:** Generated XML doesn't match Tally schema

**Solution:**

```python
# Verify XML structure
import xml.etree.ElementTree as ET

xml_string = generate_tally_xml(invoice)

try:
    ET.fromstring(xml_string)
    print("XML is valid")
except ET.ParseError as e:
    print(f"XML Error: {e}")

# Check required fields
required_fields = ['supplier', 'invoice_date', 'total_amount']
for field in required_fields:
    if not getattr(invoice, field):
        print(f"Missing required field: {field}")
```

---

### Issue: "Tally says 'Company Not Found'"

**Error:**
```
XML Response: <ERROR>Company Not Found</ERROR>
```

**Root Cause:** XML specifies different company than Tally currently has open

**Solution:**

```python
# Specify company in XML
xml = f"""
<ENVELOPE>
  <HEADER>
    <COMPANY>{company_name}</COMPANY>
  </HEADER>
  ...
</ENVELOPE>
"""

# Or ensure user has correct company open in Tally
# Tally must have the company open before receiving API requests
```

---

### Issue: "GST rates incorrect in Tally"

**Error:**
```
Tally shows IGST instead of CGST+SGST
Tax amounts don't match
```

**Root Cause:** Incorrect tax type in XML or item HSN code missing

**Solution:**

```python
def generate_tally_item(item):
    """Generate item with correct GST"""
    
    # For interstate (IGST)
    if is_interstate_supplier(item.supplier):
        return f"""
        <ALLEDITEMTAX>
          <ITEMTAXTYPE>IGST</ITEMTAXTYPE>
          <TAXRATE>{item.igst_rate}</TAXRATE>
        </ALLEDITEMTAX>
        """
    
    # For intrastate (CGST+SGST)
    else:
        return f"""
        <ALLEDITEMTAX>
          <ITEMTAXTYPE>CGST</ITEMTAXTYPE>
          <TAXRATE>{item.cgst_rate}</TAXRATE>
        </ALLEDITEMTAX>
        <ALLEDITEMTAX>
          <ITEMTAXTYPE>SGST</ITEMTAXTYPE>
          <TAXRATE>{item.sgst_rate}</TAXRATE>
        </ALLEDITEMTAX>
        """
```

---

## Database Issues

### Issue: "database is locked"

**Error:**
```
sqlite3.OperationalError: database is locked
```

**Root Causes:**
1. Multiple processes accessing SQLite simultaneously
2. Database browser open
3. Incomplete transaction

**Solution:**

```powershell
# 1. Close all database connections
# Close database browser (SQLite Studio, etc.)
# Close all Python processes

# 2. Check what's using the database
lsof +D backend/  # macOS/Linux
tasklist /v | findstr tallyai  # Windows

# 3. Kill blocking process if necessary
taskkill /PID 1234 /F

# 4. Delete database and restart (dev only)
rm backend/tallyai.db
python backend/main.py  # Auto-creates fresh database

# 5. Use WAL mode for SQLite (better concurrency)
# In database.py
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True
)
```

---

### Issue: "IntegrityError: Foreign key constraint failed"

**Error:**
```
sqlalchemy.exc.IntegrityError: (sqlite3.IntegrityError) FOREIGN KEY constraint failed
```

**Root Cause:** Deleting parent record with child references

**Solution:**

```python
# ✅ Correct - Use cascade delete
class Invoice(Base):
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

# When deleting invoice, items auto-delete
db.delete(invoice)
db.commit()

# ❌ Wrong - Foreign key reference still exists
# Deleting invoice while items still reference it
```

---

## Performance Issues

### Issue: "Application is slow / unresponsive"

**Symptoms:**
- Slow response times
- Page load takes >5 seconds
- UI freezing

**Diagnosis:**

```powershell
# Check CPU usage
tasklist /V | findstr python
Get-Process python | Format-List CPU, Memory

# Check network requests (browser DevTools)
# F12 > Network > See which endpoints are slow

# Check database query time
# Add logging to backend:
```

```python
import time
from sqlalchemy import event

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = time.time() - conn.info['query_start_time'].pop(-1)
    if total_time > 1:  # Log slow queries >1s
        print(f"SLOW QUERY: {total_time:.3f}s - {statement[:100]}...")
```

**Solutions:**
1. Add database indexes on frequently filtered fields
2. Use pagination for large result sets
3. Implement caching
4. Optimize component rendering in React

---

### Issue: "High memory usage"

**Symptoms:**
```
Python process using 500MB+ RAM
Browser using 300MB+
```

**Solution:**

```python
# Backend memory optimization
# Limit database query result sets
invoices = db.query(Invoice).limit(100).all()

# Stream large file uploads
@app.post("/upload-large")
async def upload_large(file: UploadFile):
    chunks = []
    while True:
        chunk = await file.read(1024 * 1024)  # 1MB chunks
        if not chunk:
            break
        process_chunk(chunk)

# Frontend memory optimization
# Use React.memo for expensive components
const MyComponent = React.memo(({ data }) => {
  return <div>{data.map(...)}</div>;
});
```

---

## Security & Authentication

### Issue: "401 Unauthorized on all requests"

**Error:**
```json
{"detail": "Invalid or missing API key"}
```

**Causes:**
1. Missing API key in request header
2. Wrong API key value
3. API key not set in backend

**Solution:**

```typescript
// Frontend - Check headers
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${process.env.VITE_BACKEND_API_KEY}`  // ✓ Correct
    // NOT: `Bearer ${apiKey}`  if apiKey is undefined
  }
});

// Backend - Verify key
import os
EXPECTED_KEY = os.getenv("BACKEND_API_KEY")
if not EXPECTED_KEY:
    raise ValueError("BACKEND_API_KEY not set in .env")
```

```bash
# Check .env file
cat .env | grep BACKEND_API_KEY

# Verify both frontend and backend use same key
.env.local: VITE_BACKEND_API_KEY=test-key-123
backend/.env: BACKEND_API_KEY=test-key-123
```

---

### Issue: "Gemini API key invalid or expired"

**Error:**
```
google.auth.exceptions.MissingTokenError
invalid_grant: Token has been expired or revoked
```

**Solution:**

```bash
# 1. Check if key exists in .env
grep GEMINI_API_KEY backend/.env

# 2. Verify key is valid at https://ai.google.dev/
# Click "Manage API key"
# Delete old/expired keys
# Create new key

# 3. Update backend/.env with new key
GEMINI_API_KEY=your-new-key-here

# 4. Restart backend
python main.py
```

---

## Desktop App Issues

### Issue: "Electron window won't open"

**Error:**
```
Error: Cannot find module
File not found
```

**Solution:**

```powershell
# Rebuild native modules
npm install

# Clear cache and reinstall
Remove-Item -Recurse node_modules
npm install

# Rebuild electron
npm run electron:dist

# Try electron dev again
npm run electron:dev

# Check logs for errors
npm run electron:dev 2>&1 | Tee-Object electron_debug.log
```

---

### Issue: "App icon not showing in installer"

**Cause:** Icon file missing or wrong format

**Solution:**

```bash
# Ensure icon file exists
ls public/TallyAiLogo00.ico

# Specify in package.json
{
  "build": {
    "win": {
      "icon": "public/TallyAiLogo00.ico"
    }
  }
}

# Rebuild
npm run electron:dist
```

---

## FAQs

### Q: How do I reset my API key?

**A:** Update `BACKEND_API_KEY` in `backend/.env`:
```bash
BACKEND_API_KEY=your-new-secure-32-character-key
```
Update `VITE_BACKEND_API_KEY` in `.env.local`:
```bash
VITE_BACKEND_API_KEY=your-new-secure-32-character-key
```
Restart backend and frontend.

---

### Q: Can I use AutoTallyAI without Tally?

**A:** Yes! You can:
- Upload and process invoices
- View and edit invoice details
- Export invoices as Excel
- Use the ChatBot for accounting help

Tally integration is optional. You'll see warnings if Tally isn't running, but the app continues to work.

---

### Q: How do I backup my invoices?

**A:** Depends on deployment:

```powershell
# Local development (SQLite)
Copy-Item "backend/tallyai.db" "backup/tallyai_backup.db"

# Production (PostgreSQL on Render)
# Go to Render dashboard > Database > Backups
# Automatic daily backups kept for 7 days

# Export as CSV/Excel
# Dashboard > Export button (feature in progress)
```

---

### Q: Can multiple users use the same instance?

**A:** Currently:
- ✓ Multiple users can access web version (same backend)
- ✗ Desktop app is single-user per installation
- Single API key for all users (share securely)

Future: User authentication system planned.

---

### Q: How do I migrate data from one system to another?

**A:** Database export/import:

```bash
# Export (PostgreSQL)
pg_dump -h old-host -U user -d tallyai > export.sql

# Import to new system
psql -h new-host -U user -d tallyai < export.sql

# Or CSV export from UI (planned feature)
```

---

### Q: What should I do if backend crashes?

**A:** Check logs and restart:

```powershell
cd backend
python main.py 2>&1 | Tee-Object crash_log.txt

# If database corrupted
rm tallyai.db  # Fresh start
python main.py

# Report issue with crash_log.txt
```

---

### Q: How do I increase invoice file upload limit?

**A:** Currently limited to 50MB. To increase:

```python
# backend/main.py
MAX_UPLOAD_SIZE = 100 * 1024 * 1024  # 100MB

@app.post("/upload-invoice")
async def upload_invoice(file: UploadFile):
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    # Process...
```

---

### Q: Can I disable AI processing and just manually enter invoices?

**A:** Yes! Features:
- Manual invoice creation (no upload needed)
- Direct data entry
- Edit extracted data before saving
- ChatBot still available for guidance

---

**Last Updated:** January 3, 2026

**Need More Help?** Check the other documentation files or contact the development team.
