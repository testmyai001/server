# Architecture: React Agent Between Backend & Local Tally

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
│                   React App (Agent)                         │
│  - Business Logic & State Management                        │
│  - User Interface                                           │
│  - Connects to both Backend API and Local Tally             │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
      ┌──────▼──────┐              ┌──────────▼─────────┐
      │ Backend API │              │ Local Tally Prime  │
      │   (Render)  │              │  (Port 9000)       │
      ├─────────────┤              ├────────────────────┤
      │ - AI Engine │              │ - Accounting DB    │
      │ - API Keys  │              │ - Ledgers          │
      │ - Storage   │              │ - Vouchers         │
      │ - NO Tally  │              │ - Companies        │
      └─────────────┘              └────────────────────┘
```

## Component Responsibilities

### Backend API (https://autotally-backend.onrender.com)
✅ **Does:**
- AI document processing (OCR, analysis)
- Stores API keys securely
- Maintains invoice history/backup
- Provides authentication
- Logging and analytics

❌ **Does NOT:**
- Connect to Tally Prime
- Access port 9000
- Have knowledge of Tally XML
- Manage Tally vouchers

### React App (Client)
✅ **Does:**
- User interface and experience
- Business logic implementation
- Manages application state
- Calls Backend API for AI processing
- Calls Local Tally Prime directly for voucher management
- Synchronizes data between backend and Tally

❌ **Does NOT:**
- Process AI (delegates to backend)
- Store sensitive API keys (uses environment variables)
- Manage remote server connections

### Local Tally Prime (http://127.0.0.1:9000)
✅ **Does:**
- Maintains accounting database
- Stores ledgers and masters
- Creates/modifies vouchers
- Handles GST calculations

❌ **Does NOT:**
- Connect to internet
- Communicate with backend
- Authenticate API requests

## Data Flow Examples

### Flow 1: Invoice Upload & Processing

```
User uploads Invoice Image
          │
          ▼
React receives file
          │
          ▼
React calls Backend API: /ai/process-document
          │
          ▼
Backend AI analyzes document
Returns: { supplierName, lineItems, GST rates, etc. }
          │
          ▼
React receives structured invoice data
          │
          ▼
React converts to Tally XML format
          │
          ▼
React sends XML directly to Local Tally (port 9000)
          │
          ▼
Tally Prime creates Purchase Voucher
          │
          ▼
React receives success response
          │
          ▼
React saves invoice to Backend (for history)
          │
          ▼
UI shows: ✓ "Invoice pushed to Tally successfully"
Dashboard updates with new entry
```

### Flow 2: Bulk Excel Import

```
User uploads Excel file (100 invoices)
          │
          ▼
React parses Excel to array
          │
          ▼
React calls Backend: /ai/process-bulk
          │
          ▼
Backend processes in batches
Returns: Array of InvoiceData objects
          │
          ▼
React receives processed invoices
          │
          ▼
React generates Tally XML for each invoice
          │
          ▼
React sends XMLs to Local Tally (batched)
          │
          ▼
Tally Prime creates multiple vouchers
          │
          ▼
React collects results
Returns: { successful: 95, failed: 5 }
          │
          ▼
React saves to Backend for records
          │
          ▼
UI shows progress: "95/100 imported successfully"
```

### Flow 3: Tally Direct Operations (No Backend)

```
User wants to fetch existing Tally ledgers
          │
          ▼
React calls Local Tally (port 9000) directly
[NO Backend involved - Direct connection]
          │
          ▼
Tally responds with ledger list
          │
          ▼
React updates UI with autocomplete
```

## API Endpoints

### Backend Endpoints (Managed by React)

**Note:** Backend does NOT have Tally endpoints. All Tally operations are direct React↔Tally.

```
POST /auth/login
POST /auth/validate

POST /ai/process-document (upload invoice image)
POST /ai/process-bulk (upload multiple images)

POST /invoices/save (save processed invoice to history)
GET  /invoices/list (fetch past invoices)
DELETE /invoices/:id

POST /logs/event (track user actions)
GET  /history (get processing history)
```

### Tally Endpoints (Direct from React - NO Backend)

```
POST /
  Body: XML Envelope
  Purpose: Push voucher to Tally
  
POST /
  Body: Export request XML
  Purpose: Fetch ledgers, companies, existing data
```

## Environment Configuration

### .env.local

```env
# Backend API (AI & Storage)
VITE_BACKEND_API_URL=https://autotally-backend.onrender.com
VITE_BACKEND_API_KEY=your_api_key_here

