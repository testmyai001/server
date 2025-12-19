# Backend & Tally Integration Setup

This guide sets up AutoTally AI to work with the backend API and local Tally Prime on port 9000.

## Architecture Overview

```
React App (http://localhost:3001)
    ↓
Backend Service (https://autotally-backend.onrender.com)
    ↓
Local Tally Prime (http://127.0.0.1:9000)
```

## Quick Start (5 minutes)

### 1. Get Backend API Key

1. Go to https://autotally-backend.onrender.com/dashboard
2. Sign up or login
3. Create an API key
4. Copy the API key

### 2. Configure Environment

Edit `.env.local`:

```env
VITE_GEMINI_API_KEY=your_gemini_key_from_aistudio.google.com
VITE_BACKEND_API_URL=https://autotally-backend.onrender.com
VITE_BACKEND_API_KEY=your_api_key_from_backend
VITE_TALLY_API_URL=http://127.0.0.1:9000
```

### 3. Start Tally Prime

- Open Tally Prime on your computer (runs on port 9000 by default)
- Keep it open

### 4. Start Dev Server

```bash
npm run dev
```

### 5. Test Connection

- Open app at http://localhost:3001
- Go to Settings → Test Tally Connection
- Should show: ✅ "Tally Prime Connected"

## Backend API Endpoints

All endpoints require `Authorization: Bearer YOUR_API_KEY` header.

### Authentication
```
POST /auth/login
- username: string
- password: string
Response: { token, user }
```

### Tally Operations
```
POST /tally/push-invoice
- invoice: InvoiceData
Response: { success, message }

GET /tally/ledgers?company=CompanyName
Response: { ledgers: string[] }

GET /tally/status
Response: { online, company, ledgerCount, lastSync }

POST /tally/bulk-push
- invoices: InvoiceData[]
Response: { successful, failed, message }
```

### Invoice Management
```
POST /invoices/save
- invoice: InvoiceData
Response: { id, success }

GET /invoices/list?limit=50
Response: { invoices: InvoiceData[] }

DELETE /invoices/:id
Response: { success, message }
```

### Sync Operations
```
POST /sync/data
- invoices: InvoiceData[]
Response: { synced, failed, message }
```

## How It Works

### 1. React Component → Backend → Tally Flow

```
User uploads Invoice in React
    ↓
React calls backendService.pushInvoiceToBackend()
    ↓
Request sent to Backend API with auth key
    ↓
Backend validates and converts to Tally XML
    ↓
Backend connects to Local Tally Prime (port 9000)
    ↓
Tally Prime creates voucher entry
    ↓
Response returned to React
    ↓
UI shows success/error message
```

### 2. Real-time Synchronization

```
React periodically syncs with Backend
    ↓
Backend checks Tally for new entries
    ↓
Updates local cache
    ↓
React fetches and displays in Dashboard
```

## Integration Points

### In React Components:

**Import the backend service:**
```typescript
import { 
  pushInvoiceToBackend, 
  getTallyStatusFromBackend,
  fetchLedgersFromBackend 
} from '../services/backendService';
```

**Push an invoice to Tally:**
```typescript
const result = await pushInvoiceToBackend(invoice, apiKey);
if (result.success) {
  console.log('Pushed to Tally:', result.message);
} else {
  console.error('Error:', result.message);
}
```

**Check Tally connection:**
```typescript
const status = await getTallyStatusFromBackend(apiKey);
if (status.online) {
  console.log('Tally is connected!');
}
```

**Fetch ledgers from Tally:**
```typescript
const ledgers = await fetchLedgersFromBackend(apiKey, 'CompanyName');
console.log('Available ledgers:', ledgers);
```

**Bulk push invoices:**
```typescript
const result = await pushBulkInvoicesToBackend(invoices, apiKey);
console.log(`Success: ${result.successful}, Failed: ${result.failed}`);
```

## Error Handling

### CORS Errors
- Backend handles CORS automatically
- No browser CORS issues

