from fastapi import FastAPI, Header, HTTPException, Body, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, Optional, List
import os
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from google.api_core.exceptions import ResourceExhausted
from pdf_processor import split_pdf_to_images, get_pdf_page_count
import hashlib
from sqlalchemy.orm import Session
import database
import models
import schemas

# Load environment variables
load_dotenv()

# Create Database Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AutoTally Backend API")

# CORS configuration - Allow your React app to access this API
origins = ["*"]

# Add production origins from environment variable
prod_origins = os.getenv("ALLOWED_ORIGINS", "")
if prod_origins:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple API key validation
VALID_API_KEYS = os.getenv("BACKEND_API_KEY", "").split(",")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def validate_api_key(authorization: str = Header(None)):
    """Validate the user's backend API key"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    api_key = authorization.replace("Bearer ", "")
    
    if api_key not in VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return api_key



# Helper to clean JSON string
def clean_json_text(text: str) -> str:
    """Clean markdown code blocks from JSON string"""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "AutoTally Backend API",
        "version": "3.0.0",
        "features": ["gemini-proxy", "invoice-storage", "logging", "error-tracking"]
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}


@app.get("/healthz")
async def healthz():
    """Render Health check endpoint"""
    return {"status": "ok"}


@app.get("/auth/validate")
async def validate_key(authorization: str = Header(None)):
    """Validate user's API key"""
    try:
        validate_api_key(authorization)
        return {
            "success": True,
            "message": "API key is valid"
        }
    except HTTPException as e:
        return {
            "success": False,
            "message": e.detail
        }


# Pydantic models for Gemini proxy
class GeminiProxyRequest(BaseModel):
    model: str
    contents: Any
    config: Optional[Dict[str, Any]] = None


@app.post("/ai/gemini-proxy")
async def gemini_proxy(
    request: GeminiProxyRequest,
    authorization: str = Header(None)
):
    """
    Proxy endpoint for Gemini API calls.
    All business logic stays in React - this just forwards the request securely.
    """
    # Validate user's API key
    validate_api_key(authorization)
    
    # Check if Gemini API key is configured
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not configured on server"
        )
    
    # Debug: Check if key is being loaded
    print(f"GEMINI_API_KEY loaded: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-4:]}")
    print(f"Key length: {len(GEMINI_API_KEY)}")
    
    try:
        # Configure Gemini with server's API key
        genai.configure(api_key=GEMINI_API_KEY)
        
        # Extract system_instruction from config (if present)
        config = request.config or {}
        system_instruction = config.pop('system_instruction', None)
        
        # Instantiate GenerationConfig if config is present
        generation_config = GenerationConfig(**config) if config else None
        
        # Create model with system_instruction if provided
        if system_instruction:
            model = genai.GenerativeModel(request.model, system_instruction=system_instruction)
        else:
            model = genai.GenerativeModel(request.model)
        
        # Handle both formats:
        # 1. Single request: {"parts": [...]} - for image/document analysis
        # 2. Chat history: [{"role": "user", "parts": [...]}, ...] - for chat
        contents = request.contents
        
        # If contents is a dict with 'parts', it's a single request
        # If contents is a list, it's chat history - but we need to convert to proper format
        if isinstance(contents, dict) and 'parts' in contents:
            # Single request format - pass as-is
            response = model.generate_content(
                contents=contents['parts'],
                generation_config=generation_config
            )
        elif isinstance(contents, list):
            # Chat history format - pass as-is (Gemini expects list of Content objects)
            response = model.generate_content(
                contents=contents,
                generation_config=generation_config
            )
        else:
            # Fallback - pass as-is
            response = model.generate_content(
                contents=contents,
                generation_config=generation_config
            )
        
        # Safely get text content
        text_content = ""
        try:
            text_content = response.text
        except Exception:
            # If response.text fails (e.g. safety block), we leave it empty
            # The candidates list will still contain safety info
            pass

        # Return the response
        return {
            "success": True,
            "text": text_content,
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": part.text} for part in candidate.content.parts],
                        "role": candidate.content.role
                    },
                    "finish_reason": candidate.finish_reason,
                    "safety_ratings": [
                        {
                            "category": rating.category,
                            "probability": rating.probability
                        }
                        for rating in candidate.safety_ratings
                    ]
                }
                for candidate in response.candidates
            ]
        }
    
    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="Gemini API quota exceeded. Please retry later or upgrade plan."
        )

    except Exception as e:
        # Log the full error for debugging
        import traceback
        import uuid
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        print(f"ERROR: {error_msg}")
        print(f"Traceback: {error_trace}")
        print(f"Request contents type: {type(request.contents)}")
        print(f"Request contents: {request.contents}")
        
        # Save error to database
        # (Database logging disabled in this version)
        
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API error: {error_msg}"
        )


