import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { RubroTicket, TipoTicket, EstadoTicket } from '@siba/shared';
import { ESTADO_LABELS } from '@siba/shared';
import { getUserId, logHistorial } from './utils.js';

// --- Schemas ---
const createTicketSchema = z.object({
  codigoCliente: z.string().max(50).optional().nullable(),
  descripcion: z.string().min(5).max(1000),
  trabajo: z.string().max(1000).optional().nullable(),
  observaciones: z.string().max(2000).optional().nullable(),
  rubro: z.string().min(1),
  tipoTicket: z.enum(['SEA', 'SEP', 'SN']).default('SN'),
  sucursalId: z.number().int(),
  tecnicoId: z.number().int().optional().nullable(),
  fechaProgramada: z.string().datetime().optional().nullable(),
  horaEjecucion: z.string().datetime().optional().nullable(),
  ticketRelacionadoId: z.number().int().optional().nullable(),
});

const updateTicketSchema = createTicketSchema.partial();

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const estado = req.query.estado as EstadoTicket;
    const rubro = req.query.rubro as RubroTicket;
    const tipoTicket = req.query.tipoTicket as TipoTicket;
    const sortBy = req.query.sortBy as string;
    const sortDir = (req.query.sortDir as string) === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    // Server-side sorting
    const allowedSortFields = [
      'codigoInterno',
      'descripcion',
      'estado',
      'tipoTicket',
      'fechaCreacion',
      'rubro',
    ];
    const orderBy: Prisma.TicketOrderByWithRelationInput =
      sortBy && allowedSortFields.includes(sortBy)
        ? { [sortBy]: sortDir }
        : { fechaCreacion: 'desc' };

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
    if (tipoTicket) whereClause.tipoTicket = tipoTicket;

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        include: {
          sucursal: { select: { nombre: true, cliente: { select: { razonSocial: true } } } },
          tecnico: { select: { id: true, nombre: true, apellido: true } },
          creadoPor: { select: { nombre: true, apellido: true } },
        },
        skip,
        take: limit,
        orderBy,
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

    // Validate sucursal exists and check for Correo Argentino requirement
    const sucursal = await prisma.sucursal.findFirst({
      where: { id: body.sucursalId, fechaEliminacion: null },
      include: { cliente: true },
    });
    if (!sucursal) {
      return res.status(400).json({ error: 'La sucursal seleccionada no existe.' });
    }

    // Validar Correo Argentino
    if (sucursal.cliente?.razonSocial?.toLowerCase().includes('correo') && !body.codigoCliente) {
      return res.status(400).json({
        error: 'El N° de Ticket Externo es obligatorio para clientes Correo Argentino.',
      });
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
        descripcion: body.descripcion,
        codigoCliente: body.codigoCliente,
        trabajo: body.trabajo,
        observaciones: body.observaciones,
        rubro: body.rubro as RubroTicket,
        tipoTicket: body.tipoTicket as TipoTicket,
        estado: 'NUEVO',
        sucursalId: body.sucursalId,
        fechaProgramada: body.fechaProgramada ? new Date(body.fechaProgramada) : null,
        horaEjecucion: body.horaEjecucion ? new Date(body.horaEjecucion) : null,
        creadoPorId: userId,
        tecnicoId: body.tecnicoId ?? null,
        ticketRelacionadoId: body.ticketRelacionadoId ?? null,
      },
      include: {
        sucursal: {
          select: { id: true, nombre: true, cliente: { select: { razonSocial: true } } },
        },
        tecnico: { select: { id: true, nombre: true, apellido: true } },
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

    // Solo se puede editar en estados NUEVO o ASIGNADO
    if (!['NUEVO', 'ASIGNADO'].includes(ticket.estado)) {
      return res.status(400).json({
        error: `No se puede editar un ticket en estado ${ESTADO_LABELS[ticket.estado as EstadoTicket]}`,
      });
    }

    // Validate sucursal if changing or validate Correo rule if needed
    if (body.sucursalId && body.sucursalId !== ticket.sucursalId) {
      const sucursal = await prisma.sucursal.findFirst({
        where: { id: body.sucursalId, fechaEliminacion: null },
        include: { cliente: true },
      });
      if (!sucursal) {
        return res.status(400).json({ error: 'La sucursal seleccionada no existe.' });
      }

      // Si cambia a una sucursal de Correo, validar codigoCliente
      if (sucursal.cliente?.razonSocial?.toLowerCase().includes('correo')) {
        const codigoCliente =
          body.codigoCliente !== undefined ? body.codigoCliente : ticket.codigoCliente;
        if (!codigoCliente) {
          return res.status(400).json({
            error: 'El N° de Ticket Externo es obligatorio para clientes Correo Argentino.',
          });
        }
      }
    } else {
      // Si no cambia sucursal, pero quizás es de Correo y está borrando el codigoCliente
      // O si el ticket ya era de Correo (chequeamos la sucursal actual)
      if (body.codigoCliente === null || body.codigoCliente === '') {
        const currentSucursal = await prisma.sucursal.findUnique({
          where: { id: ticket.sucursalId },
          include: { cliente: true },
        });
        if (currentSucursal?.cliente?.razonSocial?.toLowerCase().includes('correo')) {
          return res.status(400).json({
            error: 'El N° de Ticket Externo es obligatorio para clientes Correo Argentino.',
          });
        }
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

    // Log ALL field changes
    const changes: { campo: string; anterior: string | null; nuevo: string | null }[] = [];

    if (body.descripcion !== undefined && body.descripcion !== ticket.descripcion) {
      changes.push({ campo: 'descripcion', anterior: ticket.descripcion, nuevo: body.descripcion });
    }
    if (body.rubro !== undefined && body.rubro !== ticket.rubro) {
      changes.push({ campo: 'rubro', anterior: ticket.rubro, nuevo: body.rubro });
    }
    if (body.tipoTicket !== undefined && body.tipoTicket !== ticket.tipoTicket) {
      changes.push({ campo: 'tipoTicket', anterior: ticket.tipoTicket, nuevo: body.tipoTicket });
    }
    if (body.sucursalId !== undefined && body.sucursalId !== ticket.sucursalId) {
      changes.push({
        campo: 'sucursalId',
        anterior: String(ticket.sucursalId),
        nuevo: String(body.sucursalId),
      });
    }
    if (body.tecnicoId !== undefined && body.tecnicoId !== ticket.tecnicoId) {
      changes.push({
        campo: 'tecnicoId',
        anterior: String(ticket.tecnicoId),
        nuevo: String(body.tecnicoId),
      });
    }
    if (body.codigoCliente !== undefined && body.codigoCliente !== ticket.codigoCliente) {
      changes.push({
        campo: 'codigoCliente',
        anterior: ticket.codigoCliente,
        nuevo: body.codigoCliente || null,
      });
    }
    if (body.fechaProgramada !== undefined) {
      const oldDate = ticket.fechaProgramada
        ? new Date(ticket.fechaProgramada).toISOString().split('T')[0]
        : null;
      const newDate = body.fechaProgramada
        ? new Date(body.fechaProgramada).toISOString().split('T')[0]
        : null;
      if (oldDate !== newDate) {
        changes.push({ campo: 'fechaProgramada', anterior: oldDate, nuevo: newDate });
      }
    }
    if (body.trabajo !== undefined && body.trabajo !== ticket.trabajo) {
      changes.push({ campo: 'trabajo', anterior: ticket.trabajo, nuevo: body.trabajo || null });
    }
    if (body.observaciones !== undefined && body.observaciones !== ticket.observaciones) {
      changes.push({
        campo: 'observaciones',
        anterior: ticket.observaciones,
        nuevo: body.observaciones || null,
      });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        descripcion: body.descripcion,
        codigoCliente: body.codigoCliente,
        trabajo: body.trabajo,
        observaciones: body.observaciones,
        rubro: body.rubro as RubroTicket,
        tipoTicket: body.tipoTicket as TipoTicket,
        sucursalId: body.sucursalId,
        fechaProgramada:
          body.fechaProgramada !== undefined
            ? body.fechaProgramada
              ? new Date(body.fechaProgramada)
              : null
            : undefined,
        horaEjecucion:
          body.horaEjecucion !== undefined
            ? body.horaEjecucion
              ? new Date(body.horaEjecucion)
              : null
            : undefined,
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

export const getHistorial = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const historial = await prisma.ticketHistorial.findMany({
      where: { ticketId: id },
      orderBy: { fechaCambio: 'desc' },
      include: {
        usuario: { select: { nombre: true, apellido: true } },
      },
    });

    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};
