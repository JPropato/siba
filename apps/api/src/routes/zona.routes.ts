import { Router } from 'express';
import * as ZonaController from '../controllers/zona.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', requirePermission('zonas:leer'), ZonaController.getAll);
router.get('/:id', requirePermission('zonas:leer'), ZonaController.getOne);
router.post('/', requirePermission('zonas:escribir'), ZonaController.create);
router.put('/:id', requirePermission('zonas:escribir'), ZonaController.update);
router.delete('/:id', requirePermission('zonas:escribir'), ZonaController.deleteOne);

export default router;
