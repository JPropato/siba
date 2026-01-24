import { Router } from 'express';
import * as RoleController from '../controllers/role.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Endpoint de permisos (lectura)
router.get('/permisos', requirePermission('seguridad:leer'), RoleController.getAllPermisos);

// CRUD de roles
router.get('/', requirePermission('seguridad:leer'), RoleController.getAll);
router.get('/:id', requirePermission('seguridad:leer'), RoleController.getOne);
router.post('/', requirePermission('seguridad:escribir'), RoleController.create);
router.put('/:id', requirePermission('seguridad:escribir'), RoleController.update);
router.delete('/:id', requirePermission('seguridad:escribir'), RoleController.deleteOne);

export default router;
