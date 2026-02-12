import { Router } from 'express';
import * as facturacionController from '../controllers/facturacion/index.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de facturacion requieren autenticacion
router.use(authenticateToken);

// === FACTURAS EMITIDAS ===
router.get(
  '/facturas',
  requirePermission('facturacion:leer'),
  facturacionController.getFacturasEmitidas
);
router.get(
  '/facturas/:id',
  requirePermission('facturacion:leer'),
  facturacionController.getFacturaEmitidaById
);
router.post(
  '/facturas',
  requirePermission('facturacion:escribir'),
  facturacionController.createFacturaEmitida
);
router.put(
  '/facturas/:id',
  requirePermission('facturacion:escribir'),
  facturacionController.updateFacturaEmitida
);
router.post(
  '/facturas/:id/anular',
  requirePermission('facturacion:escribir'),
  facturacionController.anularFacturaEmitida
);

// === COBROS ===
router.post(
  '/facturas/:id/cobros',
  requirePermission('facturacion:escribir'),
  facturacionController.registrarCobro
);

export default router;
