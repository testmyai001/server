# AutoTallyAI - Deployment Guide

## Table of Contents
1. [Production Deployment](#production-deployment)
2. [Backend Deployment (Render.com)](#backend-deployment-rendercom)
3. [Frontend Web Deployment](#frontend-web-deployment)
4. [Desktop Application Deployment](#desktop-application-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Production Deployment

### Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                CLIENT DEVICES                        │
├──────────────────┬──────────────────────────────────┤
│   WEB BROWSER    │   WINDOWS DESKTOP (Electron)     │
│   Users          │   NSIS Installer (auto-update)  │
└──────────────────┴──────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
┌────────▼─────────────┐  ┌────▼─────────────────┐
│ CDN / Static Files   │  │ LOAD BALANCER        │
│ (Optional)           │  │ (Render.com)         │
└──────────────────────┘  └──────────┬───────────┘
                                     │
                         ┌───────────▼──────────┐
                         │ FASTAPI BACKEND      │
                         │ (Render.com)         │
                         │ • uvicorn workers    │
                         │ • Auto-scaling       │
                         └───────────┬──────────┘
                                     │
                         ┌───────────▼──────────┐
                         │ POSTGRESQL DATABASE  │
                         │ (Render.com)         │
                         │ • Automated backups  │
                         │ • Connection pooling │
                         └──────────────────────┘
```

### Deployment Environments

| Environment | Purpose | Backend | Database | Updates |
|-------------|---------|---------|----------|---------|
| **Development** | Local testing | localhost:8000 | SQLite | Manual |
| **Staging** | Pre-production testing | staging-api.domain | PostgreSQL | After testing |
| **Production** | Live users | api.domain | PostgreSQL | Controlled releases |

---

## Backend Deployment (Render.com)

### Prerequisites

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub account
   - Connect GitHub repository

2. **Have Git Repository Ready**
   - All code committed to GitHub
   - Backend in `backend/` folder
   - `.env` secrets ready to configure

### Step 1: Deploy FastAPI Backend

**Option A: Via Render Dashboard**

1. Go to Render.com dashboard
2. Click **New +**
3. Select **Web Service**
4. Connect GitHub repository
5. Configure settings:

| Setting | Value |
|---------|-------|
| Name | `autotally-ai-backend` |
| Environment | `Python 3.9` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Plan | `Free` or `Starter` (for production) |

6. Add environment variables:
   ```
   BACKEND_API_KEY=your-secure-key
   GEMINI_API_KEY=your-gemini-key
   DATABASE_URL=postgresql://...
   ALLOWED_ORIGINS=https://your-domain.com
   ```

7. Click **Create Web Service**

**Option B: Via render.yaml Configuration**

1. Update `backend/render.yaml`:

```yaml
services:
  - type: web
    name: autotally-ai-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: BACKEND_API_KEY
        scope: all
        value: "your-secure-key"
      - key: GEMINI_API_KEY
        scope: all
        value: "your-gemini-key"
      - key: DATABASE_URL
        scope: all
        value: "postgresql://..."
      - key: ALLOWED_ORIGINS
        scope: all
        value: "https://your-domain.com"
```

2. Push to GitHub:
```powershell
git add backend/render.yaml
git commit -m "Update render deployment config"
git push origin main
```

3. Render auto-deploys from GitHub

### Step 2: Deploy PostgreSQL Database

**Create PostgreSQL Instance on Render:**

1. Render dashboard → **New +** → **PostgreSQL**
2. Configure:

| Setting | Value |
|---------|-------|
| Name | `autotally-db` |
| Database | `tallyai` |
| User | `postgres` |
| Plan | `Free` or `Starter` |

3. Render creates connection string: `postgresql://user:password@host:5432/tallyai`
4. Copy connection string to backend environment variable `DATABASE_URL`

**Initialize Database:**

```powershell
# Option 1: Render logs run on deployment
# Script in backend/deploy_init.py runs migrations

# Option 2: Manual via Render Shell
# 1. Go to database service in Render
# 2. Click "Connect"
# 3. Use psql or Python to initialize tables
```

### Step 3: Verify Deployment

**Check Backend Health:**

```powershell
# Get deployed URL from Render dashboard (https://autotally-ai-backend.onrender.com)
$response = Invoke-WebRequest -Uri "https://autotally-ai-backend.onrender.com/health"
$response | ConvertFrom-Json

# Expected:
# status    : healthy
# timestamp : 2026-01-03T10:00:00Z
```

**Test API Endpoint:**

```powershell
$headers = @{
    'Authorization' = 'Bearer your-api-key'
}
$response = Invoke-WebRequest `
  -Uri "https://autotally-ai-backend.onrender.com/invoices" `
  -Headers $headers

$response.Content | ConvertFrom-Json
```

---

## Frontend Web Deployment

### Option 1: Deploy to Render Static Site

**Build Frontend:**

```powershell
npm run build
```

Output: `dist/` folder with optimized build

**Deploy Static Files:**

1. Render dashboard → **New +** → **Static Site**
2. Configure:

| Setting | Value |
|---------|-------|
| Name | `autotally-ai-web` |
| Repository | Your GitHub repo |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

3. Set environment variables in Render:

```
VITE_API_BASE_URL=https://autotally-ai-backend.onrender.com
VITE_BACKEND_API_KEY=your-api-key
VITE_TALLY_URL=http://127.0.0.1:9000
```

4. Click **Create Static Site**

### Option 2: Deploy to Netlify

**Connect to Netlify:**

1. Go to https://netlify.com
2. Click **New site from Git**
3. Connect GitHub
4. Configure:

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Publish Directory | `dist` |

5. Add environment variables (Build settings → Environment)
6. Deploy

### Option 3: Deploy to Vercel

**Connect to Vercel:**

1. Go to https://vercel.com
2. Import project
3. Vercel auto-detects Vite configuration
4. Set environment variables
5. Deploy

### Option 4: Self-Hosted

**Build & Host on Your Server:**

```powershell
# Build
npm run build

# Upload dist/ folder to your web server
# Configure web server (Nginx/Apache) to serve from dist/

# Nginx example:
# location / {
#     root /var/www/autotally;
#     try_files $uri $uri/ /index.html;
# }
```

---

## Desktop Application Deployment

### Building Windows Installer

**Create Release Build:**

```powershell
# Step 1: Build React app
npm run build

# Step 2: Build Electron installer
npm run electron:dist
```

**Output Location:**
```
release_v*/
├── AutoTallyAI Setup 0.2.3.exe          # Installer for users
├── AutoTallyAI Setup 0.2.3.exe.blockmap # Auto-update metadata
└── latest.yml                           # Version metadata
```

### Distributing Installer

#### Option 1: GitHub Releases

```powershell
# Create GitHub release with installer
git tag v0.2.3
git push origin v0.2.3

# Upload .exe to GitHub release page
# Users download from https://github.com/yourrepo/releases
```

#### Option 2: Direct Download Link

```html
<!-- Put on your website -->
<a href="https://yourserver.com/downloads/AutoTallyAI-Setup-0.2.3.exe">
  Download AutoTallyAI
</a>
```

#### Option 3: Auto-Update Server

Electron Builder auto-update uses `latest.yml`:

```yaml
version: 0.2.3
releaseDate: '2026-01-03'
files:
  - url: AutoTallyAI-Setup-0.2.3.exe
    sha512: abc123...
    size: 150000000
path: https://yourserver.com/releases/AutoTallyAI-Setup-0.2.3.exe
sha512: abc123...
releaseNotes: Bug fixes and performance improvements
```

### Auto-Update Mechanism

Users automatically get updates when:

1. App checks `electron-builder` update server
2. New version available
3. User can install update (app restarts)
4. Old version replaces with new

---

## Environment Configuration

### Production Environment Variables

**Backend (.env):**

```bash
# Security
BACKEND_API_KEY=your-secure-32-char-key-here

# AI Integration
GEMINI_API_KEY=your-google-gemini-key-from-aistudio

# Database (PostgreSQL on Render)
DATABASE_URL=postgresql://user:password@host.render.internal:5432/tallyai

# CORS
ALLOWED_ORIGINS=https://autotally-ai-web.onrender.com,https://yourdomain.com

# Environment
DEBUG=false
LOG_LEVEL=info
```

**Frontend (.env.production):**

```bash
# API Configuration
VITE_API_BASE_URL=https://autotally-ai-backend.onrender.com
VITE_BACKEND_API_KEY=your-secure-api-key-from-backend

# Tally Integration (local to users)
VITE_TALLY_URL=http://127.0.0.1:9000

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id
```

### Securing API Keys

**DO NOT:**
- ❌ Commit API keys to Git
- ❌ Expose keys in frontend code (except proxy keys)
- ❌ Share keys in emails or messages

**DO:**
- ✅ Use environment variables
- ✅ Use `.env` files (never commit)
- ✅ Use Render environment variables
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod

### Accessing Secrets on Render

1. Go to service in Render dashboard
2. Go to **Environment**
3. Add/edit variables
4. Render auto-deploys with new variables

---

## Monitoring & Maintenance

### Health Monitoring

**Set up monitoring:**

1. **Render Built-in:**
   - Dashboard shows uptime, errors, logs
   - Alerts on deploy failures

2. **UptimeRobot (Free):**
   - Go to https://uptimerobot.com
   - Add monitor: `https://autotally-ai-backend.onrender.com/health`
   - Get email alerts on downtime

3. **Application Performance Monitoring (APM):**
   - Optional: Add New Relic, DataDog, etc.

### Viewing Logs

**Render Logs:**

1. Go to service in Render dashboard
2. Click **Logs**
3. See real-time backend logs

**Access Backend Logs via API:**

```powershell
# SSH into Render service (if available)
# View application logs
tail -f /var/log/autotally/app.log
```

### Database Backups

**Render Automatic Backups:**

- PostgreSQL service on Render automatically backs up daily
- Backups retained for 7 days (free plan)
- Download backup via Render dashboard if needed

**Manual Backup:**

```bash
# Connect to PostgreSQL and dump
pg_dump -h host -U user -d tallyai > backup.sql

# Later restore
psql -h host -U user -d tallyai < backup.sql
```

### Dependency Updates

**Check for Updates:**

```powershell
# Frontend
npm outdated

# Backend
pip list --outdated

# Pinned versions in package.json and requirements.txt
```

**Update Process:**

1. Update version in file
2. Test locally: `npm install && npm run dev`
3. Test backend: `pip install -r requirements.txt && python main.py`
4. Commit and push to GitHub
5. Render auto-deploys

---

## Troubleshooting

### Issue 1: Backend 500 Errors on Render

**Error Message:**
```
500 Internal Server Error
```

**Check Logs:**
1. Go to Render service → Logs
2. Look for error messages
3. Common causes:
   - Missing environment variables
   - Database connection failed
   - Gemini API key invalid

**Solution:**
1. Verify all `.env` variables set in Render
2. Test database connection
3. Verify Gemini API key is valid

---

### Issue 2: CORS Errors from Frontend

**Error Message:**
```
Cross-Origin Request Blocked: ... 
```

**Cause:** Frontend origin not in `ALLOWED_ORIGINS`

**Solution:**
1. Get frontend URL (e.g., `https://autotally-ai-web.onrender.com`)
2. Add to backend `ALLOWED_ORIGINS` environment variable
3. Restart backend

---

### Issue 3: Tally Connection Failed in Production

**Error Message:**
```
Cannot connect to Tally Prime on 127.0.0.1:9000
```

**Cause:** Desktop users have local Tally, but may be on different network

**Solution:**
- Tally only works when running on user's local machine
- Users need Tally Prime installed locally
- Document that Tally integration requires local Tally instance

---

### Issue 4: File Uploads Timeout

**Error Message:**
```
Request timeout after 30s
```

**Cause:** Large file or slow backend

**Solution:**
1. Increase request timeout in frontend
2. Enable gzip compression on backend
3. Use async processing for large files

---

### Issue 5: Database Connection Limit Exceeded

**Error Message:**
```
FATAL: too many connections
```

**Cause:** Connection pool exhausted

**Solution:**
1. Reduce max connections in SQLAlchemy config
2. Add connection pooling
3. Upgrade Render database plan

---

## Version Management

### Release Process

1. **Update Version Number:**
   ```json
   // package.json
   "version": "0.2.4"
   ```

2. **Create Release Notes:**
   ```markdown
   # v0.2.4 Release Notes
   - Fixed invoice deletion bug
   - Added CSV import support
   - Improved Tally performance
   ```

3. **Build Release:**
   ```powershell
   npm run electron:dist
   ```

4. **Create GitHub Release:**
   - Tag: `v0.2.4`
   - Upload `.exe` file
   - Publish release notes

5. **Update Website:**
   - Update download link
   - Update version number
   - Post release notes

### Version Rollback

If production has critical issue:

```powershell
# Deploy previous version
git checkout v0.2.3
git push origin main

# Render auto-redeploys
```

---

## Scaling Considerations

### As User Base Grows

| Issue | Solution |
|-------|----------|
| Backend slow | Upgrade Render plan, enable caching |
| Database slow | Add indexes, upgrade PostgreSQL plan |
| Storage full | Archive old invoices to cold storage |
| High load | Enable auto-scaling on Render |

### Database Performance

```python
# Add indexes for frequently queried fields
class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True, index=True)
    status = Column(String, index=True)
    created_at = Column(DateTime, index=True)
    supplier = Column(String, index=True)
```

---

**Last Updated:** January 3, 2026
