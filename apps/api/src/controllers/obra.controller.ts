import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoObra, EstadoObra, ModoEjecucion, Prisma } from '@prisma/client';
import { prisma } from '../index.js';

// --- Schemas ---
const createObraSchema = z.object({
  tipo: z.nativeEnum(TipoObra),
  modoEjecucion: z.nativeEnum(ModoEjecucion).optional().default(ModoEjecucion.CON_PRESUPUESTO),
  titulo: z.string().min(3).max(200),
  descripcion: z.string().optional().nullable(),
  fechaSolicitud: z.string().datetime().or(z.date()),
  fechaInicioEstimada: z.string().datetime().or(z.date()).optional().nullable(),
  fechaFinEstimada: z.string().datetime().or(z.date()).optional().nullable(),
  clienteId: z.number().int(),
  sucursalId: z.number().int().optional().nullable(),
  ticketId: z.number().int().optional().nullable(),
  condicionesPago: z.string().optional().nullable(),
  validezDias: z.number().int().optional().default(30),
});

const updateObraSchema = createObraSchema.partial().extend({
  fechaInicioReal: z.string().datetime().or(z.date()).optional().nullable(),
  fechaFinReal: z.string().datetime().or(z.date()).optional().nullable(),
  numeroFactura: z.string().optional().nullable(),
  fechaFacturacion: z.string().datetime().or(z.date()).optional().nullable(),
});

const cambiarEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoObra),
  observacion: z.string().optional(),
});

// --- Helper Functions ---
function getUserId(req: Request): number {
  return req.user?.id || 1;
}

