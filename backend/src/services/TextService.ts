import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface SharedText {
  id: string;
  session_id: string;
  title: string;
  content: string;
  created_at: Date;
  expires_at: Date;
}

export class TextService {
  /**
   * Создаёт новый общий текст
   */
  static async create(
    sessionId: string,
    title: string,
    content: string
  ): Promise<SharedText> {
    const id = uuidv4();
    const now = new Date();

    // Получаем срок хранения из настроек
    const settingsResult = await query(
      `SELECT value FROM settings WHERE key = 'text_expiry_days'`
    );
    const expiryDays = settingsResult.rows[0]
      ? parseInt(settingsResult.rows[0].value, 10)
      : 7;

    const expiresAt = new Date(
      now.getTime() + expiryDays * 24 * 60 * 60 * 1000
    );

    await query(
      `INSERT INTO shared_texts (id, session_id, title, content, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, sessionId, title, content, now, expiresAt]
    );

    logger.info(`Text shared: "${title}" (session: ${sessionId})`);

    return { id, session_id: sessionId, title, content, created_at: now, expires_at: expiresAt };
  }

  /**
   * Получает текст по ID
   */
  static async getById(id: string): Promise<SharedText | null> {
    const result = await query(
      `SELECT * FROM shared_texts WHERE id = $1 AND expires_at > NOW()`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Получает тексты сессии
   */
  static async getBySession(sessionId: string): Promise<SharedText[]> {
    const result = await query(
      `SELECT * FROM shared_texts WHERE session_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [sessionId]
    );
    return result.rows;
  }

  /**
   * Удаляет текст
   */
  static async delete(id: string, sessionId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM shared_texts WHERE id = $1 AND session_id = $2`,
      [id, sessionId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Удаляет просроченные тексты
   */
  static async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM shared_texts WHERE expires_at < NOW()`
    );
    return result.rowCount || 0;
  }
}
