import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

export interface UploadedFile {
  id: string;
  session_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size: number;
  download_count: number;
  created_at: Date;
  expires_at: Date;
}

export class FileService {
  /**
   * Сохраняет файл на диск и в БД
   */
  static async upload(
    file: Express.Multer.File,
    sessionId: string
  ): Promise<UploadedFile> {
    const id = uuidv4();
    const ext = path.extname(file.originalname);
    const storedName = `${id}${ext}`;
    const filePath = path.join(config.upload.storagePath, storedName);

    // Сохраняем на диск
    await fs.mkdir(config.upload.storagePath, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    const now = new Date();
    const settings = await this.getSettings();
    const expiresAt = new Date(
      now.getTime() + settings.file_expiry_days * 24 * 60 * 60 * 1000
    );

    // Сохраняем в БД
    await query(
      `INSERT INTO files (id, session_id, original_name, stored_name, mime_type, size, download_count, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8)`,
      [id, sessionId, file.originalname, storedName, file.mimetype, file.size, now, expiresAt]
    );

    logger.info(`File uploaded: ${file.originalname} (${file.size} bytes)`);

    return {
      id,
      session_id: sessionId,
      original_name: file.originalname,
      stored_name: storedName,
      mime_type: file.mimetype,
      size: file.size,
      download_count: 0,
      created_at: now,
      expires_at: expiresAt,
    };
  }

  /**
   * Получает файл по ID
   */
  static async getById(id: string): Promise<UploadedFile | null> {
    const result = await query(
      `SELECT * FROM files WHERE id = $1 AND expires_at > NOW()`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Увеличивает счётчик скачиваний
   */
  static async incrementDownloads(id: string): Promise<void> {
    await query(
      `UPDATE files SET download_count = download_count + 1 WHERE id = $1`,
      [id]
    );
  }

  /**
   * Получает путь к файлу на диске
   */
  static async getFilePath(file: UploadedFile): Promise<string> {
    return path.join(config.upload.storagePath, file.stored_name);
  }

  /**
   * Получает файлы сессии
   */
  static async getBySession(sessionId: string): Promise<UploadedFile[]> {
    const result = await query(
      `SELECT * FROM files WHERE session_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [sessionId]
    );
    return result.rows;
  }

  /**
   * Удаляет файл (с диска и из БД)
   */
  static async delete(id: string): Promise<boolean> {
    const file = await this.getById(id);
    if (!file) return false;

    try {
      const filePath = await this.getFilePath(file);
      await fs.unlink(filePath);
    } catch (err) {
      logger.warn(`Failed to delete file from disk: ${err}`);
    }

    await query(`DELETE FROM files WHERE id = $1`, [id]);
    logger.info(`File deleted: ${file.original_name}`);
    return true;
  }

  /**
   * Удаляет просроченные файлы
   */
  static async cleanupExpired(): Promise<number> {
    const expired = await query(
      `SELECT id, stored_name FROM files WHERE expires_at < NOW()`
    );

    for (const row of expired.rows) {
      try {
        await fs.unlink(path.join(config.upload.storagePath, row.stored_name));
      } catch {
        // ignore
      }
    }

    const result = await query(`DELETE FROM files WHERE expires_at < NOW()`);
    return result.rowCount || 0;
  }

  /**
   * Получает настройки из БД
   */
  private static async getSettings(): Promise<{ file_expiry_days: number }> {
    const result = await query(
      `SELECT value FROM settings WHERE key = 'file_expiry_days'`
    );
    return {
      file_expiry_days: result.rows[0]
        ? parseInt(result.rows[0].value, 10)
        : config.session.expiryDays,
    };
  }
}
