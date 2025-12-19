
import { InvoiceData, TallyResponse, BankStatementData, ExcelVoucher } from '../types';
import { TALLY_API_URL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// --- PERFORMANCE OPTIMIZED HELPERS ---

const esc = (str: string) => {
  if (!str) return '';
  // Faster string replacement for high-volume XML
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
};

export const cleanName = (str: string): string => {
  if (!str) return 'Unknown Item';
  return str.replace(/[^a-zA-Z0-9\s\-\.\(\)%]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 80); // Increased limit for complex ledger names
};

const round = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const formatRate = (num: number): string => {
  return Number.isInteger(num) ? num.toString() : num.toFixed(1).replace(/\.0$/, '');
};

const formatDateForXml = (dateStr: string) => {
  if (!dateStr) return new Date().toISOString().slice(0, 10).replace(/-/g, ''); 
  const d = dateStr.replace(/[\.\/\s]/g, '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d.replace(/-/g, '');
  const match = d.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) return `${match[3]}${match[2].padStart(2, '0')}${match[1].padStart(2, '0')}`;
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
};

const STATE_MAP: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan",
  "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura",
  "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
  "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "25": "Daman & Diu", "26": "Dadra & Nagar Haveli", "27": "Maharashtra", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh"
};

const getStateName = (gstin: string): string => {
    if(!gstin || gstin.length < 2) return '';
    const code = gstin.substring(0, 2);
    return STATE_MAP[code] || '';
};

const decodeHtml = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

// --- BATCH PROCESSING LOGIC ---

export const analyzeLedgerRequirements = (vouchers: ExcelVoucher[], existingLedgers: Set<string>): string[] => {
    const required = new Set<string>();
    const missing: string[] = [];

    // Optimized single-pass set creation
    for (let i = 0; i < vouchers.length; i++) {
        const v = vouchers[i];
        const party = cleanName(v.partyName);
        if (party) required.add(party);

        const isSales = v.voucherType === 'Sales';
        const sourceState = '27'; // Assume MS for now
        const destState = (v.gstin || '').substring(0, 2);
        const isInterState = destState && destState !== sourceState;

        for (const item of v.items) {
            const taxLedger = item.ledgerName || `${isSales ? 'Sale' : 'Purchase'} ${item.taxRate}%`;
            required.add(taxLedger);
            if (item.taxRate > 0) {
                if (isInterState) {
                    required.add(`${isSales ? 'Output' : 'Input'} IGST ${item.taxRate}%`);
                } else {
                    const half = item.taxRate / 2;
                    required.add(`${isSales ? 'Output' : 'Input'} CGST ${formatRate(half)}%`);
                    required.add(`${isSales ? 'Output' : 'Input'} SGST ${formatRate(half)}%`);
                }
            }
        }
    }

    required.forEach(req => {
        if (!existingLedgers.has(req)) missing.push(req);
    });

    return missing.sort();
};

