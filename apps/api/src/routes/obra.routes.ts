import { Router } from 'express';
import * as obraController from '../controllers/obra/index.js';
import * as presupuestoController from '../controllers/presupuesto.controller.js';
import * as obraExtrasController from '../controllers/obraExtras.controller.js';

const router = Router();

// Obras CRUD
router.get('/', obraController.getAll);
router.get('/:id', obraController.getById);
router.post('/', obraController.create);
router.put('/:id', obraController.update);
router.patch('/:id/estado', obraController.cambiarEstado);
router.delete('/:id', obraController.deleteOne);

// Presupuesto endpoints
router.get('/:obraId/presupuesto', presupuestoController.getPresupuesto);
router.get('/:obraId/presupuesto/versiones', presupuestoController.getVersiones);
router.post('/:obraId/presupuesto/versiones', presupuestoController.createVersion);
router.post('/:obraId/presupuesto/items', presupuestoController.addItem);
router.put('/:obraId/presupuesto/items/:itemId', presupuestoController.updateItem);
router.delete('/:obraId/presupuesto/items/:itemId', presupuestoController.deleteItem);
router.put('/:obraId/presupuesto/items/reorder', presupuestoController.reorderItems);
router.post('/:obraId/presupuesto/generar-pdf', presupuestoController.generarPDF);

// Comentarios endpoints
router.get('/:obraId/comentarios', obraExtrasController.getComentarios);
router.post('/:obraId/comentarios', obraExtrasController.createComentario);
router.delete('/:obraId/comentarios/:comentarioId', obraExtrasController.deleteComentario);

// Historial endpoints
router.get('/:obraId/historial', obraExtrasController.getHistorial);

// Archivos endpoints
router.get('/:obraId/archivos', obraExtrasController.getArchivos);
router.post(
  '/:obraId/archivos',
  obraExtrasController.upload.single('archivo'),
  obraExtrasController.uploadArchivo
);
router.delete('/:obraId/archivos/:archivoId', obraExtrasController.deleteArchivo);

export default router;
