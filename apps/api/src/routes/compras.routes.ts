import { Router } from 'express';
import * as comprasController from '../controllers/compras/index.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de compras requieren autenticación
router.use(authenticateToken);

// === PROVEEDORES ===
router.get('/proveedores', requirePermission('compras:leer'), comprasController.getProveedores);
router.get(
  '/proveedores/:id',
  requirePermission('compras:leer'),
  comprasController.getProveedorById
);
router.post(
  '/proveedores',
  requirePermission('compras:escribir'),
  comprasController.createProveedor
);
router.put(
  '/proveedores/:id',
  requirePermission('compras:escribir'),
  comprasController.updateProveedor
);
router.delete(
  '/proveedores/:id',
  requirePermission('compras:escribir'),
  comprasController.deleteProveedor
);

// === FACTURAS ===
router.get('/facturas', requirePermission('compras:leer'), comprasController.getFacturas);
router.get('/facturas/:id', requirePermission('compras:leer'), comprasController.getFacturaById);
router.post('/facturas', requirePermission('compras:escribir'), comprasController.createFactura);
router.put('/facturas/:id', requirePermission('compras:escribir'), comprasController.updateFactura);
router.post(
  '/facturas/:id/anular',
  requirePermission('compras:escribir'),
  comprasController.anularFactura
);

// === PAGOS ===
router.post(
  '/facturas/:id/pagos',
  requirePermission('compras:escribir'),
  comprasController.registrarPago
);

// === CHEQUES ===
// Batch routes BEFORE /:id to avoid param collision
router.post(
  '/cheques/vender-batch',
  requirePermission('compras:escribir'),
  comprasController.venderBatchCheques
);
router.post(
  '/cheques/acreditar-venta',
  requirePermission('compras:escribir'),
  comprasController.acreditarVentaCheques
);
router.get('/cheques', requirePermission('compras:leer'), comprasController.getCheques);
router.get('/cheques/:id', requirePermission('compras:leer'), comprasController.getChequeById);
router.post('/cheques', requirePermission('compras:escribir'), comprasController.createCheque);
router.put('/cheques/:id', requirePermission('compras:escribir'), comprasController.updateCheque);
router.post(
  '/cheques/:id/depositar',
  requirePermission('compras:escribir'),
  comprasController.depositarCheque
);
router.post(
  '/cheques/:id/cobrar',
  requirePermission('compras:escribir'),
  comprasController.cobrarCheque
);
router.post(
  '/cheques/:id/endosar',
  requirePermission('compras:escribir'),
  comprasController.endosarCheque
);
router.post(
  '/cheques/:id/rechazar',
  requirePermission('compras:escribir'),
  comprasController.rechazarCheque
);
router.post(
  '/cheques/:id/anular',
  requirePermission('compras:escribir'),
  comprasController.anularCheque
);
router.post(
  '/cheques/:id/vender',
  requirePermission('compras:escribir'),
  comprasController.venderCheque
);

export default router;
