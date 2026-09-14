import { Request, Response, NextFunction } from 'express';
import { TextService } from '../services/TextService.js';
import { AppError } from '../middleware/errorHandler.js';

export class TextController {
  /**
   * POST /api/texts
   * Создание общего текста
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content } = req.body;

      if (!content || !content.trim()) {
        throw new AppError('Содержимое не может быть пустым', 400);
      }

      const sessionId = req.sessionId!;
      const text = await TextService.create(
        sessionId,
        title || 'Без названия',
        content.trim()
      );

      res.status(201).json({
        success: true,
        data: {
          id: text.id,
          title: text.title,
          content: text.content,
          shareLink: `/api/texts/${text.id}`,
          createdAt: text.created_at,
          expiresAt: text.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/texts/:id
   * Получение текста по ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const text = await TextService.getById(id);

      if (!text) {
        throw new AppError('Текст не найден или срок хранения истёк', 404);
      }

      res.json({
        success: true,
        data: {
          id: text.id,
          title: text.title,
          content: text.content,
          createdAt: text.created_at,
          expiresAt: text.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/texts
   * Получение текстов текущей сессии
   */
  static async listBySession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.sessionId!;
      const texts = await TextService.getBySession(sessionId);

      res.json({
        success: true,
        data: texts.map((t) => ({
          id: t.id,
          title: t.title,
          content: t.content,
          shareLink: `/api/texts/${t.id}`,
          createdAt: t.created_at,
          expiresAt: t.expires_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/texts/:id
   * Удаление текста
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const sessionId = req.sessionId!;
      const deleted = await TextService.delete(id, sessionId);

      if (!deleted) {
        throw new AppError('Текст не найден', 404);
      }

      res.json({ success: true, message: 'Текст удалён' });
    } catch (error) {
      next(error);
    }
  }
}
