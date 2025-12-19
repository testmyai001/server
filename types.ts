
export interface LineItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount: number; // Taxable Value
  gstRate: number; // e.g., 18
  unit?: string; // e.g., Nos, Kg, Box
}

export interface InvoiceData {
  id?: string;
  documentType: 'INVOICE' | 'BANK_STATEMENT' | 'INVALID';
  supplierName: string;
  supplierGstin: string;
  buyerName: string;
  buyerGstin: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  voucherType: 'Sales' | 'Purchase';
  targetCompany?: string;
  lineItems: LineItem[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
  reverseCharge: boolean;
}

export interface BankTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  withdrawal: number; // Debit
  deposit: number; // Credit
  balance?: number;
  contraLedger: string;
  voucherType: 'Payment' | 'Receipt' | 'Contra';
}

export interface BankStatementData {
  id?: string;
  documentType: 'INVOICE' | 'BANK_STATEMENT' | 'INVALID';
  bankName: string;
  accountNumber: string; // Last 4 digits
  transactions: BankTransaction[];
  periodStart?: string;
  periodEnd?: string;
}

export interface ExcelVoucherItem {
  amount: number;
  taxRate: number;
  ledgerName?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface ExcelVoucher {
  id: string;
  date: string; // YYYY-MM-DD
  invoiceNo: string;
  partyName: string;
  gstin: string;
  voucherType: 'Sales' | 'Purchase';
  items: ExcelVoucherItem[];
  totalAmount: number;
  narration?: string;
}

export interface TallyResponse {
  success: boolean;
  message: string;
}

export interface ProcessedFile {
  id: string;
  file?: File;
  fileName: string;
  sourceType: 'INVOICE_IMPORT' | 'BANK_STATEMENT' | 'EXCEL_IMPORT'; 
  status: 'Pending' | 'Processing' | 'Ready' | 'Success' | 'Failed' | 'Mismatch'; 
  error?: string;
  correctEntries: number;
  incorrectEntries: number;
  timeTaken: string;
  uploadTimestamp: number;
  data?: InvoiceData;
  bankData?: BankStatementData;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  method: 'POST' | 'GET';
  endpoint: string;
  status: 'Success' | 'Failed' | 'Pending';
  message: string;
  response?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  EDITOR = 'EDITOR',
  LOGS = 'LOGS',
  CHAT = 'CHAT',
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  BANK_STATEMENT = 'BANK_STATEMENT',
  EXCEL_IMPORT = 'EXCEL_IMPORT'
}
