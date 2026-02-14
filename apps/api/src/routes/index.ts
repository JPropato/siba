import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import roleRoutes from './role.routes.js';
import clientRoutes from './client.routes.js';
import zonaRoutes from './zona.routes.js';
import sedeRoutes from './sucursal.routes.js';
import vehiculoRoutes from './vehiculo.routes.js';
import materialRoutes from './material.routes.js';
import empleadoRoutes from './empleado.routes.js';
import ticketRoutes from './ticket.routes.js';
import uploadRoutes from './upload.routes.js';
import otRoutes from './ot.routes.js';
import obraRoutes from './obra.routes.js';
import finanzasRoutes from './finanzas.routes.js';
import comprasRoutes from './compras.routes.js';
import facturacionRoutes from './facturacion.routes.js';
import auditRoutes from './audit.routes.js';
import tarjetasRoutes from './tarjetas.routes.js';
import chatRoutes from './chat.routes.js';
import sseRoutes from './sse.routes.js';

const router = Router();

// Rutas de módulos
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/clients', clientRoutes);
router.use('/zones', zonaRoutes);
router.use('/sedes', sedeRoutes);
router.use('/vehiculos', vehiculoRoutes);
router.use('/materials', materialRoutes);
router.use('/empleados', empleadoRoutes);
router.use('/tickets', ticketRoutes);
router.use('/upload', uploadRoutes);
router.use('/ordenes-trabajo', otRoutes);
router.use('/obras', obraRoutes);
router.use('/finanzas', finanzasRoutes);
router.use('/compras', comprasRoutes);
router.use('/facturacion', facturacionRoutes);
router.use('/audit', auditRoutes);
router.use('/tarjetas', tarjetasRoutes);
router.use('/chat', chatRoutes);
router.use('/', sseRoutes);

export default router;
