import { Request, Response } from 'express';
import { z } from 'zod';
import { EstadoObra, ModoEjecucion, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { cambiarEstadoSchema, getUserId, TRANSICIONES_VALIDAS } from './utils.js';

// --- Controller Methods ---

export const cambiarEstado = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = cambiarEstadoSchema.parse(req.body);
    const nuevoEstado = body.estado;
    const userId = getUserId(req);

    const obra = await prisma.obra.findUnique({
      where: { id },
    });

    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    // Validar transicion
    const transicionesPermitidas = TRANSICIONES_VALIDAS[obra.estado];
    if (!transicionesPermitidas.includes(nuevoEstado)) {
      return res.status(400).json({
        error: `Transicion no permitida: ${obra.estado} → ${nuevoEstado}`,
        transicionesPermitidas,
      });
    }

    // Reglas especiales
    if (obra.modoEjecucion === ModoEjecucion.EJECUCION_DIRECTA) {
      // Solo puede ir de BORRADOR a EN_EJECUCION directamente
      if (obra.estado === EstadoObra.BORRADOR && nuevoEstado !== EstadoObra.EN_EJECUCION) {
        return res.status(400).json({
          error: 'En modo EJECUCION_DIRECTA, solo se puede pasar de BORRADOR a EN_EJECUCION',
        });
      }
    }

    const updatedData: Prisma.ObraUpdateInput = {
      estado: nuevoEstado,
    };

    // Setear fechas automaticamente
    if (nuevoEstado === EstadoObra.EN_EJECUCION && !obra.fechaInicioReal) {
      updatedData.fechaInicioReal = new Date();
    }
    if (nuevoEstado === EstadoObra.FINALIZADO && !obra.fechaFinReal) {
      updatedData.fechaFinReal = new Date();
    }
    if (nuevoEstado === EstadoObra.FACTURADO) {
      updatedData.fechaFacturacion = new Date();
    }

    // Usar transaccion para actualizar obra y registrar historial
    const [updatedObra] = await prisma.$transaction([
      prisma.obra.update({
        where: { id },
        data: updatedData,
      }),
      prisma.historialEstadoObra.create({
        data: {
          obraId: id,
          estadoAnterior: obra.estado,
          estadoNuevo: nuevoEstado,
          usuarioId: userId,
          observacion: body.observacion,
        },
      }),
    ]);

    console.log(`[ObraController] Estado cambiado: ${obra.codigo} ${obra.estado} → ${nuevoEstado}`);
    res.json(updatedObra);
  } catch (error) {
    console.error('[ObraController] CAMBIAR ESTADO ERROR:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({
      error: 'Error al cambiar estado',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};