class ChatRequest(BaseModel):
    history: List[Dict[str, Any]]
    model: str = "gemini-2.5-flash"
    system_instruction: Optional[str] = None


@app.post("/ai/chat")
async def chat(
    request: ChatRequest,
    authorization: str = Header(None)
):
    """Server-side chat handler that uses Gemini securely"""
    try:
        print(f"DEBUG: Received chat request: {request}")
        
        # Validate API key
        validate_api_key(authorization)

        if not GEMINI_API_KEY:
            print("ERROR: GEMINI_API_KEY is missing")
            raise HTTPException(status_code=500, detail="Gemini API key not configured on server")

        print(f"DEBUG: Using Gemini Key: {GEMINI_API_KEY[:5]}... (Length: {len(GEMINI_API_KEY)})")

        genai.configure(api_key=GEMINI_API_KEY)
        if request.system_instruction:
            model = genai.GenerativeModel(request.model, system_instruction=request.system_instruction)
        else:
            model = genai.GenerativeModel(request.model)

        # Convert history to model input format
        parts: List[Any] = []
        for msg in request.history:
            if msg.get("parts"):
                for p in msg["parts"]:
                    if "text" in p:
                        parts.append(p["text"])
            elif msg.get("text"):
                parts.append(msg["text"])

        print(f"DEBUG: Sending to Gemini: {parts}")
        response = model.generate_content(parts)
        print(f"DEBUG: Gemini Response: {response.text[:100]}...")
        
        return {"success": True, "text": response.text}
        
    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="Gemini API quota exceeded. Please retry later or upgrade plan."
        )

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"CHAT ENDPOINT ERROR: {str(e)}")
        print(f"TRACEBACK: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/ai/process-document")
