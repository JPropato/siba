import { Router } from 'express';
import * as SedeController from '../controllers/sucursal.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', requirePermission('sedes:leer'), SedeController.getAll);
router.post('/', requirePermission('sedes:escribir'), SedeController.create);
router.put('/:id', requirePermission('sedes:escribir'), SedeController.update);
router.delete('/:id', requirePermission('sedes:escribir'), SedeController.deleteOne);

export default router;
