import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const getEventos = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      usuarioId,
      modulo,
      accion,
      entidadTipo,
      search,
      fechaDesde,
      fechaHasta,
      obraId,
      ticketId,
      clienteId,
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (usuarioId) where.usuarioId = Number(usuarioId);
    if (modulo) where.modulo = modulo;
    if (accion) where.accion = accion;
    if (entidadTipo) where.entidadTipo = entidadTipo;
    if (obraId) where.obraId = Number(obraId);
    if (ticketId) where.ticketId = Number(ticketId);
    if (clienteId) where.clienteId = Number(clienteId);

    if (search) {
      where.descripcion = { contains: search, mode: 'insensitive' };
    }

    if (fechaDesde || fechaHasta) {
      where.fechaEvento = {};
      if (fechaDesde)
        (where.fechaEvento as Record<string, unknown>).gte = new Date(fechaDesde as string);
      if (fechaHasta)
        (where.fechaEvento as Record<string, unknown>).lte = new Date(fechaHasta as string);
    }

    const [total, eventos] = await Promise.all([
      prisma.eventoAuditoria.count({ where }),
      prisma.eventoAuditoria.findMany({
        where,
        include: {
          usuario: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
        orderBy: { fechaEvento: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      data: eventos,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[Audit] getEventos error:', error);
    res.status(500).json({ error: 'Error al obtener eventos de auditoría' });
  }
};

export const getModulos = async (_req: Request, res: Response) => {
  try {
    const modulos = await prisma.eventoAuditoria.findMany({
      select: { modulo: true },
      distinct: ['modulo'],
      orderBy: { modulo: 'asc' },
    });
    res.json(modulos.map((m) => m.modulo));
  } catch (error) {
    console.error('[Audit] getModulos error:', error);
    res.status(500).json({ error: 'Error al obtener módulos' });
  }
};

export const getAcciones = async (_req: Request, res: Response) => {
  try {
    const acciones = await prisma.eventoAuditoria.findMany({
      select: { accion: true },
      distinct: ['accion'],
      orderBy: { accion: 'asc' },
    });
    res.json(acciones.map((a) => a.accion));
  } catch (error) {
    console.error('[Audit] getAcciones error:', error);
    res.status(500).json({ error: 'Error al obtener acciones' });
  }
};
