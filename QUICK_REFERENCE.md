# Quick Reference: React↔Backend↔Tally Architecture

## One-Minute Overview

```
React (Agent)
  ├→ Backend (AI, Keys, Storage) - https://autotally-backend.onrender.com
  └→ Local Tally (Ledgers, Vouchers) - http://127.0.0.1:9000
```

**Key Point:** React manages both connections. Backend has NO Tally access.

---

## Common Tasks

### Task 1: Process Invoice Image
```typescript
import { processDocumentWithAI } from '../services/backendService';

const invoice = await processDocumentWithAI(file, apiKey);
// Returns: { supplierName, lineItems, gstRate, etc. }
```

### Task 2: Push to Tally
```typescript
import { generateTallyXml, pushToTally } from '../services/tallyService';

const xml = generateTallyXml(invoice);
const result = await pushToTally(xml);
// Returns: { success: true, message: "Imported" }
```

### Task 3: Get Tally Ledgers
```typescript
import { fetchExistingLedgers } from '../services/tallyService';

const ledgers = await fetchExistingLedgers();
// Returns: Set<string> of ledger names
```

### Task 4: Save Invoice History
```typescript
import { saveInvoiceToBackend } from '../services/backendService';

await saveInvoiceToBackend(invoice, apiKey);
// Saves to backend for future reference
```

---

## Service Files

| File | Purpose | Connects To |
|------|---------|-------------|
| `backendService.ts` | AI, Auth, Storage | Backend API only |
| `tallyService.ts` | Tally XML, Ledgers | Local Tally only |
| `geminiService.ts` | AI Alternative | Google Gemini API |
| `dbService.ts` | Local Storage | Browser IndexedDB |

---

## Endpoints

### Backend Only (via React)
```
POST /ai/process-document
POST /ai/process-bulk
POST /invoices/save
GET  /invoices/list
POST /auth/validate
```

### Tally Only (Direct from React)
```
POST / (any XML envelope)
```

---

## When to Use Each Service

| Need | Use | Notes |
|------|-----|-------|
| Analyze invoice image | `backendService` | AI powered |
| Create Tally voucher | `tallyService` | Direct to Tally |
| Get ledger list | `tallyService` | Direct to Tally |
| Save to history | `backendService` | For records |
| Local storage | `dbService` | Browser cache |

---

## Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Backend unavailable" | No internet / Server down | Check connection / Wait |
| "Tally not responding" | Tally not running / Port blocked | Start Tally / Check firewall |
| "Invalid API key" | Wrong/expired key | Regenerate from backend |
| "CORS error" | Wrong endpoint | Check constants.ts |

---

## Environment Setup

```env
# Backend (AI & Storage)
VITE_BACKEND_API_URL=https://autotally-backend.onrender.com
VITE_BACKEND_API_KEY=your_key_here

# Tally (Local - React Direct)
VITE_TALLY_API_URL=http://127.0.0.1:9000

# Optional: Gemini
VITE_GEMINI_API_KEY=your_key_here
```

---

## Full Workflow Example

```typescript
// 1. Upload invoice image
const file = userSelectedFile;

// 2. Process with AI (Backend)
const result = await processDocumentWithAI(file, apiKey);
if (!result.success) throw new Error(result.message);

// 3. Use processed data
const invoice = result.invoice;

// 4. Generate Tally XML
const xml = generateTallyXml(invoice);

// 5. Push to Local Tally
const tallyResult = await pushToTally(xml);
if (!tallyResult.success) throw new Error(tallyResult.message);

// 6. Save to Backend for history
await saveInvoiceToBackend(invoice, apiKey);

// 7. Update UI
showSuccess("✓ Pushed to Tally");
```

---

## Important Notes

🔴 **Backend:**
- Has NO access to Tally Prime
- Does NOT run on port 9000
- Handles AI processing only
- Stores API keys securely

🔴 **React:**
- Acts as middleware/agent
- Connects to both services
- Converts data between formats
- Manages errors from both

🔴 **Tally:**
- Local only
- Port 9000 always
- React accesses directly
- No backend involvement

---

## Testing Checklist

- [ ] Backend responds to `/auth/validate`
- [ ] React can process document with AI
- [ ] Tally Prime is running on port 9000
- [ ] React can fetch Tally ledgers
- [ ] React can push new voucher to Tally
- [ ] Invoice appears in Tally
- [ ] Invoice saved to backend history
- [ ] All error cases handled

---

## Support URLs

- Backend Docs: https://autotally-backend.onrender.com/docs
- Backend Health: https://autotally-backend.onrender.com/health
- Tally Help: Local installation guide
- React App: http://localhost:3000 (dev)

---

**Last Updated:** December 18, 2025
