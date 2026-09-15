import { create } from 'zustand';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  expiresAt: Date;
  downloadLink: string;
  downloads: number;
}

export interface SharedText {
  id: string;
  content: string;
  title: string;
  createdAt: Date;
  expiresAt: Date;
  shareLink: string;
}

export interface AppSettings {
  maxFileSize: number; // MB
  fileExpiryDays: number;
  textExpiryDays: number;
  sessionExpiryDays: number;
  maxFilesPerSession: number;
  allowedFileTypes: string[];
  serviceName: string;
}

interface AppState {
  // Session
  sessionId: string | null;
  sessionActive: boolean;
  
  // Files
  uploadedFiles: UploadedFile[];
  
  // Texts
  sharedTexts: SharedText[];
  
  // Settings
  settings: AppSettings;
  
  // Admin
  adminInitialized: boolean;
  isAdmin: boolean;
  
  // Actions
  setSessionId: (id: string) => void;
  addFile: (file: UploadedFile) => void;
  removeFile: (id: string) => void;
  addText: (text: SharedText) => void;
  removeText: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setAdminInitialized: (value: boolean) => void;
  setIsAdmin: (value: boolean) => void;
  clearExpiredItems: () => void;
}

const defaultSettings: AppSettings = {
  maxFileSize: 100,
  fileExpiryDays: 7,
  textExpiryDays: 7,
  sessionExpiryDays: 7,
  maxFilesPerSession: 50,
  allowedFileTypes: ['*'],
  serviceName: 'FileShare',
};

export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useAppStore = create<AppState>((set, get) => ({
  sessionId: null,
  sessionActive: false,
  uploadedFiles: [],
  sharedTexts: [],
  settings: defaultSettings,
  adminInitialized: false,
  isAdmin: false,

  setSessionId: (id) =>
    set({ sessionId: id, sessionActive: true }),

  addFile: (file) =>
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, file],
    })),

  removeFile: (id) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((f) => f.id !== id),
    })),

  addText: (text) =>
    set((state) => ({
      sharedTexts: [...state.sharedTexts, text],
    })),

  removeText: (id) =>
    set((state) => ({
      sharedTexts: state.sharedTexts.filter((t) => t.id !== id),
    })),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setAdminInitialized: (value) =>
    set({ adminInitialized: value }),

  setIsAdmin: (value) =>
    set({ isAdmin: value }),

  clearExpiredItems: () => {
    const now = new Date();
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter(
        (f) => new Date(f.expiresAt) > now
      ),
      sharedTexts: state.sharedTexts.filter(
        (t) => new Date(t.expiresAt) > now
      ),
    }));
  },
}));
