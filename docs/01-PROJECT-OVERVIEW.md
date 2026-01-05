# AutoTallyAI - Project Overview

## Executive Summary

**AutoTallyAI** is an intelligent desktop and web application that automates accounting workflows by combining AI-powered document processing with real-time Tally Prime integration. It streamlines invoice processing, bank statement reconciliation, and automatically synchronizes data with Tally accounting software.

**Current Version:** 0.2.3  
**Author:** Suraj Suryawanshi  
**Repository:** taxblock-autotally-ai  
**Last Updated:** January 2026

---

## Project Goals & Use Cases

### Primary Goals
- Automate invoice processing from PDF/image files using AI
- Eliminate manual data entry for accounting workflows
- Provide seamless integration with Tally Prime
- Support GST compliance and multi-ledger reconciliation
- Offer both desktop and web application experiences

### Key Use Cases
1. **Invoice Processing** - Extract invoice data (supplier, items, GST, amounts) from PDFs automatically
2. **Bank Reconciliation** - Match bank transactions with invoices and create Tally vouchers
3. **Bulk Import** - Process hundreds of invoices via Excel or PDF batch upload
4. **Tally Sync** - Push processed invoices to Tally as purchase/sales vouchers in real-time
5. **Accounting Assistance** - AI ChatBot for accounting queries and Tally guidance

---

## Technical Stack Summary

### Frontend
- **Framework:** React 19.2.0 with TypeScript
- **Build Tool:** Vite 6.2.0 (optimized bundling with chunk splitting)
- **Styling:** Tailwind CSS 3.4.19 with custom animations
- **UI Libraries:** Lucide React (icons), Recharts (charts), ExcelJS (spreadsheets)
- **Desktop:** Electron 39.2.7 with Windows NSIS installer

### Backend
- **Framework:** FastAPI (Python) with Uvicorn
- **AI Integration:** Google Generative AI (Gemini API)
- **Database:** SQLAlchemy ORM (SQLite dev / PostgreSQL prod)
- **Document Processing:** PDFPlumber, OpenCV, Pillow, PDF2Image
- **Deployment:** Render.com

### DevOps & Tools
- **Package Manager:** npm
- **Version Control:** Git
- **Build Automation:** Electron Builder for Windows installers
- **Code Quality:** TypeScript for type safety

---

## Feature Overview

### 1. Document Intelligence (AI-Powered)
- Extract invoice details from PDFs using Google Gemini API
- Process bank statements and reconcile transactions
- Automatic duplicate detection via file hashing
- Batch processing with progress tracking
- Support for GST calculations and multi-item invoices

### 2. Tally Prime Integration
- Real-time Tally instance detection
- Generate XML vouchers for Tally (Purchase/Sales invoices)
- Bulk push to Tally with atomic transactions
- Automatic ledger and supplier creation
- IGST, CGST, SGST tax support
- Tally sync history and error logging

### 3. User Interface & Experience
- **Dashboard** - Statistics, quick actions, recent uploads
- **Invoice Editor** - Full CRUD operations with line items and calculations
- **Bank Statement Manager** - Import and reconcile transactions
- **Excel Import** - Bulk voucher creation from spreadsheets
- **AI ChatBot** - Contextual accounting assistant
- **Tally Logs** - Real-time sync status monitoring
- **Settings** - Backend API, Tally connection, UI preferences, dark mode
- **Responsive Design** - Works on desktop and tablet viewports

### 4. Data Management
- SQLAlchemy ORM with migrations support
- File hash tracking for duplicate prevention
- Invoice registry with status tracking
- Bank transaction reconciliation
- Tally sync audit logs

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   USER APPLICATIONS                          │
├──────────────────────┬──────────────────────────────────────┤
│   WEB BROWSER        │   ELECTRON DESKTOP APP               │
│  (React + Vite)      │  (React + Vite + Electron)           │
│                      │  (Windows NSIS Installer)            │
└──────────────┬───────┴────────────────────┬──────────────────┘
               │                            │
        ┌──────▼─────────────────────────────▼──────┐
        │     FRONTEND LAYER (React/TypeScript)     │
        ├──────────────────────────────────────────┤
        │  Services:                                │
        │  • backendService.ts (API calls)          │
        │  • tallyService.ts (Tally XML proxy)      │
        │  • dbService.ts (Database operations)     │
        │  • authService.ts (Authentication)        │
        └──────┬────────────────────────────┬───────┘
               │                            │
        ┌──────▼────────────┐      ┌────────▼──────────────┐
        │  FASTAPI BACKEND  │      │  TALLY PRIME (XML)    │
        │  (Python/Uvicorn) │      │  Local Instance       │
        ├───────────────────┤      └───────────────────────┘
        │ Endpoints:        │
        │ • /health         │
        │ • /auth/validate  │
        │ • /gemini-proxy   │
        │ • [DB Operations] │
        │                   │
        │ AI Integration:   │
        │ • Google Gemini   │
        └──────┬────────────┘
               │
        ┌──────▼────────────────────────┐
        │  DATABASE LAYER               │
        ├───────────────────────────────┤
        │ • SQLAlchemy ORM              │
        │ • Models: Invoice, Transaction│
        │ • Support: SQLite / PostgreSQL│
        └───────────────────────────────┘
