
import React, { useState, useEffect } from 'react';
import InvoiceEditor from './components/InvoiceEditor';
import TallyLogs from './components/TallyLogs';
import Dashboard from './components/Dashboard';
import InvoiceUpload from './components/InvoiceUpload';
import ChatBot from './components/ChatBot';
import BankStatementManager from './components/BankStatementManager';
import ExcelImportManager from './components/ExcelImportManager';
import Navbar from './components/Navbar';
import InvalidFileModal from './components/InvalidFileModal';
import SettingsModal from './components/SettingsModal';
import AuthScreen from './components/AuthScreen';
import { InvoiceData, LogEntry, AppView, ProcessedFile, Message } from './types';
import { ArrowRight, CheckCircle2, X, FileText, AlertTriangle, CloudUpload, LayoutDashboard } from 'lucide-react';
import { checkTallyConnection, fetchExistingLedgers, generateTallyXml, pushToTally } from './services/tallyService';
import { processDocumentWithAI } from './services/backendService';
import { saveInvoiceToDB, saveLogToDB, deleteUploadFromDB, saveInvoiceRegistry, checkInvoiceExists, getInvoiceRegistry } from './services/dbService';
import { TALLY_API_URL, EMPTY_INVOICE, BACKEND_API_KEY } from './constants';
import { v4 as uuidv4 } from 'uuid';
import TallyDisconnectedModal from './components/TallyDisconnectedModal';
import ImportSummaryModal from './components/ImportSummaryModal';


