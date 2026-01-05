# AutoTallyAI - Complete Documentation Index

Welcome to the AutoTallyAI documentation. This is your comprehensive guide to understanding, developing, deploying, and maintaining the application.

---

## 📚 Documentation Files

### **1. [Project Overview](01-PROJECT-OVERVIEW.md)** ⭐ START HERE
Comprehensive introduction to AutoTallyAI project including:
- Project goals and key features
- Technology stack summary
- System architecture overview
- Version history and quick links

**Read this first** to understand what AutoTallyAI does and how it works at a high level.

---

### **2. [System Architecture & Design](02-ARCHITECTURE.md)**
Deep dive into how the application is structured:
- Three-tier application architecture
- Component hierarchy and relationships
- Data flow diagrams (invoice processing, Tally sync, reconciliation)
- Integration points (frontend ↔ backend, Tally, Gemini AI)
- Security architecture
- Scalability considerations
- Technology rationale

**Read this** to understand how components communicate and data flows through the system.

---

### **3. [API Reference](03-API-REFERENCE.md)**
Complete FastAPI backend documentation:
- Authentication & authorization
- Health check endpoints
- Invoice management endpoints (CRUD, get, update, delete)
- Tally integration endpoints
- ChatBot & AI endpoints
- Bank transaction endpoints
- Error codes and handling
- Real-world request/response examples

**Read this** when developing frontend features that call backend APIs.

---

### **4. [Setup & Development Guide](04-SETUP-DEVELOPMENT.md)** ⭐ FOR DEVELOPERS
Complete step-by-step setup for local development:
- Prerequisites (Node.js, Python, Git installation)
- Environment configuration (.env files)
- Frontend development (Vite dev server, hot reload)
- Backend development (FastAPI, testing endpoints)
- Electron desktop development
- Database setup and initialization
- Common issues and solutions

**Read this first** if you're setting up the project locally or joining the development team.

---

### **5. [Deployment Guide](05-DEPLOYMENT.md)**
Production deployment documentation:
- Deployment architecture
- Backend deployment on Render.com
- PostgreSQL database setup
- Frontend web deployment (multiple options)
- Desktop application (.exe) distribution
- Environment configuration for production
- Monitoring and maintenance
- Scaling considerations
- Troubleshooting production issues

**Read this** before deploying to production or when preparing a release.

---

### **6. [Components & Services Guide](06-COMPONENTS-SERVICES.md)**
Frontend component and service layer documentation:
- Dashboard, InvoiceUpload, InvoiceEditor, BankStatementManager, ChatBot components
- Services: backendService, tallyService, dbService, authService
- Component patterns and best practices
- State management with React Context
- Styling with Tailwind CSS

**Read this** when building new features or understanding React component architecture.

---

### **7. [Database Schema & ORM](07-DATABASE-SCHEMA.md)**
Complete database documentation:
- Database technology (SQLite dev, PostgreSQL prod)
- Data models (Invoice, InvoiceItem, BankTransaction, TallyLog, UploadedFile)
- Model relationships (ER diagram)
- ORM queries and operations
- Indexing strategy
- Backup and recovery procedures

**Read this** when working with data models or database queries.

---

### **8. [Troubleshooting & FAQs](08-TROUBLESHOOTING.md)**
Problem-solving guide:
- Common frontend errors and solutions
- Backend API issues
- Tally integration troubleshooting
- Database problems
- Performance optimization
- Security & authentication issues
- Desktop app problems
- Frequently asked questions

**Read this** when you encounter an error or have common questions.

---

## 🚀 Quick Start Paths

### **I'm a New Developer**
1. Read: [Project Overview](01-PROJECT-OVERVIEW.md) (10 min)
2. Read: [Setup & Development Guide](04-SETUP-DEVELOPMENT.md) (20 min)
3. Follow setup steps from scratch
4. Run: `npm run dev` and `python main.py` in separate terminals
5. Open `http://localhost:5173` in browser

**Time to first success:** ~30 minutes

---

### **I Need to Deploy to Production**
1. Read: [Deployment Guide](05-DEPLOYMENT.md) (entire document)
2. Create Render.com account
3. Deploy backend and PostgreSQL
4. Set environment variables
5. Deploy frontend
6. Test with production data
7. Create Windows installer for desktop users

**Time to deployment:** ~1-2 hours

---

### **I'm Building a New Feature**
1. Read: [Project Overview](01-PROJECT-OVERVIEW.md) - understand context
2. Read: [System Architecture](02-ARCHITECTURE.md) - understand data flow
3. Check [Components & Services Guide](06-COMPONENTS-SERVICES.md) - similar components
4. Read [API Reference](03-API-REFERENCE.md) - backend endpoints
5. Implement frontend component
6. Test against backend
7. Consider edge cases from [Troubleshooting Guide](08-TROUBLESHOOTING.md)

---

### **I Need to Fix a Bug**
1. Check [Troubleshooting Guide](08-TROUBLESHOOTING.md) for similar issues
2. Check [API Reference](03-API-REFERENCE.md) for API contract
3. Check [Components & Services Guide](06-COMPONENTS-SERVICES.md) for component logic
4. Enable debugging in browser DevTools (F12)
5. Check backend logs: `npm run dev` in terminal
6. Use [Database Schema](07-DATABASE-SCHEMA.md) to understand data

