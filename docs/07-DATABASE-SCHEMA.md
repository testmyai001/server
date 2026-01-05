# AutoTallyAI - Database Schema & ORM Documentation

## Table of Contents
1. [Database Overview](#database-overview)
2. [Data Models](#data-models)
3. [Relationships](#relationships)
4. [Migrations](#migrations)
5. [Queries & Operations](#queries--operations)
6. [Indexing Strategy](#indexing-strategy)
7. [Backup & Recovery](#backup--recovery)

---

## Database Overview

### Database Technology Stack

**Development:** SQLite
- File-based, no server required
- Perfect for local development and testing
- Single user, limited concurrency

**Production:** PostgreSQL
- Server-based, scalable
- Multi-user support
- Better performance with large datasets
- Deployed on Render.com

### Database Configuration

**Location:** `backend/database.py`

**Connection Strings:**

```python
# Development (SQLite)
DATABASE_URL = "sqlite:///./tallyai.db"

# Production (PostgreSQL)
DATABASE_URL = "postgresql://user:password@host:5432/tallyai"
```

### SQLAlchemy ORM Setup

```python
# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tallyai.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for FastAPI to provide database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Data Models

### 1. UploadedFile Model

**Purpose:** Track uploaded files for duplicate detection

**Table:** `uploaded_files`

```python
class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    
    # Primary Key
    id = Column(String, primary_key=True, index=True)
    
    # File Metadata
    filename = Column(String, not_null=True)
    original_filename = Column(String, not_null=True)
    file_hash = Column(String, unique=True, not_null=True, index=True)
    file_size = Column(Integer)  # bytes
    mime_type = Column(String)  # application/pdf, image/jpeg
    
    # Storage
    storage_path = Column(String)  # local file path
    
    # Processing Status
    status = Column(String, default="pending")  # pending, processed, error
    processing_error = Column(String, nullable=True)
    
    # Timestamps
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=True)
    invoice = relationship("Invoice", back_populates="uploaded_file")
```

**Example Usage:**

```python
# Create and save uploaded file
from models import UploadedFile
from database import SessionLocal
import hashlib

db = SessionLocal()

# Calculate file hash
file_content = open("invoice.pdf", "rb").read()
file_hash = hashlib.sha256(file_content).hexdigest()

# Check for duplicates
existing = db.query(UploadedFile).filter(
    UploadedFile.file_hash == file_hash
).first()

if existing:
    print(f"Duplicate! Previous upload: {existing.uploaded_at}")
else:
    # Save new file
    uploaded_file = UploadedFile(
        id="uuid-1",
        filename="invoice_2026_01.pdf",
        original_filename="Invoice - 2026-01.pdf",
        file_hash=file_hash,
        file_size=len(file_content),
        mime_type="application/pdf",
        storage_path="/data/uploads/invoice_2026_01.pdf"
    )
    db.add(uploaded_file)
    db.commit()
    print("File saved successfully")

db.close()
```

---

### 2. Invoice Model

**Purpose:** Store extracted invoice information

**Table:** `invoices`

```python
class Invoice(Base):
    __tablename__ = "invoices"
    
    # Primary Key
    id = Column(String, primary_key=True, index=True)
    
    # Supplier Information
    supplier = Column(String, not_null=True, index=True)
    supplier_gstin = Column(String)  # Goods & Services Tax ID
    supplier_address = Column(String, nullable=True)
    supplier_contact = Column(String, nullable=True)
    
    # Invoice Details
    invoice_number = Column(String, index=True)
    invoice_date = Column(Date, index=True)
    po_number = Column(String, nullable=True)  # Purchase Order
    
    # Financial Information
    subtotal = Column(Float, default=0)
    total_tax = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    
    # GST Information (India Specific)
    igst_total = Column(Float, default=0)
    cgst_total = Column(Float, default=0)
    sgst_total = Column(Float, default=0)
    
    # Additional Details
    payment_terms = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
    # Processing Status
    status = Column(
        String,
        default="draft",
        index=True
    )  # draft, processed, verified, pushed_to_tally, reconciled
    
    # Tally Information
    tally_status = Column(String, default="pending")  # pending, synced, failed
    tally_voucher_number = Column(String, nullable=True)
    tally_sync_date = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String, nullable=True)
    
    # Relationships
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    uploaded_file = relationship("UploadedFile", back_populates="invoice", uselist=False)
    tally_logs = relationship("TallyLog", back_populates="invoice")
```

**Database Indexes:**
```python
# Efficient queries
__table_args__ = (
    Index('idx_invoice_status_date', 'status', 'invoice_date'),
    Index('idx_invoice_supplier', 'supplier'),
)
```

**Example Usage:**

```python
# Create invoice
invoice = Invoice(
    id="inv-uuid-1",
    supplier="ABC Corporation Ltd",
    supplier_gstin="27AABCT1234F1Z0",
    invoice_number="INV-2026-001",
    invoice_date=date(2026, 1, 1),
    subtotal=5000.00,
    total_tax=500.00,
    total_amount=5500.00,
    status="processed"
)
db.add(invoice)
db.commit()

# Query by status
processed_invoices = db.query(Invoice).filter(
    Invoice.status == "processed"
).all()

# Query with date range
from datetime import date, timedelta
recent = db.query(Invoice).filter(
    Invoice.invoice_date >= date.today() - timedelta(days=30)
).all()

# Get with related items
invoice_with_items = db.query(Invoice).filter(
    Invoice.id == "inv-uuid-1"
).first()
print(invoice_with_items.items)  # Access related items
```

---

### 3. InvoiceItem Model

**Purpose:** Store line items within an invoice

**Table:** `invoice_items`

```python
class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    # Primary Key
    item_id = Column(String, primary_key=True, index=True)
    
    # Foreign Key
    invoice_id = Column(String, ForeignKey("invoices.id"), not_null=True, index=True)
    
    # Item Description
    description = Column(String, not_null=True)
    quantity = Column(Float, not_null=True)
    unit = Column(String, default="pcs")  # pcs, kg, l, etc.
    rate = Column(Float, not_null=True)  # price per unit
    
    # HSN/SAC Code (India specific)
    hsn_code = Column(String, nullable=True)  # Harmonized System of Nomenclature
    sac_code = Column(String, nullable=True)  # Service Accounting Code
    
    # Tax Information
    tax_rate = Column(Float, default=0)  # Percentage (e.g., 5 for 5%)
    tax_type = Column(String, default="IGST")  # IGST, CGST+SGST
    
    # Calculated Fields
    subtotal = Column(Float)  # quantity * rate
    tax_amount = Column(Float)  # subtotal * (tax_rate / 100)
    amount = Column(Float)  # subtotal + tax_amount
    
    # GST Components (if CGST+SGST)
    cgst_rate = Column(Float, default=0)
    cgst_amount = Column(Float, default=0)
    sgst_rate = Column(Float, default=0)
    sgst_amount = Column(Float, default=0)
    igst_rate = Column(Float, default=0)
    igst_amount = Column(Float, default=0)
    
    # Line Item Order
    line_number = Column(Integer)  # For sorting
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="items")
```

**Example Usage:**

```python
# Create invoice items
item1 = InvoiceItem(
    item_id="item-1",
    invoice_id="inv-uuid-1",
    description="Software License",
    quantity=1,
    rate=10000.00,
    hsn_code="6203",
    tax_rate=5,
    line_number=1
)

item2 = InvoiceItem(
    item_id="item-2",
    invoice_id="inv-uuid-1",
    description="Support Services",
    quantity=3,
    unit="months",
    rate=5000.00,
    hsn_code="9105",
    cgst_rate=2.5,
    sgst_rate=2.5,
    line_number=2
)

db.add_all([item1, item2])
db.commit()

# Query items for an invoice
invoice = db.query(Invoice).filter(Invoice.id == "inv-uuid-1").first()
for item in invoice.items:
    print(f"{item.description}: {item.amount}")
```

---

### 4. BankTransaction Model

**Purpose:** Store bank statement transactions for reconciliation

**Table:** `bank_transactions`

```python
class BankTransaction(Base):
    __tablename__ = "bank_transactions"
    
    # Primary Key
    transaction_id = Column(String, primary_key=True, index=True)
    
    # Transaction Details
    date = Column(Date, index=True)
    description = Column(String)
    amount = Column(Float)
    transaction_type = Column(String)  # debit, credit
    reference_number = Column(String, nullable=True)
    
    # Bank Information
    bank_name = Column(String)
    account_number = Column(String)
    statement_month = Column(Date)  # Month of statement
    
    # Reconciliation
    matched_invoice_id = Column(
        String,
        ForeignKey("invoices.id"),
        nullable=True
    )
    voucher_type = Column(String, nullable=True)  # Payment, Receipt, etc.
    reconciliation_status = Column(
        String,
        default="pending"
    )  # pending, matched, reconciled
    matched_at = Column(DateTime, nullable=True)
    
    # Difference Tracking
    matched_amount = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)  # actual - matched
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

### 5. TallyLog Model

**Purpose:** Audit trail for Tally synchronization

**Table:** `tally_logs`

```python
class TallyLog(Base):
    __tablename__ = "tally_logs"
    
    # Primary Key
    log_id = Column(String, primary_key=True, index=True)
    
    # Reference
    invoice_id = Column(String, ForeignKey("invoices.id"), index=True)
    
    # Sync Details
    status = Column(
        String,
        index=True
    )  # success, failed, pending, retrying
    operation_type = Column(String)  # create, update, delete
    voucher_type = Column(String, nullable=True)  # Purchase, Sales, Payment
    
    # Response from Tally
    tally_voucher_number = Column(String, nullable=True)
    tally_response = Column(JSON)  # Full response from Tally
    error_message = Column(String, nullable=True)
    
    # Retry Information
    retry_count = Column(Integer, default=0)
    last_error = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    synced_at = Column(DateTime, nullable=True)
    next_retry_at = Column(DateTime, nullable=True)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="tally_logs")
```

**Example Usage:**

```python
# Log successful sync
log = TallyLog(
    log_id="log-uuid-1",
    invoice_id="inv-uuid-1",
    status="success",
    operation_type="create",
    voucher_type="Purchase",
    tally_voucher_number="PUR-2026-001",
    tally_response={"created_date": "2026-01-03", "amount": 5500.00},
    synced_at=datetime.utcnow()
)
db.add(log)
db.commit()

# Query failed syncs for retry
failed_logs = db.query(TallyLog).filter(
    TallyLog.status == "failed",
    TallyLog.retry_count < 3
).all()

for log in failed_logs:
    print(f"Retry sync for: {log.invoice_id}")
    # Attempt resync...
```

---

## Relationships

### ER Diagram

```
UploadedFile (1) --→ (1) Invoice
                         ↓
                    InvoiceItem (many)
                    
BankTransaction (many) --→ (1) Invoice

TallyLog (many) --→ (1) Invoice
```

### Relationship Queries

**Get invoice with all related data:**

```python
invoice = db.query(Invoice).filter(Invoice.id == "inv-uuid-1").first()

# Access relationships
print(invoice.items)              # List of InvoiceItem
print(invoice.uploaded_file)      # UploadedFile
print(invoice.tally_logs)         # List of TallyLog

# Cascade delete (deletes all items and logs)
db.delete(invoice)
db.commit()
```

**Get invoices with items (eager loading):**

```python
from sqlalchemy.orm import joinedload

invoices = db.query(Invoice).options(
    joinedload(Invoice.items)
).all()
# Prevents N+1 query problem
```

---

## Migrations

### Creating Database (First Time)

```python
# backend/database.py or init_db.py
from database import engine, Base
from models import UploadedFile, Invoice, InvoiceItem, BankTransaction, TallyLog

# Create all tables
Base.metadata.create_all(bind=engine)
print("Database initialized successfully")
```

### Modifying Schema

**Add a new column:**

```python
# 1. Update model
class Invoice(Base):
    # ... existing fields ...
    new_field = Column(String, nullable=True)  # Allow NULL for existing rows

# 2. Alembic migration (if using)
# alembic revision --autogenerate -m "Add new field to invoice"
# alembic upgrade head

# 3. Or manual migration
# ALTER TABLE invoices ADD COLUMN new_field VARCHAR;
```

---

## Queries & Operations

### Common Queries

**Get invoices by date range:**

```python
from datetime import date, timedelta

start_date = date(2026, 1, 1)
end_date = date(2026, 1, 31)

invoices = db.query(Invoice).filter(
    Invoice.invoice_date >= start_date,
    Invoice.invoice_date <= end_date
).all()
```

**Get supplier summary:**

```python
supplier_totals = db.query(
    Invoice.supplier,
    func.count(Invoice.id).label('invoice_count'),
    func.sum(Invoice.total_amount).label('total_amount')
).group_by(Invoice.supplier).all()

for supplier, count, total in supplier_totals:
    print(f"{supplier}: {count} invoices, Total: {total}")
```

**Get pending Tally syncs:**

```python
pending = db.query(Invoice).filter(
    Invoice.tally_status == "pending"
).all()

for invoice in pending:
    print(f"Push {invoice.id} to Tally")
```

**Pagination:**

```python
skip = 0
limit = 20

invoices = db.query(Invoice)\
    .order_by(Invoice.created_at.desc())\
    .offset(skip)\
    .limit(limit)\
    .all()

total_count = db.query(Invoice).count()
```

---

## Indexing Strategy

### Current Indexes

```python
# invoices table
Index('idx_invoice_status', 'status')
Index('idx_invoice_date', 'invoice_date')
Index('idx_invoice_supplier', 'supplier')
Index('idx_invoice_tally_status', 'tally_status')
Index('idx_invoice_status_date', 'status', 'invoice_date')

# invoice_items table
Index('idx_item_invoice', 'invoice_id')

# bank_transactions table
Index('idx_bank_transaction_date', 'date')
Index('idx_bank_transaction_status', 'reconciliation_status')

# tally_logs table
Index('idx_tally_log_status', 'status')
Index('idx_tally_log_date', 'created_at')
```

### Adding New Indexes

**For frequently filtered fields:**

```python
class Invoice(Base):
    __table_args__ = (
        Index('idx_new_field', 'new_field'),
    )
    
    new_field = Column(String, index=True)  # Or use index=True parameter
```

---

## Backup & Recovery

### SQLite Backup

```powershell
# Copy database file
Copy-Item "backend/tallyai.db" "backup/tallyai_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').db"
```

### PostgreSQL Backup

```bash
# Full backup
pg_dump -h localhost -U postgres -d tallyai > backup.sql

# Compressed backup
pg_dump -h localhost -U postgres -d tallyai | gzip > backup.sql.gz

# Restore from backup
psql -h localhost -U postgres -d tallyai < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -h localhost -U postgres -d tallyai
```

### Automated Backups (Render.com)

- Automatic daily backups retained for 7 days
- Access via Render dashboard → Database → Backups
- Can restore to specific point in time

---

**Last Updated:** January 3, 2026
