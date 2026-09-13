import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Глобальный обработчик ошибок
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message} [${err.statusCode}]`);
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
  });
};

/**
 * Обработчик 404
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.path,
  });
};
