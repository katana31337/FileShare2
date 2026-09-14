import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  last_login: Date | null;
}

export class AdminService {
  /**
   * Проверяет, инициализирован ли администратор
   */
  static async isInitialized(): Promise<boolean> {
    const result = await query(`SELECT COUNT(*) FROM admins`);
    return parseInt(result.rows[0].count, 10) > 0;
  }

  /**
   * Создаёт первого администратора
   */
  static async createFirst(
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    const isInit = await this.isInitialized();
    if (isInit) {
      return { success: false, message: 'Администратор уже создан' };
    }

    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    await query(
      `INSERT INTO admins (id, username, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [id, username, passwordHash]
    );

    logger.info(`Admin created: ${username}`);
    return { success: true, message: 'Администратор создан' };
  }

  /**
   * Аутентификация администратора
   */
  static async authenticate(
    username: string,
    password: string
  ): Promise<{ success: boolean; token?: string; message: string }> {
    const result = await query(
      `SELECT * FROM admins WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return { success: false, message: 'Неверный логин или пароль' };
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return { success: false, message: 'Неверный логин или пароль' };
    }

    // Обновляем последний вход
    await query(
      `UPDATE admins SET last_login = NOW() WHERE id = $1`,
      [admin.id]
    );

    // Генерируем JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as string | number }
    );

    logger.info(`Admin logged in: ${username}`);
    return { success: true, token, message: 'Успешный вход' };
  }

  /**
   * Валидация JWT токена
   */
  static verifyToken(token: string): { valid: boolean; payload?: any } {
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      return { valid: true, payload };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Смена пароля
   */
  static async changePassword(
    adminId: string,
    newPassword: string
  ): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const result = await query(
      `UPDATE admins SET password_hash = $2 WHERE id = $1`,
      [adminId, passwordHash]
    );
    return (result.rowCount || 0) > 0;
  }
}
