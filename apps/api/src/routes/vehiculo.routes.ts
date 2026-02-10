import { Router } from 'express';
import * as VehiculoController from '../controllers/vehiculo.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de vehículos requieren autenticación
router.use(authenticateToken);

router.get('/', requirePermission('vehiculos:leer'), VehiculoController.getAll);
router.post('/', requirePermission('vehiculos:escribir'), VehiculoController.create);
router.put('/:id', requirePermission('vehiculos:escribir'), VehiculoController.update);
router.delete('/:id', requirePermission('vehiculos:escribir'), VehiculoController.deleteOne);

export default router;
