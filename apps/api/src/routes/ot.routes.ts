import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware.js';
import { getUserId, logHistorial } from '../controllers/ticket/utils.js';

type IdParams = { id: string };

const router = Router();

// Proteger TODAS las rutas de OT con autenticación
router.use(authenticateToken);

// Validation schemas
const createOTSchema = z.object({
  ticketId: z.number().int().positive(),
  descripcionTrabajo: z.string().min(1, 'Descripción del trabajo es requerida'),
  materialesUsados: z.string().optional().nullable(),
  fechaOT: z.string().optional(), // ISO date string
});

const updateOTSchema = z.object({
  descripcionTrabajo: z.string().min(1).optional(),
  materialesUsados: z.string().optional().nullable(),
  firmaResponsable: z.string().optional().nullable(),
  aclaracionResponsable: z.string().optional().nullable(),
});

/**
 * GET /api/ordenes-trabajo
 * List all work orders with filters
 */
router.get('/', requirePermission('ordenes:leer'), async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', ticketId } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const where: Record<string, unknown> = {};
    if (ticketId) {
      where.ticketId = parseInt(ticketId as string, 10);
    }

    const [ordenes, total] = await Promise.all([
      prisma.ordenTrabajo.findMany({
        where,
        skip,
        take: parseInt(limit as string, 10),
        orderBy: { fechaCreacion: 'desc' },
        include: {
          ticket: {
            select: { id: true, codigoInterno: true, descripcion: true },
          },
          cliente: {
            select: { id: true, razonSocial: true },
          },
          sucursal: {
            select: { id: true, nombre: true },
          },
          tecnico: {
            select: { id: true, nombre: true, apellido: true },
          },
          archivos: true,
        },
      }),
      prisma.ordenTrabajo.count({ where }),
    ]);

    return res.json({
      data: ordenes,
      meta: {
        total,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        totalPages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    });
  } catch (error) {
    console.error('[OT] List Error:', error);
    return res.status(500).json({ error: 'Error al obtener órdenes de trabajo' });
  }
});

/**
 * GET /api/ordenes-trabajo/:id
 * Get single work order by ID
 */
router.get(
  '/:id',
  requirePermission('ordenes:leer'),
  async (req: Request<IdParams>, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);

      const orden = await prisma.ordenTrabajo.findUnique({
        where: { id },
        include: {
          ticket: {
            select: {
              id: true,
              codigoInterno: true,
              descripcion: true,
              rubro: true,
              estado: true,
            },
          },
          cliente: true,
          sucursal: true,
          tecnico: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          archivos: true,
        },
      });

      if (!orden) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }

      return res.json(orden);
    } catch (error) {
      console.error('[OT] Get Error:', error);
      return res.status(500).json({ error: 'Error al obtener orden de trabajo' });
    }
  }
);

/**
 * POST /api/ordenes-trabajo
 * Create work order from ticket
 */
