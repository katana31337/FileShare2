import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService.js';
import { SettingsService } from '../services/SettingsService.js';
import { AppError } from '../middleware/errorHandler.js';

export class AdminController {
  /**
   * GET /api/admin/status
   * Проверка статуса инициализации
   */
  static async status(req: Request, res: Response, next: NextFunction) {
    try {
      const isInitialized = await AdminService.isInitialized();
      res.json({
        success: true,
        data: { initialized: isInitialized },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/setup
   * Создание первого администратора
   */
  static async setup(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (!username || username.length < 3) {
        throw new AppError('Логин должен быть минимум 3 символа', 400);
      }

      if (!password || password.length < 12) {
        throw new AppError('Пароль должен быть минимум 12 символов', 400);
      }

      // Проверка сложности пароля
      const hasUpper = /[A-ZА-Я]/.test(password);
      const hasLower = /[a-zа-я]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        throw new AppError(
          'Пароль должен содержать заглавные и строчные буквы, цифры и спецсимволы',
          400
        );
      }

      const result = await AdminService.createFirst(username, password);

      if (!result.success) {
        throw new AppError(result.message, 409);
      }

      // Инициализируем настройки по умолчанию
      await SettingsService.initDefaults();

      res.status(201).json({
        success: true,
        message: 'Администратор создан',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/login
   * Авторизация администратора
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new AppError('Логин и пароль обязательны', 400);
      }

      const result = await AdminService.authenticate(username, password);

      if (!result.success) {
        throw new AppError(result.message, 401);
      }

      res.json({
        success: true,
        data: { token: result.token },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/settings
   * Получение всех настроек
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getAll();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/admin/settings
   * Обновление настроек
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body.updates as Array<{ key: string; value: string }>;

      if (!Array.isArray(updates)) {
        throw new AppError('Неверный формат данных', 400);
      }

      const count = await SettingsService.updateMany(updates);

      res.json({
        success: true,
        message: `Обновлено настроек: ${count}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stats
   * Статистика системы
   */
  static async stats(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = await import('../config/database.js');

      const filesResult = await query(`SELECT COUNT(*) FROM files WHERE expires_at > NOW()`);
      const textsResult = await query(`SELECT COUNT(*) FROM shared_texts WHERE expires_at > NOW()`);
      const sessionsResult = await query(`SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()`);

      res.json({
        success: true,
        data: {
          files: parseInt(filesResult.rows[0].count, 10),
          texts: parseInt(textsResult.rows[0].count, 10),
          activeSessions: parseInt(sessionsResult.rows[0].count, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
