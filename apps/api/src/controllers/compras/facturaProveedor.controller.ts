import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoComprobante, EstadoFacturaProveedor, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createFacturaSchema = z.object({
  proveedorId: z.number().int().positive(),
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
  retencionGanancias: z.number().min(0).default(0),
  retencionIva: z.number().min(0).default(0),
  retencionIIBB: z.number().min(0).default(0),
  retencionSUSS: z.number().min(0).default(0),
  cuentaContableId: z.number().int().positive().optional().nullable(),
  centroCostoId: z.number().int().positive().optional().nullable(),
  obraId: z.number().int().positive().optional().nullable(),
  archivoPdf: z.string().max(500).optional().nullable(),
  descripcion: z.string().max(500).optional().nullable(),
});

// =====================================================
// FACTURAS PROVEEDOR
// =====================================================

export const getFacturas = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { proveedorId, estado, fechaDesde, fechaHasta, search } = req.query;

    const skip = (page - 1) * limit;

    const where: Prisma.FacturaProveedorWhereInput = {};

    if (proveedorId) where.proveedorId = Number(proveedorId);
    if (estado) where.estado = estado as EstadoFacturaProveedor;
    if (fechaDesde || fechaHasta) {
      where.fechaEmision = {};
      if (fechaDesde) where.fechaEmision.gte = new Date(fechaDesde as string);
      if (fechaHasta) where.fechaEmision.lte = new Date(fechaHasta as string);
    }
    if (search) {
      where.OR = [
        { numeroComprobante: { contains: search as string, mode: 'insensitive' } },
        { proveedor: { razonSocial: { contains: search as string, mode: 'insensitive' } } },
        { descripcion: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [total, facturas] = await Promise.all([
      prisma.facturaProveedor.count({ where }),
      prisma.facturaProveedor.findMany({
        where,
        include: {
          proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          cuentaContable: { select: { id: true, codigo: true, nombre: true } },
          centroCosto: { select: { id: true, codigo: true, nombre: true } },
          obra: { select: { id: true, codigo: true, titulo: true } },
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
    console.error('[Compras] getFacturas error:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

export const getFacturaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }

    const factura = await prisma.facturaProveedor.findUnique({
      where: { id },
      include: {
        proveedor: true,
        cuentaContable: { select: { id: true, codigo: true, nombre: true } },
        centroCosto: { select: { id: true, codigo: true, nombre: true } },
        obra: { select: { id: true, codigo: true, titulo: true } },
        registradoPor: { select: { id: true, nombre: true, apellido: true } },
        pagos: {
          include: {
            movimiento: { select: { id: true, codigo: true, estado: true } },
            cheque: { select: { id: true, numero: true, tipo: true } },
          },
          orderBy: { fechaPago: 'desc' },
        },
      },
    });

    if (!factura) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    res.json(factura);
  } catch (error) {
    console.error('[Compras] getFacturaById error:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
};

export const createFactura = async (req: Request, res: Response) => {
  try {
    const data = createFacturaSchema.parse(req.body);
    const userId = (req as Request & { user: { id: number } }).user.id;

    // Validate proveedor exists
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: data.proveedorId },
    });
    if (!proveedor || proveedor.fechaEliminacion) {
      return res.status(400).json({ error: 'Proveedor no encontrado' });
    }

    // Calculate totalAPagar
    const totalRetenciones =
      data.retencionGanancias + data.retencionIva + data.retencionIIBB + data.retencionSUSS;
    const totalAPagar = data.total - totalRetenciones;

    if (totalAPagar < 0) {
      return res.status(400).json({ error: 'Las retenciones no pueden superar el total' });
    }

    const factura = await prisma.facturaProveedor.create({
      data: {
        proveedorId: data.proveedorId,
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
        retencionGanancias: data.retencionGanancias,
        retencionIva: data.retencionIva,
        retencionIIBB: data.retencionIIBB,
        retencionSUSS: data.retencionSUSS,
        totalAPagar,
        montoPagado: 0,
        saldoPendiente: totalAPagar,
        cuentaContableId: data.cuentaContableId ?? null,
        centroCostoId: data.centroCostoId ?? null,
        obraId: data.obraId ?? null,
        archivoPdf: data.archivoPdf ?? null,
        descripcion: data.descripcion ?? null,
        registradoPorId: userId,
      },
      include: {
        proveedor: { select: { id: true, razonSocial: true, cuit: true } },
      },
    });

    res.status(201).json(factura);
  } catch (error) {
    console.error('[Compras] createFactura error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res
        .status(400)
        .json({ error: 'Ya existe una factura con ese numero para este proveedor' });
    }
    res.status(500).json({ error: 'Error al crear factura' });
  }
};

export const updateFactura = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }

    const existing = await prisma.facturaProveedor.findUnique({
      where: { id },
      include: { pagos: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    if (existing.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden editar facturas en estado Pendiente' });
    }

    if (existing.pagos.length > 0) {
      return res.status(400).json({ error: 'No se puede editar una factura que ya tiene pagos' });
    }

    const data = createFacturaSchema.partial().parse(req.body);

    // Recalculate if amounts changed
    const total = data.total ?? Number(existing.total);
    const retGanancias = data.retencionGanancias ?? Number(existing.retencionGanancias);
    const retIva = data.retencionIva ?? Number(existing.retencionIva);
    const retIIBB = data.retencionIIBB ?? Number(existing.retencionIIBB);
    const retSUSS = data.retencionSUSS ?? Number(existing.retencionSUSS);
    const totalRetenciones = retGanancias + retIva + retIIBB + retSUSS;
    const totalAPagar = total - totalRetenciones;

    const factura = await prisma.facturaProveedor.update({
      where: { id },
      data: {
        ...(data.proveedorId !== undefined && { proveedorId: data.proveedorId }),
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
        ...(data.retencionGanancias !== undefined && {
          retencionGanancias: data.retencionGanancias,
        }),
        ...(data.retencionIva !== undefined && { retencionIva: data.retencionIva }),
        ...(data.retencionIIBB !== undefined && { retencionIIBB: data.retencionIIBB }),
        ...(data.retencionSUSS !== undefined && { retencionSUSS: data.retencionSUSS }),
        totalAPagar,
        saldoPendiente: totalAPagar,
        ...(data.cuentaContableId !== undefined && {
          cuentaContableId: data.cuentaContableId ?? null,
        }),
        ...(data.centroCostoId !== undefined && { centroCostoId: data.centroCostoId ?? null }),
        ...(data.obraId !== undefined && { obraId: data.obraId ?? null }),
        ...(data.archivoPdf !== undefined && { archivoPdf: data.archivoPdf ?? null }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion ?? null }),
      },
      include: {
        proveedor: { select: { id: true, razonSocial: true, cuit: true } },
      },
    });

    res.json(factura);
  } catch (error) {
    console.error('[Compras] updateFactura error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Error al actualizar factura' });
  }
};

export const anularFactura = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de factura invalido' });
    }

    const existing = await prisma.facturaProveedor.findUnique({
      where: { id },
      include: {
        pagos: {
          include: { movimiento: { select: { estado: true } } },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    if (existing.estado === 'ANULADA') {
      return res.status(400).json({ error: 'La factura ya esta anulada' });
    }

    // Check if there are payments with confirmed movements
    const pagosConMovimientos = existing.pagos.filter(
      (p) => p.movimiento && p.movimiento.estado !== 'ANULADO'
    );

    if (pagosConMovimientos.length > 0) {
      return res.status(400).json({
        error:
          'No se puede anular: tiene pagos con movimientos activos. Anule los movimientos primero.',
      });
    }

    const factura = await prisma.facturaProveedor.update({
      where: { id },
      data: {
        estado: 'ANULADA',
        montoPagado: 0,
        saldoPendiente: 0,
      },
    });

    res.json(factura);
  } catch (error) {
    console.error('[Compras] anularFactura error:', error);
    res.status(500).json({ error: 'Error al anular factura' });
  }
};
