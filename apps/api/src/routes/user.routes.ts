import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de usuarios requieren autenticación
router.use(authenticateToken);

// CRUD con permisos
// GET: requiere lectura de seguridad
router.get('/', requirePermission('seguridad:leer'), UserController.getAll);
router.get('/:id', requirePermission('seguridad:leer'), UserController.getOne);

// POST/PUT/DELETE: requiere escritura de seguridad
router.post('/', requirePermission('seguridad:escribir'), UserController.create);
router.put('/:id', requirePermission('seguridad:escribir'), UserController.update);
router.delete('/:id', requirePermission('seguridad:escribir'), UserController.deleteOne);

export default router;
