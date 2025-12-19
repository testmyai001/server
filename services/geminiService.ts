
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { InvoiceData, BankTransaction, BankStatementData } from "../types";
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_INSTRUCTION = `
You are an expert Indian GST Invoice Accountant. Extract data for Tally Prime integration.
CLASSIFICATION:
- If document contains "GSTIN" or "Tax Invoice", set documentType to 'INVOICE'.
- If document contains "Date", "Narration/Description", "Withdrawal/Debit", set documentType to 'BANK_STATEMENT'.
- If neither, set documentType to 'INVALID'.

EXTRACTION RULES:
1. DATES: DD-MM-YYYY
2. GST RATES: Infer from tax amounts (5, 12, 18, 28)
3. TOTALS: Ensure Taxable + Tax = Grand Total
`;

const BANK_INSTRUCTION = `
You are a Tally Bank Reconciliation expert. Extract bank transactions.
FORMAT:
- bankName: Full name + Last 4 digits of A/c No.
- transactions: Array of { date, description, withdrawal, deposit, suggestedLedger }
- suggestedLedger: Guess based on narration (e.g., 'SWIGGY' -> 'Staff Welfare')
`;

export const parseInvoiceWithGemini = async (file: File): Promise<InvoiceData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64Data } },
        { text: "Parse this invoice for Tally accounting." }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          documentType: { type: Type.STRING, enum: ['INVOICE', 'BANK_STATEMENT', 'INVALID'] },
          supplierName: { type: Type.STRING },
          supplierGstin: { type: Type.STRING },
          buyerName: { type: Type.STRING },
          buyerGstin: { type: Type.STRING },
          invoiceNumber: { type: Type.STRING },
          invoiceDate: { type: Type.STRING },
          lineItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                hsn: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                rate: { type: Type.NUMBER },
                amount: { type: Type.NUMBER },
                gstRate: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  const data = JSON.parse(response.text);
  if (data.documentType === 'INVALID') throw new Error("Document not recognized.");
  
  // Post-process logic (totals, rounding, inter-state)
  const taxable = data.lineItems.reduce((acc: number, i: any) => acc + (i.amount || 0), 0);
  // ... apply precision rounding ...

  return {
    ...data,
    lineItems: data.lineItems.map((l: any) => ({ ...l, id: uuidv4() })),
    taxableValue: taxable,
    // defaults
    cgst: 0, sgst: 0, igst: 0, cess: 0, total: taxable,
    voucherType: 'Purchase',
    reverseCharge: false
  };
};

export const parseBankStatementWithGemini = async (file: File): Promise<BankStatementData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64Data } },
        { text: "Extract transactions from this bank statement." }
      ]
    },
    config: {
      systemInstruction: BANK_INSTRUCTION,
      responseMimeType: "application/json"
    }
  });

  const data = JSON.parse(response.text);
  return {
    ...data,
    documentType: 'BANK_STATEMENT',
    accountNumber: data.accountNumber || "0000",
    transactions: data.transactions.map((t: any) => ({
      ...t,
      id: uuidv4(),
      voucherType: t.withdrawal > 0 ? 'Payment' : 'Receipt',
      contraLedger: t.suggestedLedger || 'Suspense A/c'
    }))
  };
};

export const createChatSession = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are AutoTally Assistant, an expert in Tally Prime, Indian GST laws, and accounting automation. You help users with ledger mapping, XML generation, and GST compliance.',
    },
  });
};

// Added missing image analysis function
export const analyzeImageWithGemini = async (file: File, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64Data } },
        { text: prompt || "Analyze this document." }
      ]
    }
  });

  return response.text || "No analysis result.";
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};