async function generateCodigo(): Promise<string> {
  const lastObra = await prisma.obra.findFirst({
    orderBy: { id: 'desc' },
    select: { codigo: true },
  });

  let nextNum = 1;
  if (lastObra?.codigo) {
    const match = lastObra.codigo.match(/OBR-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `OBR-${String(nextNum).padStart(5, '0')}`;
}

// Validación de transiciones de estado
const TRANSICIONES_VALIDAS: Record<EstadoObra, EstadoObra[]> = {
  [EstadoObra.BORRADOR]: [EstadoObra.PRESUPUESTADO, EstadoObra.EN_EJECUCION],
  [EstadoObra.PRESUPUESTADO]: [EstadoObra.APROBADO, EstadoObra.RECHAZADO, EstadoObra.BORRADOR],
  [EstadoObra.APROBADO]: [EstadoObra.EN_EJECUCION],
  [EstadoObra.RECHAZADO]: [EstadoObra.BORRADOR],
  [EstadoObra.EN_EJECUCION]: [EstadoObra.FINALIZADO],
  [EstadoObra.FINALIZADO]: [EstadoObra.FACTURADO],
  [EstadoObra.FACTURADO]: [],
};

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const estado = req.query.estado as EstadoObra | undefined;
    const tipo = req.query.tipo as TipoObra | undefined;
    const clienteId = req.query.clienteId ? Number(req.query.clienteId) : undefined;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ObraWhereInput = {};

    if (search) {
      whereClause.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { titulo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) {
      whereClause.estado = estado;
    }

    if (tipo) {
      whereClause.tipo = tipo;
    }

    if (clienteId) {
      whereClause.clienteId = clienteId;
    }

    const [total, obras] = await prisma.$transaction([
      prisma.obra.count({ where: whereClause }),
      prisma.obra.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          cliente: {
            select: { id: true, razonSocial: true, codigo: true },
          },
          sucursal: {
            select: { id: true, nombre: true, codigoInterno: true },
          },
          ticket: {
            select: { id: true, codigoInterno: true },
          },
        },
      }),
    ]);

    res.json({
      data: obras,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener obras:', error);
    res.status(500).json({ error: 'Error al obtener obras' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const obra = await prisma.obra.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, razonSocial: true, codigo: true },
        },
        sucursal: {
          select: { id: true, nombre: true, codigoInterno: true, direccion: true },
        },
        ticket: {
          select: { id: true, codigoInterno: true, descripcion: true },
        },
        creadoPor: {
          select: { id: true, nombre: true, apellido: true },
        },
        versiones: {
          orderBy: { version: 'desc' },
          include: {
            items: {
              orderBy: { orden: 'asc' },
            },
          },
        },
        archivos: {
          orderBy: { fechaCreacion: 'desc' },
        },
        historialEstados: {
          orderBy: { fechaCambio: 'desc' },
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    });

    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    res.json(obra);
  } catch (error) {
    console.error('Error al obtener obra:', error);
    res.status(500).json({ error: 'Error al obtener obra' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createObraSchema.parse(req.body);
    const userId = getUserId(req);
    const codigo = await generateCodigo();

    // Verificar cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: body.clienteId },
    });
    if (!cliente) {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    // Verificar sucursal si se proporciona
    if (body.sucursalId) {
      const sucursal = await prisma.sucursal.findUnique({
        where: { id: body.sucursalId },
      });
      if (!sucursal) {
        return res.status(400).json({ error: 'Sucursal no encontrada' });
      }
    }

    // Verificar ticket si se proporciona (y que no esté ya vinculado a otra obra)
    if (body.ticketId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: body.ticketId },
      });
      if (!ticket) {
        return res.status(400).json({ error: 'Ticket no encontrado' });
      }
      // Check if another obra already uses this ticket
      const existingObra = await prisma.obra.findFirst({
        where: { ticketId: body.ticketId },
      });
      if (existingObra) {
        return res.status(400).json({ error: 'El ticket ya está vinculado a otra obra' });
      }
    }

    const obra = await prisma.obra.create({
      data: {
        codigo,
        tipo: body.tipo,
        modoEjecucion: body.modoEjecucion,
        titulo: body.titulo,
        descripcion: body.descripcion,
        fechaSolicitud: new Date(body.fechaSolicitud),
        fechaInicioEstimada: body.fechaInicioEstimada ? new Date(body.fechaInicioEstimada) : null,
        fechaFinEstimada: body.fechaFinEstimada ? new Date(body.fechaFinEstimada) : null,
        clienteId: body.clienteId,
        sucursalId: body.sucursalId,
        ticketId: body.ticketId,
        condicionesPago: body.condicionesPago,
        validezDias: body.validezDias,
        creadoPorId: userId,
      },
      include: {
        cliente: {
          select: { id: true, razonSocial: true },
        },
        sucursal: {
          select: { id: true, nombre: true },
        },
      },
    });

    // Crear versión inicial del presupuesto si es CON_PRESUPUESTO
    if (body.modoEjecucion === ModoEjecucion.CON_PRESUPUESTO) {
      await prisma.versionPresupuesto.create({
        data: {
          obraId: obra.id,
          version: 1,
          esVigente: true,
        },
      });
    }

    console.log('[ObraController] Obra creada:', obra.codigo);
    res.status(201).json(obra);
  } catch (error) {
    console.error('[ObraController] ERROR:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({
      error: 'Error al crear obra',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateObraSchema.parse(req.body);

    const obra = await prisma.obra.findUnique({
      where: { id },
    });

    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    // Bloquear edición si está FACTURADO
    if (obra.estado === EstadoObra.FACTURADO) {
      return res.status(400).json({ error: 'No se puede editar una obra facturada' });
    }

    const updatedObra = await prisma.obra.update({
      where: { id },
      data: {
        ...body,
        fechaSolicitud: body.fechaSolicitud ? new Date(body.fechaSolicitud) : undefined,
        fechaInicioEstimada: body.fechaInicioEstimada
          ? new Date(body.fechaInicioEstimada)
          : undefined,
        fechaFinEstimada: body.fechaFinEstimada ? new Date(body.fechaFinEstimada) : undefined,
        fechaInicioReal: body.fechaInicioReal ? new Date(body.fechaInicioReal) : undefined,
        fechaFinReal: body.fechaFinReal ? new Date(body.fechaFinReal) : undefined,
        fechaFacturacion: body.fechaFacturacion ? new Date(body.fechaFacturacion) : undefined,
      },
      include: {
        cliente: {
          select: { id: true, razonSocial: true },
        },
        sucursal: {
          select: { id: true, nombre: true },
        },
      },
    });

    res.json(updatedObra);
  } catch (error) {
    console.error('[ObraController] UPDATE ERROR:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({
      error: 'Error al actualizar obra',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

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

    // Validar transición
    const transicionesPermitidas = TRANSICIONES_VALIDAS[obra.estado];
    if (!transicionesPermitidas.includes(nuevoEstado)) {
      return res.status(400).json({
        error: `Transición no permitida: ${obra.estado} → ${nuevoEstado}`,
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

    // Setear fechas automáticamente
    if (nuevoEstado === EstadoObra.EN_EJECUCION && !obra.fechaInicioReal) {
      updatedData.fechaInicioReal = new Date();
    }
    if (nuevoEstado === EstadoObra.FINALIZADO && !obra.fechaFinReal) {
      updatedData.fechaFinReal = new Date();
    }
    if (nuevoEstado === EstadoObra.FACTURADO) {
      updatedData.fechaFacturacion = new Date();
    }

    // Usar transacción para actualizar obra y registrar historial
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
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({
      error: 'Error al cambiar estado',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const obra = await prisma.obra.findUnique({
      where: { id },
    });

    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    // Solo se puede eliminar si está en BORRADOR
    if (obra.estado !== EstadoObra.BORRADOR) {
      return res.status(400).json({
        error: 'Solo se pueden eliminar obras en estado BORRADOR',
      });
    }

    // Eliminar obra (cascade eliminará versiones, items y archivos)
    await prisma.obra.delete({
      where: { id },
    });

    res.json({ message: 'Obra eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar obra:', error);
    res.status(500).json({ error: 'Error al eliminar obra' });
  }
};
