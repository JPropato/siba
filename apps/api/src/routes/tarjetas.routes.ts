import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import * as tarjetaCtrl from '../controllers/tarjetas/tarjeta.controller.js';
import * as cargaCtrl from '../controllers/tarjetas/carga.controller.js';
import * as gastoCtrl from '../controllers/tarjetas/gasto.controller.js';
import * as rendicionCtrl from '../controllers/tarjetas/rendicion.controller.js';
import * as configCategoriaCtrl from '../controllers/tarjetas/configCategoria.controller.js';

const router = Router();
router.use(authenticateToken);

// Config categorias (must be before :id routes)
router.get('/config-categorias', configCategoriaCtrl.getAll);
router.put(
  '/config-categorias/:id',
  requirePermission('tarjetas:escribir'),
  configCategoriaCtrl.update
);

// Resumen (must be before :id routes)
router.get('/resumen', tarjetaCtrl.getResumen);

// Rendiciones (all)
router.get('/rendiciones', rendicionCtrl.getRendiciones);
router.post('/rendiciones', requirePermission('tarjetas:escribir'), rendicionCtrl.createRendicion);
router.post(
  '/rendiciones/:id/cerrar',
  requirePermission('tarjetas:escribir'),
  rendicionCtrl.cerrarRendicion
);
router.post(
  '/rendiciones/:id/aprobar',
  requirePermission('tarjetas:aprobar'),
  rendicionCtrl.aprobarRendicion
);
router.post(
  '/rendiciones/:id/rechazar',
  requirePermission('tarjetas:aprobar'),
  rendicionCtrl.rechazarRendicion
);

// Gastos (update/delete by gastoId)
router.put('/gastos/:gastoId', requirePermission('tarjetas:escribir'), gastoCtrl.updateGasto);
router.delete('/gastos/:gastoId', requirePermission('tarjetas:escribir'), gastoCtrl.deleteGasto);

// CRUD tarjetas
router.get('/', tarjetaCtrl.getAll);
router.post('/', requirePermission('tarjetas:escribir'), tarjetaCtrl.create);
router.get('/:id', tarjetaCtrl.getById);
router.put('/:id', requirePermission('tarjetas:escribir'), tarjetaCtrl.update);
router.delete('/:id', requirePermission('tarjetas:escribir'), tarjetaCtrl.remove);

// Cargas (by tarjeta)
router.get('/:tarjetaId/cargas', cargaCtrl.getCargas);
router.post('/:tarjetaId/cargas', requirePermission('tarjetas:escribir'), cargaCtrl.createCarga);

// Gastos (by tarjeta)
router.get('/:tarjetaId/gastos', gastoCtrl.getGastos);
router.post('/:tarjetaId/gastos', requirePermission('tarjetas:escribir'), gastoCtrl.createGasto);

// Proveedores frecuentes (by tarjeta)
router.get('/:tarjetaId/proveedores-frecuentes', tarjetaCtrl.getProveedoresFrecuentes);

export default router;
