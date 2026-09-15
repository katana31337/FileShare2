import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../utils/auth';

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash password consistently', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different passwords', async () => {
      const hash1 = await hashPassword('Password1');
      const hash2 = await hashPassword('Password2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toHaveLength(64);
    });

    it('should handle special characters', async () => {
      const hash = await hashPassword('!@#$%^&*()_+-=[]{}|;:,.<>?');
      expect(hash).toHaveLength(64);
    });

    it('should handle unicode characters', async () => {
      const hash = await hashPassword('Пароль123!');
      expect(hash).toHaveLength(64);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('CorrectPassword');
      
      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const hash = await hashPassword('');
      
      const isValid1 = await verifyPassword('', hash);
      const isValid2 = await verifyPassword('notempty', hash);
      
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(false);
    });
  });
});
