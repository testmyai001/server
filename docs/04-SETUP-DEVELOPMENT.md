# AutoTallyAI - Setup & Development Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [Electron Desktop Development](#electron-desktop-development)
6. [Database Setup](#database-setup)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Prerequisites

### System Requirements

**Windows 10/11 (Recommended for Electron/Tally Development)**
- RAM: 8GB minimum (16GB recommended)
- Disk Space: 5GB free
- Node.js: v18+ (LTS recommended)
- Python: 3.9+
- Git: Latest version

### Required Software Installation

#### 1. Node.js & npm

**Windows:**
1. Download from https://nodejs.org/ (LTS version)
2. Run installer with default options
3. Verify installation:
```powershell
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

#### 2. Python & pip

**Windows:**
1. Download from https://www.python.org/downloads/ (3.9+)
2. **Important:** Check "Add Python to PATH" during installation
3. Verify installation:
```powershell
python --version  # Should show Python 3.9.x or higher
pip --version     # Should show pip 21.x.x or higher
```

#### 3. Git

1. Download from https://git-scm.com/download/win
2. Use default installation options
3. Verify:
```powershell
git --version     # Should show git version 2.x.x
```

#### 4. Optional: Visual Studio Code Extensions

Recommended extensions for better development experience:
- **Pylance** (Python language support)
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Thunder Client** (API testing)
- **REST Client** (for testing endpoints)

---

## Environment Setup

### 1. Clone & Navigate to Project

```powershell
cd c:\Users\Suraj\Desktop\DesktopApp
```

### 2. Install Node Dependencies

```powershell
npm install
```

**Expected Output:**
```
added 500+ packages in 2m
```

This installs:
- React 19.2.0
- Vite 6.2.0
- Tailwind CSS
- Electron
- And all other npm dependencies

### 3. Create Frontend Environment File

Create `.env.local` in project root:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_API_KEY=test-backend-key-12345
VITE_TALLY_URL=http://127.0.0.1:9000
```

**Environment Variables:**
| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | http://localhost:8000 | FastAPI backend URL |
| `VITE_BACKEND_API_KEY` | test-backend-key-12345 | Backend authentication key |
| `VITE_TALLY_URL` | http://127.0.0.1:9000 | Tally Prime XML API endpoint |

### 4. Create Backend Environment File

Create `.env` in `backend/` folder:

```bash
# backend/.env
BACKEND_API_KEY=test-backend-key-12345
GEMINI_API_KEY=your-gemini-api-key-here
DATABASE_URL=sqlite:///./tallyai.db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8000
```

**Backend Environment Variables:**
| Variable | Description | Example |
|----------|-------------|---------|
| `BACKEND_API_KEY` | API authentication key | test-backend-key-12345 |
| `GEMINI_API_KEY` | Google Generative AI key | AIzaSyDx... |
| `DATABASE_URL` | Database connection string | sqlite:///./tallyai.db |
| `ALLOWED_ORIGINS` | CORS allowed origins | http://localhost:5173 |

### 5. Obtain Google Gemini API Key

1. Go to https://ai.google.dev/
2. Click "Get API key"
3. Create a new Google Cloud project or use existing
4. Generate API key
5. Copy key and paste into `.env` as `GEMINI_API_KEY`

**Verifying API Key:**
```powershell
# Backend should start without error
cd backend
python main.py
# Should not show "Invalid Gemini API key" error
```

---

## Frontend Development

### Starting the Development Server

**Option 1: Web Development Server (Vite)**

```powershell
npm run dev
```

**Expected Output:**
```
VITE v6.2.0  ready in 400 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

Then open browser to `http://localhost:5173`

**Features in Dev Mode:**
- Hot Module Replacement (HMR) - Changes reflect instantly
- Source maps for debugging
- Development console with detailed errors

### Understanding the Frontend Structure

```
src/
├── components/              # React Components
│   ├── Dashboard.tsx       # Main dashboard view
│   ├── InvoiceEditor.tsx   # Edit invoice details
│   ├── InvoiceUpload.tsx   # Upload interface
│   ├── BankStatementManager.tsx
│   ├── ChatBot.tsx         # AI assistant
│   ├── TallyLogs.tsx       # Sync history
│   ├── SettingsModal.tsx   # Configuration
│   └── [Other components]
│
├── services/                # Business Logic
│   ├── backendService.ts   # API calls to FastAPI
│   ├── tallyService.ts     # Tally integration
│   ├── dbService.ts        # Database operations
│   └── authService.ts      # Authentication
│
├── App.tsx                 # Main App Component (1361 lines)
├── index.tsx               # React entry point
├── types.ts                # TypeScript interfaces
├── constants.ts            # Configuration
└── index.css               # Global styles
```

### Frontend Development Tasks

#### Adding a New Component

1. Create file in `src/components/MyComponent.tsx`:

```typescript
import React from 'react';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold">{title}</h2>
      <button 
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Click Me
      </button>
    </div>
  );
};

export default MyComponent;
```

2. Import and use in `src/App.tsx`:

```typescript
import { MyComponent } from './components/MyComponent';

// In App component JSX:
<MyComponent 
  title="My New Component" 
  onAction={() => console.log('Action clicked')}
/>
```

3. Changes auto-reload with HMR

#### Debugging Frontend

**Using Browser DevTools:**
1. Open `http://localhost:5173` in browser
2. Press `F12` to open DevTools
3. Go to "Console" tab to see errors and logs
4. Go to "Sources" tab to set breakpoints
5. Go to "Network" tab to monitor API calls

**VS Code Debugging:**
1. Set breakpoints in VS Code (click line number)
2. Press `F5` to attach debugger
3. Continue execution with `F5`, step with `F10`

---

## Backend Development

### Starting the Backend Server

**Step 1: Open New Terminal**

```powershell
cd c:\Users\Suraj\Desktop\DesktopApp\backend
```

**Step 2: Create Virtual Environment**

```powershell
# Windows PowerShell
python -m venv venv
.\venv\Scripts\Activate
```

**Step 3: Install Dependencies**

```powershell
pip install -r requirements.txt
```

**Expected Output:**
```
Successfully installed fastapi-0.x.x uvicorn-0.x.x sqlalchemy-2.x.x ...
```

**Step 4: Run Backend**

```powershell
python main.py
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

### Backend Directory Structure

```
backend/
├── main.py                  # FastAPI app & endpoints (933 lines)
│   ├── Health endpoints
│   ├── Auth endpoints
│   ├── Invoice CRUD
│   ├── Tally integration
│   ├── ChatBot endpoint
│   └── Error handling
│
├── models.py               # SQLAlchemy ORM Models
│   ├── UploadedFile       # File metadata
│   ├── Invoice            # Invoice records
│   ├── InvoiceItem        # Line items
│   ├── BankTransaction    # Bank records
│   └── TallyLog           # Sync history
│
├── schemas.py             # Pydantic Request/Response Schemas
│   ├── InvoiceCreate
│   ├── InvoiceUpdate
│   ├── InvoiceResponse
│   └── [Other schemas]
│
├── database.py            # Database Configuration
│   ├── Database URL setup
│   ├── Session management
│   └── Engine creation
│
├── pdf_processor.py       # PDF Extraction Utilities
│   ├── extract_text_from_pdf()
│   ├── convert_pdf_to_images()
│   └── process_invoice_image()
│
├── requirements.txt       # Python Dependencies
├── venv/                  # Virtual environment (created)
└── .env                   # Environment variables
```

### Testing Backend Endpoints

**Using REST Client Extension (VS Code):**

1. Create `test.rest` file:

```rest
### Test Health
GET http://localhost:8000/health

### Validate API Key
GET http://localhost:8000/auth/validate
Authorization: Bearer test-backend-key-12345

### Get All Invoices
GET http://localhost:8000/invoices
Authorization: Bearer test-backend-key-12345
```

2. Click "Send Request" on each endpoint

**Using Thunder Client (VS Code):**
1. Open Thunder Client extension
2. Create new request
3. Set method to GET
4. Set URL to `http://localhost:8000/health`
5. Click Send

**Using PowerShell:**

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method Get

# Test with API key
$headers = @{
    'Authorization' = 'Bearer test-backend-key-12345'
}
Invoke-WebRequest -Uri "http://localhost:8000/invoices" -Headers $headers
```

### Backend Development Tasks

#### Adding a New Endpoint

1. Add route to `backend/main.py`:

```python
@app.post("/my-endpoint")
async def my_endpoint(request: MyRequest, db: Session = Depends(get_db)):
    """
    Handle my custom request.
    
    Args:
        request: Request data
        db: Database session
        
    Returns:
        Response data
    """
    try:
        # Validate API key
        api_key = request.headers.get("Authorization", "").replace("Bearer ", "")
        if api_key != os.getenv("BACKEND_API_KEY"):
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        # Process request
        result = process_my_request(request)
        
        # Save to database
        db.add(result)
        db.commit()
        db.refresh(result)
        
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

2. Create request schema in `backend/schemas.py`:

```python
from pydantic import BaseModel

class MyRequest(BaseModel):
    field1: str
    field2: int
    
    class Config:
        from_attributes = True
```

3. Test with REST client or browser

---

## Electron Desktop Development

### Starting Electron Development

**In VS Code Terminal:**

```powershell
npm run electron:dev
```

**Expected Output:**
```
vite v6.2.0 dev server running at:

➜  Local:   http://localhost:5173/
➜  press h to show help

[main 1234] Electron 39.2.7 running on darwin
```

This starts:
1. **Vite Dev Server** on `http://localhost:5173`
2. **Electron** window that loads Vite server

### Debugging Electron

**Open DevTools in Electron Window:**
1. Press `Ctrl+Shift+I` (Windows) in the Electron window
2. Console shows errors from both main and renderer processes
3. Elements tab lets you inspect React components
4. Network tab shows API calls

**Main Process Debugging:**
- Errors in `electron/main.js` appear in terminal
- Use `console.log()` in main.js to debug
- Restart with `npm run electron:dev` after changes

**Renderer Process Debugging:**
- Open DevTools with `Ctrl+Shift+I`
- Renderer process (React) appears in Console
- Same DevTools as Chrome

### Building Electron Installer

```powershell
npm run electron:dist
```

**Expected Output:**
```
  » electron-builder version=25.x.x platform=win32 arch=x64
  » packaging       platform=win32 arch=x64 electron-builder=25.x.x
  » building        nsis installer
  » artifacts:
    - AutoTallyAI Setup 0.2.3.exe
```

Output location: `release_v*/` folders

---

## Database Setup

### Understanding the Database

**Development (SQLite):**
- File-based database: `backend/tallyai.db`
- No server needed, perfect for local development
- Single user at a time

**Production (PostgreSQL):**
- Server-based database
- Multiple concurrent users
- Better for production scaling

### Database Initialization

**First Time Setup:**

```powershell
cd backend
python

# In Python interpreter:
from database import engine, Base
from models import UploadedFile, Invoice, InvoiceItem, BankTransaction, TallyLog

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database initialized!")
exit()
```

**Or use main.py which auto-creates on startup**

### Database Models

#### Invoice Model

```python
class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True)
    supplier = Column(String)
    invoice_number = Column(String)
    invoice_date = Column(Date)
    gstin = Column(String)
    subtotal = Column(Float)
    total_tax = Column(Float)
    total_amount = Column(Float)
    status = Column(String)  # draft, processed, pushed_to_tally
    created_at = Column(DateTime, default=datetime.utcnow)
    items = relationship("InvoiceItem", back_populates="invoice")
```

#### Querying Data

```python
from database import SessionLocal
from models import Invoice

db = SessionLocal()

# Get all invoices
invoices = db.query(Invoice).all()

# Get invoices by status
processed = db.query(Invoice).filter(Invoice.status == "processed").all()

# Get with pagination
skip = 0
limit = 20
invoices = db.query(Invoice).offset(skip).limit(limit).all()

# Get with relationship
invoice = db.query(Invoice).filter(Invoice.id == "uuid-123").first()
items = invoice.items  # Access related items

db.close()
```

### Viewing Database (SQLite)

**Using SQLite Browser:**

1. Download from https://sqlitebrowser.org/
2. Open `backend/tallyai.db`
3. View tables, data, and schema

**Using Python:**

```powershell
python

from database import SessionLocal
from models import Invoice, InvoiceItem
import json

db = SessionLocal()

# Count records
print(f"Total invoices: {db.query(Invoice).count()}")

# Get recent invoices
recent = db.query(Invoice).order_by(Invoice.created_at.desc()).limit(5).all()
for inv in recent:
    print(f"- {inv.supplier}: {inv.total_amount}")

db.close()
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module 'react'"

**Error Message:**
```
Module not found: Error: Can't resolve 'react'
```

**Solution:**
```powershell
npm install
npm run dev
```

---

### Issue 2: "GEMINI_API_KEY not found"

**Error Message:**
```
KeyError: 'GEMINI_API_KEY'
```

**Solution:**
1. Create `.env` file in `backend/` folder
2. Add: `GEMINI_API_KEY=your-key-here`
3. Restart backend: `python main.py`

---

### Issue 3: "Tally connection failed"

**Error Message:**
```
Cannot connect to Tally Prime on 127.0.0.1:9000
```

**Solution:**
1. Ensure Tally Prime is running
2. Verify Tally XML port is 9000 (Gateway > F11 > Network Settings)
3. Check firewall isn't blocking port 9000
4. Try: `Test-NetConnection -ComputerName 127.0.0.1 -Port 9000`

---

### Issue 4: "Port 5173 already in use"

**Error Message:**
```
error: listen EADDRINUSE: address already in use :::5173
```

**Solution Option A:** Kill process using port
```powershell
# Find process using port 5173
netstat -ano | findstr :5173

# Kill process (replace PID)
taskkill /PID 1234 /F
```

**Solution Option B:** Use different port
```powershell
npm run dev -- --port 3000
```

---

### Issue 5: "Python virtual environment not activating"

**Error Message:**
```
'venv' is not recognized
```

**Solution (Windows PowerShell):**
```powershell
# Navigate to backend
cd backend

# Activate virtual environment
.\venv\Scripts\Activate

# Should show (venv) in prompt
(venv) PS C:\...\backend>

# If still not working, check execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
.\venv\Scripts\Activate
```

---

### Issue 6: "401 Unauthorized on all API calls"

**Error Message:**
```json
{"detail": "Invalid or missing API key"}
```

**Solution:**
1. Check `.env.local` has `VITE_BACKEND_API_KEY`
2. Check `backend/.env` has matching `BACKEND_API_KEY`
3. Request header must be: `Authorization: Bearer YOUR_KEY`

---

### Issue 7: "SQLite database locked"

**Error Message:**
```
database is locked
```

**Solution:**
1. Close all instances of database browser
2. Ensure no other process accessing `tallyai.db`
3. Delete `tallyai.db` if corrupted (fresh start)
4. Restart backend

---

### Issue 8: "Electron window won't open"

**Error Message:**
```
Error: Cannot find module
```

**Solution:**
```powershell
# Rebuild native modules
npm install

# Clear cache
rmdir -r node_modules
npm install

# Try again
npm run electron:dev
```

---

## Useful Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start web dev server (Vite) |
| `npm run electron:dev` | Start Electron dev environment |
| `npm run build` | Build production React app |
| `npm run electron:dist` | Create Windows installer |
| `cd backend && python main.py` | Start FastAPI backend |
| `npm install` | Install all dependencies |
| `pip install -r requirements.txt` | Install Python dependencies |
| `git status` | Check git changes |
| `git commit -m "message"` | Commit changes |

---

## Next Steps

1. **Start Development:**
   - Terminal 1: `npm run dev` (Frontend)
   - Terminal 2: `cd backend && python main.py` (Backend)
   - Open `http://localhost:5173` in browser

2. **Make Your First Change:**
   - Edit `src/App.tsx`
   - Add a console.log statement
   - See hot-reload in action

3. **Test Backend:**
   - Visit `http://localhost:8000/health`
   - Should see: `{"status": "healthy"}`

4. **Next Guide:** See [05-DEPLOYMENT.md](05-DEPLOYMENT.md) for production setup

---

**Last Updated:** January 3, 2026
