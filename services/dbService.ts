
import { InvoiceData, BankStatementData, LogEntry, ProcessedFile } from '../types';

const DB_NAME = 'AutoTallyDB';
const DB_VERSION = 1;

class AutoTallyDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('uploads')) {
          db.createObjectStore('uploads', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveUpload(upload: ProcessedFile) {
    const db = await this.init();
    const tx = db.transaction('uploads', 'readwrite');
    const store = tx.objectStore('uploads');
    // Remove the File object before saving to IDB as it can be large/problematic
    const { file, ...serializable } = upload;
    await store.put(serializable);
  }

  async getAllUploads(): Promise<ProcessedFile[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('uploads', 'readonly');
      const store = tx.objectStore('uploads');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveLog(log: LogEntry) {
    const db = await this.init();
    const tx = db.transaction('logs', 'readwrite');
    const store = tx.objectStore('logs');
    await store.put(log);
  }

  async getAllLogs(): Promise<LogEntry[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('logs', 'readonly');
      const store = tx.objectStore('logs');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a: any, b: any) => b.timestamp - a.timestamp));
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll() {
    const db = await this.init();
    const tx = db.transaction(['uploads', 'logs'], 'readwrite');
    tx.objectStore('uploads').clear();
    tx.objectStore('logs').clear();
  }
}

const dbInstance = new AutoTallyDB();

export const saveLogToDB = async (log: LogEntry) => {
  await dbInstance.saveLog(log);
};

export const getAllLogsFromDB = async () => {
  return await dbInstance.getAllLogs();
};

export const saveInvoiceToDB = async (data: InvoiceData, status: string, id: string) => {
  // Find the upload and update it
  const uploads = await dbInstance.getAllUploads();
  const upload = uploads.find(u => u.id === id);
  if (upload) {
    upload.status = status as any;
    upload.data = data;
    await dbInstance.saveUpload(upload);
  }
};

export const saveUploadToDB = async (upload: ProcessedFile) => {
  await dbInstance.saveUpload(upload);
};

export const getUploadsFromDB = async () => {
  return await dbInstance.getAllUploads();
};

export const clearLocalDatabase = async () => {
  await dbInstance.clearAll();
};
