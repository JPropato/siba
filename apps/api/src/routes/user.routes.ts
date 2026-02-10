import { Router } from 'express';
import * as UserController from '../controllers/user.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de usuarios requieren autenticación
router.use(authenticateToken);

// CRUD con permisos
router.get('/', requirePermission('usuarios:leer'), UserController.getAll);
router.get('/:id', requirePermission('usuarios:leer'), UserController.getOne);
router.post('/', requirePermission('usuarios:escribir'), UserController.create);
router.put('/:id', requirePermission('usuarios:escribir'), UserController.update);
router.delete('/:id', requirePermission('usuarios:escribir'), UserController.deleteOne);

export default router;