---

### **I'm Joining as a New Team Member**
1. **Day 1:** Read [Project Overview](01-PROJECT-OVERVIEW.md)
2. **Day 1:** Run [Setup & Development Guide](04-SETUP-DEVELOPMENT.md)
3. **Day 2:** Read [System Architecture](02-ARCHITECTURE.md)
4. **Day 2:** Read [Components & Services Guide](06-COMPONENTS-SERVICES.md)
5. **Day 3:** Review actual code files
6. **Day 3:** Start small PR on existing feature
7. **Day 4-5:** Contribute to feature development

---

## 📖 Documentation by Topic

### **Understanding the Project**
- Project purpose: [Project Overview](01-PROJECT-OVERVIEW.md#executive-summary)
- Features: [Project Overview](01-PROJECT-OVERVIEW.md#feature-overview)
- Tech stack: [Project Overview](01-PROJECT-OVERVIEW.md#technical-stack-summary)

### **System Design**
- Architecture: [System Architecture](02-ARCHITECTURE.md#high-level-architecture)
- Components: [System Architecture](02-ARCHITECTURE.md#component-architecture)
- Data flow: [System Architecture](02-ARCHITECTURE.md#data-flow)
- Integration: [System Architecture](02-ARCHITECTURE.md#integration-points)

### **Frontend Development**
- Components: [Components & Services](06-COMPONENTS-SERVICES.md#frontend-components)
- Services: [Components & Services](06-COMPONENTS-SERVICES.md#service-layer)
- Styling: [Components & Services](06-COMPONENTS-SERVICES.md#styling-with-tailwind)
- Setup: [Setup Guide](04-SETUP-DEVELOPMENT.md#frontend-development)

### **Backend Development**
- API endpoints: [API Reference](03-API-REFERENCE.md#invoice-management)
- Setup: [Setup Guide](04-SETUP-DEVELOPMENT.md#backend-development)
- Models: [Database Schema](07-DATABASE-SCHEMA.md#data-models)
- Queries: [Database Schema](07-DATABASE-SCHEMA.md#queries--operations)

### **Database**
- Models: [Database Schema](07-DATABASE-SCHEMA.md#data-models)
- Relationships: [Database Schema](07-DATABASE-SCHEMA.md#relationships)
- Queries: [Database Schema](07-DATABASE-SCHEMA.md#queries--operations)
- Backup: [Database Schema](07-DATABASE-SCHEMA.md#backup--recovery)

### **Tally Integration**
- Endpoints: [API Reference](03-API-REFERENCE.md#tally-integration)
- Service: [Components & Services](06-COMPONENTS-SERVICES.md#tallyservicets)
- Troubleshooting: [Troubleshooting](08-TROUBLESHOOTING.md#tally-integration-issues)
- XML format: [System Architecture](02-ARCHITECTURE.md#2-frontend--tally-prime-integration)

### **Deployment**
- All deployment info: [Deployment Guide](05-DEPLOYMENT.md)
- Backend: [Deployment - Render.com](05-DEPLOYMENT.md#backend-deployment-rendercom)
- Frontend: [Deployment - Web](05-DEPLOYMENT.md#frontend-web-deployment)
- Desktop: [Deployment - Electron](05-DEPLOYMENT.md#desktop-application-deployment)

### **Problem Solving**
- Frontend errors: [Troubleshooting](08-TROUBLESHOOTING.md#common-frontend-issues)
- Backend errors: [Troubleshooting](08-TROUBLESHOOTING.md#backend--api-issues)
- Tally issues: [Troubleshooting](08-TROUBLESHOOTING.md#tally-integration-issues)
- Database issues: [Troubleshooting](08-TROUBLESHOOTING.md#database-issues)
- FAQs: [Troubleshooting](08-TROUBLESHOOTING.md#faqs)

---

## 💡 Common Tasks & Where to Find Help

| Task | Document | Section |
|------|----------|---------|
| Run app locally | Setup Guide | [Frontend Development](04-SETUP-DEVELOPMENT.md#frontend-development) |
| Call backend API | Components Guide | [backendService.ts](06-COMPONENTS-SERVICES.md#backendservicets) |
| Add new component | Components Guide | [Component Patterns](06-COMPONENTS-SERVICES.md#component-patterns) |
| Create database query | Database Schema | [Queries](07-DATABASE-SCHEMA.md#queries--operations) |
| Fix authentication error | Troubleshooting | [Security Issues](08-TROUBLESHOOTING.md#security--authentication) |
| Improve performance | Architecture | [Scalability](02-ARCHITECTURE.md#scalability--performance) |
| Deploy to Render | Deployment Guide | [Render.com](05-DEPLOYMENT.md#backend-deployment-rendercom) |
| Debug Tally sync | Troubleshooting | [Tally Issues](08-TROUBLESHOOTING.md#tally-integration-issues) |
| Update API endpoint | API Reference | [Endpoints](03-API-REFERENCE.md) |
| Understand data model | Database Schema | [Models](07-DATABASE-SCHEMA.md#data-models) |

---

## 🔑 Key Concepts Explained

### **Invoice Processing Pipeline**
1. User uploads PDF file via [InvoiceUpload](06-COMPONENTS-SERVICES.md#invoiceupload-component) component
2. [backendService](06-COMPONENTS-SERVICES.md#backendservicets) sends to [/upload-invoice](03-API-REFERENCE.md#upload-invoices) endpoint
3. Backend calls Google Gemini API to extract data
4. Extracted data validated against [Invoice schema](07-DATABASE-SCHEMA.md#2-invoice-model)
5. User sees [InvoiceEditor](06-COMPONENTS-SERVICES.md#invoiceeditor-component) with extracted data
6. User can edit and push to Tally

See: [Architecture - Invoice Processing Data Flow](02-ARCHITECTURE.md#1-invoice-processing-data-flow)

### **Tally Integration**
1. User clicks "Push to Tally"
2. [tallyService](06-COMPONENTS-SERVICES.md#tallyservicets) generates XML voucher
3. XML sent to Tally Prime on port 9000
4. Tally creates Purchase/Sales voucher
5. Sync logged in [TallyLog](07-DATABASE-SCHEMA.md#5-tallylog-model) table

See: [Architecture - Tally Sync Data Flow](02-ARCHITECTURE.md#2-tally-synchronization-data-flow)

### **API Authentication**
- Frontend stores API key from `.env.local`
- Every request includes: `Authorization: Bearer YOUR_API_KEY`
- Backend validates key before processing
- Key defined in backend `.env` as `BACKEND_API_KEY`

See: [API Reference - Authentication](03-API-REFERENCE.md#authentication)

---

## 🛠️ Development Workflows

### **Local Development Setup** (first time)
```bash
# Terminal 1: Frontend
npm install
npm run dev
# Open http://localhost:5173

# Terminal 2: Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate  # Windows
pip install -r requirements.txt
python main.py
# Backend running on http://localhost:8000
```

### **Making a Change**
1. Edit file in `src/` or `backend/`
2. Frontend: HMR auto-reloads page
3. Backend: Restart with Ctrl+C and `python main.py`
4. Test in browser
5. Commit and push

### **Creating a Release**
1. Update version in `package.json`
2. Build: `npm run build`
3. Desktop: `npm run electron:dist`
4. Upload .exe to GitHub releases
5. Deploy backend to Render
6. Update documentation

---

## 📞 Getting Help

**Can't find what you need?**

1. Check [Troubleshooting & FAQs](08-TROUBLESHOOTING.md)
2. Search other documentation files (Ctrl+F)
3. Check code comments in `src/` and `backend/`
4. Check existing GitHub issues
5. Contact development team

---

## 📅 Version Information

**Current Version:** 0.2.3  
**Last Updated:** January 3, 2026  
**Status:** Active Development

See [Project Overview - Version History](01-PROJECT-OVERVIEW.md#version-history) for changelog.

---

## 📝 Documentation Contribution

Found an error or outdated info? Help improve documentation:

1. Edit the relevant `.md` file
2. Commit with clear message: `docs: update API reference for invoices endpoint`
3. Create Pull Request with explanation
4. Team reviews and merges

---

## 🎯 Learning Path by Role

### **Frontend Developer**
1. [Project Overview](01-PROJECT-OVERVIEW.md)
2. [System Architecture](02-ARCHITECTURE.md#component-architecture)
3. [Setup Guide - Frontend](04-SETUP-DEVELOPMENT.md#frontend-development)
4. [Components & Services](06-COMPONENTS-SERVICES.md)
5. [API Reference](03-API-REFERENCE.md)

### **Backend Developer**
1. [Project Overview](01-PROJECT-OVERVIEW.md)
2. [System Architecture](02-ARCHITECTURE.md)
3. [Setup Guide - Backend](04-SETUP-DEVELOPMENT.md#backend-development)
4. [API Reference](03-API-REFERENCE.md)
5. [Database Schema](07-DATABASE-SCHEMA.md)

### **DevOps / Deployment**
1. [Project Overview](01-PROJECT-OVERVIEW.md)
2. [Deployment Guide](05-DEPLOYMENT.md) - ENTIRE DOCUMENT
3. [System Architecture](02-ARCHITECTURE.md#deployment-architecture)
4. [Troubleshooting](08-TROUBLESHOOTING.md)

### **QA / Tester**
1. [Project Overview](01-PROJECT-OVERVIEW.md)
2. [Components & Services](06-COMPONENTS-SERVICES.md)
3. [Troubleshooting & FAQs](08-TROUBLESHOOTING.md)
4. [API Reference](03-API-REFERENCE.md)

### **New Team Member**
1. Read in order: Overview → Architecture → Development Setup
2. Run local environment
3. Review Components guide
4. Check Troubleshooting for common issues
5. Review code in repository

---

**Happy developing! 🚀**

For questions or suggestions about documentation, open an issue or contact the team.

---

**Last Updated:** January 3, 2026
