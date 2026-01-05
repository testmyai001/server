# AutoTallyAI - Quick Reference Card

## 🚀 Essential Commands

### **Frontend (Vite)**
```bash
npm install                 # Install dependencies
npm run dev                # Start dev server (http://localhost:5173)
npm run build              # Production build
npm run preview            # Preview build locally
```

### **Backend (FastAPI)**
```bash
cd backend
python -m venv venv        # Create virtual environment
.\venv\Scripts\Activate    # Windows: Activate venv
source venv/bin/activate   # Linux/Mac: Activate venv
pip install -r requirements.txt
python main.py             # Start backend (http://localhost:8000)
```

### **Desktop (Electron)**
```bash
npm run electron:dev       # Start Electron dev
npm run electron:dist      # Build .exe installer
```

---

## 📁 Key File Locations

| File/Folder | Purpose |
|------------|---------|
| `src/App.tsx` | Main React app (1361 lines) |
| `src/components/` | React components (21+ files) |
| `src/services/` | API & business logic services |
| `backend/main.py` | FastAPI app (933 lines) |
| `backend/models.py` | Database models |
| `electron/main.js` | Electron main process |
| `.env.local` | Frontend env vars |
| `backend/.env` | Backend env vars |
| `vite.config.ts` | Vite configuration |
| `tailwind.config.js` | Tailwind CSS config |
| `package.json` | Project metadata & scripts |

---

## 🔐 Environment Variables

### **Frontend (.env.local)**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_API_KEY=test-backend-key-12345
VITE_TALLY_URL=http://127.0.0.1:9000
```

### **Backend (backend/.env)**
```
BACKEND_API_KEY=test-backend-key-12345
GEMINI_API_KEY=your-google-gemini-key
DATABASE_URL=sqlite:///./tallyai.db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🌐 API Quick Reference

### **Health Check**
```bash
GET http://localhost:8000/health
```

### **Validate API Key**
```bash
GET http://localhost:8000/auth/validate
Header: Authorization: Bearer YOUR_API_KEY
```

### **Upload Invoice**
```bash
POST http://localhost:8000/upload-invoice
Header: Authorization: Bearer YOUR_API_KEY
Body: multipart/form-data (file)
```

### **Get Invoices**
```bash
GET http://localhost:8000/invoices?skip=0&limit=20
Header: Authorization: Bearer YOUR_API_KEY
```

### **Push to Tally**
```bash
POST http://localhost:8000/push-to-tally
Header: Authorization: Bearer YOUR_API_KEY
Body: {
  "invoice_id": "uuid-123",
  "voucher_type": "Purchase"
}
```

### **Send to ChatBot**
```bash
POST http://localhost:8000/chat
Header: Authorization: Bearer YOUR_API_KEY
Body: {
  "message": "How do I reconcile invoices?",
  "context": { "topic": "tally" }
}
```

---

## 🛠️ Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Port 5173 in use | `npm run dev -- --port 3000` |
| Port 8000 in use | `python main.py --port 8001` |
| Backend not found | Check `VITE_API_BASE_URL` in `.env.local` |
| API key invalid | Ensure same key in both `.env` files |
| Tally not connecting | Verify Tally running, port 9000 open |
| Module not found | `npm install` or `pip install -r requirements.txt` |
| HMR not working | Restart `npm run dev` |
| Database locked | Close database browser, restart backend |

---

## 📊 Project Structure

```
DesktopApp/
├── docs/                          # 📖 DOCUMENTATION
│   ├── README.md                 # Start here!
│   ├── 01-PROJECT-OVERVIEW.md    # What is this?
│   ├── 02-ARCHITECTURE.md        # How it works
│   ├── 03-API-REFERENCE.md       # API endpoints
│   ├── 04-SETUP-DEVELOPMENT.md   # Local setup
│   ├── 05-DEPLOYMENT.md          # Production
│   ├── 06-COMPONENTS-SERVICES.md # React components
│   ├── 07-DATABASE-SCHEMA.md     # Database models
│   └── 08-TROUBLESHOOTING.md     # Problems & solutions
│
├── src/                           # Frontend React App
│   ├── components/                # React components
│   ├── services/                  # API services
│   ├── App.tsx                   # Main component
│   ├── index.tsx                 # Entry point
│   ├── types.ts                  # TypeScript types
│   └── constants.ts              # Configuration
│
├── backend/                       # Backend FastAPI
│   ├── main.py                   # FastAPI app
│   ├── models.py                 # Database models
│   ├── schemas.py                # API schemas
│   ├── database.py               # DB setup
│   └── requirements.txt          # Python deps
│
├── electron/                      # Electron Desktop
│   ├── main.js                   # Main process
│   └── preload.js                # Preload script
│
├── package.json                   # npm config
├── vite.config.ts                # Vite config
├── tsconfig.json                 # TypeScript config
└── DOCUMENTATION-SUMMARY.md      # This project's docs
```

