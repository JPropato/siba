import { Router } from 'express';
import * as ticketController from '../controllers/ticket/index.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Proteger TODAS las rutas de tickets con autenticación
router.use(authenticateToken);

router.get('/', ticketController.getAll);
router.get('/:id', ticketController.getById);
router.post('/', ticketController.create);
router.put('/:id', ticketController.update);
router.patch('/:id/estado', ticketController.cambiarEstado);
router.delete('/:id', ticketController.deleteOne);

export default router;
