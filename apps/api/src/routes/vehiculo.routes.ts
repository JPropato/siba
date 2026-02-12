import { Router } from 'express';
import * as VehiculoController from '../controllers/vehiculo.controller.js';
import * as MultaVehiculoController from '../controllers/multaVehiculo.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de vehículos requieren autenticación
router.use(authenticateToken);

// Resumen (antes de /:id)
router.get('/resumen', requirePermission('vehiculos:leer'), VehiculoController.getResumen);

// Multas globales (antes de /:id)
router.get('/multas', requirePermission('vehiculos:leer'), MultaVehiculoController.getAll);
router.put(
  '/multas/:multaId',
  requirePermission('vehiculos:escribir'),
  MultaVehiculoController.update
);
router.delete(
  '/multas/:multaId',
  requirePermission('vehiculos:escribir'),
  MultaVehiculoController.deleteOne
);

// CRUD vehiculos
router.get('/', requirePermission('vehiculos:leer'), VehiculoController.getAll);
router.post('/', requirePermission('vehiculos:escribir'), VehiculoController.create);
router.put('/:id', requirePermission('vehiculos:escribir'), VehiculoController.update);
router.delete('/:id', requirePermission('vehiculos:escribir'), VehiculoController.deleteOne);

// Multas por vehiculo (despues de /:id)
router.get(
  '/:id/multas',
  requirePermission('vehiculos:leer'),
  MultaVehiculoController.getByVehiculoId
);
router.post('/:id/multas', requirePermission('vehiculos:escribir'), MultaVehiculoController.create);

export default router;
