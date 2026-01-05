# AutoTallyAI - Components & Services Guide

## Table of Contents
1. [Frontend Components](#frontend-components)
2. [Service Layer](#service-layer)
3. [Component Patterns](#component-patterns)
4. [State Management](#state-management)
5. [Styling with Tailwind](#styling-with-tailwind)

---

## Frontend Components

### Component Overview

All components located in `src/components/`

#### Dashboard Component

**File:** `src/components/Dashboard.tsx`

**Purpose:** Main landing page showing statistics and quick actions

**Key Features:**
- Statistics cards (total invoices, processed, pending)
- Recent activity timeline
- Quick action buttons (upload, create invoice, etc.)
- Status overview charts

**Usage:**
```tsx
import Dashboard from './components/Dashboard';

<Dashboard />
```

**Props:** None (stateful component)

**State Managed:**
- Invoice statistics
- Recent uploads
- User preferences

---

#### InvoiceUpload Component

**File:** `src/components/InvoiceUpload.tsx`

**Purpose:** File upload interface for processing invoices

**Key Features:**
- Drag-and-drop file upload
- Multiple file selection
- Progress tracking
- Duplicate detection feedback
- Error handling for invalid files

**Usage:**
```tsx
import InvoiceUpload from './components/InvoiceUpload';

<InvoiceUpload 
  onUploadComplete={(invoices) => handleSuccess(invoices)}
  maxFileSize={50} // MB
/>
```

**Props:**
| Prop | Type | Required | Default |
|------|------|----------|---------|
| `onUploadComplete` | Function | No | undefined |
| `maxFileSize` | number | No | 50 |
| `allowedFormats` | string[] | No | ['pdf', 'jpg', 'png'] |

**File Upload Flow:**
```
User selects file
    ↓
Validate format & size
    ↓
Calculate file hash
    ↓
POST /upload-invoice
    ↓
Show progress (0-100%)
    ↓
If success: show extracted data
If error: show error message
    ↓
onUploadComplete callback fired
```

---

#### InvoiceEditor Component

**File:** `src/components/InvoiceEditor.tsx`

**Purpose:** Edit and view invoice details with calculations

**Key Features:**
- Invoice header information (supplier, date, etc.)
- Line items table with add/edit/delete
- Real-time calculation of subtotal, taxes, total
- Save changes
- Push to Tally button
- Status indicator

**Usage:**
```tsx
import InvoiceEditor from './components/InvoiceEditor';

<InvoiceEditor 
  invoiceId="uuid-123"
  onSave={(invoice) => console.log('Saved', invoice)}
/>
```

**Invoice Fields:**
```tsx
interface Invoice {
  id: string;
  supplier: string;
  invoice_number: string;
  invoice_date: string;
  gstin: string;
  items: InvoiceItem[];
  subtotal: number;
  total_tax: number;
  total_amount: number;
  status: 'draft' | 'processed' | 'pushed_to_tally';
}

interface InvoiceItem {
  item_id: string;
  description: string;
  quantity: number;
  rate: number;
  hsn_code: string;
  tax_rate: number;
  tax_amount: number;
  amount: number;
}
```

**Calculate Totals:**
```typescript
function calculateTotals(items: InvoiceItem[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const total_tax = items.reduce((sum, item) => sum + item.tax_amount, 0);
  const total_amount = subtotal + total_tax;
  
  return { subtotal, total_tax, total_amount };
}
```

---

#### BankStatementManager Component

**File:** `src/components/BankStatementManager.tsx`

**Purpose:** Import and reconcile bank statements

**Key Features:**
- Upload bank statement (Excel/CSV)
- Transaction list view
- Match transactions to invoices
- Generate payment vouchers
- Reconciliation summary

**Data Flow:**
```
Upload Bank Statement
    ↓
Parse transactions
    ↓
Display transaction list
    ↓
User selects transaction
    ↓
Show matching invoices
    ↓
User confirms match
    ↓
POST /reconcile-transaction
    ↓
Generate Tally payment voucher
    ↓
Update reconciliation status
```

---

#### ExcelImportManager Component

**File:** `src/components/ExcelImportManager.tsx`

**Purpose:** Bulk import invoices from Excel file

**Key Features:**
- Excel file upload
- Column mapping interface
- Data preview
- Bulk create invoices
- Progress tracking for batch operations

**Supported Columns:**
- Supplier Name
- Invoice Number
- Invoice Date
- Amount
- GST Amount
- Item Description
- HSN Code

---

#### ChatBot Component

**File:** `src/components/ChatBot.tsx`

**Purpose:** AI-powered accounting assistant

**Key Features:**
- Chat message interface
- Message history
- Context-aware responses (Tally, GST, accounting)
- Stream responses for long answers
- Export conversation history

**Usage:**
```tsx
<ChatBot 
  initialContext="tally"
  currentInvoiceId="uuid-123"
/>
```

**Message Flow:**
```
User types message
    ↓
User clicks Send
    ↓
POST /chat with message & context
    ↓
Gemini API processes request
    ↓
Stream response back to frontend
    ↓
Display response in chat
    ↓
Add to message history
```

**Example Queries:**
- "How do I create a purchase order in Tally?"
- "What is the current GST rate for software services?"
- "How do I reconcile bank statements?"

---

#### TallyLogs Component

**File:** `src/components/TallyLogs.tsx`

**Purpose:** View Tally synchronization history

**Key Features:**
- Log table showing sync attempts
- Filter by status (success/failed/pending)
- Timestamp of each operation
- Error details for failed syncs
- Retry button for failed operations
- Real-time updates

**Log Entry Structure:**
```tsx
interface TallyLog {
  log_id: string;
  invoice_id: string;
  status: 'success' | 'failed' | 'pending';
  voucher_number?: string;
  error_message?: string;
  created_at: string;
}
```

---

#### SettingsModal Component

**File:** `src/components/SettingsModal.tsx`

**Purpose:** Application configuration and preferences

**Settings Categories:**

1. **API Configuration**
   - Backend API Base URL
   - API Key
   - Test Connection button

2. **Tally Integration**
   - Tally Host (default: 127.0.0.1)
   - Tally Port (default: 9000)
   - Test Connection button

3. **Appearance**
   - Theme (Light/Dark)
   - Language (English/Hindi)
   - Font size

4. **Advanced**
   - Debug mode
   - Log level
   - Cache management
   - Database location (Electron only)

---

#### AuthScreen Component

**File:** `src/components/AuthScreen.tsx`

**Purpose:** User authentication gate

**Features:**
- API key input
- Validation
- Error messages
- Remember me option
- "Test Backend" link

**Auth Flow:**
```
User enters API key
    ↓
GET /auth/validate with key
    ↓
If valid: store in memory, allow access
If invalid: show error, ask again
    ↓
User can "Test Backend" before login
```

---

#### Navbar & Sidebar Components

**Files:** 
- `src/components/Navbar.tsx`
- `src/components/Sidebar.tsx`

**Navbar Features:**
- Application logo and title
- User profile menu
- Notifications badge
- Quick settings access
- Logout button

**Sidebar Navigation:**
- Dashboard link
- Invoice Management
- Bank Statements
- Tally Logs
- Settings
- Help/Support
- Logout

**Responsive Design:**
- Collapsible on mobile
- Mobile hamburger menu

---

### Component Dependencies

```
App (Main Container)
├── AuthScreen (Authentication Gate)
├── Navbar (Top Navigation)
├── Sidebar (Left Navigation)
└── MainContent Router
    ├── Dashboard
    ├── InvoiceUpload
    │   └── uses backendService.uploadInvoice()
    ├── InvoiceEditor
    │   ├── uses backendService.getInvoice()
    │   ├── uses backendService.updateInvoice()
    │   └── uses tallyService.pushToTally()
    ├── BankStatementManager
    │   ├── uses backendService.uploadBankStatement()
    │   └── uses backendService.reconcileTransaction()
    ├── ExcelImportManager
    │   └── uses backendService.bulkCreateInvoices()
    ├── ChatBot
    │   └── uses backendService.chatBot()
    ├── TallyLogs
    │   └── uses backendService.getTallyLogs()
    └── SettingsModal
        ├── uses authService.validateSettings()
        └── uses tallyService.testConnection()
```

---

## Service Layer

### backendService.ts

Handles all HTTP communication with FastAPI backend.

**Key Functions:**

#### uploadInvoice()

```typescript
async function uploadInvoice(
  file: File,
  options?: {
    duplicate_check?: boolean;
  }
): Promise<InvoiceResponse>
```

**Usage:**
```typescript
const invoice = await backendService.uploadInvoice(pdfFile);
console.log(invoice.supplier, invoice.total_amount);
```

**Error Handling:**
```typescript
try {
  const invoice = await backendService.uploadInvoice(file);
} catch (error) {
  if (error.status === 413) {
    console.log('File too large (>50MB)');
  } else if (error.status === 400) {
    console.log('Invalid file format');
  }
}
```

---

#### getInvoice()

```typescript
async function getInvoice(invoiceId: string): Promise<Invoice>
```

Fetch complete invoice details with all line items.

---

#### updateInvoice()

```typescript
async function updateInvoice(
  invoiceId: string,
  data: Partial<Invoice>
): Promise<Invoice>
```

Update invoice fields. Recalculates totals automatically.

---

#### deleteInvoice()

```typescript
async function deleteInvoice(invoiceId: string): Promise<void>
```

---

#### getInvoices()

```typescript
async function getInvoices(options?: {
  skip?: number;
  limit?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
}): Promise<PaginatedResponse<Invoice>>
```

Retrieve invoices with filtering and pagination.

---

#### chatBot()

```typescript
async function chatBot(
  message: string,
  context?: {
    current_invoice_id?: string;
    topic?: string;
  }
): Promise<ChatResponse>
```

Send message to AI assistant and get response.

---

#### getTallyLogs()

```typescript
async function getTallyLogs(options?: {
  status?: 'success' | 'failed' | 'pending';
  skip?: number;
  limit?: number;
}): Promise<PaginatedResponse<TallyLog>>
```

---

### tallyService.ts

Handles Tally Prime integration.

**Key Functions:**

#### detectTallyInstance()

```typescript
async function detectTallyInstance(): Promise<boolean>
```

Check if Tally Prime is running and accessible on configured port.

**Usage:**
```typescript
const isTallyRunning = await tallyService.detectTallyInstance();
if (!isTallyRunning) {
  showWarning('Tally Prime is not running');
}
```

---

#### generateXML()

```typescript
async function generateXML(
  invoice: Invoice,
  options: {
    voucher_type: 'Purchase' | 'Sales';
    expense_ledger?: string;
    tax_ledger?: string;
  }
): Promise<string>
```

Generate Tally-formatted XML from invoice data.

---

#### pushToTally()

```typescript
async function pushToTally(
  invoice: Invoice,
  voucher_type: 'Purchase' | 'Sales'
): Promise<TallyPushResponse>
```

Push invoice to Tally as a voucher.

**Complete Example:**
```typescript
try {
  const response = await tallyService.pushToTally(invoice, 'Purchase');
  console.log(`Voucher created: ${response.voucher_number}`);
  toast.success('Invoice synced to Tally');
} catch (error) {
  if (error.message.includes('Tally')) {
    toast.error('Cannot connect to Tally. Is it running?');
  } else {
    toast.error('Failed to sync with Tally');
  }
}
```

---

#### validateTallyConnection()

```typescript
async function validateTallyConnection(
  host: string,
  port: number
): Promise<boolean>
```

Test Tally connection with custom host/port (for settings).

---

### dbService.ts

Local database operations (Electron with IndexedDB or SQLite).

**Key Functions:**

#### initializeDB()

```typescript
async function initializeDB(): Promise<void>
```

Initialize local database (called on app start).

---

#### getLocalInvoices()

```typescript
async function getLocalInvoices(): Promise<Invoice[]>
```

Get invoices from local storage (offline support).

---

#### saveLocalInvoice()

```typescript
async function saveLocalInvoice(invoice: Invoice): Promise<void>
```

Cache invoice locally for offline access.

---

#### syncWithServer()

```typescript
async function syncWithServer(): Promise<SyncResult>
```

Sync local cache with backend server.

---

### authService.ts

Authentication and API key management.

**Key Functions:**

#### validateApiKey()

```typescript
async function validateApiKey(key: string): Promise<boolean>
```

Validate API key against backend.

---

#### setApiKey()

```typescript
function setApiKey(key: string): void
```

Store API key in memory (never in localStorage).

---

#### getApiKey()

```typescript
function getApiKey(): string
```

Retrieve stored API key.

---

#### clearAuth()

```typescript
function clearAuth(): void
```

Clear authentication (logout).

---

## Component Patterns

### Pattern 1: Controlled Form Component

```tsx
import React, { useState } from 'react';

interface FormData {
  supplier: string;
  amount: number;
}

interface FormProps {
  initialData?: FormData;
  onSubmit: (data: FormData) => Promise<void>;
}

export const MyForm: React.FC<FormProps> = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState<FormData>(
    initialData || { supplier: '', amount: 0 }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="supplier"
        value={formData.supplier}
        onChange={handleChange}
        placeholder="Supplier Name"
        className="w-full px-3 py-2 border rounded"
      />
      <input
        type="number"
        name="amount"
        value={formData.amount}
        onChange={handleChange}
        placeholder="Amount"
        className="w-full px-3 py-2 border rounded"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

---

### Pattern 2: Async Data Loading

```tsx
import React, { useEffect, useState } from 'react';

interface DataListProps {
  serviceCall: () => Promise<Item[]>;
}

export const DataList: React.FC<DataListProps> = ({ serviceCall }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await serviceCall();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serviceCall]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};
```

---

## State Management

### Using React Context (Recommended for simple state)

```typescript
import React, { createContext, useState, useContext } from 'react';

interface AppContextType {
  currentUser: string | null;
  setCurrentUser: (user: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, isDarkMode, toggleDarkMode }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
```

**Usage in Component:**
```tsx
const MyComponent = () => {
  const { currentUser, isDarkMode, toggleDarkMode } = useAppContext();
  
  return (
    <div className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
      <p>User: {currentUser}</p>
      <button onClick={toggleDarkMode}>Toggle Theme</button>
    </div>
  );
};
```

---

## Styling with Tailwind

### Common Utility Patterns

**Button Styling:**
```tsx
// Primary Button
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Submit
</button>

// Secondary Button
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
  Cancel
</button>

// Danger Button
<button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
  Delete
</button>
```

**Card Component:**
```tsx
<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
  <h2 className="text-lg font-bold mb-4">Card Title</h2>
  <p className="text-gray-600">Card content goes here</p>
</div>
```

**Form Input:**
```tsx
<input
  type="text"
  placeholder="Enter value"
  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
```

**Grid Layout:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <div key={item.id} className="bg-white p-4 rounded shadow">
      {item.content}
    </div>
  ))}
</div>
```

---

**Last Updated:** January 3, 2026