---

## 📚 Reading Paths

### **First Time Setup: 30 minutes**
```
1. docs/README.md (5 min)
   ↓
2. docs/01-PROJECT-OVERVIEW.md (10 min)
   ↓
3. docs/04-SETUP-DEVELOPMENT.md (15 min - follow steps)
```

### **Add New Feature: 45 minutes**
```
1. docs/02-ARCHITECTURE.md (15 min)
   ↓
2. docs/06-COMPONENTS-SERVICES.md (15 min)
   ↓
3. docs/03-API-REFERENCE.md (15 min)
```

### **Deploy to Production: 2 hours**
```
docs/05-DEPLOYMENT.md (entire document)
```

### **Fix a Bug: 20 minutes**
```
1. docs/08-TROUBLESHOOTING.md (search for error)
   ↓
2. Relevant reference doc (API, Components, etc.)
```

---

## 🔌 API Ports

| Service | Port | URL |
|---------|------|-----|
| Vite Dev Server | 5173 | http://localhost:5173 |
| FastAPI Backend | 8000 | http://localhost:8000 |
| Tally Prime | 9000 | http://127.0.0.1:9000 |
| PostgreSQL (Prod) | 5432 | - |

---

## 🧪 Testing Endpoints

### **Using PowerShell**
```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:8000/health"

# With API key
$headers = @{ 'Authorization' = 'Bearer test-backend-key-12345' }
Invoke-WebRequest -Uri "http://localhost:8000/invoices" -Headers $headers
```

### **Using REST Client Extension (VS Code)**
Create `test.rest`:
```rest
### Test Health
GET http://localhost:8000/health

### Test API
GET http://localhost:8000/invoices
Authorization: Bearer test-backend-key-12345
```

---

## 🎯 Key Technologies

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.0 |
| Build | Vite | 6.2.0 |
| CSS | Tailwind | 3.4.19 |
| Desktop | Electron | 39.2.7 |
| Backend | FastAPI | Latest |
| DB (Dev) | SQLite | - |
| DB (Prod) | PostgreSQL | - |
| ORM | SQLAlchemy | 2.x |
| AI | Gemini API | Latest |

---

## 🚀 Development Workflow

### **Start Development (3 terminals)**

**Terminal 1: Frontend**
```bash
npm run dev
# Opens http://localhost:5173
```

**Terminal 2: Backend**
```bash
cd backend
python main.py
# Server on http://localhost:8000
```

**Terminal 3: Optional - Tally**
```bash
# Start Tally Prime manually
# Port 9000 must be accessible
```

### **Test the Connection**
```bash
# Browser: http://localhost:5173
# Should load without errors

# Check backend health:
curl http://localhost:8000/health
```

---

## 📝 Key Concepts

### **Invoice Flow**
```
Upload PDF → AI Extract → Edit Fields → Push to Tally
```

### **Data Storage**
```
Frontend ↔ Backend API ↔ Database
```

### **Tally Integration**
```
Invoice Data → XML Format → Tally XML API → Tally Prime
```

### **Authentication**
```
API Key → Authorization Header → Backend Validation
```

---

## 🔍 Debugging Tips

### **Frontend**
- Press `F12` to open DevTools
- Console tab shows errors
- Network tab shows API calls
- Go to Sources tab for breakpoints

### **Backend**
- Check terminal output for errors
- Add `print()` statements for debugging
- Use browser DevTools Network tab to see requests
- Check `.env` file for missing variables

### **Tally**
- Verify Tally is running
- Check port 9000 accessible: `Test-NetConnection localhost 9000`
- Test XML: Open browser to `http://127.0.0.1:9000`

### **Database**
- Use SQLite Browser to view database
- Run queries directly: `python` then import models

---

## 📋 Checklist: Before Deploying

- [ ] All tests passing
- [ ] No console errors in browser
- [ ] Backend health check working
- [ ] API endpoints tested
- [ ] Tally integration tested
- [ ] Database backed up
- [ ] Environment variables set
- [ ] Version number updated
- [ ] Release notes written
- [ ] Documentation updated

---

## 🆘 Need Help?

1. **Search Documentation:** `docs/README.md` (index)
2. **Quick Troubleshooting:** `docs/08-TROUBLESHOOTING.md`
3. **API Help:** `docs/03-API-REFERENCE.md`
4. **Setup Issues:** `docs/04-SETUP-DEVELOPMENT.md`
5. **General Understanding:** `docs/01-PROJECT-OVERVIEW.md`

---

## 📞 Version Info

- **Project:** AutoTallyAI
- **Version:** 0.2.3
- **Last Updated:** January 3, 2026
- **Status:** Active Development

---

**Keep this card handy while developing! 🚀**
