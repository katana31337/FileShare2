import { Request, Response, NextFunction } from 'express';
import config from '../config/index.js';
import { SessionService } from '../services/SessionService.js';

// Расширяем Request для TypeScript
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
    }
  }
}

/**
 * Middleware для управления сессиями
 * Создаёт/продлевает сессию и устанавливает cookie
 */
export const sessionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookieSessionId = req.cookies?.[config.session.cookieName];
    const session = await SessionService.getOrCreate(cookieSessionId || null);

    req.sessionId = session.id;

    // Устанавливаем/обновляем cookie
    res.cookie(config.session.cookieName, session.id, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.session.expiryDays * 24 * 60 * 60 * 1000,
      path: '/',
    });

    next();
  } catch (error) {
    next(error);
  }
};
