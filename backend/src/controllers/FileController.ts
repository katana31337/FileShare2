import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/FileService.js';
import { AppError } from '../middleware/errorHandler.js';

export class FileController {
  /**
   * POST /api/files/upload
   * Загрузка файла
   */
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('Файл не предоставлен', 400);
      }

      const sessionId = req.sessionId!;
      const file = await FileService.upload(req.file, sessionId);

      res.status(201).json({
        success: true,
        data: {
          id: file.id,
          name: file.original_name,
          size: file.size,
          type: file.mime_type,
          downloadLink: `/api/files/${file.id}/download`,
          expiresAt: file.expires_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/files/:id/download
   * Скачивание файла
   */
  static async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const file = await FileService.getById(id);

      if (!file) {
        throw new AppError('Файл не найден или срок хранения истёк', 404);
      }

      const filePath = await FileService.getFilePath(file);
      await FileService.incrementDownloads(id);

      res.download(filePath, file.original_name);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/files
   * Получение списка файлов текущей сессии
   */
  static async listBySession(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.sessionId!;
      const files = await FileService.getBySession(sessionId);

      res.json({
        success: true,
        data: files.map((f) => ({
          id: f.id,
          name: f.original_name,
          size: f.size,
          type: f.mime_type,
          downloadLink: `/api/files/${f.id}/download`,
          downloads: f.download_count,
          createdAt: f.created_at,
          expiresAt: f.expires_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/files/:id
   * Удаление файла
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deleted = await FileService.delete(id);

      if (!deleted) {
        throw new AppError('Файл не найден', 404);
      }

      res.json({ success: true, message: 'Файл удалён' });
    } catch (error) {
      next(error);
    }
  }
}
