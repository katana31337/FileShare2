import { AdminService } from '../src/services/AdminService.js';

// Mock database
jest.mock('../src/config/database.js', () => ({
  query: jest.fn(),
  pool: { on: jest.fn(), end: jest.fn() },
  getClient: jest.fn(),
  default: { on: jest.fn(), end: jest.fn() },
}));

import { query } from '../src/config/database.js';

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isInitialized', () => {
    it('should return false when no admins exist', async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '0' }],
      });

      const result = await AdminService.isInitialized();
      expect(result).toBe(false);
    });

    it('should return true when admins exist', async () => {
      (query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: '1' }],
      });

      const result = await AdminService.isInitialized();
      expect(result).toBe(true);
    });
  });

  describe('verifyToken', () => {
    it('should return invalid for bad token', () => {
      const result = AdminService.verifyToken('invalid-token');
      expect(result.valid).toBe(false);
    });

    it('should return invalid for empty token', () => {
      const result = AdminService.verifyToken('');
      expect(result.valid).toBe(false);
    });
  });
});

describe('Password Validation Rules', () => {
  const validatePassword = (password: string) => {
    return {
      length: password.length >= 12,
      uppercase: /[A-ZА-Я]/.test(password),
      lowercase: /[a-zа-я]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  it('should accept strong password', () => {
    const result = validatePassword('MyStr0ng!Pass');
    expect(Object.values(result).every(Boolean)).toBe(true);
  });

  it('should reject short password', () => {
    const result = validatePassword('Sh0rt!');
    expect(result.length).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = validatePassword('nouppercase123!');
    expect(result.uppercase).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = validatePassword('NOLOWERCASE123!');
    expect(result.lowercase).toBe(false);
  });

  it('should reject password without numbers', () => {
    const result = validatePassword('NoNumbersHere!');
    expect(result.numbers).toBe(false);
  });

  it('should reject password without special chars', () => {
    const result = validatePassword('NoSpecial1234');
    expect(result.special).toBe(false);
  });

  it('should accept password with Cyrillic', () => {
    const result = validatePassword('Пароль123!Строгий');
    expect(Object.values(result).every(Boolean)).toBe(true);
  });
});
