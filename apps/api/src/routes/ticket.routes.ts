import { Router } from 'express';
import * as ticketController from '../controllers/ticket.controller.js';

const router = Router();

router.get('/', ticketController.getAll);
router.get('/:id', ticketController.getById);
router.post('/', ticketController.create);
router.put('/:id', ticketController.update);
router.patch('/:id/estado', ticketController.cambiarEstado);
router.delete('/:id', ticketController.deleteOne);

export default router;
