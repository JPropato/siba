import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { EstadoTicket } from '@siba/shared';
import { ESTADO_LABELS, TRANSICIONES_VALIDAS, esTransicionValida } from '@siba/shared';
import { getUserId, logHistorial } from './utils.js';

// --- Schemas ---
const cambiarEstadoSchema = z.object({
  estado: z.enum(['NUEVO', 'ASIGNADO', 'EN_CURSO', 'PENDIENTE_CLIENTE', 'FINALIZADO', 'CANCELADO']),
  observacion: z.string().optional(),
  motivoRechazo: z.string().optional(),
  tecnicoId: z.number().int().optional(),
  fechaProgramada: z.string().datetime().optional().nullable(),
});

// --- Cambiar Estado con validación de transiciones ---
export const cambiarEstado = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = cambiarEstadoSchema.parse(req.body);
    const userId = getUserId(req);

    const ticket = await prisma.ticket.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const estadoActual = ticket.estado as EstadoTicket;
    const estadoNuevo = body.estado as EstadoTicket;

    // Validar transición
    if (!esTransicionValida(estadoActual, estadoNuevo)) {
      const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual];
      return res.status(400).json({
        error: `Transición no permitida de ${ESTADO_LABELS[estadoActual]} a ${ESTADO_LABELS[estadoNuevo]}`,
        transicionesPermitidas: transicionesPermitidas.map((e) => ({
          estado: e,
          label: ESTADO_LABELS[e],
        })),
      });
    }

    // Validaciones específicas por transición
    const updateData: Prisma.TicketUpdateInput = {
      estado: estadoNuevo,
      actualizadoPor: { connect: { id: userId } },
    };

    // NUEVO → ASIGNADO: requiere técnico
    if (estadoActual === 'NUEVO' && estadoNuevo === 'ASIGNADO') {
      const tecnicoId = body.tecnicoId || ticket.tecnicoId;
      if (!tecnicoId) {
        return res.status(400).json({
          error: 'Debe asignar un técnico para cambiar a estado ASIGNADO',
        });
      }
      // Validar que el técnico existe
      const tecnico = await prisma.empleado.findFirst({
        where: { id: tecnicoId, fechaEliminacion: null, tipo: 'TECNICO' },
      });
      if (!tecnico) {
        return res.status(400).json({ error: 'El técnico seleccionado no es válido.' });
      }
      updateData.tecnico = { connect: { id: tecnicoId } };
      if (body.fechaProgramada) {
        updateData.fechaProgramada = new Date(body.fechaProgramada);
      }
    }

    // PENDIENTE_CLIENTE → NUEVO (rechazo): guardar motivo
    if (estadoActual === 'PENDIENTE_CLIENTE' && estadoNuevo === 'NUEVO') {
      updateData.motivoRechazo = body.motivoRechazo || body.observacion || null;
      // Al rechazar, se desasigna el técnico (solo si tiene uno asignado)
      if (ticket.tecnicoId) {
        updateData.tecnico = { disconnect: true };
      }
      updateData.fechaProgramada = null;
    }

    // → FINALIZADO: registrar fecha de finalización
    if (estadoNuevo === 'FINALIZADO') {
      updateData.fechaFinalizacion = new Date();
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        sucursal: { select: { nombre: true, cliente: { select: { razonSocial: true } } } },
        tecnico: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    await logHistorial(id, userId, 'estado', estadoActual, estadoNuevo, body.observacion);

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};
