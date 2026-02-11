import { Router } from 'express';
import * as empleadoController from '../controllers/empleado.controller.js';
import * as seguroAPController from '../controllers/seguroAP.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de empleados requieren autenticación
router.use(authenticateToken);

// --- Seguros AP (antes de /:id para evitar conflicto de rutas) ---
router.get('/seguros-ap', requirePermission('empleados:leer'), seguroAPController.getAll);
router.get(
  '/seguros-ap/resumen',
  requirePermission('empleados:leer'),
  seguroAPController.getResumen
);
router.put(
  '/seguros-ap/:seguroId',
  requirePermission('empleados:escribir'),
  seguroAPController.update
);
router.post(
  '/seguros-ap/:seguroId/estado',
  requirePermission('empleados:escribir'),
  seguroAPController.cambiarEstado
);

// --- Empleados ---
router.get('/', requirePermission('empleados:leer'), empleadoController.getAll);
router.get('/:id', requirePermission('empleados:leer'), empleadoController.getById);
router.post('/', requirePermission('empleados:escribir'), empleadoController.create);
router.put('/:id', requirePermission('empleados:escribir'), empleadoController.update);
router.delete('/:id', requirePermission('empleados:escribir'), empleadoController.deleteOne);

// --- Seguros AP por empleado ---
router.get(
  '/:id/seguros-ap',
  requirePermission('empleados:leer'),
  seguroAPController.getByEmpleadoId
);
router.post('/:id/seguros-ap', requirePermission('empleados:escribir'), seguroAPController.create);

export default router;