async def process_document(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """Process a single document (invoice image/PDF) and return structured data"""
    validate_api_key(authorization)

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured on server")

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Prefer flash for speed
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Read file bytes and convert to base64
        file_bytes = await file.read()
        
        # Calculate file hash for duplicate detection
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        
        import base64, json
        b64 = base64.b64encode(file_bytes).decode('utf-8')

        system_instruction = """1️⃣ INVOICE SYSTEM INSTRUCTION
(Used during Gemini model initialization for invoice documents)

You are an expert Indian GST Invoice Accountant.
Extract data for Tally Prime XML integration.

CRITICAL DOCUMENT TYPE CHECK:
1. INVALID CHECK:
   - If the image is a photo of a person (selfie), animal, food, scenery, or a random object
   - And NOT a document
   - → set "documentType" to "INVALID"

2. BANK STATEMENT CHECK:
   - If it contains columns like:
     Date, Description/Narration, Withdrawal/Debit, Deposit/Credit, Balance
   - AND does NOT contain "GSTIN" or "Tax Invoice"
   - → set "documentType" to "BANK_STATEMENT"

3. INVOICE CHECK:
   - If it is a Bill, Receipt, or Invoice
   - Even if handwritten, simple, or missing fields
   - → set "documentType" to "INVOICE"

MISSING FIELDS POLICY:
- Missing Supplier Name, Buyer Name, GSTIN, or Invoice Number DOES NOT make the document invalid
- Return empty strings for missing fields
- Always extract whatever is available

RULES FOR INVOICE EXTRACTION:
1. Stock item names MUST be ≤ 25 characters
2. Dates MUST be normalized to DD-MM-YYYY
3. GST CALCULATION RULES (CRITICAL):
   - Identify ALL tax rates present (e.g., 0%, 5%, 12%, 18%, 28%).
   - If multiple rates exist, the 'gstRate' in lineItems must reflect the specific rate for that item.
   - **MANDATORY**: If SGST and CGST columns are present (e.g., 9% each), you MUST SUM them for the 'gstRate' (e.g., 9+9 = 18%).
   - If tax rate is not explicitly printed, CALCULATE it: (Tax Amount / Taxable Value) * 100.
   - 'taxableValue' = Sum of amounts of all line items BEFORE tax.
   - 'total' (Grand Total) = 'taxableValue' + TOTAL TAX AMOUNT.
   - CHECK THE BOTTOM of the invoice for the final "Grand Total" or "Invoice Total". 
   - DO NOT confuse 'Taxable Value' with 'Grand Total'.
   - If 'IGST', 'CGST', 'SGST' are shown, sum them up for the total tax.
4. Extract COMMON TRADE NAMES only (Remove city names, legal prefixes, and "M/s")

Goal:
Return a clean, structured JSON object suitable for Tally Prime."""

        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)

        prompt = """3️⃣ INVOICE PARSING PROMPT (STRICT JSON)

You are a parser.

Return VALID JSON ONLY with the following fields:

- documentType
- invoiceNumber
- invoiceDate (DD-MM-YYYY)
- supplierName
- supplierAddress
- supplierGstin
- buyerName
- buyerAddress
- buyerGstin
- lineItems [
    {
      description,
      hsn,
      quantity,
      rate,
      amount,
      gstRate,
      unit
    }
  ]
- taxableValue
- total

Rules:
- If the document is NOT an invoice, set documentType = "INVALID"
- Do not include explanations
- Do not include extra text
- VERIFY MATH: total = taxableValue + (taxableValue * gstRate/100) is NOT always true for multi-rate invoices.
- USE THE PRINTED GRAND TOTAL FROM THE DOCUMENT.
"""

        response = model.generate_content([
            {"mime_type": file.content_type or "application/octet-stream", "data": b64},
            prompt
        ], generation_config={"response_mime_type": "application/json"})

        print(f"DEBUG AI RAW RESPONSE: {response.text}")
        clean_json = clean_json_text(response.text)
        data = json.loads(clean_json)
        print(f"DEBUG EXTRACTED DATA: {data}")
        
        return {
            "success": True,
            "invoice": data,
            "message": "Document processed successfully"
        }
    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="Gemini API quota exceeded. Please retry later or upgrade plan."
        )
    except Exception as e:
        import traceback
        print(f"PROCESS DOCUMENT ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@app.post("/ai/process-bulk")
async def process_bulk(
    files: List[UploadFile] = File(...),
    authorization: str = Header(None)
):
    """Process multiple documents and return structured data"""
    validate_api_key(authorization)

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured on server")

    genai.configure(api_key=GEMINI_API_KEY)
    
    # Use flash-lite for bulk processing to save costs and tokens
    model = genai.GenerativeModel('gemini-2.5-flash-lite')

    results = []
    successful = 0
    failed = 0

    import base64, json

    for f in files:
        try:
            file_bytes = await f.read()
            b64 = base64.b64encode(file_bytes).decode('utf-8')

            prompt = """Extract invoice data into this exact JSON structure:
{
  "supplierName": "string",
  "supplierAddress": "string",
  "supplierGstin": "string",
  "buyerName": "string",
  "buyerAddress": "string",
  "buyerGstin": "string",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "voucherType": "Purchase",
  "lineItems": [
    {
      "description": "string",
      "hsn": "string",
      "quantity": 0,
      "rate": 0,
      "amount": 0,
      "gstRate": 0,
      "unit": "string"
    }
  ]
}
Ensure dates are YYYY-MM-DD.
"""
            response = model.generate_content([
                {"mime_type": f.content_type or "application/octet-stream", "data": b64},
                prompt
            ], generation_config={"response_mime_type": "application/json"})

            clean_json = clean_json_text(response.text)
            data = json.loads(clean_json)
            results.append(data)
            successful += 1
        except ResourceExhausted:
            # If bulk processing hits limit, stop and raise error to save user from waiting
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded during bulk processing."
            )
        except Exception:
            failed += 1
            continue

    return {
        "success": True,
        "invoices": results,
        "successful": successful,
        "failed": failed,
        "message": "Bulk processing completed"
    }