export const generateBulkExcelXml = (vouchers: ExcelVoucher[], createdMasters: Set<string>, targetCompany: string): string => {
    const svCompany = targetCompany ? esc(targetCompany) : '##SVCurrentCompany';
    let mastersXml = '';
    let vouchersXml = '';

    // Batch 1: Master Generation
    for (const v of vouchers) {
        const partyName = cleanName(v.partyName);
        if (!createdMasters.has(partyName)) {
            const group = v.voucherType === 'Sales' ? 'Sundry Debtors' : 'Sundry Creditors';
            const state = getStateName(v.gstin);
            mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(partyName)}" ACTION="Create"><NAME.LIST><NAME>${esc(partyName)}</NAME></NAME.LIST><PARENT>${group}</PARENT><ISBILLWISEON>Yes</ISBILLWISEON><ISGSTAPPLICABLE>Yes</ISGSTAPPLICABLE>${v.gstin ? `<PARTYGSTIN>${esc(v.gstin)}</PARTYGSTIN>` : ''}${state ? `<STATENAME>${esc(state)}</STATENAME>` : ''}</LEDGER></TALLYMESSAGE>`;
            createdMasters.add(partyName);
        }
        for (const item of v.items) {
            const taxRate = item.taxRate || 0;
            const ledgerName = item.ledgerName || `${v.voucherType === 'Sales' ? 'Sale' : 'Purchase'} ${taxRate}%`;
            if (!createdMasters.has(ledgerName)) {
                mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(ledgerName)}" ACTION="Create"><NAME.LIST><NAME>${esc(ledgerName)}</NAME></NAME.LIST><PARENT>${v.voucherType === 'Sales' ? 'Sales Accounts' : 'Purchase Accounts'}</PARENT><ISGSTAPPLICABLE>Yes</ISGSTAPPLICABLE></LEDGER></TALLYMESSAGE>`;
                createdMasters.add(ledgerName);
            }
            if (taxRate > 0) {
                const igst = `${v.voucherType === 'Sales' ? 'Output' : 'Input'} IGST ${taxRate}%`;
                if (!createdMasters.has(igst)) {
                    mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(igst)}" ACTION="Create"><NAME.LIST><NAME>${esc(igst)}</NAME></NAME.LIST><PARENT>Duties &amp; Taxes</PARENT><TAXTYPE>GST</TAXTYPE><GSTDUTYHEAD>Integrated Tax</GSTDUTYHEAD></LEDGER></TALLYMESSAGE>`;
                    createdMasters.add(igst);
                }
            }
        }
    }

    // Batch 2: Voucher Generation
    for (const v of vouchers) {
        const dateXml = formatDateForXml(v.date);
        const partyName = cleanName(v.partyName);
        const isSales = v.voucherType === 'Sales';
        const partyDeemedPos = isSales ? 'Yes' : 'No'; 
        const otherDeemedPos = isSales ? 'No' : 'Yes';

        let entriesXml = '';
        let runningTotal = 0;

        for (const item of v.items) {
            const taxable = round(item.amount);
            const ledgerName = item.ledgerName || `${v.voucherType === 'Sales' ? 'Sale' : 'Purchase'} ${item.taxRate}%`;
            const taxAmt = round(taxable * (item.taxRate / 100));
            
            runningTotal += (taxable + taxAmt);
            
            // Taxable Entry
            entriesXml += `<LEDGERENTRIES.LIST><LEDGERNAME>${esc(ledgerName)}</LEDGERNAME><ISDEEMEDPOSITIVE>${otherDeemedPos}</ISDEEMEDPOSITIVE><AMOUNT>${(taxable * (isSales ? 1 : -1)).toFixed(2)}</AMOUNT></LEDGERENTRIES.LIST>`;
            
            // Tax Entry (simplified for bulk performance)
            if (taxAmt > 0) {
                const taxLedger = `${v.voucherType === 'Sales' ? 'Output' : 'Input'} IGST ${item.taxRate}%`;
                entriesXml += `<LEDGERENTRIES.LIST><LEDGERNAME>${esc(taxLedger)}</LEDGERNAME><ISDEEMEDPOSITIVE>${otherDeemedPos}</ISDEEMEDPOSITIVE><AMOUNT>${(taxAmt * (isSales ? 1 : -1)).toFixed(2)}</AMOUNT></LEDGERENTRIES.LIST>`;
            }
        }

        const partyAmt = (runningTotal * (isSales ? -1 : 1)).toFixed(2);
        vouchersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${v.voucherType}" ACTION="Create"><DATE>${dateXml}</DATE><VOUCHERTYPENAME>${v.voucherType}</VOUCHERTYPENAME><VOUCHERNUMBER>${esc(v.invoiceNo)}</VOUCHERNUMBER><PARTYLEDGERNAME>${esc(partyName)}</PARTYLEDGERNAME><LEDGERENTRIES.LIST><LEDGERNAME>${esc(partyName)}</LEDGERNAME><ISDEEMEDPOSITIVE>${partyDeemedPos}</ISDEEMEDPOSITIVE><ISPARTYLEDGER>Yes</ISPARTYLEDGER><AMOUNT>${partyAmt}</AMOUNT><BILLALLOCATIONS.LIST><NAME>${esc(v.invoiceNo)}</NAME><BILLTYPE>New Ref</BILLTYPE><AMOUNT>${partyAmt}</AMOUNT></BILLALLOCATIONS.LIST></LEDGERENTRIES.LIST>${entriesXml}</VOUCHER></TALLYMESSAGE>`;
    }

    return `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${svCompany}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>${mastersXml}</REQUESTDATA></IMPORTDATA><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${svCompany}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>${vouchersXml}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
};

export const generateTallyXml = (data: InvoiceData, existingLedgers: Set<string> = new Set()): string => {
  const isSales = data.voucherType === 'Sales';
  const dateXml = formatDateForXml(data.invoiceDate); 
  const svCompany = data.targetCompany && data.targetCompany.trim() ? esc(data.targetCompany) : '##SVCurrentCompany';
  
  const rawPartyName = (isSales ? data.buyerName : data.supplierName) || "Cash Party";
  const partyName = cleanName(rawPartyName);
  const partyGroup = isSales ? 'Sundry Debtors' : 'Sundry Creditors';
  const ledgerParentGroup = isSales ? 'Sales Accounts' : 'Purchase Accounts';
  
  const supplierGstin = (data.supplierGstin || '').trim().toUpperCase();
  const buyerGstin = (data.buyerGstin || '').trim().toUpperCase();
  const partyGstin = isSales ? buyerGstin : supplierGstin;
  const partyState = getStateName(partyGstin);
  const isInterState = (supplierGstin.substring(0, 2) !== buyerGstin.substring(0, 2)) && (supplierGstin.length === 15 && buyerGstin.length === 15);
  
  let mastersXml = '';
  if (!existingLedgers.has(partyName)) {
    mastersXml += `
    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <LEDGER NAME="${esc(partyName)}" ACTION="Create">
        <NAME.LIST><NAME>${esc(partyName)}</NAME></NAME.LIST>
        <PARENT>${partyGroup}</PARENT>
        <ISBILLWISEON>Yes</ISBILLWISEON>
        <ISGSTAPPLICABLE>Yes</ISGSTAPPLICABLE>
        ${partyGstin ? `<PARTYGSTIN>${esc(partyGstin)}</PARTYGSTIN>` : ''}
        <STATENAME>${esc(partyState)}</STATENAME>
      </LEDGER>
    </TALLYMESSAGE>`;
  }

  const uniqueRates = new Set<number>();
  data.lineItems.forEach(item => uniqueRates.add(Number(item.gstRate) || 0));

  uniqueRates.forEach(rate => {
    const rateStr = formatRate(rate);
    const ledgerName = `${isSales ? 'SALE' : 'PURCHASE'} @${rateStr}%`;
    if (!existingLedgers.has(ledgerName)) {
        mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(ledgerName)}" ACTION="Create"><NAME.LIST><NAME>${esc(ledgerName)}</NAME></NAME.LIST><PARENT>${ledgerParentGroup}</PARENT><ISGSTAPPLICABLE>Yes</ISGSTAPPLICABLE></LEDGER></TALLYMESSAGE>`;
    }
    if (rate > 0) {
        const taxParent = "Duties & Taxes";
        if (isInterState) {
            const igstName = `${isSales ? 'Output' : 'Input'} IGST ${rateStr}%`;
            if (!existingLedgers.has(igstName)) {
                mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(igstName)}" ACTION="Create"><NAME.LIST><NAME>${esc(igstName)}</NAME></NAME.LIST><PARENT>${taxParent}</PARENT><TAXTYPE>GST</TAXTYPE><GSTDUTYHEAD>Integrated Tax</GSTDUTYHEAD><GSTRATE>${rate}</GSTRATE></LEDGER></TALLYMESSAGE>`;
            }
        } else {
            const half = rate / 2;
            const halfStr = formatRate(half);
            const cgstName = `${isSales ? 'Output' : 'Input'} CGST@${halfStr}%`;
            const sgstName = `${isSales ? 'Output' : 'Input'} SGST@${halfStr}%`;
            if (!existingLedgers.has(cgstName)) mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(cgstName)}" ACTION="Create"><NAME.LIST><NAME>${esc(cgstName)}</NAME></NAME.LIST><PARENT>${taxParent}</PARENT><TAXTYPE>GST</TAXTYPE><GSTDUTYHEAD>Central Tax</GSTDUTYHEAD><GSTRATE>${half}</GSTRATE></LEDGER></TALLYMESSAGE>`;
            if (!existingLedgers.has(sgstName)) mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(sgstName)}" ACTION="Create"><NAME.LIST><NAME>${esc(sgstName)}</NAME></NAME.LIST><PARENT>${taxParent}</PARENT><TAXTYPE>GST</TAXTYPE><GSTDUTYHEAD>State Tax</GSTDUTYHEAD><GSTRATE>${half}</GSTRATE></LEDGER></TALLYMESSAGE>`;
        }
    }
  });

  const ledgerTotals: Record<string, number> = {};
  let totalVoucherAmount = 0;

  data.lineItems.forEach(item => {
      const taxable = round(item.amount);
      const rate = Number(item.gstRate) || 0;
      const rateStr = formatRate(rate);
      const ledgerName = `${isSales ? 'SALE' : 'PURCHASE'} @${rateStr}%`;
      
      ledgerTotals[ledgerName] = (ledgerTotals[ledgerName] || 0) + taxable;
      totalVoucherAmount += taxable;

      if (rate > 0) {
          const totalTax = round(taxable * (rate / 100));
          totalVoucherAmount += totalTax;
          if (isInterState) {
              const name = `${isSales ? 'Output' : 'Input'} IGST ${rateStr}%`;
              ledgerTotals[name] = (ledgerTotals[name] || 0) + totalTax;
          } else {
              const halfTax = round(totalTax / 2);
              const halfStr = formatRate(rate / 2);
              const cName = `${isSales ? 'Output' : 'Input'} CGST@${halfStr}%`;
              const sName = `${isSales ? 'Output' : 'Input'} SGST@${halfStr}%`;
              ledgerTotals[cName] = (ledgerTotals[cName] || 0) + halfTax;
              ledgerTotals[sName] = (ledgerTotals[sName] || 0) + round(totalTax - halfTax);
          }
      }
  });

  const partyAmount = round(totalVoucherAmount);
  const partyDeemedPos = isSales ? 'Yes' : 'No';
  const partyAmountVal = (partyAmount * (isSales ? -1 : 1)).toFixed(2);

  let ledgerEntriesXml = `
    <LEDGERENTRIES.LIST>
      <LEDGERNAME>${esc(partyName)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>${partyDeemedPos}</ISDEEMEDPOSITIVE>
      <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
      <AMOUNT>${partyAmountVal}</AMOUNT>
      <BILLALLOCATIONS.LIST>
        <NAME>${esc(data.invoiceNumber)}</NAME>
        <BILLTYPE>New Ref</BILLTYPE>
        <AMOUNT>${partyAmountVal}</AMOUNT>
      </BILLALLOCATIONS.LIST>
    </LEDGERENTRIES.LIST>`;

  const otherDeemedPos = isSales ? 'No' : 'Yes';
  const otherSign = isSales ? 1 : -1;

  Object.entries(ledgerTotals).forEach(([name, amt]) => {
      const val = (amt * otherSign).toFixed(2);
      ledgerEntriesXml += `
    <LEDGERENTRIES.LIST>
      <LEDGERNAME>${esc(name)}</LEDGERNAME>
      <ISDEEMEDPOSITIVE>${otherDeemedPos}</ISDEEMEDPOSITIVE>
      <AMOUNT>${val}</AMOUNT>
    </LEDGERENTRIES.LIST>`;
  });

  return `
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${svCompany}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${mastersXml}</REQUESTDATA>
    </IMPORTDATA>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${svCompany}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${data.voucherType}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${dateXml}</DATE>
            <VOUCHERTYPENAME>${data.voucherType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${esc(data.invoiceNumber)}</VOUCHERNUMBER>
            <REFERENCE>${esc(data.invoiceNumber)}</REFERENCE>
            <PARTYLEDGERNAME>${esc(partyName)}</PARTYLEDGERNAME>
            <STATENAME>${esc(partyState)}</STATENAME>
            <PLACEOFSUPPLY>${esc(partyState)}</PLACEOFSUPPLY>
            <EFFECTIVEDATE>${dateXml}</EFFECTIVEDATE>
            <ISINVOICE>Yes</ISINVOICE>
            <NARRATION>Auto-Imported Ref: ${esc(data.invoiceNumber)}</NARRATION>
            ${ledgerEntriesXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

export const pushToTally = async (xml: string): Promise<TallyResponse> => {
  try {
    const response = await fetch(TALLY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: xml
    });
    const text = await response.text();
    if (text.includes("<ERRORS>0</ERRORS>") && (text.includes("<CREATED>1</CREATED>") || text.includes("<ALTERED>1</ALTERED>") || text.includes("<CREATED>"))) {
      return { success: true, message: "Imported Successfully" };
    }
    const match = text.match(/<LINEERROR>(.*?)<\/LINEERROR>/);
    return { success: false, message: match ? match[1] : "Tally integration error" };
  } catch (error) {
    return { success: false, message: "Connection to Tally failed. Check proxy/ngrok." };
  }
};

export const fetchOpenCompanies = async (): Promise<string[]> => {
  const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
  try {
    const response = await fetch(TALLY_API_URL, { method: 'POST', body: xml });
    const text = await response.text();
    const names: string[] = [];
    const regex = /<COMPANYNAME[^>]*>(.*?)<\/COMPANYNAME>/gi; 
    let match;
    while ((match = regex.exec(text)) !== null) { names.push(decodeHtml(match[1])); }
    return [...new Set(names)].sort();
  } catch (error) { return []; }
};

export const fetchExistingLedgers = async (companyName?: string): Promise<Set<string>> => {
    const svCompany = companyName ? esc(companyName) : '##SVCurrentCompany';
    const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Accounts</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT><ACCOUNTTYPE>Ledgers</ACCOUNTTYPE><SVCURRENTCOMPANY>${svCompany}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
  try {
      const response = await fetch(TALLY_API_URL, { method: 'POST', body: xml });
      const text = await response.text();
      const ledgers = new Set<string>();
      const regexName = /<NAME>(.*?)<\/NAME>/gi;
      let match;
      while ((match = regexName.exec(text)) !== null) { ledgers.add(decodeHtml(match[1])); }
      return ledgers;
  } catch (error) { return new Set(); }
};

export const fetchCompanyDetails = async (companyName: string): Promise<{ gstin: string; state: string } | null> => {
  const xml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>ODBC Report</REPORTNAME><STATICVARIABLES><SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT></STATICVARIABLES></REQUESTDESC><REQUESTDATA><TALLYMESSAGE xmlns:UDF="TallyUDF"><COLLECTION NAME="CompanyDetails" TYPE="Company"><NATIVEMETHOD>Name</NATIVEMETHOD><NATIVEMETHOD>GSTIN</NATIVEMETHOD><NATIVEMETHOD>StateName</NATIVEMETHOD><FILTERS>CompanyNameFilter</FILTERS></COLLECTION><SYSTEM TYPE="Formulae" NAME="CompanyNameFilter">$Name = "${companyName}"</SYSTEM></TALLYMESSAGE></REQUESTDATA></EXPORTDATA></BODY></ENVELOPE>`;
  try {
    const response = await fetch(TALLY_API_URL, { method: 'POST', body: xml });
    const text = await response.text();
    const gstinMatch = text.match(/<GSTIN>(.*?)<\/GSTIN>/i);
    const stateMatch = text.match(/<STATENAME>(.*?)<\/STATENAME>/i);
    if (gstinMatch || stateMatch) return { gstin: gstinMatch ? decodeHtml(gstinMatch[1]) : '', state: stateMatch ? decodeHtml(stateMatch[1]) : '' };
    return null;
  } catch (e) { return null; }
};

