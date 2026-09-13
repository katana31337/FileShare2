import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService.js';

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; username: string; role: string };
    }
  }
}

/**
 * Middleware для проверки авторизации администратора
 */
export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    const token = authHeader.substring(7);
    const result = AdminService.verifyToken(token);

    if (!result.valid || result.payload.role !== 'admin') {
      res.status(401).json({ error: 'Недействительный токен' });
      return;
    }

    req.admin = result.payload;
    next();
  } catch (error) {
    next(error);
  }
};
