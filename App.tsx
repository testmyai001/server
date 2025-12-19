
import React, { useState, useEffect } from 'react';
import InvoiceEditor from './components/InvoiceEditor';
import XmlViewer from './components/XmlViewer';
import JsonViewer from './components/JsonViewer';
import TallyLogs from './components/TallyLogs';
import Dashboard from './components/Dashboard';
import InvoiceUpload from './components/InvoiceUpload';
import ChatBot from './components/ChatBot';
import ImageAnalyzer from './components/ImageAnalyzer';
import BankStatementManager from './components/BankStatementManager';
import ExcelImportManager from './components/ExcelImportManager';
import Navbar from './components/Navbar';
import InvalidFileModal from './components/InvalidFileModal';
import SettingsModal from './components/SettingsModal';
import AuthScreen from './components/AuthScreen';
import { InvoiceData, LogEntry, AppView, ProcessedFile } from './types';
import { generateTallyXml, pushToTally, fetchExistingLedgers, checkTallyConnection, syncMastersFromAllCompanies } from './services/tallyService';
import { parseInvoiceWithGemini } from './services/geminiService';
import { saveLogToDB, saveInvoiceToDB, getUploadsFromDB, getAllLogsFromDB, saveUploadToDB } from './services/dbService';
import { v4 as uuidv4 } from 'uuid';
import { EMPTY_INVOICE } from './constants';
import { CheckCircle2, X } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [currentFile, setCurrentFile] = useState<File | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'editor' | 'xml' | 'json'>('editor');
  
  const [pendingBankStatementFile, setPendingBankStatementFile] = useState<File | null>(null);
  const [mismatchedFileAlert, setMismatchedFileAlert] = useState<{show: boolean, file: ProcessedFile | null}>({ show: false, file: null });
  const [invalidFileAlert, setInvalidFileAlert] = useState<{show: boolean, fileName: string, reason: string}>({ show: false, fileName: '', reason: '' });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPushing, setIsPushing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [tallyStatus, setTallyStatus] = useState<{online: boolean; msg: string; activeCompany?: string}>({ online: false, msg: 'Checking...' });
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
        const savedFiles = await getUploadsFromDB();
        const savedLogs = await getAllLogsFromDB();
        setProcessedFiles(savedFiles);
        setLogs(savedLogs);
        
        // Auto-sync Tally masters (companies & ledgers) on app initialization
        try {
            await syncMastersFromAllCompanies();
            console.log("✓ Masters auto-synced on app load");
        } catch (e) {
            console.error("Auto-sync failed, will use cache:", e);
        }
    };
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (isAuthenticated) checkStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleSyncEvent = () => setSyncKey(k => k + 1);
    window.addEventListener('tally_masters_synced', handleSyncEvent);
    return () => window.removeEventListener('tally_masters_synced', handleSyncEvent);
  }, []);

  const checkStatus = async () => {
      setTallyStatus({ online: false, msg: 'Checking...' });
      const status = await checkTallyConnection();
      setTallyStatus({ online: status.online, msg: status.msg });
  };

  const handlePushLog = async (status: 'Success' | 'Failed', message: string, response?: string) => {
    const log: LogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      method: 'POST',
      endpoint: 'Tally Prime Integration',
      status,
      message,
      response
    };
    setLogs(prev => [log, ...prev]);
    await saveLogToDB(log);
    if (status === 'Success') setToast({ show: true, message });
  };

  const handleBulkUpload = async (files: File[]) => {
      setIsUploading(true);
      const newEntries: ProcessedFile[] = files.map(file => ({
          id: uuidv4(),
          file,
          fileName: file.name,
          sourceType: 'INVOICE_IMPORT',
          status: 'Pending',
          correctEntries: 0,
          incorrectEntries: 0,
          timeTaken: '-',
          uploadTimestamp: Date.now()
      }));
      setProcessedFiles(prev => [...newEntries, ...prev]);
      
      // Process files sequentially but jump to editor for the first one as soon as it's ready
      let firstFileRedirected = false;
      for (const entry of newEntries) {
          await processSingleFile(entry);
          if (!firstFileRedirected) {
            const updated = (await getUploadsFromDB()).find(u => u.id === entry.id);
            if (updated && updated.status === 'Ready') {
                setCurrentInvoice(updated.data!);
                setCurrentFile(entry.file);
                setCurrentView(AppView.EDITOR);
                setActiveTab('editor');
                firstFileRedirected = true;
            }
          }
      }
      setIsUploading(false);
  };

  const processSingleFile = async (entry: ProcessedFile) => {
      setProcessedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'Processing' } : f));
      const start = Date.now();
      try {
          const data = await parseInvoiceWithGemini(entry.file!);
          if (data.documentType === 'BANK_STATEMENT') {
               setProcessedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'Mismatch', error: "Detected as Bank Statement" } : f));
               setMismatchedFileAlert({ show: true, file: { ...entry, status: 'Mismatch', data } });
               return; 
          }
          const duration = ((Date.now() - start) / 1000 / 60).toFixed(2);
          const updated = {
              ...entry,
              status: 'Ready' as const,
              data,
              timeTaken: `${duration} min`,
              correctEntries: data.lineItems.length
          };
          setProcessedFiles(prev => prev.map(f => f.id === entry.id ? updated : f));
          await saveUploadToDB(updated);
      } catch (error) {
           const duration = ((Date.now() - start) / 1000 / 60).toFixed(2);
           const errorMsg = error instanceof Error ? error.message : "Processing Failed";
           setProcessedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'Failed', error: errorMsg, timeTaken: `${duration} min` } : f));
           await handlePushLog('Failed', `OCR Failed for ${entry.fileName}: ${errorMsg}`);
      }
  };

  const handleSaveInvoice = async (data: InvoiceData, switchTab: boolean = true) => {
    setCurrentInvoice(data);
    if (switchTab) setActiveTab('xml');
    
    if (currentFile) {
        const fileEntry = processedFiles.find(f => f.file === currentFile);
        if (fileEntry) {
            const updated = { ...fileEntry, data, correctEntries: data.lineItems.length };
            setProcessedFiles(prev => prev.map(f => f.id === fileEntry.id ? updated : f));
            await saveUploadToDB(updated);
        }
    }
  };

  const handleViewInvoice = (file: ProcessedFile) => {
      if (file.status === 'Mismatch') { setMismatchedFileAlert({ show: true, file }); return; }
      if (file.sourceType === 'BANK_STATEMENT') { setPendingBankStatementFile(file.file || null); setCurrentView(AppView.BANK_STATEMENT); return; }
      if (file.data) {
          setCurrentInvoice(file.data);
          setCurrentFile(file.file);
          setCurrentView(AppView.EDITOR);
          setActiveTab('editor');
      }
  };

  const handleLock = () => setIsAuthenticated(false);

  const filteredFiles = processedFiles.filter(f => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = f.fileName.toLowerCase().includes(term) || (f.data?.invoiceNumber || '').toLowerCase().includes(term);
      const matchesFilter = filterStatus === 'All' || f.status === filterStatus;
      return matchesSearch && matchesFilter;
  });

  const currentIndex = processedFiles.findIndex(f => f.file === currentFile);
  const totalInvoices = processedFiles.filter(f => f.sourceType === 'INVOICE_IMPORT').length;

  if (!isAuthenticated) return <AuthScreen onAuthenticated={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f172a] text-slate-100 transition-colors duration-200">
      <Navbar 
        currentView={currentView} onChangeView={setCurrentView} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}
        tallyStatus={tallyStatus} onCheckStatus={checkStatus} searchTerm={searchTerm} onSearchChange={setSearchTerm} onOpenSettings={() => setIsSettingsOpen(true)}
        onLock={handleLock} 
      />
      <main className="flex-1 overflow-hidden relative p-6 bg-slate-50 dark:bg-[#0f172a]">
          {currentView === AppView.DASHBOARD && (
              <Dashboard files={filteredFiles} onNavigateToUpload={() => setCurrentView(AppView.UPLOAD)} onRetry={() => {}} onView={handleViewInvoice} onPushSuccess={() => {}} isPushing={isPushing} onDownload={() => {}} searchTerm={searchTerm} onSearchChange={setSearchTerm} filterStatus={filterStatus} onFilterChange={setFilterStatus} />
          )}
          {currentView === AppView.UPLOAD && <InvoiceUpload onFilesSelected={handleBulkUpload} isProcessing={isUploading} />}
          {currentView === AppView.EDITOR && (
              <div className="h-full flex flex-col">
                  <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 flex gap-2 rounded-t-xl">
                      {['editor', 'xml', 'json'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{tab}</button>
                      ))}
                  </div>
                  <div className="flex-1 overflow-hidden">
                      {activeTab === 'editor' && <InvoiceEditor key={syncKey} data={currentInvoice || EMPTY_INVOICE} file={currentFile} onSave={handleSaveInvoice} onPush={() => {}} isPushing={isPushing} currentIndex={currentIndex} totalCount={totalInvoices} hasNext={currentIndex < processedFiles.length - 1} hasPrev={currentIndex > 0} />}
                      {activeTab === 'xml' && <XmlViewer data={currentInvoice || EMPTY_INVOICE} />}
                      {activeTab === 'json' && <JsonViewer data={currentInvoice || EMPTY_INVOICE} />}
                  </div>
              </div>
          )}
          {currentView === AppView.BANK_STATEMENT && <BankStatementManager key={syncKey} onPushLog={handlePushLog} externalFile={pendingBankStatementFile} />}
          {currentView === AppView.EXCEL_IMPORT && <ExcelImportManager key={syncKey} onPushLog={handlePushLog} />}
          {currentView === AppView.CHAT && <ChatBot />}
          {currentView === AppView.IMAGE_ANALYSIS && <ImageAnalyzer />}
          {currentView === AppView.LOGS && (
              <div className="h-full">
                  <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Integration Logs</h2>
                  <TallyLogs logs={logs} />
              </div>
          )}

          {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />}
          {invalidFileAlert.show && <InvalidFileModal fileName={invalidFileAlert.fileName} reason={invalidFileAlert.reason} onClose={() => setInvalidFileAlert({ show: false, fileName: '', reason: '' })} />}
          
          {toast.show && (
                <div className="fixed bottom-6 right-6 z-[100] animate-fade-in bg-white dark:bg-slate-800 border-l-4 border-indigo-500 shadow-xl rounded-lg p-4 flex items-center gap-3 pr-8 min-w-[300px]">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    <div><h4 className="font-bold text-sm text-slate-900 dark:text-white">Success</h4><p className="text-xs text-slate-500">{toast.message}</p></div>
                    <button onClick={() => setToast({ show: false, message: '' })} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                </div>
            )}
      </main>
    </div>
  );
};

export default App;
