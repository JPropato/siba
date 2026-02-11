import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { pdfService } from '../../services/pdf.service.js';
import type { EstadoTicket, TipoTicket, RubroTicket } from '@siba/shared';

const ESTADOS_PENDIENTES: EstadoTicket[] = ['NUEVO', 'ASIGNADO', 'EN_CURSO', 'PENDIENTE_CLIENTE'];

export const getPendientesPorZona = async (req: Request, res: Response) => {
  try {
    const zonaId = Number(req.params.zonaId);

    const zona = await prisma.zona.findUnique({ where: { id: zonaId } });
    if (!zona) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        fechaEliminacion: null,
        estado: { in: ESTADOS_PENDIENTES },
        sucursal: { zonaId },
      },
      include: {
        sucursal: {
          select: {
            nombre: true,
            cliente: { select: { razonSocial: true } },
          },
        },
        tecnico: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ tipoTicket: 'asc' }, { fechaCreacion: 'asc' }],
    });

    // Conteos por estado
    const totales = {
      nuevo: 0,
      asignado: 0,
      enCurso: 0,
      pendienteCliente: 0,
      total: tickets.length,
    };

    for (const t of tickets) {
      if (t.estado === 'NUEVO') totales.nuevo++;
      else if (t.estado === 'ASIGNADO') totales.asignado++;
      else if (t.estado === 'EN_CURSO') totales.enCurso++;
      else if (t.estado === 'PENDIENTE_CLIENTE') totales.pendienteCliente++;
    }

    res.json({
      zona: { id: zona.id, nombre: zona.nombre, codigo: zona.codigo },
      fecha: new Date().toISOString(),
      tickets: tickets.map((t) => ({
        id: t.id,
        codigoInterno: t.codigoInterno,
        descripcion: t.descripcion,
        sucursal: t.sucursal?.nombre || '-',
        cliente: t.sucursal?.cliente?.razonSocial || '-',
        tecnico: t.tecnico ? `${t.tecnico.nombre} ${t.tecnico.apellido}` : null,
        estado: t.estado as EstadoTicket,
        tipoTicket: t.tipoTicket as TipoTicket,
        rubro: t.rubro as RubroTicket,
        fechaCreacion: t.fechaCreacion.toISOString(),
      })),
      totales,
    });
  } catch (error) {
    console.error('Error al obtener pendientes por zona:', error);
    res.status(500).json({ error: 'Error al obtener pendientes por zona' });
  }
};

export const getPendientesPorZonaPDF = async (req: Request, res: Response) => {
  try {
    const zonaId = Number(req.params.zonaId);

    const zona = await prisma.zona.findUnique({ where: { id: zonaId } });
    if (!zona) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        fechaEliminacion: null,
        estado: { in: ESTADOS_PENDIENTES },
        sucursal: { zonaId },
      },
      include: {
        sucursal: {
          select: {
            nombre: true,
            cliente: { select: { razonSocial: true } },
          },
        },
        tecnico: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ tipoTicket: 'asc' }, { fechaCreacion: 'asc' }],
    });

    const totales = {
      nuevo: 0,
      asignado: 0,
      enCurso: 0,
      pendienteCliente: 0,
      total: tickets.length,
    };

    for (const t of tickets) {
      if (t.estado === 'NUEVO') totales.nuevo++;
      else if (t.estado === 'ASIGNADO') totales.asignado++;
      else if (t.estado === 'EN_CURSO') totales.enCurso++;
      else if (t.estado === 'PENDIENTE_CLIENTE') totales.pendienteCliente++;
    }

    const pdfBuffer = await pdfService.generarResumenPendientes({
      zona: { nombre: zona.nombre, codigo: zona.codigo },
      fecha: new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      tickets: tickets.map((t) => ({
        codigoInterno: t.codigoInterno,
        descripcion: t.descripcion,
        sucursal: t.sucursal?.nombre || '-',
        cliente: t.sucursal?.cliente?.razonSocial || '-',
        tecnico: t.tecnico ? `${t.tecnico.nombre} ${t.tecnico.apellido}` : null,
        estado: t.estado as EstadoTicket,
        tipoTicket: t.tipoTicket as TipoTicket,
        rubro: t.rubro as RubroTicket,
        fechaCreacion: new Date(t.fechaCreacion).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      })),
      totales,
    });

    const filename = `pendientes-zona-${zona.nombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF de pendientes:', error);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
};
