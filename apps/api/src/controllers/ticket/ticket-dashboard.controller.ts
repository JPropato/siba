import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NON_TERMINAL_STATES = ['NUEVO', 'ASIGNADO', 'EN_CURSO', 'PENDIENTE_CLIENTE'] as const;

export async function getDashboard(_req: Request, res: Response) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const baseWhere = { fechaEliminacion: null };

    // KPIs
    const [ticketsAbiertos, sinAsignar, emergenciasActivas, totalMes, finalizadosMes] =
      await Promise.all([
        prisma.ticket.count({
          where: { ...baseWhere, estado: { in: [...NON_TERMINAL_STATES] } },
        }),
        prisma.ticket.count({
          where: { ...baseWhere, estado: 'NUEVO' },
        }),
        prisma.ticket.count({
          where: { ...baseWhere, tipoTicket: 'SEA', estado: { in: [...NON_TERMINAL_STATES] } },
        }),
        prisma.ticket.count({
          where: { ...baseWhere, fechaCreacion: { gte: startOfMonth } },
        }),
        prisma.ticket.count({
          where: { ...baseWhere, fechaCreacion: { gte: startOfMonth }, estado: 'FINALIZADO' },
        }),
      ]);

    // Charts
    const [porEstadoRaw, porRubroRaw, porTipoSLARaw, porSucursalRaw] = await Promise.all([
      prisma.ticket.groupBy({
        by: ['estado'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.ticket.groupBy({
        by: ['rubro'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.ticket.groupBy({
        by: ['tipoTicket'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.ticket.groupBy({
        by: ['sucursalId'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Urgent tickets + recent activity
    const [urgentTickets, recentActivity] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          ...baseWhere,
          tipoTicket: { in: ['SEA', 'SEP'] },
          estado: { in: [...NON_TERMINAL_STATES] },
        },
        orderBy: { fechaCreacion: 'asc' },
        take: 10,
        select: {
          id: true,
          codigoInterno: true,
          descripcion: true,
          tipoTicket: true,
          estado: true,
          fechaCreacion: true,
          sucursal: { select: { nombre: true } },
        },
      }),
      prisma.ticketHistorial.findMany({
        orderBy: { fechaCambio: 'desc' },
        take: 10,
        select: {
          id: true,
          ticketId: true,
          campoModificado: true,
          valorAnterior: true,
          valorNuevo: true,
          observacion: true,
          fechaCambio: true,
          usuario: { select: { nombre: true, apellido: true } },
          ticket: { select: { codigoInterno: true } },
        },
      }),
    ]);

    // Resolve sucursal names for chart
    const sucursalIds = porSucursalRaw.map((s) => s.sucursalId);
    const sucursales = await prisma.sucursal.findMany({
      where: { id: { in: sucursalIds } },
      select: { id: true, nombre: true },
    });
    const sucursalMap = new Map(sucursales.map((s) => [s.id, s.nombre]));

    const tasaResolucion = totalMes > 0 ? Math.round((finalizadosMes / totalMes) * 100) : 0;

    res.json({
      kpis: {
        ticketsAbiertos,
        sinAsignar,
        emergenciasActivas,
        tasaResolucion,
        totalMes,
        finalizadosMes,
      },
      charts: {
        porEstado: porEstadoRaw.map((e) => ({ estado: e.estado, count: e._count.id })),
        porRubro: porRubroRaw.map((r) => ({ rubro: r.rubro, count: r._count.id })),
        porTipoSLA: porTipoSLARaw.map((t) => ({ tipoTicket: t.tipoTicket, count: t._count.id })),
        porSucursal: porSucursalRaw.map((s) => ({
          sucursalId: s.sucursalId,
          nombre: sucursalMap.get(s.sucursalId) || `Sucursal ${s.sucursalId}`,
          count: s._count.id,
        })),
      },
      urgentTickets: urgentTickets.map((t) => ({
        ...t,
        diasAbiertos: Math.floor((now.getTime() - new Date(t.fechaCreacion).getTime()) / 86400000),
      })),
      recentActivity: recentActivity.map((a) => ({
        ...a,
        codigoInterno: a.ticket.codigoInterno,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
}