### Connection Timeout
- Backend has 30-second timeout for Tally
- Will retry if connection fails

### Authentication Failures
- Check API key in `.env.local`
- Validate key at /auth/validate endpoint
- Generate new key from dashboard if needed

### Tally Not Running
- Backend will return: `{ online: false, message: "Tally not responding" }`
- Start Tally Prime and retry

## Running Locally Without Backend (Direct Tally)

If backend is unavailable, you can connect directly to Tally:

1. Update `VITE_TALLY_API_URL` to direct connection
2. Use `tallyService.ts` functions directly
3. Note: CORS issues may occur in browser

**Recommended:** Always use backend for production.

## Data Flow Examples

### Example 1: Single Invoice Upload

```
1. User clicks "Push to Tally" in InvoiceEditor
2. Frontend calls: pushInvoiceToBackend(invoice, apiKey)
3. Backend receives invoice in JSON format
4. Backend converts to Tally XML format
5. Backend sends XML to Local Tally (port 9000)
6. Tally Prime creates Purchase/Sales voucher
7. Backend returns: { success: true, message: "Created" }
8. Frontend shows: "✓ Invoice pushed successfully"
9. Dashboard updates with new entry
```

### Example 2: Bulk Excel Import

```
1. User uploads Excel file with 100 invoices
2. Frontend parses Excel to InvoiceData array
3. Frontend calls: pushBulkInvoicesToBackend(invoices, apiKey)
4. Backend processes in batches (10 at a time)
5. Each batch sent to Tally Prime
6. Backend tracks success/failures
7. Returns: { successful: 95, failed: 5, message: "..." }
8. Frontend displays progress and error details
9. Failed invoices can be retried individually
```

### Example 3: Auto-Sync

```
1. App starts, loads stored API key
2. Every 5 minutes, calls: syncWithBackend(invoices)
3. Backend checks what's new in Tally
4. Fetches any new vouchers created externally
5. Backend updates local cache
6. Frontend refreshes dashboard
7. User sees latest Tally entries
```

## Security Best Practices

✅ **Do:**
- Store API key in `.env.local` (git-ignored)
- Use HTTPS (backend uses HTTPS)
- Validate input before sending
- Implement rate limiting on frontend
- Use Bearer token authentication

❌ **Don't:**
- Hardcode API keys in source code
- Expose API keys in frontend console
- Use HTTP instead of HTTPS
- Share API keys publicly
- Commit .env.local to git

## Troubleshooting

### "Backend API unreachable"
- Check internet connection
- Verify backend URL in constants.ts
- Check backend status at https://autotally-backend.onrender.com/health

### "Invalid API Key"
- Go to backend dashboard
- Regenerate API key
- Update .env.local

### "Tally connection timeout"
- Ensure Tally Prime is running
- Check port 9000 is not blocked
- Restart Tally Prime

### "CORS errors in browser"
- Not expected with backend
- If occurring, check CORS settings in backend
- Clear browser cache and retry

### "Invoice not appearing in Tally"
- Check backend logs at https://autotally-backend.onrender.com/logs
- Verify invoice data is valid
- Check Tally company is open
- Try manual push from Settings

## Advanced Configuration

### Custom Backend URL
```env
VITE_BACKEND_API_URL=https://your-custom-backend.com
```

### Batch Processing
```env
VITE_BATCH_SIZE=25  # Invoices per batch
VITE_RETRY_ATTEMPTS=3  # Retry failed attempts
```

### Performance Optimization
```env
VITE_CACHE_LEDGERS=true  # Cache ledger list
VITE_AUTO_SYNC_INTERVAL=300000  # Sync every 5 min (ms)
```

## Support

- Backend Issues: https://autotally-backend.onrender.com/support
- API Documentation: https://autotally-backend.onrender.com/docs
- Contact: support@autotally.ai

---

**Last Updated:** December 18, 2025  
**AutoTally AI v1.0.0 with Backend Integration**