export const checkTallyConnection = async (): Promise<{ online: boolean; msg: string; activeCompany?: string }> => {
  try {
     const controller = new AbortController();
     const id = setTimeout(() => controller.abort(), 2000); 
     const response = await fetch(`${TALLY_API_URL}/health`, { signal: controller.signal });
     clearTimeout(id);
     if (response.ok) return { online: true, msg: "Proxy Connected" };
     return { online: true, msg: "Port Accessible" };
  } catch {
     return { online: false, msg: "Offline" };
  }
};

export const generateBankStatementXml = (data: BankStatementData, existingLedgers: Set<string>, targetCompany: string): string => {
    const svCompany = targetCompany ? esc(targetCompany) : '##SVCurrentCompany';
    let mastersXml = '';
    if (!existingLedgers.has(data.bankName)) {
        mastersXml += `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${esc(data.bankName)}" ACTION="Create"><NAME.LIST><NAME>${esc(data.bankName)}</NAME></NAME.LIST><PARENT>Bank Accounts</PARENT></LEDGER></TALLYMESSAGE>`;
    }
    
    let vouchersXml = '';
    data.transactions.forEach(txn => {
        const dateXml = formatDateForXml(txn.date);
        const amount = txn.withdrawal > 0 ? txn.withdrawal : txn.deposit;
        const isPayment = txn.voucherType === 'Payment';
        const bankDeemed = isPayment ? 'No' : 'Yes';
        const partyDeemed = isPayment ? 'Yes' : 'No';
        const bankAmt = (amount * (isPayment ? 1 : -1)).toFixed(2);
        const partyAmt = (amount * (isPayment ? -1 : 1)).toFixed(2);

        vouchersXml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${txn.voucherType}" ACTION="Create">
            <DATE>${dateXml}</DATE>
            <NARRATION>${esc(txn.description)}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>${esc(data.bankName)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${bankDeemed}</ISDEEMEDPOSITIVE>
                <AMOUNT>${bankAmt}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>${esc(txn.contraLedger)}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>${partyDeemed}</ISDEEMEDPOSITIVE>
                <AMOUNT>${partyAmt}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
    });

    return `<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>All Masters</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${svCompany}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>${mastersXml}</REQUESTDATA></IMPORTDATA><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME><STATICVARIABLES><SVCURRENTCOMPANY>${svCompany}</SVCURRENTCOMPANY></STATICVARIABLES></REQUESTDESC><REQUESTDATA>${vouchersXml}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`;
};

export const getLedgersFromCache = (companyName?: string): Set<string> => {
    const saved = localStorage.getItem('autotally_masters_sync');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (companyName && parsed.ledgers?.[companyName]) {
            return new Set(parsed.ledgers[companyName]);
        }
        const all = new Set<string>();
        Object.values(parsed.ledgers || {}).forEach((arr: any) => arr.forEach((l: string) => all.add(l)));
        return all;
    }
    return new Set();
};

export const getCompaniesFromCache = (): string[] => {
    const saved = localStorage.getItem('autotally_masters_sync');
    if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.companies || [];
    }
    return [];
};

/**
 * Interface and function to sync masters from all open Tally companies.
 */
export interface TallyMasterSync { 
  companies: string[]; 
  ledgers: Record<string, string[]>; 
  lastSync: number; 
}

export const syncMastersFromAllCompanies = async (): Promise<TallyMasterSync> => {
    const companies = await fetchOpenCompanies();
    const ledgersMap: Record<string, string[]> = {};
    for (const company of companies) {
        const ledgersSet = await fetchExistingLedgers(company);
        ledgersMap[company] = Array.from(ledgersSet);
    }
    return { companies, ledgers: ledgersMap, lastSync: Date.now() };
};
