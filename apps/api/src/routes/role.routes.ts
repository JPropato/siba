import { Router } from 'express';
import * as RoleController from '../controllers/role.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Endpoint de permisos (lectura)
router.get('/permisos', requirePermission('roles:leer'), RoleController.getAllPermisos);

// CRUD de roles
router.get('/', requirePermission('roles:leer'), RoleController.getAll);
router.get('/:id', requirePermission('roles:leer'), RoleController.getOne);
router.post('/', requirePermission('roles:escribir'), RoleController.create);
router.put('/:id', requirePermission('roles:escribir'), RoleController.update);
router.delete('/:id', requirePermission('roles:escribir'), RoleController.deleteOne);

export default router;