router.post('/', requirePermission('ordenes:escribir'), async (req: Request, res: Response) => {
  try {
    const data = createOTSchema.parse(req.body);

    // Get ticket with sucursal to extract clienteId
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
      include: {
        sucursal: { select: { id: true, clienteId: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (ticket.estado === 'FINALIZADO') {
      return res.status(400).json({ error: 'El ticket ya está finalizado' });
    }

    if (!ticket.tecnicoId) {
      return res.status(400).json({ error: 'El ticket debe tener un técnico asignado' });
    }

    // Check if OT already exists for this ticket
    const existingOT = await prisma.ordenTrabajo.findUnique({
      where: { ticketId: ticket.id },
    });

    if (existingOT) {
      return res.status(400).json({ error: 'Ya existe una orden de trabajo para este ticket' });
    }

    // Create OT
    const orden = await prisma.ordenTrabajo.create({
      data: {
        ticketId: ticket.id,
        clienteId: ticket.sucursal.clienteId,
        sucursalId: ticket.sucursalId,
        tecnicoId: ticket.tecnicoId,
        fechaOT: data.fechaOT ? new Date(data.fechaOT) : new Date(),
        descripcionTrabajo: data.descripcionTrabajo,
        materialesUsados: data.materialesUsados,
      },
      include: {
        ticket: { select: { id: true, codigoInterno: true } },
        tecnico: { select: { nombre: true, apellido: true } },
      },
    });

    // Update ticket status to EN_CURSO if it's not already
    const estadoAnterior = ticket.estado;
    if (ticket.estado !== 'EN_CURSO') {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { estado: 'EN_CURSO' },
      });
    }

    // Log OT creation and estado change in historial
    const userId = getUserId(req);
    await logHistorial(
      ticket.id,
      userId,
      'ot_creacion',
      null,
      `OT #${orden.id}`,
      `Orden de trabajo creada: ${data.descripcionTrabajo}`
    );
    if (estadoAnterior !== 'EN_CURSO') {
      await logHistorial(ticket.id, userId, 'estado', estadoAnterior, 'EN_CURSO');
    }

    return res.status(201).json(orden);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('[OT] Create Error:', error);
    return res.status(500).json({ error: 'Error al crear orden de trabajo' });
  }
});

/**
 * PUT /api/ordenes-trabajo/:id
 * Update work order
 */
router.put(
  '/:id',
  requirePermission('ordenes:escribir'),
  async (req: Request<IdParams>, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateOTSchema.parse(req.body);

      const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });
      if (!orden) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }

      const updated = await prisma.ordenTrabajo.update({
        where: { id },
        data,
        include: {
          ticket: { select: { id: true, codigoInterno: true } },
          archivos: true,
        },
      });

      // Log OT update in historial
      const userId = getUserId(req);
      const cambios: string[] = [];
      if (data.descripcionTrabajo && data.descripcionTrabajo !== orden.descripcionTrabajo)
        cambios.push('descripción del trabajo');
      if (data.materialesUsados !== undefined && data.materialesUsados !== orden.materialesUsados)
        cambios.push('materiales usados');
      if (cambios.length > 0) {
        await logHistorial(
          orden.ticketId,
          userId,
          'ot_actualizacion',
          null,
          `OT #${orden.id}`,
          `Se actualizó: ${cambios.join(', ')}`
        );
      }

      return res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[OT] Update Error:', error);
      return res.status(500).json({ error: 'Error al actualizar orden de trabajo' });
    }
  }
);

/**
 * POST /api/ordenes-trabajo/:id/finalizar
 * Complete work order and finalize ticket
 */
router.post(
  '/:id/finalizar',
  requirePermission('ordenes:escribir'),
  async (req: Request<IdParams>, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { firmaResponsable, aclaracionResponsable } = req.body;

      const orden = await prisma.ordenTrabajo.findUnique({
        where: { id },
        include: { ticket: true },
      });

      if (!orden) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }

      // Update OT with signature
      await prisma.ordenTrabajo.update({
        where: { id },
        data: {
          firmaResponsable,
          aclaracionResponsable,
        },
      });

      // Finalize ticket
      const estadoAnterior = orden.ticket.estado;
      await prisma.ticket.update({
        where: { id: orden.ticketId },
        data: {
          estado: 'FINALIZADO',
          fechaFinalizacion: new Date(),
        },
      });

      // Log OT finalization and estado change
      const userId = getUserId(req);
      await logHistorial(
        orden.ticketId,
        userId,
        'ot_finalizacion',
        null,
        `OT #${orden.id}`,
        'Orden de trabajo finalizada'
      );
      if (estadoAnterior !== 'FINALIZADO') {
        await logHistorial(orden.ticketId, userId, 'estado', estadoAnterior, 'FINALIZADO');
      }

      return res.json({ success: true, message: 'Orden de trabajo finalizada' });
    } catch (error) {
      console.error('[OT] Finalizar Error:', error);
      return res.status(500).json({ error: 'Error al finalizar orden de trabajo' });
    }
  }
);

/**
 * DELETE /api/ordenes-trabajo/:id
 * Delete work order (soft delete would be better for production)
 */
router.delete(
  '/:id',
  requirePermission('ordenes:escribir'),
  async (req: Request<IdParams>, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);

      const orden = await prisma.ordenTrabajo.findUnique({ where: { id } });
      if (!orden) {
        return res.status(404).json({ error: 'Orden de trabajo no encontrada' });
      }

      // Log OT deletion before deleting
      const userId = getUserId(req);
      await logHistorial(
        orden.ticketId,
        userId,
        'ot_eliminacion',
        `OT #${orden.id}`,
        null,
        'Orden de trabajo eliminada'
      );

      // Delete associated files first
      await prisma.archivo.deleteMany({ where: { ordenTrabajoId: id } });

      // Delete OT
      await prisma.ordenTrabajo.delete({ where: { id } });

      return res.json({ success: true, message: 'Orden de trabajo eliminada' });
    } catch (error) {
      console.error('[OT] Delete Error:', error);
      return res.status(500).json({ error: 'Error al eliminar orden de trabajo' });
    }
  }
);

export default router;
