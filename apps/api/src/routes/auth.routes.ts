import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas Públicas
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Rutas Privadas
router.get('/me', authenticateToken, me);

export default router;
