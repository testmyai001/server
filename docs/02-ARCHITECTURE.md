# AutoTallyAI - System Architecture & Design

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Integration Points](#integration-points)
5. [Security Architecture](#security-architecture)
6. [Scalability & Performance](#scalability--performance)

---

## High-Level Architecture

### Three-Tier Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Components (Dashboard, Editor, ChatBot, etc.)     │   │
│  │  State Management (React hooks, Context API)             │   │
│  │  Responsive UI (Tailwind CSS)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/REST
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Frontend Services:                                      │   │
│  │  • backendService.ts - API communication                 │   │
│  │  • tallyService.ts - Tally XML API proxy                 │   │
│  │  • dbService.ts - Database CRUD operations               │   │
│  │  • authService.ts - Authentication & validation          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FastAPI Backend (Python):                               │   │
│  │  • Request validation (Pydantic schemas)                 │   │
│  │  • Business logic (invoice processing, DB operations)    │   │
│  │  • Google Gemini AI integration                          │   │
│  │  • CORS & authentication middleware                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
┌────────▼──────────────┐      ┌──────────▼──────────────┐
│   DATABASE LAYER      │      │  EXTERNAL SERVICES     │
│                       │      │                        │
│ • SQLAlchemy ORM      │      │ • Tally Prime XML API  │
│ • Models & Schemas    │      │ • Google Gemini API    │
│ • Migrations          │      │ • File Storage (local) │
│ • Transactions        │      │                        │
│                       │      │                        │
│ SQLite (dev)          │      │                        │
│ PostgreSQL (prod)     │      │                        │
└───────────────────────┘      └────────────────────────┘
```

---

## Component Architecture

### Frontend Component Hierarchy

```
App (Main Container)
├── AuthScreen (Authentication Gate)
└── [After Auth]
    ├── Navbar (Top Navigation)
    │   ├── Logo & App Title
    │   ├── User Menu
    │   └── Notifications
    │
    ├── Sidebar (Navigation)
    │   ├── Dashboard Link
    │   ├── Invoice Management
    │   ├── Bank Statements
    │   ├── Tally Logs
    │   ├── Settings
    │   └── Logout
    │
    └── MainContent (Router-based Views)
        ├── Dashboard
        │   ├── Statistics Cards
        │   ├── Recent Activity
        │   └── Quick Action Buttons
        │
        ├── InvoiceUpload
        │   ├── File Drop Zone
        │   ├── Progress Tracker
        │   └── Processing Results
        │
        ├── InvoiceEditor
        │   ├── Invoice Details Form
        │   ├── Line Items Table
        │   ├── GST Calculator
        │   ├── Save & Submit Buttons
        │   └── Status Indicator
        │
        ├── BankStatementManager
        │   ├── Import Interface
        │   ├── Transaction List
        │   ├── Reconciliation Tool
        │   └── Voucher Generator
        │
        ├── ExcelImportManager
        │   ├── Excel File Upload
        │   ├── Column Mapping
        │   ├── Preview Table
        │   └── Bulk Create Button
        │
        ├── ChatBot
        │   ├── Message History
        │   ├── Input Field
        │   └── AI Response Display
        │
        ├── TallyLogs
        │   ├── Sync History Table
        │   ├── Status Filters
        │   ├── Error Details
        │   └── Retry Mechanism
        │
        └── SettingsModal
            ├── Backend API Config
            ├── Tally Connection Settings
            ├── Theme Preferences
            └── Advanced Options
```

### Service Layer Architecture

```
src/services/
├── backendService.ts
│   ├── apiCall() - Generic HTTP wrapper
│   ├── uploadInvoice()
│   ├── updateInvoice()
│   ├── deleteInvoice()
│   ├── getInvoices()
│   ├── chatBot()
│   ├── getTallyLogs()
│   └── [Other CRUD operations]
│
├── tallyService.ts
│   ├── detectTallyInstance()
│   ├── generateXML()
│   │   ├── createPurchaseVoucher()
│   │   └── createSalesVoucher()
│   ├── pushToTally()
│   ├── validateTallyConnection()
│   └── getTallyCompanies()
│
├── dbService.ts
│   ├── initializeDB()
│   ├── syncWithServer()
│   ├── getLocalInvoices()
│   ├── saveLocalInvoice()
│   └── [Local storage operations]
│
└── authService.ts
    ├── validateApiKey()
    ├── getAuthToken()
    ├── refreshToken()
    └── logout()
```

---

## Data Flow

### 1. Invoice Processing Data Flow

```
User uploads PDF file
        ↓
InvoiceUpload Component
├── File validation
└── Hash generation (for duplicate detection)
        ↓
backendService.uploadInvoice()
├── HTTP POST to /upload-invoice
├── File attached as multipart/form-data
└── Backend validates & stores
        ↓
FastAPI Backend (main.py)
├── Save file to storage
├── Calculate file hash
├── Query database for duplicate
└── If duplicate: return warning
        ↓
AI Processing (if not duplicate)
├── Call Google Gemini API
├── Extract invoice fields:
│   ├── Supplier name
│   ├── Invoice number & date
│   ├── GST registration
│   ├── Line items (description, qty, rate, tax)
│   └── Total amounts
└── Parse response JSON
        ↓
Database Storage
├── Create Invoice record
├── Create InvoiceItem records (line items)
├── Store extracted data
└── Set status: "processed"
        ↓
Response to Frontend
└── Display extracted invoice in editor
```

### 2. Tally Synchronization Data Flow

```
User clicks "Push to Tally" Button
        ↓
InvoiceEditor Component
└── Validate invoice data completeness
        ↓
tallyService.generateXML()
├── Create voucher XML structure
├── Map invoice fields to Tally format
├── Calculate HSN-wise IGST/CGST/SGST
├── Generate ledger account entries
└── Return formatted XML
        ↓
tallyService.pushToTally()
├── Detect Tally instance (port 9000)
├── Check Tally access via XML API
└── Send POST request with XML
        ↓
Tally Prime (Local)
├── Parse XML
├── Create Purchase/Sales Voucher
├── Create ledgers if missing
├── Validate GST compliance
└── Return success/error response
        ↓
BackendService logs Tally operation
├── Store in TallyLog table
├── Record timestamp & status
├── Log any error messages
└── Update invoice status
        ↓
TallyLogs Component displays result
└── User sees sync status immediately
```

### 3. Bank Statement Reconciliation Flow

```
User uploads Bank Statement (Excel/PDF)
        ↓
BankStatementManager Component
├── Parse file format
└── Extract transactions
        ↓
Display Transaction List
├── Show date, amount, description
├── Mark matched invoices
└── Allow manual matching
        ↓
Reconciliation Engine
├── Compare bank amount vs invoice total
├── Match supplier name with transaction description
├── Generate voucher type (Payment/Receipt)
└── Display reconciliation summary
        ↓
Create Vouchers
├── Generate Tally vouchers for matched transactions
├── Push to Tally via tallyService
└── Update reconciliation status
```

---

## Integration Points

### 1. Frontend ↔ Backend Integration

**Protocol:** REST API via HTTP/HTTPS  
**Authentication:** Bearer token in Authorization header  
**Base URL:** Configured in `.env.local` → `VITE_API_BASE_URL`

**Key Endpoints:**
- `POST /upload-invoice` - Submit invoice files for AI processing
- `PUT /invoice/{id}` - Update invoice details
- `GET /invoices` - Fetch all invoices with pagination
- `POST /push-to-tally` - Push invoice to Tally
- `POST /chat` - Send message to AI ChatBot
- `GET /tally-logs` - Fetch Tally sync history

**Error Handling:**
- HTTP status codes (200, 400, 401, 404, 500)
- JSON error responses with message details
- Frontend catches and displays user-friendly errors

### 2. Frontend ↔ Tally Prime Integration

**Protocol:** Tally XML API  
**Endpoint:** `http://127.0.0.1:9000` (configurable)  
**Method:** HTTP POST with XML body

**XML Structure Example:**
```xml
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Create</TALLYREQUEST>
    <TYPE>Voucher</TYPE>
  </HEADER>
  <BODY>
    <VOUCHER>
      <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
      <VOUCHERDATE>2026-01-03</VOUCHERDATE>
      <LEDGERENTRIES.LIST>
        <!-- Ledger entries for invoice items -->
      </LEDGERENTRIES.LIST>
    </VOUCHER>
  </BODY>
</ENVELOPE>
```

**CORS Handling:**
- Vite proxy configured in `vite.config.ts`
- Frontend requests routed through proxy to avoid CORS issues
- Proxy configuration: `/@vite-proxy/tally` → `http://127.0.0.1:9000`

### 3. Backend ↔ Google Gemini API Integration

**Service:** Google Generative AI  
**Model:** Gemini (specified in API)  
**Authentication:** `GEMINI_API_KEY` from environment  
**Communication:** HTTP REST to Google API endpoints

**Request Format:**
```python
response = model.generate_content(
    f"Extract invoice details from this image: {image_data}",
    stream=False
)
```

**Response Processing:**
- Parse structured JSON from Gemini response
- Extract fields: supplier, invoice #, date, items, GST, totals
- Validate extracted data against schema
- Handle parsing errors gracefully

### 4. Backend ↔ Database Integration

**ORM:** SQLAlchemy  
**Connection Management:**
- Database URL from `DATABASE_URL` environment variable
- Connection pooling for performance
- Session management per request

**Models:**
- `UploadedFile` - File metadata & hashing
- `Invoice` - Master invoice records
- `InvoiceItem` - Line items with HSN & GST
- `BankTransaction` - Bank statement entries
- `TallyLog` - Sync history & audit trail

---

## Security Architecture

### Authentication & Authorization

```
Frontend                          Backend
    │                               │
    ├─ Send API Key ─────────────>  │
    │  (Authorization header)       │
    │                               ├─ Validate key
    │                               ├─ Check database
    │<────── Token Response ────────┤
    │  (if valid)                   │
    │                               │
    ├─ Store token in memory ──────│ (Not localStorage!)
    │                               │
    ├─ Use token in requests ──────>│
    │  (Bearer token)               │
    │                               ├─ Verify token
    │                               └─ Process request
```

### API Key Management

- **Storage Location:** Environment variable `BACKEND_API_KEY`
- **Transmission:** Authorization header with Bearer scheme
- **Validation:** Server-side validation on every request
- **Test Key:** `test-backend-key-12345` (development only)
- **Production Key:** Deployed via environment variables on Render.com

### CORS Configuration

```python
# Backend CORS setup in main.py
ALLOWED_ORIGINS = [
    "http://localhost:5173",      # Vite dev server
    "http://localhost:3000",      # Alternative dev port
    "https://your-deployed-domain", # Production
]
```

### Electron Security

- **Context Isolation:** Enabled in `electron/main.js`
- **Preload Script:** `electron/preload.js` for secure IPC
- **Development Tools:** Only in development mode
- **Sandboxing:** Enabled for renderer process

---

## Scalability & Performance Optimizations

### Frontend Performance

1. **Code Splitting (Vite)**
   - Vendor chunk (node_modules)
   - XLSX library (large dependency)
   - UI components (lazy loaded)

2. **Asset Optimization**
   - Image compression
   - SVG icons with Lucide React
   - CSS optimization via Tailwind purge

3. **React Optimization**
   - Component memoization for expensive renders
   - useCallback for function stability
   - useMemo for computed values

### Backend Performance

1. **Database Optimization**
   - Connection pooling (SQLAlchemy)
   - Indexed queries (id, status, date)
   - Pagination for large datasets

2. **Caching Strategy**
   - File hash caching for duplicates
   - User session caching
   - Gemini API response caching

3. **Async Processing**
   - FastAPI async endpoints
   - Background tasks for heavy processing
   - Streaming responses for large files

### Deployment Scalability

1. **Horizontal Scaling (Web)**
   - Stateless FastAPI backend
   - Load balancing at Render.com
   - Database replication (PostgreSQL)

2. **Desktop Application**
   - Electron app is self-contained
   - Local SQLite for offline mode
   - Sync when backend available

---

## Error Handling & Resilience

### Frontend Error Handling

```typescript
try {
  const response = await backendService.uploadInvoice(file);
  displaySuccess(response);
} catch (error) {
  if (error.status === 401) {
    // Re-authenticate
    redirectToLogin();
  } else if (error.status === 413) {
    // File too large
    showError("File size exceeds 50MB limit");
  } else {
    showError("Failed to upload invoice. Please try again.");
  }
}
```

### Backend Error Handling

```python
from fastapi import HTTPException

@app.post("/upload-invoice")
async def upload_invoice(file: UploadFile):
    try:
        validate_file(file)
        content = await file.read()
        result = process_with_gemini(content)
        return {"status": "success", "data": result}
    except FileTooLargeError:
        raise HTTPException(status_code=413, detail="File too large")
    except InvalidFileFormat:
        raise HTTPException(status_code=400, detail="Invalid file format")
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### Retry Mechanism

- Frontend retries failed requests (3 attempts with exponential backoff)
- Tally sync failures logged for manual retry
- Failed Gemini API calls escalate to backend logs

---

## Deployment Architecture

### Development Environment
- Local Vite server on `http://localhost:5173`
- Local FastAPI backend on `http://localhost:8000`
- SQLite database for quick iteration

### Production Environment
- Frontend: Deployed as static files (optional CDN)
- Backend: Render.com
- Database: PostgreSQL on Render
- Desktop: Windows NSIS installer with auto-update

### Environment Configuration

```
Development (.env.local):
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_API_KEY=test-backend-key-12345
VITE_TALLY_URL=http://127.0.0.1:9000

Production (.env):
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_BACKEND_API_KEY=<secure-key-from-vault>
VITE_TALLY_URL=http://127.0.0.1:9000
```

---

## Technology Decision Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend | React + TypeScript | Strong ecosystem, type safety, component reusability |
| Styling | Tailwind CSS | Rapid UI development, customization flexibility |
| Build | Vite | Fast cold start, optimized builds, excellent HMR |
| Backend | FastAPI | Type hints, automatic OpenAPI docs, high performance |
| Database ORM | SQLAlchemy | Flexible, database-agnostic, excellent for complex queries |
| AI Integration | Gemini API | Cost-effective, good extraction accuracy, easy integration |
| Desktop | Electron | Cross-platform potential, code reuse, large ecosystem |
| Deployment | Render.com | Simple deployment, auto-scaling, integrated database |

---

**Last Updated:** January 3, 2026
