import { Router } from 'express';
import * as obraController from '../controllers/obra/index.js';
import * as presupuestoController from '../controllers/presupuesto.controller.js';
import * as obraExtrasController from '../controllers/obraExtras.controller.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de obras requieren autenticación
router.use(authenticateToken);

// Obras CRUD
router.get('/', requirePermission('obras:leer'), obraController.getAll);
router.get('/:id', requirePermission('obras:leer'), obraController.getById);
router.post('/', requirePermission('obras:escribir'), obraController.create);
router.put('/:id', requirePermission('obras:escribir'), obraController.update);
router.patch('/:id/estado', requirePermission('obras:escribir'), obraController.cambiarEstado);
router.delete('/:id', requirePermission('obras:escribir'), obraController.deleteOne);

// Presupuesto endpoints
router.get(
  '/:obraId/presupuesto',
  requirePermission('obras:leer'),
  presupuestoController.getPresupuesto
);
router.get(
  '/:obraId/presupuesto/versiones',
  requirePermission('obras:leer'),
  presupuestoController.getVersiones
);
router.post(
  '/:obraId/presupuesto/versiones',
  requirePermission('obras:escribir'),
  presupuestoController.createVersion
);
router.post(
  '/:obraId/presupuesto/items',
  requirePermission('obras:escribir'),
  presupuestoController.addItem
);
router.put(
  '/:obraId/presupuesto/items/reorder',
  requirePermission('obras:escribir'),
  presupuestoController.reorderItems
);
router.put(
  '/:obraId/presupuesto/items/:itemId',
  requirePermission('obras:escribir'),
  presupuestoController.updateItem
);
router.delete(
  '/:obraId/presupuesto/items/:itemId',
  requirePermission('obras:escribir'),
  presupuestoController.deleteItem
);
router.post(
  '/:obraId/presupuesto/generar-pdf',
  requirePermission('obras:escribir'),
  presupuestoController.generarPDF
);

// Comentarios endpoints
router.get(
  '/:obraId/comentarios',
  requirePermission('obras:leer'),
  obraExtrasController.getComentarios
);
router.post(
  '/:obraId/comentarios',
  requirePermission('obras:escribir'),
  obraExtrasController.createComentario
);
router.delete(
  '/:obraId/comentarios/:comentarioId',
  requirePermission('obras:escribir'),
  obraExtrasController.deleteComentario
);

// Historial endpoints
router.get(
  '/:obraId/historial',
  requirePermission('obras:leer'),
  obraExtrasController.getHistorial
);

// Archivos endpoints
router.get('/:obraId/archivos', requirePermission('obras:leer'), obraExtrasController.getArchivos);
router.post(
  '/:obraId/archivos',
  requirePermission('obras:escribir'),
  obraExtrasController.upload.single('archivo'),
  obraExtrasController.uploadArchivo
);
router.delete(
  '/:obraId/archivos/:archivoId',
  requirePermission('obras:escribir'),
  obraExtrasController.deleteArchivo
);

export default router;
