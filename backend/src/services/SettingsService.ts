import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface Setting {
  key: string;
  value: string;
  description: string;
  category: string;
}

export class SettingsService {
  /**
   * Получает все настройки
   */
  static async getAll(): Promise<Setting[]> {
    const result = await query(
      `SELECT key, value, description, category FROM settings ORDER BY category, key`
    );
    return result.rows;
  }

  /**
   * Получает настройку по ключу
   */
  static async get(key: string): Promise<string | null> {
    const result = await query(
      `SELECT value FROM settings WHERE key = $1`,
      [key]
    );
    return result.rows[0]?.value || null;
  }

  /**
   * Обновляет настройку
   */
  static async update(key: string, value: string): Promise<boolean> {
    const result = await query(
      `UPDATE settings SET value = $2, updated_at = NOW() WHERE key = $1`,
      [key, value]
    );
    if ((result.rowCount || 0) > 0) {
      logger.info(`Setting updated: ${key} = ${value}`);
    }
    return (result.rowCount || 0) > 0;
  }

  /**
   * Массовое обновление настроек
   */
  static async updateMany(
    updates: Array<{ key: string; value: string }>
  ): Promise<number> {
    let count = 0;
    for (const { key, value } of updates) {
      const updated = await this.update(key, value);
      if (updated) count++;
    }
    return count;
  }

  /**
   * Получает настройки по категории
   */
  static async getByCategory(category: string): Promise<Setting[]> {
    const result = await query(
      `SELECT key, value, description, category FROM settings WHERE category = $1 ORDER BY key`,
      [category]
    );
    return result.rows;
  }

  /**
   * Инициализирует настройки по умолчанию
   */
  static async initDefaults(): Promise<void> {
    const defaults = [
      { key: 'service_name', value: 'FileShare', description: 'Название сервиса', category: 'general' },
      { key: 'max_file_size', value: '100', description: 'Максимальный размер файла (MB)', category: 'files' },
      { key: 'file_expiry_days', value: '7', description: 'Срок хранения файлов (дни)', category: 'files' },
      { key: 'text_expiry_days', value: '7', description: 'Срок хранения текстов (дни)', category: 'files' },
      { key: 'session_expiry_days', value: '7', description: 'Время жизни сессии (дни)', category: 'sessions' },
      { key: 'max_files_per_session', value: '50', description: 'Максимум файлов на сессию', category: 'files' },
      { key: 'allowed_file_types', value: '*', description: 'Разрешённые типы файлов', category: 'files' },
    ];

    for (const setting of defaults) {
      await query(
        `INSERT INTO settings (key, value, description, category, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (key) DO NOTHING`,
        [setting.key, setting.value, setting.description, setting.category]
      );
    }

    logger.info('Default settings initialized');
  }
}
