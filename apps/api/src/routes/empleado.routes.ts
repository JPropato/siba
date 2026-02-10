import { Router } from 'express';
import * as empleadoController from '../controllers/empleado.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de empleados requieren autenticación
router.use(authenticateToken);

router.get('/', requirePermission('empleados:leer'), empleadoController.getAll);
router.get('/:id', requirePermission('empleados:leer'), empleadoController.getById);
router.post('/', requirePermission('empleados:escribir'), empleadoController.create);
router.put('/:id', requirePermission('empleados:escribir'), empleadoController.update);
router.delete('/:id', requirePermission('empleados:escribir'), empleadoController.deleteOne);

export default router;