```

---

## Project Directory Structure

```
DesktopApp/
├── docs/                                    # Project Documentation
│   ├── 01-PROJECT-OVERVIEW.md              # This file
│   ├── 02-ARCHITECTURE.md                  # System design & data flow
│   ├── 03-API-REFERENCE.md                 # Backend API endpoints
│   ├── 04-SETUP-DEVELOPMENT.md             # Local development setup
│   ├── 05-DEPLOYMENT.md                    # Production deployment
│   ├── 06-COMPONENTS-SERVICES.md           # Frontend components & services
│   ├── 07-DATABASE-SCHEMA.md               # Data models documentation
│   └── 08-TROUBLESHOOTING.md               # FAQs & debugging
│
├── src/                                     # Frontend React Application
│   ├── components/                          # 21+ React components
│   ├── services/                            # Business logic & API calls
│   ├── App.tsx                             # Main application
│   ├── index.tsx                           # React entry point
│   └── types.ts                            # TypeScript interfaces
│
├── backend/                                 # Python FastAPI Backend
│   ├── main.py                             # FastAPI application (933 lines)
│   ├── models.py                           # SQLAlchemy models
│   ├── schemas.py                          # Pydantic validation schemas
│   ├── database.py                         # DB configuration & session
│   ├── pdf_processor.py                    # PDF parsing utilities
│   ├── requirements.txt                    # Python dependencies
│   └── render.yaml                         # Render.com deployment config
│
├── electron/                                # Electron Main Process
│   ├── main.js                             # Window & app lifecycle
│   └── preload.js                          # Secure context bridge
│
├── public/                                  # Static assets & icons
├── dist/                                    # Build output (generated)
├── release_v*/                              # Release artifacts (v2-v22)
│
├── Configuration Files
├── package.json                            # Project metadata & npm scripts
│   ├── vite.config.ts                      # Vite build configuration
│   ├── tsconfig.json                       # TypeScript compiler options
│   ├── tailwind.config.js                  # Tailwind CSS customization
│   ├── postcss.config.js                   # PostCSS configuration
│   └── .env.example                        # Environment variables template
│
└── README.md                                # Quick start guide
```

---

## Development Workflow

### Local Development Environment
```bash
# Frontend (Vite Dev Server + React)
npm run dev

# Desktop Development (Vite + Electron)
npm run electron:dev

# TypeScript Compilation
npm run build

# Production Build
npm run build:prod

# Desktop Installer Build
npm run electron:dist
```

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Key Scripts in package.json
| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server for web |
| `npm run electron:dev` | Start Electron dev environment |
| `npm run build` | Build React app with TypeScript |
| `npm run electron:dist` | Create Windows NSIS installer |
| `npm run start` | Run built application |

---

## Version History

| Version | Release Date | Key Changes |
|---------|-------------|------------|
| 0.2.3 | Jan 2026 | Latest stable |
| 0.2.2 | - | Included in v19-v21 |
| 0.2.1 | - | Included in v14-v18 |
| 0.2.0 | - | Initial releases v10-v13 |
| Earlier | - | v2-v9 with foundational features |

See `release_v*/latest.yml` for detailed version information.

---

## Key Technologies & Dependencies

### Critical Frontend Libraries
- `react@19.2.0` - UI framework
- `typescript@5.x` - Type safety
- `vite@6.2.0` - Fast bundling
- `tailwindcss@3.4.19` - Utility-first CSS
- `electron@39.2.7` - Desktop app framework
- `exceljs@4.4.0` - Excel file processing
- `lucide-react` - Icon library
- `recharts` - React charting library

### Critical Backend Libraries
- `fastapi` - Web framework
- `sqlalchemy` - ORM
- `pydantic` - Data validation
- `google-generativeai` - AI integration
- `pdfplumber` - PDF parsing
- `opencv-python` - Image processing
- `uvicorn` - ASGI server

---

## Getting Started Quick Links

1. **First Time Setup?** → See [04-SETUP-DEVELOPMENT.md](04-SETUP-DEVELOPMENT.md)
2. **Want to Deploy?** → See [05-DEPLOYMENT.md](05-DEPLOYMENT.md)
3. **Understanding Components?** → See [06-COMPONENTS-SERVICES.md](06-COMPONENTS-SERVICES.md)
4. **API Integration?** → See [03-API-REFERENCE.md](03-API-REFERENCE.md)
5. **Troubleshooting Issues?** → See [08-TROUBLESHOOTING.md](08-TROUBLESHOOTING.md)
6. **Database Questions?** → See [07-DATABASE-SCHEMA.md](07-DATABASE-SCHEMA.md)

---

## Contact & Support

**Project Lead:** Suraj Suryawanshi

---

## License & Compliance

- GST compliance enabled for Indian accounting (September 2025 rates)
- Tally Prime integration follows official XML API specifications
- Windows NSIS installer with auto-update capability via Electron Builder

---

**Last Updated:** January 3, 2026  
**Status:** Active Development & Maintenance