const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

    // Chat State (Persists on Navigation, Clears on Refresh)
    const [chatMessages, setChatMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: 'Hello! I am your AutoTally Assistant. I specialize in Tally Prime XML, Indian GST laws, and accounting automation. How can I help you today?',
            timestamp: new Date()
        }
    ]);

    // Bulk Processing State
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Currently Active Invoice
    const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
    const [currentFile, setCurrentFile] = useState<File | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'editor' | 'xml' | 'json'>('editor');

    // Redirect Logic
    const [pendingBankStatementFile, setPendingBankStatementFile] = useState<File | null>(null);
    const [pendingExcelFile, setPendingExcelFile] = useState<ProcessedFile | null>(null);
    const [mismatchedFileAlert, setMismatchedFileAlert] = useState<{ show: boolean, file: ProcessedFile | null }>({ show: false, file: null });

    // Invalid File Alert
    const [invalidFileAlert, setInvalidFileAlert] = useState<{ show: boolean, fileName: string, reason: string }>({ show: false, fileName: '', reason: '' });

    // Settings Modal
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [logs, setLogs] = useState<LogEntry[]>([]);

    const [isPushing, setIsPushing] = useState(false);
    const [shouldAutoTriggerUpload, setShouldAutoTriggerUpload] = useState(false);

    // Import Summary State
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [importSummary, setImportSummary] = useState<{ total: number, skipped: number, success: number, failed: number, errors?: string[] }>({ total: 0, skipped: 0, success: 0, failed: 0 });

    // Toast
    const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

    // Dark Mode
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            return saved === 'dark';
        }
        return false;
    });

    // Tally Status
    const [tallyStatus, setTallyStatus] = useState<{ online: boolean; info: string; mode: 'full' | 'blind' | 'none'; activeCompany?: string }>({ online: false, info: 'Connecting...', mode: 'none' });
    const [showTallyDisconnectModal, setShowTallyDisconnectModal] = useState(false);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    useEffect(() => {
        if (isAuthenticated) {
            checkStatus();
        }
    }, [isAuthenticated]);

    // Auto-scroll to top when view changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentView]);

    // Sync currentInvoice
    useEffect(() => {
        if (currentFile) {
            const match = processedFiles.find(f => f.file === currentFile);
            if (match && match.data && match.data !== currentInvoice) {
                setCurrentInvoice(match.data);
            }
        }
    }, [processedFiles, currentFile, currentInvoice]);

    useEffect(() => {
        if (currentView === AppView.EDITOR && !currentInvoice && !currentFile && processedFiles.length > 0) {
            const latest = processedFiles.find(f => f.sourceType === 'OCR_INVOICE');
            if (latest) {
                setCurrentFile(latest.file);
                if (latest.data) {
                    setCurrentInvoice(latest.data);
                }
            }
        }
    }, [currentView, processedFiles, currentInvoice, currentFile]);

    const checkStatus = async () => {
        setTallyStatus({ online: false, info: 'Checking...', mode: 'none' });
        const status = await checkTallyConnection();
        setTallyStatus({
            online: status.online,
            info: status.info,
            mode: status.mode,
            activeCompany: status.activeCompany
        });
    };

    const handlePushLog = (status: 'Success' | 'Failed', message: string, response?: string) => {
        const log: LogEntry = {
            id: uuidv4(),
            timestamp: new Date(),
            method: 'POST',
            endpoint: TALLY_API_URL,
            status: status,
            message: message,
            response: response
        };
        setLogs(prev => [log, ...prev]);
        saveLogToDB(log);
        if (status === 'Success') {
            setToast({ show: true, message: message });
        }
    };

    const handleRegisterFile = (file: File, type: 'OCR_INVOICE' | 'BANK_STATEMENT' | 'EXCEL_IMPORT') => {
        const newEntry: ProcessedFile = {
            id: uuidv4(),
            file,
            fileName: file.name,
            sourceType: type,
            status: 'Processing',
            correctEntries: 0,
            incorrectEntries: 0,
            timeTaken: '0 min',
            uploadTimestamp: Date.now()
        };
        setProcessedFiles(prev => [newEntry, ...prev]);
        return newEntry.id;
    };

    const handleUpdateFile = (id: string, updates: Partial<ProcessedFile>) => {
        setProcessedFiles(prev => prev.map(f => {
            if (f.id === id) {
                const updatedFile = { ...f, ...updates };

                // Auto-navigate to Dashboard ONLY for OCR_INVOICE processing
                // Prevent redirect for Bank Statements or Excel Imports so user can edit them
                if ((updates.status === 'Success' || updates.status === 'Failed') && f.sourceType === 'OCR_INVOICE') {
                    setTimeout(() => setCurrentView(AppView.DASHBOARD), 100);
                }

                return updatedFile;
            }
            return f;
        }));
    };

    const calculateEntryStats = (data: InvoiceData) => {
        let correct = 0;
        let incorrect = 0;
        data.lineItems.forEach(item => {
            if (item.amount !== 0) correct++; else incorrect++;
        });
        return { correct, incorrect };
    };

    const handleBulkUpload = async (files: File[]) => {
        const newEntries: ProcessedFile[] = files.map(file => ({
            id: uuidv4(),
            file,
            fileName: file.name,
            sourceType: 'OCR_INVOICE',
            status: 'Pending',
            correctEntries: 0,
            incorrectEntries: 0,
            timeTaken: '-',
            uploadTimestamp: Date.now()
        }));
        setProcessedFiles(prev => [...newEntries, ...prev]);
        for (const entry of newEntries) {
            await processSingleFile(entry);
        }
    };

    const processSingleFile = async (entry: ProcessedFile, retryCount = 0) => {
        if (retryCount === 0) {
            setProcessedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'Processing' } : f));
        }

        const start = Date.now();
        try {
            if (!isAuthenticated) {
                throw new Error("User not authenticated");
            }
            const result = await processDocumentWithAI(entry.file, BACKEND_API_KEY);
            if (!result.success || !result.invoice) {
                throw new Error(result.message || 'Failed to process document');
            }
            const data = result.invoice;

            if (data.documentType === 'BANK_STATEMENT') {
                setProcessedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'Mismatch', error: "Detected as Bank Statement" } : f));
                setMismatchedFileAlert({ show: true, file: { ...entry, status: 'Mismatch', data: data } });
                return;
            }

            const duration = ((Date.now() - start) / 1000 / 60).toFixed(2);
            const { correct, incorrect } = calculateEntryStats(data);

            setProcessedFiles(prev => prev.map(f => {
                if (f.id === entry.id) {
                    return {
                        ...f,
                        status: 'Ready',
                        data: data,
                        timeTaken: `${duration} min`,
                        correctEntries: correct,
                        incorrectEntries: incorrect
                    };
                }
                return f;
            }));

            saveInvoiceToDB(data, 'Ready', entry.id);
            saveInvoiceToDB(data, 'Ready', entry.id);
            // Removed auto-save to registry. Registry save happens only on final confirmation/push.
            setToast({ show: true, message: `${entry.fileName} processed successfully` });

        } catch (error) {
            const duration = ((Date.now() - start) / 1000 / 60).toFixed(2);
            let errorMsg = error instanceof Error ? error.message : "Processing Failed";

            if (errorMsg.includes("The document has no pages")) {
                errorMsg = "Empty or Corrupted File";
                setInvalidFileAlert({ show: true, fileName: entry.fileName, reason: "File empty/corrupted." });
            }

            if (retryCount < 2) {
                // Retry Logic
                console.log(`Retrying ${entry.fileName}... Attempt ${retryCount + 1}`);
                setTimeout(() => processSingleFile(entry, retryCount + 1), 2000);
                return;
            }

            setProcessedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'Failed', error: errorMsg, timeTaken: `${duration} min` } : f));

            const failLog: LogEntry = {
                id: uuidv4(),
                timestamp: new Date(),
                method: 'POST',
                endpoint: 'GEMINI_API',
                status: 'Failed',
                message: `OCR Failed for ${entry.fileName}: ${errorMsg}`
            };
            setLogs(prev => [failLog, ...prev]);
            saveLogToDB(failLog);
        }
    };

    const handleSwitchToBankStatement = () => {
        const fileToMove = mismatchedFileAlert.file;
        if (fileToMove) {
            setProcessedFiles(prev => prev.filter(f => f.id !== fileToMove.id));
            setPendingBankStatementFile(fileToMove.file);
            setCurrentView(AppView.BANK_STATEMENT);
            setMismatchedFileAlert({ show: false, file: null });
        }
    };

    const handleRedirectToInvoice = (file: File) => {
        setCurrentView(AppView.DASHBOARD);
        handleBulkUpload([file]);
    };

    const handleRetryFailed = () => {
        const failed = processedFiles.filter(f => (f.status === 'Failed' || f.status === 'Mismatch') && f.sourceType === 'OCR_INVOICE');
        failed.forEach(f => processSingleFile(f));
    };

    const handleViewInvoice = (file: ProcessedFile) => {
        if (file.status === 'Mismatch') {
            setMismatchedFileAlert({ show: true, file });
            return;
        }

        // Bank Statement - navigate to view/edit
        if (file.sourceType === 'BANK_STATEMENT') {
            setCurrentView(AppView.BANK_STATEMENT);
            // Always set the file so it can be viewed, even if failed
            setPendingBankStatementFile(file.file);
            return;
        }

        // Excel Import - navigate and the file will be picked up by ExcelImportManager
        if (file.sourceType === 'EXCEL_IMPORT') {
            setCurrentView(AppView.EXCEL_IMPORT);
            setPendingExcelFile(file); // Store the clicked file
            return;
        }

        // Invoice - load data into editor
        if (file.data) {
            setCurrentInvoice(file.data);
            setCurrentFile(file.file);
            setCurrentView(AppView.EDITOR);
            setActiveTab('editor');
        }
    };

    const handleSaveInvoice = (data: InvoiceData, switchTab: boolean = true, silent: boolean = false) => {
        setCurrentInvoice(data);
        if (switchTab) setActiveTab('xml');
        else if (!silent) setToast({ show: true, message: "Invoice updated successfully" });

        if (currentFile) {
            const { correct, incorrect } = calculateEntryStats(data);
            const fileEntry = processedFiles.find(f => f.file === currentFile);

            setProcessedFiles(prev => prev.map(f => f.file === currentFile ? { ...f, data, correctEntries: correct, incorrectEntries: incorrect } : f));

            if (fileEntry) saveInvoiceToDB(data, fileEntry.status, fileEntry.id);
        }

        if (data.invoiceNumber && !silent) {
            // Check for duplicates purely for UI warning in editor (non-blocking)
            checkInvoiceExists(data.invoiceNumber).then(exists => {
                if (exists) {
                    setToast({ show: true, message: `Warning: Invoice ${data.invoiceNumber} is already registered.` });
                }
            });
        }
    };

    const handleNavigateInvoice = (direction: 'next' | 'prev') => {
        const currentIndex = processedFiles.findIndex(f => f.file === currentFile);
        if (currentIndex === -1) return;
        const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < processedFiles.length) {
            const nextFile = processedFiles[newIndex];
            if (nextFile.sourceType === 'OCR_INVOICE' && nextFile.data) handleViewInvoice(nextFile);
        }
    };

    const handleDeleteFile = (fileId?: string) => {
        const targetFileEntry = fileId ? processedFiles.find(f => f.id === fileId) : (currentFile ? processedFiles.find(f => f.file === currentFile) : undefined);

        if (!targetFileEntry) return;

        // 1. Delete from DB
        deleteUploadFromDB(targetFileEntry.id).catch(console.error);

        // 2. Find index of target file
        const currentIndex = processedFiles.findIndex(f => f.id === targetFileEntry.id);

        // 3. Remove target from list locally
        const updatedFiles = processedFiles.filter(f => f.id !== targetFileEntry.id);

        // 4. Find nearest neighbor of type OCR_INVOICE
        let nextInvoice: ProcessedFile | undefined;

        // Look ahead
        for (let i = currentIndex + 1; i < processedFiles.length; i++) {
            if (processedFiles[i].sourceType === 'OCR_INVOICE') {
                nextInvoice = processedFiles[i];
                break;
            }
        }

        // If not found ahead, look behind
        if (!nextInvoice) {
            for (let i = currentIndex - 1; i >= 0; i--) {
                if (processedFiles[i].sourceType === 'OCR_INVOICE') {
                    nextInvoice = processedFiles[i];
                    break;
                }
            }
        }

        // 5. Update State
        setProcessedFiles(updatedFiles);

        if (nextInvoice && updatedFiles.some(f => f.id === nextInvoice?.id)) {
            // Wait a tick or just update current
            // Since handleViewInvoice relies on processedFiles state (which is stale in this closure),
            // We manually do what handleViewInvoice does:
            setCurrentFile(nextInvoice.file);
            if (nextInvoice.data) setCurrentInvoice(nextInvoice.data);
            // handleViewInvoice(nextInvoice); // This might use old state if it uses processedFiles.find
        } else {
            // No other invoices found
            setCurrentFile(undefined);
            setCurrentInvoice(null);
            setCurrentView(AppView.EDITOR);
        }
    };

    const handleAddFile = () => {
        // Navigate to upload view to add more files and auto-trigger picker
        setShouldAutoTriggerUpload(true);
        setCurrentView(AppView.UPLOAD);
    };

    const handleAddFilesFromEditor = (files: File[]) => {
        if (files.length === 0) return;

        // Use existing bulk upload logic
        handleBulkUpload(files);

        // Set context to the first new file immediately
        setCurrentFile(files[0]);
        setCurrentInvoice(null);
    };




    const handlePushToTally = async (invoiceData?: InvoiceData) => {
        const targetInvoice = invoiceData || currentInvoice;
        if (!targetInvoice) return;
        const fileEntry = processedFiles.find(f => f.file === currentFile);
        await performPush(targetInvoice, fileEntry?.id);
    };

    const validateInvoiceForPush = (invoice: InvoiceData): string | null => {
        if (!invoice.invoiceNumber || !invoice.invoiceNumber.trim()) return "Invoice Number is missing.";
        if (!invoice.invoiceDate || !invoice.invoiceDate.trim()) return "Invoice Date is missing.";

        const isSales = invoice.voucherType === 'Sales';
        if (isSales) {
            if (!invoice.buyerName || !invoice.buyerName.trim()) return "Buyer Name (Party) is missing.";
        } else {
            if (!invoice.supplierName || !invoice.supplierName.trim()) return "Supplier Name (Party) is missing.";
        }
        return null;
    };

    const performPush = async (invoice: InvoiceData, fileId?: string) => {
        // 0. Strict Validation
        const validationError = validateInvoiceForPush(invoice);
        if (validationError) {
            setToast({ show: true, message: validationError });
            if (fileId) {
                setProcessedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'Failed', error: validationError } : f));
            }
            return;
        }

        // 1. Duplicate Check
        if (invoice.invoiceNumber) {
            const exists = await checkInvoiceExists(invoice.invoiceNumber);
            if (exists) {
                // Show Summary Modal instead of Toast
                setImportSummary({ total: 1, skipped: 1, success: 0, failed: 0 });
                setSummaryModalOpen(true);
                
                // Still log internally but silent
                const msg = `Skipped: Invoice ${invoice.invoiceNumber} already exists.`;
                const log: LogEntry = {
                    id: uuidv4(), timestamp: new Date(), method: 'POST', endpoint: TALLY_API_URL, 
                    status: 'Failed', message: 'Duplicate Skipped', response: msg 
                };
                setLogs(prev => [log, ...prev]);
                saveLogToDB(log);

                if (fileId) {
                    setProcessedFiles(prev => prev.map(f => {
                        if (f.id === fileId) {
                            // If already success, don't revert to Failed. 
                            // This prevents "Success" -> "Failed" if user clicks push again.
                            if (f.status === 'Success') return f;
                            return { ...f, status: 'Failed', error: 'Duplicate Invoice Number' };
                        } 
                        return f;
                    }));
                }
                return;
            }
        }

        // Pre-check Connection
        const status = await checkTallyConnection();
        if (!status.online) {
            setShowTallyDisconnectModal(true);
            return;
        }

        setIsPushing(true);
        const newLogId = uuidv4();
        const pendingLog: LogEntry = {
            id: newLogId,
            timestamp: new Date(),
            method: 'POST',
            endpoint: TALLY_API_URL,
            status: 'Pending',
            message: `Pushing Invoice ${invoice.invoiceNumber}...`
        };
        setLogs(prev => [pendingLog, ...prev]);

        try {
            const existingLedgers = await fetchExistingLedgers(invoice.targetCompany);
            const xml = generateTallyXml(invoice, existingLedgers);
            const result = await pushToTally(xml);

            // Update Log
            const updatedLog: LogEntry = {
                ...pendingLog,
                status: result.success ? 'Success' : 'Failed',
                message: result.success ? `Imported ${invoice.invoiceNumber}` : `Failed: ${invoice.invoiceNumber}`,
                response: result.message
            };

            setLogs(prev => prev.map(l => l.id === newLogId ? updatedLog : l));
            saveLogToDB(updatedLog);

            // Update File Status & DB
            if (fileId) {
                const newStatus = result.success ? 'Success' : 'Failed';
                setProcessedFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: newStatus } : f));
                saveInvoiceToDB(invoice, newStatus, fileId);
            }

            if (result.success && invoice.invoiceNumber) {
                saveInvoiceRegistry(invoice.invoiceNumber, 'OCR');
            }

            // Show Summary Modal
            setImportSummary({ 
                total: 1, 
                skipped: 0, 
                success: result.success ? 1 : 0, 
                failed: result.success ? 0 : 1,
                errors: result.success ? [] : [result.message]
            });
            setSummaryModalOpen(true);

        } catch (error: any) {
            setIsPushing(false);
            // Show Failure in Modal
            setImportSummary({ 
                total: 1, 
                skipped: 0, 
                success: 0, 
                failed: 1,
                errors: [error.message || 'Unknown error occurred']
             });
            setSummaryModalOpen(true);
        } finally {
            setIsPushing(false);
        }
    };

    const handleEditorPush = async (data: InvoiceData) => {
        handleSaveInvoice(data, false, true); // Silent save: No toasts
        // Find the file ID for the current file to update status
        const fileEntry = processedFiles.find(f => f.file === currentFile);
        await performPush(data, fileEntry?.id);
    };

    const handleBulkPushToTally = async () => {
        const readyFiles = processedFiles.filter(f => (f.status === 'Ready') && f.data && f.sourceType === 'OCR_INVOICE');
        if (readyFiles.length === 0) return;

        // Pre-check Connection
        const status = await checkTallyConnection();
        if (!status.online) {
            setShowTallyDisconnectModal(true);
            return;
        }

        setIsPushing(true);
        let skipped = 0;
        let success = 0;
        let failed = 0;

        // Fetch Registry once
        const allRegistry = await getInvoiceRegistry();
        const existingNumbers = new Set(allRegistry.map(r => r.invoiceNumber.toLowerCase()));
        
        const errors: string[] = [];

        for (const file of readyFiles) {
            if (file.data && file.data.invoiceNumber) {
                // Check duplicate
                if (existingNumbers.has(file.data.invoiceNumber.toLowerCase())) {
                    skipped++;
                    // Mark as Failed/Duplicate in UI
                    setProcessedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'Failed', error: 'Duplicate Invoice' } : f));
                    continue;
                }

                // Push
                const existingLedgers = await fetchExistingLedgers(file.data.targetCompany);
                const xml = generateTallyXml(file.data, existingLedgers);
                const result = await pushToTally(xml);

                if (result.success) {
                    success++;
                    setProcessedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'Success' } : f));
                    saveInvoiceToDB(file.data, 'Success', file.id);
                    saveInvoiceRegistry(file.data.invoiceNumber, 'OCR');
                    // Add to local set to prevent duplicate within same batch
                    existingNumbers.add(file.data.invoiceNumber.toLowerCase());
                } else {
                    failed++;
                    errors.push(`${file.data.invoiceNumber}: ${result.message}`);
                    setProcessedFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'Failed', error: result.message } : f));
                    saveInvoiceToDB(file.data, 'Failed', file.id);
                }
            } else {
                failed++; // Missing data/invoice number
                errors.push('Missing Invoice Number or Data');
            }
        }
        
        setIsPushing(false);
        setImportSummary({ 
            total: readyFiles.length,
            skipped,
            success,
            failed,
            errors
        });
        setSummaryModalOpen(true);
    };

    const handleDownload = (file: ProcessedFile) => {
        const dataToDownload = file.data || file.bankData || file.excelData;

        if (!dataToDownload) {
            // Fallback: Download metadata if no structured data exists
            const metadata = {
                fileName: file.fileName,
                status: file.status,
                error: file.error || undefined,
                uploadTimestamp: new Date(file.uploadTimestamp).toISOString()
            };
            const reportText = JSON.stringify(metadata, null, 2);
            const blob = new Blob([reportText], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.fileName.split('.')[0]}_metadata.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        }

        const reportText = JSON.stringify(dataToDownload, null, 2);
        const blob = new Blob([reportText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.fileName.split('.')[0]}_data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        if (filteredFiles.length === 0) {
            setToast({ show: true, message: "No files to download" });
            return;
        }

        const reportData = filteredFiles.map(f => ({
            fileName: f.fileName,
            status: f.status,
            sourceType: f.sourceType,
            data: f.data || f.bankData || f.excelData || { error: "No structured data available" },
            metadata: {
                error: f.error,
                timeTaken: f.timeTaken,
                uploadTime: new Date(f.uploadTimestamp).toISOString()
            }
        }));

        const reportText = JSON.stringify(reportData, null, 2);
        const blob = new Blob([reportText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `autotally_export_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToast({ show: true, message: `Exported ${filteredFiles.length} files` });
    };

    const handleLock = () => {
        setIsAuthenticated(false);
    };

    const filteredFiles = processedFiles.filter(f => {
        const term = searchTerm.toLowerCase().trim();
        let matchesSearch = f.fileName.toLowerCase().includes(term);
        if (!matchesSearch && f.data) {
            matchesSearch = (
                (f.data.invoiceNumber || '').toLowerCase().includes(term) ||
                (f.data.supplierName || '').toLowerCase().includes(term)
            );
        }
        let matchesFilter = false;
        if (filterStatus === 'All') matchesFilter = true;
        else if (['Success', 'Ready', 'Failed', 'Processing'].includes(filterStatus)) matchesFilter = f.status === filterStatus;
        else if (['Invoices', 'Bank', 'Excel'].includes(filterStatus)) {
            if (filterStatus === 'Invoices') matchesFilter = f.sourceType === 'OCR_INVOICE';
            if (filterStatus === 'Bank') matchesFilter = f.sourceType === 'BANK_STATEMENT';
            if (filterStatus === 'Excel') matchesFilter = f.sourceType === 'EXCEL_IMPORT';
        }
        else {
            if (filterStatus === 'Sales') matchesFilter = f.sourceType === 'OCR_INVOICE' && f.data?.voucherType === 'Sales';
            if (filterStatus === 'Purchase') matchesFilter = f.sourceType === 'OCR_INVOICE' && f.data?.voucherType === 'Purchase';
            if (filterStatus === 'Bank Statement') matchesFilter = f.sourceType === 'BANK_STATEMENT';
            if (filterStatus === 'Excel') matchesFilter = f.sourceType === 'EXCEL_IMPORT';
        }
        return matchesSearch && matchesFilter;
    });

    const currentIndex = processedFiles.findIndex(f => f.file === currentFile);
    const totalInvoices = processedFiles.filter(f => f.sourceType === 'OCR_INVOICE').length;

    const renderContent = () => {
        if (currentView === AppView.DASHBOARD) return (
            <Dashboard
                files={filteredFiles}
                onNavigateToUpload={() => setCurrentView(AppView.UPLOAD)}
                onRetry={handleRetryFailed}
                onView={handleViewInvoice}
                onPushSuccess={handleBulkPushToTally}
                isPushing={isPushing}
                onDownload={handleDownload}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                onDownloadAll={handleDownloadAll}
            />
        );
        if (currentView === AppView.UPLOAD) return (
            <InvoiceUpload
                autoTrigger={shouldAutoTriggerUpload}
                onAutoTriggered={() => setShouldAutoTriggerUpload(false)}
                onFilesSelected={(files) => {
                    handleBulkUpload(files);
                    if (files.length > 0) {
                        setCurrentFile(files[0]);
                        setCurrentInvoice(null);
                        setCurrentView(AppView.EDITOR);
                    }
                    else setCurrentView(AppView.DASHBOARD);
                }}
                onRestoreDraft={(data) => {
                    handleSaveInvoice(data, false); setActiveTab('editor'); setCurrentView(AppView.EDITOR);
                    setToast({ show: true, message: "Draft restored" });
                }}
            />
        );
        if (currentView === AppView.EDITOR) {
            // Logic Fix: Ensure we show Editor if currentFile is present, even if processing
            if (!currentFile) return (
                <div className="flex flex-col h-full items-center justify-center p-8 animate-fade-in">
                    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
                        {/* Header Section */}
                        <div className="mb-12 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-200 dark:border-indigo-500/30">
                                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">No Invoices Uploaded</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
                                Extract, verify, and synchronize your tax documents with Tally Prime.
                                Start by selecting an existing invoice or uploading a new one.
                            </p>
                        </div>

                        {/* Action Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

                            {/* Card 1: Process New */}
                            <button
                                onClick={() => setCurrentView(AppView.UPLOAD)}
                                className="group flex flex-col p-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500/50 rounded-3xl transition-all duration-300 text-left relative overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10"
                            >
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <CloudUpload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-sm">PROCESS NEW</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Upload PDFs or images for AI OCR extraction.
                                </p>
                                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </button>

                            {/* Card 2: Go to Dashboard */}
                            <button
                                onClick={() => setCurrentView(AppView.DASHBOARD)}
                                className="group flex flex-col p-8 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/50 rounded-3xl transition-all duration-300 text-left relative overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10"
                            >
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <LayoutDashboard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wide text-sm">GO TO DASHBOARD</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    View all processed and pending documents.
                                </p>
                                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </button>

                        </div>

                    </div>
                </div>
            );

            const fileEntry = processedFiles.find(f => f.file === currentFile);
            // If no fileEntry (rare race condition) or status is processing, we are Scanning
            const isProcessing = !fileEntry || fileEntry.status === 'Processing' || fileEntry.status === 'Pending';

            const displayData = currentInvoice || (fileEntry?.data) || EMPTY_INVOICE;

            return (
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-hidden">
                        <InvoiceEditor
                            data={displayData}
                            file={currentFile}
                            onSave={handleSaveInvoice}
                            onPush={handleEditorPush}
                            onDelete={handleDeleteFile}
                            onAddFile={handleAddFile}
                            onAddFiles={handleAddFilesFromEditor}
                            isPushing={isPushing}
                            isScanning={isProcessing}
                            currentIndex={currentIndex} totalCount={totalInvoices}
                            onNext={() => handleNavigateInvoice('next')} onPrev={() => handleNavigateInvoice('prev')}
                            hasNext={currentIndex < processedFiles.length - 1} hasPrev={currentIndex > 0}
                        />
                    </div>
                </div>
            );
        }
        if (currentView === AppView.BANK_STATEMENT) return (
            <BankStatementManager
                onPushLog={handlePushLog} externalFile={pendingBankStatementFile} externalData={processedFiles.find(f => f.sourceType === 'BANK_STATEMENT' && f.bankData)?.bankData || null} onRedirectToInvoice={handleRedirectToInvoice}
                onRegisterFile={(f) => handleRegisterFile(f, 'BANK_STATEMENT')}
                onUpdateFile={handleUpdateFile}
                onDelete={handleDeleteFile}
            />
        );
        if (currentView === AppView.EXCEL_IMPORT) {
            // Use the pending Excel file or find one with data
            const excelFile = pendingExcelFile || processedFiles.find(f => f.sourceType === 'EXCEL_IMPORT' && f.excelData);
            return (
                <ExcelImportManager
                    onPushLog={handlePushLog}
                    onRegisterFile={(f) => handleRegisterFile(f, 'EXCEL_IMPORT')}
                    onUpdateFile={handleUpdateFile}
                    externalFile={excelFile?.file || null}
                    externalFileId={excelFile?.id || null}
                    externalMappedData={excelFile?.excelData || null}
                    externalMapping={excelFile?.excelMapping || null}
                    onDelete={handleDeleteFile}
                />
            );
        }
        if (currentView === AppView.CHAT) return (
            <ChatBot
                messages={chatMessages}
                onUpdateMessages={setChatMessages}
            />
        );
        if (currentView === AppView.LOGS) return <TallyLogs logs={logs} />;
        return null;
    };

    // Auth Guard
    if (!isAuthenticated) {
        return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 relative">
            {isSettingsOpen && (
                <SettingsModal
                    onClose={() => setIsSettingsOpen(false)}
                    darkMode={darkMode}
                    toggleDarkMode={() => setDarkMode(!darkMode)}
                />
            )}
            {showTallyDisconnectModal && (
                <TallyDisconnectedModal onClose={() => setShowTallyDisconnectModal(false)} />
            )}
            <ImportSummaryModal 
                isOpen={summaryModalOpen}
                onClose={() => setSummaryModalOpen(false)}
                summary={importSummary}
            />
            {invalidFileAlert.show && <InvalidFileModal fileName={invalidFileAlert.fileName} reason={invalidFileAlert.reason} onClose={() => setInvalidFileAlert({ show: false, fileName: '', reason: '' })} />}
            {mismatchedFileAlert.show && mismatchedFileAlert.file && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl border-2 border-orange-400 max-w-md w-full text-center relative">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Document Type Mismatch</h3>
                        <div className="my-4 text-sm text-slate-600 dark:text-slate-300">
                            <p className="mb-2">
                                You uploaded <strong>{mismatchedFileAlert.file.fileName}</strong> in the Invoice section, but our AI detected it as a <strong>Bank Statement</strong>.
                            </p>
                            <p>Would you like to move it to the Bank Statement processor?</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSwitchToBankStatement}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowRight className="w-4 h-4" />
                                Move to Bank Statement
                            </button>
                            <button
                                onClick={() => setMismatchedFileAlert({ show: false, file: null })}
                                className="w-full py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Dismiss (Ignore)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar
                currentView={currentView} onChangeView={setCurrentView} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}
                tallyStatus={tallyStatus} onCheckStatus={checkStatus} searchTerm={searchTerm} onSearchChange={setSearchTerm} onOpenSettings={() => setIsSettingsOpen(true)}
                onLock={handleLock}
            />
            <main className="flex-1 overflow-auto relative p-6">
                {renderContent()}
                {toast.show && (
                    <div className="fixed bottom-6 right-6 z-[100] animate-fade-in bg-white dark:bg-slate-800 border-l-4 border-green-500 shadow-xl rounded-lg p-4 flex items-center gap-3 pr-8 min-w-[300px]">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div><h4 className="font-bold text-sm">Success</h4><p className="text-xs text-slate-500">{toast.message}</p></div>
                        <button onClick={() => setToast({ show: false, message: '' })} className="absolute top-2 right-2"><X className="w-3 h-3" /></button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
