import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import config from '../config/index.js';

export interface Session {
  id: string;
  created_at: Date;
  last_active: Date;
  expires_at: Date;
}

export class SessionService {
  /**
   * Создаёт новую сессию или продлевает существующую
   */
  static async getOrCreate(sessionId: string | null): Promise<Session> {
    if (sessionId) {
      const existing = await this.getById(sessionId);
      if (existing) {
        await this.touch(existing.id);
        return existing;
      }
    }

    return this.create();
  }

  static async create(): Promise<Session> {
    const id = uuidv4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + config.session.expiryDays * 24 * 60 * 60 * 1000
    );

    await query(
      `INSERT INTO sessions (id, created_at, last_active, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [id, now, now, expiresAt]
    );

    return { id, created_at: now, last_active: now, expires_at: expiresAt };
  }

  static async getById(id: string): Promise<Session | null> {
    const result = await query(
      `SELECT id, created_at, last_active, expires_at
       FROM sessions WHERE id = $1 AND expires_at > NOW()`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async touch(id: string): Promise<void> {
    const expiresAt = new Date(
      Date.now() + config.session.expiryDays * 24 * 60 * 60 * 1000
    );
    await query(
      `UPDATE sessions SET last_active = NOW(), expires_at = $2 WHERE id = $1`,
      [id, expiresAt]
    );
  }

  /**
   * Удаляет просроченные сессии (cron job)
   */
  static async cleanupExpired(): Promise<number> {
    const result = await query(
      `DELETE FROM sessions WHERE expires_at < NOW()`
    );
    return result.rowCount || 0;
  }
}
