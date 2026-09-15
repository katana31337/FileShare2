import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      sessionId: null,
      sessionActive: false,
      uploadedFiles: [],
      sharedTexts: [],
      adminInitialized: false,
      isAdmin: false,
      adminCredentials: null,
    });
  });

  describe('Session Management', () => {
    it('should set session id', () => {
      const { setSessionId } = useAppStore.getState();
      setSessionId('test-session-123');
      
      const state = useAppStore.getState();
      expect(state.sessionId).toBe('test-session-123');
      expect(state.sessionActive).toBe(true);
    });
  });

  describe('File Management', () => {
    it('should add file', () => {
      const { addFile } = useAppStore.getState();
      const testFile = {
        id: 'file-1',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        downloadLink: '/download/file-1',
        downloads: 0,
      };
      
      addFile(testFile);
      
      const state = useAppStore.getState();
      expect(state.uploadedFiles).toHaveLength(1);
      expect(state.uploadedFiles[0].name).toBe('test.pdf');
    });

    it('should remove file', () => {
      const { addFile, removeFile } = useAppStore.getState();
      
      addFile({
        id: 'file-1',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        downloadLink: '/download/file-1',
        downloads: 0,
      });
      
      removeFile('file-1');
      
      const state = useAppStore.getState();
      expect(state.uploadedFiles).toHaveLength(0);
    });

    it('should handle multiple files', () => {
      const { addFile } = useAppStore.getState();
      
      addFile({
        id: 'file-1',
        name: 'test1.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        downloadLink: '/download/file-1',
        downloads: 0,
      });
      
      addFile({
        id: 'file-2',
        name: 'test2.pdf',
        size: 2048,
        type: 'application/pdf',
        uploadDate: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        downloadLink: '/download/file-2',
        downloads: 0,
      });
      
      const state = useAppStore.getState();
      expect(state.uploadedFiles).toHaveLength(2);
    });
  });

  describe('Text Management', () => {
    it('should add text', () => {
      const { addText } = useAppStore.getState();
      const testText = {
        id: 'text-1',
        content: 'Test content',
        title: 'Test Title',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        shareLink: '/text/text-1',
      };
      
      addText(testText);
      
      const state = useAppStore.getState();
      expect(state.sharedTexts).toHaveLength(1);
      expect(state.sharedTexts[0].title).toBe('Test Title');
    });

    it('should remove text', () => {
      const { addText, removeText } = useAppStore.getState();
      
      addText({
        id: 'text-1',
        content: 'Test content',
        title: 'Test Title',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        shareLink: '/text/text-1',
      });
      
      removeText('text-1');
      
      const state = useAppStore.getState();
      expect(state.sharedTexts).toHaveLength(0);
    });
  });

  describe('Admin Management', () => {
    it('should set admin initialized', () => {
      const { setAdminInitialized } = useAppStore.getState();
      setAdminInitialized(true);
      
      const state = useAppStore.getState();
      expect(state.adminInitialized).toBe(true);
    });

    it('should set admin credentials', () => {
      const { setAdminCredentials } = useAppStore.getState();
      const credentials = {
        username: 'admin',
        passwordHash: 'hashedpassword',
      };
      
      setAdminCredentials(credentials);
      
      const state = useAppStore.getState();
      expect(state.adminCredentials).toEqual(credentials);
    });

    it('should set is admin', () => {
      const { setIsAdmin } = useAppStore.getState();
      setIsAdmin(true);
      
      const state = useAppStore.getState();
      expect(state.isAdmin).toBe(true);
    });
  });

  describe('Settings Management', () => {
    it('should update settings', () => {
      const { updateSettings } = useAppStore.getState();
      updateSettings({ maxFileSize: 50 });
      
      const state = useAppStore.getState();
      expect(state.settings.maxFileSize).toBe(50);
    });

    it('should preserve other settings when updating', () => {
      const { updateSettings } = useAppStore.getState();
      const originalSettings = useAppStore.getState().settings;
      
      updateSettings({ maxFileSize: 50 });
      
      const state = useAppStore.getState();
      expect(state.settings.maxFileSize).toBe(50);
      expect(state.settings.fileExpiryDays).toBe(originalSettings.fileExpiryDays);
    });
  });

  describe('Clear Expired Items', () => {
    it('should clear expired files', () => {
      const { addFile, clearExpiredItems } = useAppStore.getState();
      
      // Add expired file
      addFile({
        id: 'expired-file',
        name: 'expired.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: new Date(Date.now() - 86400000 * 2),
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
        downloadLink: '/download/expired-file',
        downloads: 0,
      });
      
      // Add valid file
      addFile({
        id: 'valid-file',
        name: 'valid.pdf',
        size: 1024,
        type: 'application/pdf',
        uploadDate: new Date(),
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        downloadLink: '/download/valid-file',
        downloads: 0,
      });
      
      clearExpiredItems();
      
      const state = useAppStore.getState();
      expect(state.uploadedFiles).toHaveLength(1);
      expect(state.uploadedFiles[0].id).toBe('valid-file');
    });

    it('should clear expired texts', () => {
      const { addText, clearExpiredItems } = useAppStore.getState();
      
      // Add expired text
      addText({
        id: 'expired-text',
        content: 'Expired',
        title: 'Expired Text',
        createdAt: new Date(Date.now() - 86400000 * 2),
        expiresAt: new Date(Date.now() - 86400000),
        shareLink: '/text/expired-text',
      });
      
      // Add valid text
      addText({
        id: 'valid-text',
        content: 'Valid',
        title: 'Valid Text',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        shareLink: '/text/valid-text',
      });
      
      clearExpiredItems();
      
      const state = useAppStore.getState();
      expect(state.sharedTexts).toHaveLength(1);
      expect(state.sharedTexts[0].id).toBe('valid-text');
    });
  });
});
