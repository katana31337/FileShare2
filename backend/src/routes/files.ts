import { Router } from 'express';
import multer from 'multer';
import config from '../config/index.js';
import { FileController } from '../controllers/FileController.js';
import { sessionMiddleware } from '../middleware/session.js';

const router = Router();

// Multer для загрузки файлов (в память)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Все маршруты требуют сессию
router.use(sessionMiddleware);

// Загрузка файла
router.post('/upload', upload.single('file'), FileController.upload);

// Список файлов сессии
router.get('/', FileController.listBySession);

// Скачивание файла
router.get('/:id/download', FileController.download);

// Удаление файла
router.delete('/:id', FileController.delete);

export default router;
