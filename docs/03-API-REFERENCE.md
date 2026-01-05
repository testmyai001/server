# AutoTallyAI - API Reference

## FastAPI Backend Documentation

**Base URL (Development):** `http://localhost:8000`  
**Base URL (Production):** `https://your-backend-domain.com`  
**Authentication:** Bearer token in `Authorization` header

---

## Table of Contents
1. [Authentication](#authentication)
2. [Health Check Endpoints](#health-check-endpoints)
3. [Invoice Management](#invoice-management)
4. [Tally Integration](#tally-integration)
5. [ChatBot & AI](#chatbot--ai)
6. [Bank Transactions](#bank-transactions)
7. [Error Codes & Responses](#error-codes--responses)

---

## Authentication

### API Key Validation

**Endpoint:** `GET /auth/validate`

Validates the provided API key before processing requests.

**Request:**
```http
GET /auth/validate HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
```

**Response (Success - 200):**
```json
{
  "status": "valid",
  "message": "API key is valid"
}
```

**Response (Failure - 401):**
```json
{
  "detail": "Invalid or missing API key"
}
```

### Authentication Scheme

All endpoints (except `/` and `/health`) require Bearer token authentication:

```typescript
// Example Frontend Request
const response = await fetch('http://localhost:8000/invoices', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Health Check Endpoints

### Basic Health Check

**Endpoint:** `GET /`

Simple health check to verify backend is running.

**Response (200):**
```json
{
  "message": "AutoTallyAI Backend is running!"
}
```

### Render Health Check

**Endpoint:** `GET /health`

Health check endpoint for Render.com deployment monitoring.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-03T10:30:00Z"
}
```

---

## Invoice Management

### Upload Invoice(s)

**Endpoint:** `POST /upload-invoice`

Upload one or more invoice PDF/image files for AI processing.

**Request:**
```http
POST /upload-invoice HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

file: <binary_pdf_or_image_file>
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | PDF or image file (JPEG, PNG, etc.) |
| `duplicate_check` | boolean | No | Check for duplicates before processing (default: true) |

**Response (Success - 200):**
```json
{
  "status": "success",
  "invoice": {
    "id": "uuid-string",
    "supplier": "ABC Corporation",
    "invoice_number": "INV-2025-001",
    "invoice_date": "2026-01-01",
    "gstin": "27AABCT1234F1Z0",
    "items": [
      {
        "description": "Software License",
        "quantity": 1,
        "rate": 10000.00,
        "hsn_code": "6203",
        "tax_rate": 5,
        "tax_amount": 500.00,
        "amount": 10500.00
      }
    ],
    "subtotal": 10000.00,
    "total_tax": 500.00,
    "total_amount": 10500.00,
    "status": "processed",
    "created_at": "2026-01-03T10:30:00Z"
  }
}
```

**Response (Duplicate Found - 200):**
```json
{
  "status": "duplicate",
  "message": "This invoice appears to be a duplicate",
  "existing_invoice_id": "existing-uuid",
  "duplicate_check": {
    "file_hash": "abc123def456",
    "previous_upload_date": "2026-01-02"
  }
}
```

**Response (Error - 400):**
```json
{
  "detail": "Invalid file format. Supported: PDF, JPEG, PNG"
}
```

**Response (Error - 413):**
```json
{
  "detail": "File size exceeds 50MB limit"
}
```

### Get All Invoices

**Endpoint:** `GET /invoices`

Retrieve all processed invoices with optional filtering and pagination.

**Request:**
```http
GET /invoices?skip=0&limit=20&status=processed&order_by=date_desc HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | integer | 0 | Number of records to skip (pagination) |
| `limit` | integer | 20 | Number of records to return (max: 100) |
| `status` | string | - | Filter by status: `draft`, `processed`, `pushed_to_tally`, `reconciled` |
| `start_date` | string | - | Filter by date (ISO 8601: YYYY-MM-DD) |
| `end_date` | string | - | Filter by date (ISO 8601: YYYY-MM-DD) |
| `supplier` | string | - | Filter by supplier name (partial match) |
| `order_by` | string | `date_desc` | Sort by: `date_asc`, `date_desc`, `amount_asc`, `amount_desc` |

**Response (Success - 200):**
```json
{
  "total": 150,
  "skip": 0,
  "limit": 20,
  "invoices": [
    {
      "id": "uuid-1",
      "supplier": "ABC Corp",
      "invoice_number": "INV-001",
      "invoice_date": "2026-01-01",
      "total_amount": 10500.00,
      "status": "processed",
      "created_at": "2026-01-03T10:30:00Z"
    },
    {
      "id": "uuid-2",
      "supplier": "XYZ Ltd",
      "invoice_number": "INV-002",
      "invoice_date": "2026-01-02",
      "total_amount": 25000.00,
      "status": "pushed_to_tally",
      "created_at": "2026-01-03T11:00:00Z"
    }
  ]
}
```

### Get Invoice Details

**Endpoint:** `GET /invoice/{invoice_id}`

Retrieve complete details of a specific invoice including line items.

**Request:**
```http
GET /invoice/uuid-123 HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
```

**Response (Success - 200):**
```json
{
  "id": "uuid-123",
  "supplier": "ABC Corporation",
  "supplier_gstin": "27AABCT1234F1Z0",
  "invoice_number": "INV-2025-001",
  "invoice_date": "2026-01-01",
  "items": [
    {
      "item_id": "uuid-item-1",
      "description": "Product A",
      "quantity": 5,
      "unit": "pcs",
      "rate": 1000.00,
      "hsn_code": "8523",
      "igst_rate": 5,
      "igst_amount": 250.00,
      "cgst_rate": 2.5,
      "cgst_amount": 125.00,
      "sgst_rate": 2.5,
      "sgst_amount": 125.00,
      "total_tax": 500.00,
      "amount": 5500.00
    }
  ],
  "subtotal": 5000.00,
  "total_tax": 500.00,
  "total_amount": 5500.00,
  "payment_terms": "Net 30",
  "status": "processed",
  "tally_status": "pending",
  "created_at": "2026-01-03T10:30:00Z",
  "updated_at": "2026-01-03T10:30:00Z"
}
```

**Response (Error - 404):**
```json
{
  "detail": "Invoice not found"
}
```

### Update Invoice

**Endpoint:** `PUT /invoice/{invoice_id}`

Update invoice details after initial processing.

**Request:**
```http
PUT /invoice/uuid-123 HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "supplier": "ABC Corporation Updated",
  "invoice_date": "2026-01-05",
  "payment_terms": "Net 45",
  "items": [
    {
      "description": "Product A",
      "quantity": 5,
      "rate": 1200.00,
      "hsn_code": "8523",
      "tax_rate": 5
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "status": "updated",
  "invoice": {
    "id": "uuid-123",
    "supplier": "ABC Corporation Updated",
    "total_amount": 6600.00
  }
}
```

### Delete Invoice

**Endpoint:** `DELETE /invoice/{invoice_id}`

Remove an invoice from the system.

**Request:**
```http
DELETE /invoice/uuid-123 HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
```

**Response (Success - 200):**
```json
{
  "status": "deleted",
  "message": "Invoice successfully deleted"
}
```

---

## Tally Integration

### Push Invoice to Tally

**Endpoint:** `POST /push-to-tally`

Generate Tally XML and push invoice to local Tally Prime instance.

**Request:**
```http
POST /push-to-tally HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "invoice_id": "uuid-123",
  "voucher_type": "Purchase",
  "ledger_config": {
    "expense_ledger": "Purchases",
    "tax_ledger": "Input Tax",
    "supplier_ledger": "ABC Corporation"
  }
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `invoice_id` | string | Yes | UUID of invoice to push |
| `voucher_type` | string | Yes | `Purchase` or `Sales` |
| `ledger_config` | object | No | Custom ledger names (uses defaults if not provided) |

**Response (Success - 200):**
```json
{
  "status": "success",
  "message": "Invoice successfully pushed to Tally",
  "tally_response": {
    "voucher_number": "PUR-001",
    "created_date": "2026-01-03",
    "amount": 10500.00
  },
  "log_id": "log-uuid-123"
}
```

**Response (Tally Not Running - 400):**
```json
{
  "detail": "Cannot connect to Tally Prime on 127.0.0.1:9000. Ensure Tally is running."
}
```

**Response (XML Generation Error - 400):**
```json
{
  "detail": "Failed to generate Tally XML: Missing required fields (supplier_gstin)"
}
```

### Get Tally Status

**Endpoint:** `GET /tally-status`

Check if Tally Prime is running and accessible.

**Request:**
```http
GET /tally-status HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
```

**Response (Success - 200):**
```json
{
  "tally_running": true,
  "tally_port": 9000,
  "tally_host": "127.0.0.1",
  "last_check": "2026-01-03T10:35:00Z",
  "connection": "active"
}
```

**Response (Tally Not Running - 200):**
```json
{
  "tally_running": false,
  "tally_port": 9000,
  "tally_host": "127.0.0.1",
  "last_check": "2026-01-03T10:35:00Z",
  "connection": "inactive"
}
```

### Get Tally Logs

**Endpoint:** `GET /tally-logs`

Retrieve history of Tally push operations.

**Request:**
```http
GET /tally-logs?status=success&skip=0&limit=20 HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by: `success`, `failed`, `pending` |
| `skip` | integer | Pagination offset |
| `limit` | integer | Number of records to return |

**Response (200):**
```json
{
  "total": 45,
  "logs": [
    {
      "log_id": "log-uuid-1",
      "invoice_id": "inv-uuid-1",
      "status": "success",
      "voucher_number": "PUR-001",
      "error_message": null,
      "response": {
        "created_date": "2026-01-03",
        "amount": 10500.00
      },
      "created_at": "2026-01-03T10:30:00Z"
    },
    {
      "log_id": "log-uuid-2",
      "invoice_id": "inv-uuid-2",
      "status": "failed",
      "voucher_number": null,
      "error_message": "Tally connection timeout",
      "response": null,
      "created_at": "2026-01-03T09:45:00Z"
    }
  ]
}
```

---

## ChatBot & AI

### Send ChatBot Message

**Endpoint:** `POST /chat`

Send a message to the AI ChatBot for accounting assistance.

**Request:**
```http
POST /chat HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "message": "How do I reconcile supplier invoices in Tally?",
  "context": {
    "current_invoice_id": "uuid-123",
    "topic": "tally"
  }
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | User's question or query |
| `context` | object | No | Additional context (invoice ID, topic, etc.) |

**Response (Success - 200):**
```json
{
  "status": "success",
  "response": "To reconcile supplier invoices in Tally:\n\n1. Go to Gateway of Tally > Accounts Info > Ledgers\n2. Select the supplier ledger\n3. Check the bills payable list\n4. Match with bank statements\n5. Create payment vouchers for matched bills\n\nFor GST reconciliation, ensure IGST/CGST/SGST are correctly applied.",
  "model": "gemini-pro",
  "tokens_used": 150
}
```

**Response (Error - 500):**
```json
{
  "detail": "Failed to process chat message. Please try again."
}
```

---

## Bank Transactions

### Upload Bank Statement

**Endpoint:** `POST /upload-bank-statement`

Upload bank statement (Excel/CSV) for reconciliation.

**Request:**
```http
POST /upload-bank-statement HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

file: <binary_excel_or_csv_file>
statement_type: "Purchase"
```

**Response (Success - 200):**
```json
{
  "status": "success",
  "transactions": [
    {
      "transaction_id": "uuid-1",
      "date": "2026-01-01",
      "description": "Payment to ABC Corp",
      "amount": 10500.00,
      "voucher_type": "Payment",
      "status": "pending"
    }
  ],
  "total_transactions": 15,
  "total_amount": 250000.00
}
```

### Reconcile Bank Transaction

**Endpoint:** `POST /reconcile-transaction`

Match bank transaction with invoice and create Tally voucher.

**Request:**
```http
POST /reconcile-transaction HTTP/1.1
Host: localhost:8000
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "transaction_id": "uuid-1",
  "invoice_id": "uuid-123",
  "reconcile_amount": 10500.00,
  "voucher_type": "Payment"
}
```

**Response (Success - 200):**
```json
{
  "status": "reconciled",
  "reconciliation": {
    "transaction_id": "uuid-1",
    "invoice_id": "uuid-123",
    "matched_amount": 10500.00,
    "difference": 0,
    "tally_voucher_id": "PAY-001",
    "reconciled_at": "2026-01-03T10:40:00Z"
  }
}
```

---

## Error Codes & Responses

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|--------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, missing fields, validation error |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | API key valid but not authorized for this action |
| 404 | Not Found | Resource (invoice, log) not found |
| 413 | Payload Too Large | File size exceeds limit |
| 422 | Unprocessable Entity | Invalid data format |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Service temporarily down |

### Common Error Responses

**Invalid API Key (401):**
```json
{
  "detail": "Invalid or missing API key"
}
```

**Missing Required Field (400):**
```json
{
  "detail": "Missing required field: supplier_name"
}
```

**Tally Connection Error (400):**
```json
{
  "detail": "Cannot connect to Tally Prime. Ensure it's running on 127.0.0.1:9000"
}
```

**AI Processing Error (500):**
```json
{
  "detail": "Failed to process invoice with AI. Please try with a clearer image/PDF."
}
```

### Error Recovery

| Error | Recovery Action |
|-------|-----------------|
| 401 Unauthorized | Check API key in .env file |
| 404 Not Found | Verify resource ID exists |
| 413 File Too Large | Compress or split file |
| 500 Server Error | Check backend logs, retry after delay |
| Tally Connection Failed | Ensure Tally Prime is running on port 9000 |

---

## Rate Limiting

**Current:** No rate limiting implemented  
**Planned:** Rate limiting to be added in future versions (100 requests/minute per API key)

---

## Request/Response Examples

### Complete Workflow Example

```typescript
// 1. Authenticate
const validateResponse = await fetch('/auth/validate', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

// 2. Upload Invoice
const formData = new FormData();
formData.append('file', invoicePDF);
const uploadResponse = await fetch('/upload-invoice', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  body: formData
});
const invoice = await uploadResponse.json();

// 3. Update if needed
await fetch(`/invoice/${invoice.id}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ supplier: "Updated Name" })
});

// 4. Push to Tally
const tallyResponse = await fetch('/push-to-tally', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    invoice_id: invoice.id,
    voucher_type: 'Purchase'
  })
});

// 5. Check Tally Logs
const logsResponse = await fetch('/tally-logs?status=success', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});
```

---

**Last Updated:** January 3, 2026  
**Version:** 1.0 (API Version: 1.0)
