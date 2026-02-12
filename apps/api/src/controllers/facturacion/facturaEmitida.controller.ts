import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoComprobante, EstadoFacturaEmitida, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createFacturaEmitidaSchema = z.object({
  clienteId: z.number().int().positive(),
  tipoComprobante: z.nativeEnum(TipoComprobante),
  puntoVenta: z.number().int().min(1).max(99999),
  numeroComprobante: z.string().min(1).max(20),
  fechaEmision: z.string().min(1),
  fechaVencimiento: z.string().min(1).optional().nullable(),
  subtotal: z.number().min(0),
  montoIva21: z.number().min(0).default(0),
  montoIva105: z.number().min(0).default(0),
  montoIva27: z.number().min(0).default(0),
  montoExento: z.number().min(0).default(0),
  montoNoGravado: z.number().min(0).default(0),
  percepcionIIBB: z.number().min(0).default(0),
  percepcionIva: z.number().min(0).default(0),
  otrosImpuestos: z.number().min(0).default(0),
  total: z.number().positive(),
  cuentaContableId: z.number().int().positive().optional().nullable(),
  centroCostoId: z.number().int().positive().optional().nullable(),
  obraId: z.number().int().positive().optional().nullable(),
  ticketId: z.number().int().positive().optional().nullable(),
  archivoPdf: z.string().max(500).optional().nullable(),
  descripcion: z.string().max(2000).optional().nullable(),
});

// =====================================================
// FACTURAS EMITIDAS
// =====================================================

export const getFacturasEmitidas = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { clienteId, estado, fechaDesde, fechaHasta, search } = req.query;

    const skip = (page - 1) * limit;

    const where: Prisma.FacturaEmitidaWhereInput = {};

    if (clienteId) where.clienteId = Number(clienteId);
    if (estado) where.estado = estado as EstadoFacturaEmitida;
    if (fechaDesde || fechaHasta) {
      where.fechaEmision = {};
      if (fechaDesde) where.fechaEmision.gte = new Date(fechaDesde as string);
      if (fechaHasta) where.fechaEmision.lte = new Date(fechaHasta as string);
    }
    if (search) {
      where.OR = [
        { numeroComprobante: { contains: search as string, mode: 'insensitive' } },
        { cliente: { razonSocial: { contains: search as string, mode: 'insensitive' } } },
        { descripcion: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [total, facturas] = await Promise.all([
      prisma.facturaEmitida.count({ where }),
      prisma.facturaEmitida.findMany({
        where,
        include: {
          cliente: { select: { id: true, razonSocial: true, cuit: true } },
          cuentaContable: { select: { id: true, codigo: true, nombre: true } },
          centroCosto: { select: { id: true, codigo: true, nombre: true } },
          obra: { select: { id: true, codigo: true, titulo: true } },
          ticket: { select: { id: true, codigoInterno: true } },
        },
        skip,
        take: limit,
        orderBy: { fechaEmision: 'desc' },
      }),
    ]);

    res.json({
      data: facturas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Facturacion] getFacturasEmitidas error:', error);
    res.status(500).json({ error: 'Error al obtener facturas emitidas' });
  }
};

export const getFacturaEmitidaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }

    const factura = await prisma.facturaEmitida.findUnique({
      where: { id },
      include: {
        cliente: true,
        cuentaContable: { select: { id: true, codigo: true, nombre: true } },
        centroCosto: { select: { id: true, codigo: true, nombre: true } },
        obra: { select: { id: true, codigo: true, titulo: true } },
        ticket: { select: { id: true, codigoInterno: true } },
        registradoPor: { select: { id: true, nombre: true, apellido: true } },
        cobros: {
          include: {
            movimiento: { select: { id: true, codigo: true, estado: true } },
            cheque: { select: { id: true, numero: true, tipo: true } },
          },
          orderBy: { fechaCobro: 'desc' },
        },
      },
    });

    if (!factura) {
      return res.status(404).json({ error: 'Factura emitida no encontrada' });
    }

    res.json(factura);
  } catch (error) {
    console.error('[Facturacion] getFacturaEmitidaById error:', error);
    res.status(500).json({ error: 'Error al obtener factura emitida' });
  }
};

