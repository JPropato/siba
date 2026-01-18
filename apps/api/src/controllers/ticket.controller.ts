import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, RubroTicket, PrioridadTicket, EstadoTicket } from '@prisma/client';
import { prisma } from '../index.js';

// --- Schemas ---
const createTicketSchema = z.object({
  codigoCliente: z.string().max(50).optional().nullable(),
  descripcion: z.string().min(5).max(1000),
  trabajo: z.string().max(1000).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
  rubro: z.nativeEnum(RubroTicket),
  prioridad: z.nativeEnum(PrioridadTicket),
  estado: z.nativeEnum(EstadoTicket).optional(),
  fechaProgramada: z.string().datetime().optional().nullable(),
  sucursalId: z.number().int(),
  tecnicoId: z.number().int().optional().nullable(),
  ticketRelacionadoId: z.number().int().optional().nullable(),
});

const updateTicketSchema = createTicketSchema.partial();

// Helper to get user ID from request (assumes auth middleware sets req.user)
const getUserId = (req: Request): number => {
  const user = (req as Request & { user?: { id: number } }).user;
  return user?.id || 1; // Fallback to 1 for dev, should always have user in prod
};

// Helper to log ticket history
const logHistorial = async (
  ticketId: number,
  usuarioId: number,
  campo: string,
  valorAnterior: string | null,
  valorNuevo: string | null,
  observacion?: string
) => {
  await prisma.ticketHistorial.create({
    data: {
      ticketId,
      usuarioId,
      campoModificado: campo,
      valorAnterior,
      valorNuevo,
      observacion,
    },
  });
};

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const estado = req.query.estado as EstadoTicket;
    const rubro = req.query.rubro as RubroTicket;
    const prioridad = req.query.prioridad as PrioridadTicket;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.TicketWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      whereClause.OR = [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { codigoCliente: { contains: search, mode: 'insensitive' } },
        { trabajo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) whereClause.estado = estado;
    if (rubro) whereClause.rubro = rubro;
    if (prioridad) whereClause.prioridad = prioridad;

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        include: {
          sucursal: { select: { nombre: true, cliente: { select: { razonSocial: true } } } },
          tecnico: { select: { nombre: true, apellido: true } },
          creadoPor: { select: { nombre: true, apellido: true } },
        },
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
      }),
    ]);

    res.json({
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const ticket = await prisma.ticket.findFirst({
      where: { id, fechaEliminacion: null },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            cliente: { select: { id: true, razonSocial: true } },
          },
        },
        tecnico: { select: { id: true, nombre: true, apellido: true } },
        creadoPor: { select: { id: true, nombre: true, apellido: true } },
        actualizadoPor: { select: { id: true, nombre: true, apellido: true } },
        ticketRelacionado: { select: { id: true, codigoInterno: true, descripcion: true } },
        historial: {
          orderBy: { fechaCambio: 'desc' },
          include: { usuario: { select: { nombre: true, apellido: true } } },
        },
        ordenTrabajo: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error al obtener ticket:', error);
    res.status(500).json({ error: 'Error al obtener ticket' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createTicketSchema.parse(req.body);
    const userId = getUserId(req);

    // Validate sucursal exists
    const sucursal = await prisma.sucursal.findFirst({
      where: { id: body.sucursalId, fechaEliminacion: null },
    });
    if (!sucursal) {
      return res.status(400).json({ error: 'La sucursal seleccionada no existe.' });
    }

    // Validate tecnico if provided
    if (body.tecnicoId) {
      const tecnico = await prisma.empleado.findFirst({
        where: { id: body.tecnicoId, fechaEliminacion: null, tipo: 'TECNICO' },
      });
      if (!tecnico) {
        return res
          .status(400)
          .json({ error: 'El técnico seleccionado no existe o no es técnico.' });
      }
    }

    // Validate related ticket if provided
    if (body.ticketRelacionadoId) {
      const related = await prisma.ticket.findFirst({
        where: { id: body.ticketRelacionadoId, fechaEliminacion: null },
      });
      if (!related) {
        return res.status(400).json({ error: 'El ticket relacionado no existe.' });
      }
    }

    const newTicket = await prisma.ticket.create({
      data: {
        ...body,
        fechaProgramada: body.fechaProgramada ? new Date(body.fechaProgramada) : null,
        creadoPorId: userId,
        tecnicoId: body.tecnicoId ?? null,
        ticketRelacionadoId: body.ticketRelacionadoId ?? null,
      },
      include: {
        sucursal: { select: { nombre: true } },
        tecnico: { select: { nombre: true, apellido: true } },
      },
    });

    // Log creation in historial
    await logHistorial(newTicket.id, userId, 'creacion', null, 'Ticket creado');

    res.status(201).json(newTicket);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al crear ticket:', error);
    res.status(500).json({ error: 'Error al crear ticket' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateTicketSchema.parse(req.body);
    const userId = getUserId(req);

    const ticket = await prisma.ticket.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Validate sucursal if changing
    if (body.sucursalId && body.sucursalId !== ticket.sucursalId) {
      const sucursal = await prisma.sucursal.findFirst({
        where: { id: body.sucursalId, fechaEliminacion: null },
      });
      if (!sucursal) {
        return res.status(400).json({ error: 'La sucursal seleccionada no existe.' });
      }
    }

    // Validate tecnico if changing
    if (body.tecnicoId && body.tecnicoId !== ticket.tecnicoId) {
      const tecnico = await prisma.empleado.findFirst({
        where: { id: body.tecnicoId, fechaEliminacion: null, tipo: 'TECNICO' },
      });
      if (!tecnico) {
        return res
          .status(400)
          .json({ error: 'El técnico seleccionado no existe o no es técnico.' });
      }
    }

    // Log changes
    const changes: { campo: string; anterior: string | null; nuevo: string | null }[] = [];

    if (body.estado && body.estado !== ticket.estado) {
      changes.push({ campo: 'estado', anterior: ticket.estado, nuevo: body.estado });
    }
    if (body.tecnicoId !== undefined && body.tecnicoId !== ticket.tecnicoId) {
      changes.push({
        campo: 'tecnicoId',
        anterior: String(ticket.tecnicoId),
        nuevo: String(body.tecnicoId),
      });
    }
    if (body.prioridad && body.prioridad !== ticket.prioridad) {
      changes.push({ campo: 'prioridad', anterior: ticket.prioridad, nuevo: body.prioridad });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...body,
        fechaProgramada:
          body.fechaProgramada !== undefined
            ? body.fechaProgramada
              ? new Date(body.fechaProgramada)
              : null
            : undefined,
        fechaFinalizacion:
          body.estado === 'FINALIZADO' && ticket.estado !== 'FINALIZADO' ? new Date() : undefined,
        actualizadoPorId: userId,
        tecnicoId: body.tecnicoId === undefined ? undefined : (body.tecnicoId ?? null),
        ticketRelacionadoId:
          body.ticketRelacionadoId === undefined ? undefined : (body.ticketRelacionadoId ?? null),
      },
      include: {
        sucursal: { select: { nombre: true } },
        tecnico: { select: { nombre: true, apellido: true } },
      },
    });

    // Log all changes
    for (const change of changes) {
      await logHistorial(id, userId, change.campo, change.anterior, change.nuevo);
    }

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al actualizar ticket:', error);
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userId = getUserId(req);

    const ticket = await prisma.ticket.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Soft Delete
    await prisma.ticket.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    await logHistorial(id, userId, 'eliminacion', null, 'Ticket eliminado');

    res.json({ message: 'Ticket eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar ticket:', error);
    res.status(500).json({ error: 'Error al eliminar ticket' });
  }
};

// --- Estado change endpoint ---
export const cambiarEstado = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { estado, observacion } = req.body;
    const userId = getUserId(req);

    if (!estado || !Object.values(EstadoTicket).includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const ticket = await prisma.ticket.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const estadoAnterior = ticket.estado;

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        estado,
        fechaFinalizacion: estado === 'FINALIZADO' ? new Date() : undefined,
        actualizadoPorId: userId,
      },
    });

    await logHistorial(id, userId, 'estado', estadoAnterior, estado, observacion);

    res.json(updated);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};
