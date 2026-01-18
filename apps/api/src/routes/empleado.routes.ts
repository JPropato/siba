import { Router } from 'express';
import * as empleadoController from '../controllers/empleado.controller.js';

const router = Router();

router.get('/', empleadoController.getAll);
router.get('/:id', empleadoController.getById);
router.post('/', empleadoController.create);
router.put('/:id', empleadoController.update);
router.delete('/:id', empleadoController.deleteOne);

export default router;
