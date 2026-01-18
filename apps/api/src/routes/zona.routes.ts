import { Router } from 'express';
import * as ZonaController from '../controllers/zona.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', requirePermission('admin:leer'), ZonaController.getAll);
router.get('/:id', requirePermission('admin:leer'), ZonaController.getOne);

router.post('/', requirePermission('admin:escribir'), ZonaController.create);
router.put('/:id', requirePermission('admin:escribir'), ZonaController.update);
router.delete('/:id', requirePermission('admin:escribir'), ZonaController.deleteOne);

export default router;
