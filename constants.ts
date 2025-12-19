import { InvoiceData } from './types';

/**
 * CORS-FREE ARCHITECTURE
 * Tally API via Vite proxy at /tally
 * Proxy forwards to http://127.0.0.1:9000 (avoiding CORS errors)
 */
export const TALLY_API_URL = "/tally";

// Backend API Configuration - AI & Data Only (No Tally Connection)
export const BACKEND_API_URL = process.env.VITE_BACKEND_API_URL || "https://autotally-backend.onrender.com";
export const BACKEND_API_KEY = process.env.VITE_BACKEND_API_KEY || "";

export const MOCK_INVOICE: InvoiceData = {
  documentType: 'INVOICE',
  supplierName: "Tech Solutions Pvt Ltd",
  supplierGstin: "27ABCDE1234F1Z5", 
  buyerName: "Global Traders Inc",
  buyerGstin: "27XYZAB5678C1Z2", 
  invoiceNumber: "INV-2024-001",
  invoiceDate: "01-08-2025", 
  voucherType: "Purchase",
  lineItems: [
    {
      id: "1",
      description: "Dell Latitude 7420 Laptop",
      hsn: "8471",
      quantity: 1,
      rate: 45000,
      amount: 45000,
      gstRate: 12,
      unit: "Nos"
    },
    {
      id: "2",
      description: "Logitech MX Master 3",
      hsn: "8471",
      quantity: 5,
      rate: 9000,
      amount: 45000,
      gstRate: 18,
      unit: "Nos"
    }
  ],
  taxableValue: 90000,
  cgst: 6750,
  sgst: 6750,
  igst: 0,
  cess: 0,
  total: 103500,
  reverseCharge: false
};

export const EMPTY_INVOICE: InvoiceData = {
  documentType: 'INVALID',
  supplierName: "",
  supplierGstin: "",
  buyerName: "",
  buyerGstin: "",
  invoiceNumber: "",
  invoiceDate: "",
  voucherType: "Purchase",
  lineItems: [],
  taxableValue: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  cess: 0,
  total: 0,
  reverseCharge: false
};
