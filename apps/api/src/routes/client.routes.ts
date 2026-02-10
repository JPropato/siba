import { Router } from 'express';
import * as ClientController from '../controllers/client.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de clientes requieren autenticación
router.use(authenticateToken);

// CRUD con permisos
router.get('/', requirePermission('clientes:leer'), ClientController.getAll);
router.get('/:id', requirePermission('clientes:leer'), ClientController.getOne);
router.post('/', requirePermission('clientes:escribir'), ClientController.create);
router.put('/:id', requirePermission('clientes:escribir'), ClientController.update);
router.delete('/:id', requirePermission('clientes:escribir'), ClientController.deleteOne);

export default router;
