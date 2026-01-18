import { Router } from 'express';
import * as MaterialController from '../controllers/material.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de materiales requieren autenticación
router.use(authenticateToken);

router.get('/', requirePermission('admin:leer'), MaterialController.getAll);
router.post('/', requirePermission('admin:escribir'), MaterialController.create);
router.put('/:id', requirePermission('admin:escribir'), MaterialController.update);
router.get('/:id/history', requirePermission('admin:leer'), MaterialController.getHistory);

export default router;
