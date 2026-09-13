import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { adminAuthMiddleware } from '../middleware/auth.js';

const router = Router();

// Публичные маршруты (без авторизации)
router.get('/status', AdminController.status);
router.post('/setup', AdminController.setup);
router.post('/login', AdminController.login);

// Защищённые маршруты (требуют авторизацию)
router.use(adminAuthMiddleware);
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);
router.get('/stats', AdminController.stats);

export default router;
