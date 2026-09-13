import { Router } from 'express';
import { TextController } from '../controllers/TextController.js';
import { sessionMiddleware } from '../middleware/session.js';

const router = Router();

// Все маршруты требуют сессию
router.use(sessionMiddleware);

// Создание текста
router.post('/', TextController.create);

// Список текстов сессии
router.get('/', TextController.listBySession);

// Получение текста по ID
router.get('/:id', TextController.getById);

// Удаление текста
router.delete('/:id', TextController.delete);

export default router;
