import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import * as auditController from '../controllers/audit.controller.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('audit:leer'), auditController.getEventos);
router.get('/modulos', requirePermission('audit:leer'), auditController.getModulos);
router.get('/acciones', requirePermission('audit:leer'), auditController.getAcciones);

export default router;