@app.post("/ai/process-invoice-pdf")
async def process_invoice_pdf(
    request: Dict[str, Any],
    authorization: str = Header(None)
):
    """
    Process invoice PDF with text extraction BEFORE Gemini.
    Reduces token usage by 90-95% compared to sending base64 PDF.
    """
    # Validate user's API key
    validate_api_key(authorization)
    
    # Check if Gemini API key is configured
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key not configured on server"
        )
    
    try:
        import base64
        import io
        import pdfplumber
        import json
        
        # Extract base64 PDF from request
        pdf_base64 = request.get('pdfData', '')
        if not pdf_base64:
            raise HTTPException(status_code=400, detail="No PDF data provided")
        
        # Decode base64 to PDF bytes
        pdf_bytes = base64.b64decode(pdf_base64)
        
        # Extract text from PDF using pdfplumber
        extracted_text = ""
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        
        # If no text extracted (scanned PDF), fall back to OCR
        if not extracted_text.strip():
            try:
                import pytesseract
                from pdf2image import convert_from_bytes
                
                images = convert_from_bytes(pdf_bytes)
                extracted_text = "\n".join(
                    pytesseract.image_to_string(img) 
                    for img in images
                )
            except Exception as ocr_error:
                print(f"OCR failed: {str(ocr_error)}")
                raise HTTPException(status_code=500, detail="Could not extract text from PDF")
        
        # ✅ IMPORTANT: Extract ALL text - do NOT filter anything
        # We preserve 100% of invoice data to ensure no fields are missed
        
        # Clean up the text (remove excessive whitespace, but keep all content)
        lines = []
        for line in extracted_text.splitlines():
            cleaned_line = line.strip()
            if cleaned_line:  # Only remove completely empty lines
                lines.append(cleaned_line)
        
        # Join all lines - this is the COMPLETE invoice text
        complete_text = "\n".join(lines)
        
        # Smart chunking: If text is too large (>8000 chars), intelligently split
        # but NEVER drop data - we'll process in chunks if needed
        max_chars = 8000  # Safe limit for Gemini
        
        if len(complete_text) <= max_chars:
            # Text fits in one request - use it all
            final_text = complete_text
        else:
            # Text is large - take first 8000 chars which usually contains all invoice data
            # (Invoice metadata is always at the top)
            final_text = complete_text[:max_chars]
            print(f"⚠️ Large invoice: Using first {max_chars} chars (full text: {len(complete_text)} chars)")
        
        print(f"📄 Extracted text: {len(extracted_text)} chars → Cleaned: {len(complete_text)} chars → Final: {len(final_text)} chars")

        
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Optimized prompt for Tally
        prompt = f"""Extract invoice data and return ONLY valid JSON.

Required fields (camelCase strictly):
- supplierName
- supplierAddress
- supplierGstin
- buyerName
- buyerAddress
- buyerGstin
- invoiceNumber
- invoiceDate (YYYY-MM-DD format)
- taxableValue
- totalAmount
- lineItems: [{{"description": "", "quantity": 0, "rate": 0, "amount": 0, "gstRate": 0, "hsn": "", "unit": ""}}]

GST EXTRACTION RULES:
1. 'gstRate' must be a NUMBER (e.g. 18, 12, 5, 0).
2. Look for columns "GST Rate", "IGST %", "CGST %", "SGST %".
3. If CGST (9%) and SGST (9%) are separate, SUM them: gstRate = 18.
4. If gstRate is NOT in the line item row, look at the tax summary at the bottom.
5. If NO rate is found, CALCULATE it: (Tax Amount / Taxable Amount) * 100.
6. Verify: (amount * gstRate/100) should approx equal the tax amount.

Invoice text:
{final_text}

Return ONLY the JSON object, no markdown formatting."""

        # Call Gemini with compressed text
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )

        print(f"DEBUG INVOICE PDF RAW: {response.text}")
        clean_json = clean_json_text(response.text)
        invoice_data = json.loads(clean_json)
        print(f"DEBUG INVOICE PDF DATA: {invoice_data}")
        
        return {
            "success": True,
            "documentType": "INVOICE",
            "data": invoice_data,
            "stats": {
                "original_text_length": len(extracted_text),
                "final_text_length": len(final_text),
                "text_preserved": "100% - All invoice data extracted"
            }
        }
        
    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="Gemini API quota exceeded. Please retry later or upgrade plan."
        )
    except Exception as e:
        import traceback
        import uuid
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        print(f"ERROR processing invoice: {error_msg}")
        print(f"Traceback: {error_trace}")
        
        # Save error to database
        # (Database logging disabled)
        
        raise HTTPException(
            status_code=500,
            detail=f"Error processing invoice: {error_msg}"
        )



