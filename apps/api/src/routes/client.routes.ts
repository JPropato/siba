import { Router } from 'express';
import * as ClientController from '../controllers/client.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de clientes requieren autenticación
router.use(authenticateToken);

// CRUD con permisos
// GET: requiere lectura de maestros
router.get('/', requirePermission('admin:leer'), ClientController.getAll);
router.get('/:id', requirePermission('admin:leer'), ClientController.getOne);

// POST/PUT/DELETE: requiere escritura de maestros
router.post('/', requirePermission('admin:escribir'), ClientController.create);
router.put('/:id', requirePermission('admin:escribir'), ClientController.update);
router.delete('/:id', requirePermission('admin:escribir'), ClientController.deleteOne);

export default router;
