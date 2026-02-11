import { Router } from 'express';
import * as ticketController from '../controllers/ticket/index.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Proteger TODAS las rutas de tickets con autenticación
router.use(authenticateToken);

router.get('/', requirePermission('tickets:leer'), ticketController.getAll);
router.get('/reference-data', requirePermission('tickets:leer'), ticketController.getReferenceData);
router.get('/dashboard', requirePermission('tickets:leer'), ticketController.getDashboard);
router.get(
  '/pendientes-zona/:zonaId',
  requirePermission('tickets:leer'),
  ticketController.getPendientesPorZona
);
router.get(
  '/pendientes-zona/:zonaId/pdf',
  requirePermission('tickets:leer'),
  ticketController.getPendientesPorZonaPDF
);
router.get('/:id', requirePermission('tickets:leer'), ticketController.getById);
router.get('/:id/historial', requirePermission('tickets:leer'), ticketController.getHistorial);
router.post('/', requirePermission('tickets:escribir'), ticketController.create);
router.put('/:id', requirePermission('tickets:escribir'), ticketController.update);
router.patch('/:id/estado', requirePermission('tickets:escribir'), ticketController.cambiarEstado);
router.post('/:id/notas', requirePermission('tickets:escribir'), ticketController.addNota);
router.delete('/:id', requirePermission('tickets:escribir'), ticketController.deleteOne);

export default router;