export const createFacturaEmitida = async (req: Request, res: Response) => {
  try {
    const data = createFacturaEmitidaSchema.parse(req.body);
    const userId = (req as Request & { user: { id: number } }).user.id;

    // Validate cliente exists
    const cliente = await prisma.cliente.findUnique({
      where: { id: data.clienteId },
    });
    if (!cliente || cliente.fechaEliminacion) {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    const factura = await prisma.facturaEmitida.create({
      data: {
        clienteId: data.clienteId,
        tipoComprobante: data.tipoComprobante,
        puntoVenta: data.puntoVenta,
        numeroComprobante: data.numeroComprobante,
        fechaEmision: new Date(data.fechaEmision),
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        subtotal: data.subtotal,
        montoIva21: data.montoIva21,
        montoIva105: data.montoIva105,
        montoIva27: data.montoIva27,
        montoExento: data.montoExento,
        montoNoGravado: data.montoNoGravado,
        percepcionIIBB: data.percepcionIIBB,
        percepcionIva: data.percepcionIva,
        otrosImpuestos: data.otrosImpuestos,
        total: data.total,
        montoCobrado: 0,
        saldoPendiente: data.total,
        cuentaContableId: data.cuentaContableId ?? null,
        centroCostoId: data.centroCostoId ?? null,
        obraId: data.obraId ?? null,
        ticketId: data.ticketId ?? null,
        archivoPdf: data.archivoPdf ?? null,
        descripcion: data.descripcion ?? null,
        registradoPorId: userId,
      },
      include: {
        cliente: { select: { id: true, razonSocial: true, cuit: true } },
      },
    });

    res.status(201).json(factura);
  } catch (error) {
    console.error('[Facturacion] createFacturaEmitida error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res
        .status(400)
        .json({ error: 'Ya existe una factura con ese numero y tipo de comprobante' });
    }
    res.status(500).json({ error: 'Error al crear factura emitida' });
  }
};

export const updateFacturaEmitida = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }

    const existing = await prisma.facturaEmitida.findUnique({
      where: { id },
      include: { cobros: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Factura emitida no encontrada' });
    }

    if (existing.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden editar facturas en estado Pendiente' });
    }

    if (existing.cobros.length > 0) {
      return res.status(400).json({ error: 'No se puede editar una factura que ya tiene cobros' });
    }

    const data = createFacturaEmitidaSchema.partial().parse(req.body);

    const total = data.total ?? Number(existing.total);
    const montoCobrado = Number(existing.montoCobrado);
    const newSaldo = Math.round((total - montoCobrado) * 100) / 100;

    const factura = await prisma.facturaEmitida.update({
      where: { id },
      data: {
        ...(data.clienteId !== undefined && { clienteId: data.clienteId }),
        ...(data.tipoComprobante !== undefined && { tipoComprobante: data.tipoComprobante }),
        ...(data.puntoVenta !== undefined && { puntoVenta: data.puntoVenta }),
        ...(data.numeroComprobante !== undefined && { numeroComprobante: data.numeroComprobante }),
        ...(data.fechaEmision !== undefined && { fechaEmision: new Date(data.fechaEmision) }),
        ...(data.fechaVencimiento !== undefined && {
          fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        }),
        ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
        ...(data.montoIva21 !== undefined && { montoIva21: data.montoIva21 }),
        ...(data.montoIva105 !== undefined && { montoIva105: data.montoIva105 }),
        ...(data.montoIva27 !== undefined && { montoIva27: data.montoIva27 }),
        ...(data.montoExento !== undefined && { montoExento: data.montoExento }),
        ...(data.montoNoGravado !== undefined && { montoNoGravado: data.montoNoGravado }),
        ...(data.percepcionIIBB !== undefined && { percepcionIIBB: data.percepcionIIBB }),
        ...(data.percepcionIva !== undefined && { percepcionIva: data.percepcionIva }),
        ...(data.otrosImpuestos !== undefined && { otrosImpuestos: data.otrosImpuestos }),
        ...(data.total !== undefined && { total: data.total }),
        saldoPendiente: Math.max(0, newSaldo),
        ...(data.cuentaContableId !== undefined && {
          cuentaContableId: data.cuentaContableId ?? null,
        }),
        ...(data.centroCostoId !== undefined && { centroCostoId: data.centroCostoId ?? null }),
        ...(data.obraId !== undefined && { obraId: data.obraId ?? null }),
        ...(data.ticketId !== undefined && { ticketId: data.ticketId ?? null }),
        ...(data.archivoPdf !== undefined && { archivoPdf: data.archivoPdf ?? null }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion ?? null }),
      },
      include: {
        cliente: { select: { id: true, razonSocial: true, cuit: true } },
      },
    });

    res.json(factura);
  } catch (error) {
    console.error('[Facturacion] updateFacturaEmitida error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al actualizar factura emitida' });
  }
};

export const anularFacturaEmitida = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }

    const existing = await prisma.facturaEmitida.findUnique({
      where: { id },
      include: {
        cobros: {
          include: { movimiento: { select: { estado: true } } },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Factura emitida no encontrada' });
    }

    if (existing.estado === 'ANULADA') {
      return res.status(400).json({ error: 'La factura ya esta anulada' });
    }

    // Check if there are cobros with active movements
    const cobrosConMovimientos = existing.cobros.filter(
      (c) => c.movimiento && c.movimiento.estado !== 'ANULADO'
    );

    if (cobrosConMovimientos.length > 0) {
      return res.status(400).json({
        error:
          'No se puede anular: tiene cobros con movimientos activos. Anule los movimientos primero.',
      });
    }

    const factura = await prisma.facturaEmitida.update({
      where: { id },
      data: {
        estado: 'ANULADA',
        montoCobrado: 0,
        saldoPendiente: 0,
      },
    });

    res.json(factura);
  } catch (error) {
    console.error('[Facturacion] anularFacturaEmitida error:', error);
    res.status(500).json({ error: 'Error al anular factura emitida' });
  }
};
