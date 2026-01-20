import { Router } from 'express';
import * as finanzasController from '../controllers/finanzas.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de finanzas requieren autenticación
router.use(authenticateToken);

// === DASHBOARD / REPORTES ===
router.get('/dashboard', requirePermission('finanzas:leer'), finanzasController.getDashboard);
router.get('/saldos', requirePermission('finanzas:leer'), finanzasController.getSaldos);

// === BANCOS ===
router.get('/bancos', requirePermission('finanzas:leer'), finanzasController.getBancos);
router.post('/bancos', requirePermission('finanzas:escribir'), finanzasController.createBanco);
router.put('/bancos/:id', requirePermission('finanzas:escribir'), finanzasController.updateBanco);

// === CUENTAS ===
router.get('/cuentas', requirePermission('finanzas:leer'), finanzasController.getCuentas);
router.post('/cuentas', requirePermission('finanzas:escribir'), finanzasController.createCuenta);
router.get('/cuentas/:id', requirePermission('finanzas:leer'), finanzasController.getCuentaById);
router.put('/cuentas/:id', requirePermission('finanzas:escribir'), finanzasController.updateCuenta);
router.delete(
  '/cuentas/:id',
  requirePermission('finanzas:escribir'),
  finanzasController.deleteCuenta
);

// === MOVIMIENTOS ===
router.get('/movimientos', requirePermission('finanzas:leer'), finanzasController.getMovimientos);
router.post(
  '/movimientos',
  requirePermission('finanzas:escribir'),
  finanzasController.createMovimiento
);
router.get(
  '/movimientos/:id',
  requirePermission('finanzas:leer'),
  finanzasController.getMovimientoById
);
router.put(
  '/movimientos/:id',
  requirePermission('finanzas:escribir'),
  finanzasController.updateMovimiento
);
router.post(
  '/movimientos/:id/anular',
  requirePermission('finanzas:escribir'),
  finanzasController.anularMovimiento
);
router.post(
  '/movimientos/:id/confirmar',
  requirePermission('finanzas:escribir'),
  finanzasController.confirmarMovimiento
);

export default router;