# Gemini API (Optional - for alternative AI)
VITE_GEMINI_API_KEY=your_gemini_key_here

# Local Tally Prime (React connects directly)
VITE_TALLY_API_URL=http://127.0.0.1:9000
```

## Implementation Guide

### In React Components

#### 1. Process Document with Backend AI

```typescript
import { processDocumentWithAI } from '../services/backendService';

const handleUpload = async (file: File) => {
  const result = await processDocumentWithAI(file, apiKey);
  if (result.success && result.invoice) {
    setInvoiceData(result.invoice);
  }
};
```

#### 2. Push to Local Tally (Direct - No Backend)

```typescript
import { pushToTally, generateTallyXml } from '../services/tallyService';

const handlePushToTally = async () => {
  const xml = generateTallyXml(invoiceData);
  const result = await pushToTally(xml);
  
  if (result.success) {
    // Save to backend for history
    await saveInvoiceToBackend(invoiceData, apiKey);
  }
};
```

#### 3. Save Invoice to Backend (Optional History)

```typescript
import { saveInvoiceToBackend } from '../services/backendService';

const handleSaveHistory = async () => {
  await saveInvoiceToBackend(invoiceData, apiKey);
};
```

#### 4. Get Tally Ledgers (Direct - No Backend)

```typescript
import { fetchExistingLedgers } from '../services/tallyService';

const handleFetchLedgers = async () => {
  const ledgers = await fetchExistingLedgers();
  setLedgerList(ledgers);
};
```

## Error Handling

### Backend API Error
```typescript
if (!result.success) {
  console.error('Backend error:', result.message);
  // Show user-friendly message
  // Offer to retry or use cached data
}
```

### Tally Connection Error
```typescript
if (!result.success) {
  console.error('Tally error:', result.message);
  // User checks:
  // 1. Is Tally Prime running?
  // 2. Is port 9000 open?
  // 3. Is there a firewall blocking it?
}
```

## Security Best Practices

✅ **Do:**
1. Store API keys in `.env.local` (git-ignored)
2. Never log API keys to console
3. Validate input before sending to backend
4. Use HTTPS for backend communication
5. Implement rate limiting on frontend
6. Validate all responses from both services

❌ **Don't:**
1. Hardcode API keys in source
2. Expose API keys in UI
3. Send sensitive data to Local Tally XML
4. Trust all responses blindly
5. Allow unlimited requests to backend

## Testing the Architecture

### Test 1: Backend Connectivity

```bash
# In browser console
fetch('https://autotally-backend.onrender.com/auth/validate', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})
```

### Test 2: Tally Connectivity

```bash
# In browser console (if CORS allows, may need proxy)
fetch('http://127.0.0.1:9000', {
  method: 'POST',
  body: '<ENVELOPE>...</ENVELOPE>'
})
```

### Test 3: Full Flow

1. Start Tally Prime on port 9000
2. Open React app at http://localhost:3000
3. Go to Settings → Test Tally Connection
4. Should show: ✓ "Tally Prime Connected"
5. Upload invoice image
6. Should show processing status from backend
7. Should show: ✓ "Pushed to Tally"

## Troubleshooting

### "Cannot reach Backend API"
- Check internet connection
- Verify backend URL in constants
- Check backend status: https://autotally-backend.onrender.com/health

### "Tally connection failed"
- Start Tally Prime on your computer
- Verify port 9000 is not blocked
- Check Windows Firewall settings
- Run: `netstat -ano | findstr 9000` to see if listening

### "API Key validation failed"
- Go to backend dashboard
- Regenerate API key
- Update .env.local

### "503 Service Unavailable from Backend"
- Backend server may be sleeping (free tier)
- Wait 30 seconds and retry
- Or upgrade to paid tier

## Performance Optimization

1. **Cache Ledgers:** React caches fetched ledgers locally
2. **Batch Processing:** Send invoices in batches of 10-25
3. **Lazy Loading:** Load large lists on demand
4. **Debouncing:** Debounce rapid API calls
5. **Local Storage:** Cache recently used data

## Deployment Checklist

- [ ] Set `VITE_BACKEND_API_KEY` in production .env
- [ ] Set `VITE_TALLY_API_URL` to correct Tally instance
- [ ] Ensure Local Tally Prime is running
- [ ] Test AI processing with backend
- [ ] Test voucher creation in Tally
- [ ] Verify error handling
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy

---

**Architecture:** React Agent Model  
**Last Updated:** December 18, 2025  
**Version:** 1.0.0