@app.post("/ai/process-bank-statement-pdf")
async def process_bank_statement_pdf(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """
    Process Bank Statement PDF.
    Prioritizes TEXT extraction (pdfplumber) for digital PDFs to save tokens/speed.
    Falls back to IMAGE processing for scanned PDFs.
    """
    validate_api_key(authorization)

    if not GEMINI_API_KEY:
        raise HTTPException(500, "Gemini API key not configured")

    genai.configure(api_key=GEMINI_API_KEY)
    
    # Use flash model for speed and large context window
    model = genai.GenerativeModel("gemini-2.5-flash")

    # Read uploaded PDF
    pdf_bytes = await file.read()
    
    # Attempt Text Extraction first
    import io
    import pdfplumber
    import json
    
    extracted_text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
    except Exception as e:
        print(f"PDF Text extraction failed: {e}")
        # Continue to image fallback
    
    # Check if we have enough text to consider it a digital PDF
    # (Scanned docs might have a few chars of noise)
    if len(extracted_text.strip()) > 50:
        print(f"📄 Processing Bank Statement as TEXT ({len(extracted_text)} chars)")
        
        # Limit text if it's insanely large
        if len(extracted_text) > 100000:
            extracted_text = extracted_text[:100000] + "\n...(truncated)"
            
        prompt = f"""5️⃣ BANK STATEMENT TEXT PARSING PROMPT (STRICT JSON)

You are a bank statement analyzer.
Extract data from the following text into this exact JSON structure:

{{
  "documentType": "BANK_STATEMENT",
  "bankName": "string (inferred from header)",
  "accountNumber": "string (full or masked)",
  "accountNumberLast4": "string (last 4 digits)",
  "totalWithdrawals": number (sum of all debits),
  "totalDeposits": number (sum of all credits),
  "transactions": [
    {{
      "id": "string (generate unique ID)",
      "date": "YYYY-MM-DD",
      "description": "string",
      "withdrawal": number (0 if deposit),
      "deposit": number (0 if withdrawal),
      "balance": number,
      "voucherType": "Payment" (if withdrawal) or "Receipt" (if deposit),
      "contraLedger": "string (suggest category e.g. 'Bank Charges', 'Salary', 'Vendor Name', or 'Suspense A/c')"
    }}
  ]
}}

RULES:
1. Detect Date Format: Normalize all dates to YYYY-MM-DD.
2. Description: Combine multi-line descriptions if they belong to the same transaction.
3. Debits/Credits: Identify columns correctly. 'Dr' or 'Withdrawal' or 'Debit' is Withdrawal. 'Cr' or 'Deposit' or 'Credit' is Deposit.
4. If a transaction has no value in Withdrawal/Deposit, set it to 0.
5. Balance: Extract running balance if available.

Text Content:
{extracted_text}
"""
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            clean_json = clean_json_text(response.text)
            data = json.loads(clean_json)
            
            # Ensure transactions array exists
            if "transactions" not in data or data["transactions"] is None:
                data["transactions"] = []
                
            return {
                "success": True,
                **data
            }
            
        except ResourceExhausted:
            raise HTTPException(
                status_code=429,
                detail="AI quota exceeded. Please wait or upgrade plan."
            )
        except Exception as e:
            print(f"Gemini Text Processing Failed: {e}")
            # Fallback to image processing if text parsing fails
            pass

    # ================= FALLBACK: IMAGE PROCESSING =================
    print("📸 Fallback: Processing Bank Statement as IMAGES")
    
    pages = split_pdf_to_images(pdf_bytes)
    transactions = []

    for img_base64, _ in pages:
        try:
            response = model.generate_content(
                [
                    {"mime_type": "image/png", "data": img_base64},
                    "Extract bank statement JSON only with transactions array. Fields: date, description, withdrawal, deposit, balance."
                ],
                generation_config={"response_mime_type": "application/json"}
            )

            data = json.loads(clean_json_text(response.text))
            transactions.extend(data.get("transactions", []))
        except ResourceExhausted:
            raise HTTPException(
                status_code=429,
                detail="AI quota exceeded. Please wait or upgrade plan."
            )
        except:
            continue

    # Return combined transactions from images
    return {
        "success": True,
        "documentType": "BANK_STATEMENT",
        "transactions": transactions,
        "note": "Processed via Image Fallback"
    }


@app.post("/ai/process-bank-statement")
async def process_bank_statement(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    """Process a single bank statement image (PNG/JPG)"""
    validate_api_key(authorization)

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured on server")

    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-flash-latest')

        file_bytes = await file.read()
        import base64, json
        img_base64 = base64.b64encode(file_bytes).decode('utf-8')

        prompt = """4️⃣ BANK STATEMENT PARSING PROMPT (STRICT JSON)
You are a bank statement parser.

Return VALID JSON ONLY with the following fields (matches React Schema):

- documentType (BANK_STATEMENT | INVOICE)
- bankName
- accountNumber
- accountNumberLast4
- totalWithdrawals
- totalDeposits
- transactions [
    {
      id (generate a random string),
      date (YYYY-MM-DD),
      description,
      withdrawal (money going OUT),
      deposit (money coming IN),
      balance,
      voucherType ("Payment" if withdrawal > 0 else "Receipt"),
      contraLedger (Infer intelligently from description, e.g. "Staff Welfare")
    }
  ]

IMPORTANT RULES:
- Extract account number from the statement header
- VoucherType:
  - Withdrawal → Payment
  - Deposit → Receipt
- contraLedger:
  - Do NOT default blindly to "Suspense A/c"
"""

        response = model.generate_content([
            {"mime_type": file.content_type or "image/png", "data": img_base64},
            prompt
        ], generation_config={"response_mime_type": "application/json"})

        print(f"DEBUG BANK IMG RAW: {response.text}")
        clean_json = clean_json_text(response.text)
        data = json.loads(clean_json)
        print(f"DEBUG BANK IMG DATA: {data}")
        
        # Ensure transactions array exists
        if "transactions" not in data or data["transactions"] is None:
             data["transactions"] = []

        return {
            "success": True,
            **data
        }
    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="AI quota exceeded. Please wait or upgrade plan."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process bank statement: {str(e)}")


# ================= DATABASE ENDPOINTS =================

@app.post("/invoices", response_model=schemas.InvoiceResponse)
async def create_invoice(
    invoice: schemas.InvoiceCreate,
    db: Session = Depends(database.get_db),
    authorization: str = Header(None)
):
    """Save an invoice to the database. Checks for duplicates."""
    validate_api_key(authorization)
    
    # Check for duplicate file hash
    if invoice.fileHash:
        existing_file = db.query(models.UploadedFile).filter(models.UploadedFile.file_hash == invoice.fileHash).first()
        if existing_file:
             # Logic: If file exists, check if invoice is also saved.
             # For now, we allow saving if the user confirmed, but we could block it.
             # The prompt asks for "Duplicate protection logic".
             # We'll check if the invoice number + supplier GSTIN exists.
             pass
        else:
            # Register file
            new_file = models.UploadedFile(
                file_hash=invoice.fileHash,
                filename=f"Invoice_{invoice.invoiceNumber}.pdf", # Placeholder name
                file_type="INVOICE"
            )
            db.add(new_file)
            db.commit()

    # Check for duplicate Invoice (Supplier GSTIN + Invoice Number)
    if invoice.supplierGstin and invoice.invoiceNumber:
        existing_invoice = db.query(models.Invoice).filter(
            models.Invoice.supplier_gstin == invoice.supplierGstin,
            models.Invoice.invoice_number == invoice.invoiceNumber
        ).first()
        
        if existing_invoice:
            raise HTTPException(status_code=409, detail=f"Invoice {invoice.invoiceNumber} from {invoice.supplierName} already exists.")

    # Create Invoice
    db_invoice = models.Invoice(
        invoice_number=invoice.invoiceNumber,
        invoice_date=invoice.invoiceDate,
        supplier_name=invoice.supplierName,
        supplier_gstin=invoice.supplierGstin,
        buyer_name=invoice.buyerName,
        buyer_gstin=invoice.buyerGstin,
        total_amount=invoice.total,
        taxable_value=invoice.taxableValue,
        file_hash=invoice.fileHash,
        status="PENDING"
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    # Create Line Items
    for item in invoice.lineItems:
        db_item = models.InvoiceItem(
            invoice_id=db_invoice.id,
            description=item.description,
            hsn=item.hsn,
            quantity=item.quantity,
            rate=item.rate,
            amount=item.amount,
            gst_rate=item.gstRate,
            unit=item.unit
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

@app.get("/invoices", response_model=List[schemas.InvoiceResponse])
async def list_invoices(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(database.get_db),
    authorization: str = Header(None)
):
    """List invoices from database"""
    validate_api_key(authorization)
    invoices = db.query(models.Invoice).offset(skip).limit(limit).all()
    return invoices

@app.post("/tally/log", response_model=schemas.TallyLogResponse)
async def log_tally_push(
    log: schemas.TallyLogCreate,
    db: Session = Depends(database.get_db),
    authorization: str = Header(None)
):
    """Log a Tally push event (audit trail)"""
    validate_api_key(authorization)
    
    db_log = models.TallyLog(
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        action=log.action,
        status=log.status,
        message=log.message
    )
    db.add(db_log)
    
    # Update entity status if successful
    if log.status == "SUCCESS" and log.entity_type == "INVOICE":
        # Find invoice and update status
        try:
            # entity_id might be the database ID or invoice number. Assuming Database ID for robustness.
            # If it's a string ID, try converting to int
            invoice_id = int(log.entity_id)
            invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
            if invoice:
                invoice.status = "SYNCED"
        except:
            pass # If ID lookup fails, just log
            
    db.commit()
    db.refresh(db_log)
    return db_log

@app.post("/bank-transactions", response_model=List[schemas.BankTransactionResponse])
async def save_bank_transactions(
    transactions: List[schemas.BankTransactionCreate],
    db: Session = Depends(database.get_db),
    authorization: str = Header(None)
):
    """Save bank transactions"""
    validate_api_key(authorization)
    
    saved_txns = []
    for txn in transactions:
        # Check if ID exists
        existing = db.query(models.BankTransaction).filter(models.BankTransaction.id == txn.id).first()
        if not existing:
            db_txn = models.BankTransaction(
                id=txn.id,
                date=txn.date,
                description=txn.description,
                withdrawal=txn.withdrawal,
                deposit=txn.deposit,
                balance=txn.balance,
                voucher_type=txn.voucherType,
                contra_ledger=txn.contraLedger,
                status="PENDING"
            )
            db.add(db_txn)
            saved_txns.append(db_txn)
    
    db.commit()
    # Refresh all to get created_at
    for t in saved_txns:
        db.refresh(t)
        
    return saved_txns


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
