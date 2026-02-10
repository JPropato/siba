import { Router } from 'express';
import * as MaterialController from '../controllers/material.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de materiales requieren autenticación
router.use(authenticateToken);

router.get('/', requirePermission('materiales:leer'), MaterialController.getAll);
router.post('/', requirePermission('materiales:escribir'), MaterialController.create);
router.put('/:id', requirePermission('materiales:escribir'), MaterialController.update);
router.get('/:id/history', requirePermission('materiales:leer'), MaterialController.getHistory);

export default router;
