import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import config from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sessionMiddleware } from './middleware/session.js';

// Routes
import filesRouter from './routes/files.js';
import textsRouter from './routes/texts.js';
import adminRouter from './routes/admin.js';

// Services
import { FileService } from './services/FileService.js';
import { TextService } from './services/TextService.js';
import { SessionService } from './services/SessionService.js';

const app = express();

// === Security ===
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// === Rate Limiting ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Слишком много запросов, попробуйте позже' },
});
app.use('/api/', limiter);

// === Parsing ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.session.cookieSecret));

// === Logging ===
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// === Health Check ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === API Routes ===
app.use('/api/files', filesRouter);
app.use('/api/texts', textsRouter);
app.use('/api/admin', adminRouter);

// === Session endpoint ===
app.get('/api/session', sessionMiddleware, (req, res) => {
  res.json({
    success: true,
    data: { sessionId: req.sessionId },
  });
});

// === Error Handling ===
app.use(notFoundHandler);
app.use(errorHandler);

// === Cron Jobs ===
// Очистка просроченных данных каждый час
cron.schedule('0 * * * *', async () => {
  logger.info('Running cleanup job...');

  try {
    const filesCleaned = await FileService.cleanupExpired();
    const textsCleaned = await TextService.cleanupExpired();
    const sessionsCleaned = await SessionService.cleanupExpired();

    logger.info(`Cleanup done: ${filesCleaned} files, ${textsCleaned} texts, ${sessionsCleaned} sessions`);
  } catch (error) {
    logger.error('Cleanup job failed:', error);
  }
});

// === Start Server ===
const startServer = () => {
  app.listen(config.port, () => {
    logger.info(`🚀 FileShare API server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
  });
};

startServer();

export default app;
