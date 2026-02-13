import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { actualizarSaldoCuenta } from '../finanzas/utils.js';

// Base schema without validation (for partial updates)
const gastoSchemaBase = z.object({
  categoria: z.enum([
    'GAS',
    'FERRETERIA',
    'ESTACIONAMIENTO',
    'LAVADERO',
    'NAFTA',
    'REPUESTOS',
    'MATERIALES_ELECTRICOS',
    'PEAJES',
    'COMIDA',
    'HERRAMIENTAS',
    'OTRO',
  ]),
  categoriaOtro: z.string().optional(),
  monto: z.number().positive(),
  fecha: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  concepto: z.string().min(1),
  ticketId: z.number().int().positive().optional().nullable(),
  centroCostoId: z.number().int().positive().optional().nullable(),

  // Proveedor: either existing ID or new data (MANDATORY - at least one required)
  proveedorId: z.number().int().positive().optional(),
  proveedor: z
    .object({
      razonSocial: z.string().min(1),
      cuit: z.string().min(11).max(13),
      condicionIva: z.enum(['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'CONSUMIDOR_FINAL']),
      telefono: z.string().optional(),
      email: z.string().email().optional(),
      direccion: z.string().optional(),
    })
    .optional(),

  // Factura data
  factura: z
    .object({
      tipoComprobante: z.enum([
        'FACTURA_A',
        'FACTURA_B',
        'FACTURA_C',
        'NOTA_CREDITO_A',
        'NOTA_CREDITO_B',
        'NOTA_CREDITO_C',
        'NOTA_DEBITO_A',
        'NOTA_DEBITO_B',
        'NOTA_DEBITO_C',
        'RECIBO',
      ]),
      puntoVenta: z.number().int().min(1).max(99999),
      numeroComprobante: z.string().min(1),
      fechaEmision: z
        .string()
        .datetime()
        .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    })
    .optional(),
});

// Create schema with provider validation
const createGastoSchema = gastoSchemaBase.refine(
  (data) => data.proveedorId !== undefined || data.proveedor !== undefined,
  {
    message: 'Debe proporcionar un proveedor (seleccionar existente o crear nuevo)',
    path: ['proveedorId'],
  }
);

// Update schema (partial, no provider validation)
const updateGastoSchema = gastoSchemaBase.partial();

export async function getGastos(req: Request, res: Response) {
  try {
    const tarjetaId = Number(req.params.tarjetaId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const categoria = req.query.categoria as string;

    const where: Prisma.GastoTarjetaWhereInput = { tarjetaId };
    if (categoria) where.categoria = categoria as Prisma.EnumCategoriaGastoTarjetaFilter;

    const [data, total] = await Promise.all([
      prisma.gastoTarjeta.findMany({
        where,
        include: {
          movimiento: {
            select: {
              id: true,
              codigo: true,
              estado: true,
              cuentaContableId: true,
              cuentaContable: { select: { id: true, codigo: true, nombre: true } },
            },
          },
          centroCosto: { select: { id: true, codigo: true, nombre: true } },
          ticket: { select: { id: true, codigoInterno: true, descripcion: true } },
          proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          facturaProveedor: {
            select: { id: true, tipoComprobante: true, puntoVenta: true, numeroComprobante: true },
          },
          registradoPor: { select: { id: true, nombre: true, apellido: true } },
          archivos: true,
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gastoTarjeta.count({ where }),
    ]);

    res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Gastos] getGastos error:', error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
}

export async function createGasto(req: Request, res: Response) {
  try {
    const tarjetaId = Number(req.params.tarjetaId);
    const data = createGastoSchema.parse(req.body);

    const tarjeta = await prisma.tarjetaPrecargable.findFirst({
      where: { id: tarjetaId, fechaEliminacion: null },
    });
    if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no encontrada' });

    // 1. Get ConfigCategoriaGasto to find cuentaContableId
    const configCategoria = await prisma.configCategoriaGasto.findUnique({
      where: { categoria: data.categoria },
    });
    if (!configCategoria)
      return res.status(400).json({
        error: `Categoría ${data.categoria} no configurada. Ejecute el seed de tarjetas.`,
      });

    // Determine medioPago based on tipo
    const medioPago = tarjeta.tipo === 'PRECARGABLE' ? 'TARJETA_DEBITO' : 'TARJETA_CREDITO';

    const result = await prisma.$transaction(async (tx) => {
      let proveedorId = data.proveedorId || null;
      let facturaProveedorId: number | null = null;

      // 2. Handle Proveedor: create if new, or find existing
      if (data.proveedor && !proveedorId) {
        // Check if proveedor with same CUIT already exists
        const existingProveedor = await tx.proveedor.findFirst({
          where: { cuit: data.proveedor.cuit, fechaEliminacion: null },
        });

        if (existingProveedor) {
          proveedorId = existingProveedor.id;
        } else {
          // Create new proveedor
          const nuevoProveedor = await tx.proveedor.create({
            data: {
              razonSocial: data.proveedor.razonSocial,
              cuit: data.proveedor.cuit,
              condicionIva: data.proveedor.condicionIva,
              telefono: data.proveedor.telefono || null,
              email: data.proveedor.email || null,
              direccion: data.proveedor.direccion || null,
            },
          });
          proveedorId = nuevoProveedor.id;
        }
      }

      // 3. Handle FacturaProveedor if factura data provided
      if (data.factura && proveedorId) {
        // Check if factura already exists (unique constraint)
        const existingFactura = await tx.facturaProveedor.findFirst({
          where: {
            proveedorId,
            tipoComprobante: data.factura.tipoComprobante,
            puntoVenta: data.factura.puntoVenta,
            numeroComprobante: data.factura.numeroComprobante,
          },
        });

        if (existingFactura) {
          facturaProveedorId = existingFactura.id;
        } else {
          // Create factura (simplified: total = monto, already paid)
          const nuevaFactura = await tx.facturaProveedor.create({
            data: {
              proveedorId,
              tipoComprobante: data.factura.tipoComprobante,
              puntoVenta: data.factura.puntoVenta,
              numeroComprobante: data.factura.numeroComprobante,
              fechaEmision: new Date(data.factura.fechaEmision),
              subtotal: data.monto,
              total: data.monto,
              totalAPagar: data.monto,
              montoPagado: data.monto,
              saldoPendiente: 0,
              estado: 'PAGADA',
              cuentaContableId: configCategoria.cuentaContableId,
              centroCostoId: data.centroCostoId || null,
              registradoPorId: req.user!.id,
            },
          });
          facturaProveedorId = nuevaFactura.id;
        }
      }

      // 4. Create Movimiento EGRESO
      const movimiento = await tx.movimiento.create({
        data: {
          tipo: 'EGRESO',
          medioPago,
          monto: data.monto,
          descripcion: `${configCategoria.label}: ${data.concepto}`,
          fechaMovimiento: new Date(data.fecha),
          cuentaId: tarjeta.cuentaFinancieraId,
          cuentaContableId: configCategoria.cuentaContableId,
          centroCostoId: data.centroCostoId || null,
          empleadoId: tarjeta.empleadoId,
          ticketId: data.ticketId || null,
          estado: 'CONFIRMADO',
          registradoPorId: req.user!.id,
        },
      });

      // 5. Create GastoTarjeta linked to proveedor and factura
      const gasto = await tx.gastoTarjeta.create({
        data: {
          tarjetaId,
          proveedorId,
          facturaProveedorId,
          categoria: data.categoria,
          categoriaOtro: data.categoria === 'OTRO' ? data.categoriaOtro : null,
          monto: data.monto,
          fecha: new Date(data.fecha),
          concepto: data.concepto,
          ticketId: data.ticketId || null,
          centroCostoId: data.centroCostoId || null,
          movimientoId: movimiento.id,
          registradoPorId: req.user!.id,
        },
        include: {
          movimiento: {
            select: {
              id: true,
              codigo: true,
              estado: true,
              cuentaContable: { select: { codigo: true, nombre: true } },
            },
          },
          centroCosto: { select: { id: true, codigo: true, nombre: true } },
          ticket: { select: { id: true, codigoInterno: true } },
          proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          facturaProveedor: {
            select: { id: true, tipoComprobante: true, puntoVenta: true, numeroComprobante: true },
          },
          archivos: true,
        },
      });

      // 6. Recalculate balance
      await actualizarSaldoCuenta(tarjeta.cuentaFinancieraId, tx);

      return gasto;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[Gastos] createGasto error:', error);
    res.status(500).json({ error: 'Error al crear gasto' });
  }
}

export async function updateGasto(req: Request, res: Response) {
  try {
    const gastoId = Number(req.params.gastoId);
    const data = updateGastoSchema.parse(req.body);

    const gasto = await prisma.gastoTarjeta.findUnique({
      where: { id: gastoId },
      include: { tarjeta: true },
    });
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

    // Get cuentaContableId if category changed
    let cuentaContableId: number | undefined;
    if (data.categoria) {
      const configCategoria = await prisma.configCategoriaGasto.findUnique({
        where: { categoria: data.categoria },
      });
      if (!configCategoria)
        return res.status(400).json({ error: `Categoría ${data.categoria} no configurada` });
      cuentaContableId = configCategoria.cuentaContableId;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update the movimiento
      const movUpdate: Prisma.MovimientoUpdateInput = {};
      if (data.monto) movUpdate.monto = data.monto;
      if (data.fecha) movUpdate.fechaMovimiento = new Date(data.fecha);
      if (data.concepto) {
        const cat = data.categoria || gasto.categoria;
        const configCat = await tx.configCategoriaGasto.findUnique({ where: { categoria: cat } });
        movUpdate.descripcion = `${configCat?.label || cat}: ${data.concepto}`;
      }
      if (cuentaContableId) movUpdate.cuentaContable = { connect: { id: cuentaContableId } };
      if (data.centroCostoId !== undefined)
        movUpdate.centroCosto = data.centroCostoId
          ? { connect: { id: data.centroCostoId } }
          : { disconnect: true };
      if (data.ticketId !== undefined)
        movUpdate.ticket = data.ticketId
          ? { connect: { id: data.ticketId } }
          : { disconnect: true };

      if (Object.keys(movUpdate).length > 0) {
        await tx.movimiento.update({ where: { id: gasto.movimientoId }, data: movUpdate });
      }

      // Update the gasto
      const gastoUpdate: Prisma.GastoTarjetaUpdateInput = {};
      if (data.categoria) gastoUpdate.categoria = data.categoria;
      if (data.categoriaOtro !== undefined)
        gastoUpdate.categoriaOtro = data.categoria === 'OTRO' ? data.categoriaOtro : null;
      if (data.monto) gastoUpdate.monto = data.monto;
      if (data.fecha) gastoUpdate.fecha = new Date(data.fecha);
      if (data.concepto) gastoUpdate.concepto = data.concepto;
      if (data.ticketId !== undefined)
        gastoUpdate.ticket = data.ticketId
          ? { connect: { id: data.ticketId } }
          : { disconnect: true };
      if (data.centroCostoId !== undefined)
        gastoUpdate.centroCosto = data.centroCostoId
          ? { connect: { id: data.centroCostoId } }
          : { disconnect: true };

      const updated = await tx.gastoTarjeta.update({
        where: { id: gastoId },
        data: gastoUpdate,
        include: {
          movimiento: {
            select: {
              id: true,
              codigo: true,
              estado: true,
              cuentaContable: { select: { codigo: true, nombre: true } },
            },
          },
          centroCosto: { select: { id: true, codigo: true, nombre: true } },
          ticket: { select: { id: true, codigoInterno: true } },
          proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          facturaProveedor: {
            select: { id: true, tipoComprobante: true, puntoVenta: true, numeroComprobante: true },
          },
          archivos: true,
        },
      });

      // Recalculate balance if amount changed
      if (data.monto) {
        await actualizarSaldoCuenta(gasto.tarjeta.cuentaFinancieraId, tx);
      }

      return updated;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('[Gastos] updateGasto error:', error);
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
}

export async function deleteGasto(req: Request, res: Response) {
  try {
    const gastoId = Number(req.params.gastoId);

    const gasto = await prisma.gastoTarjeta.findUnique({
      where: { id: gastoId },
      include: { tarjeta: true },
    });
    if (!gasto) return res.status(404).json({ error: 'Gasto no encontrado' });

    await prisma.$transaction(async (tx) => {
      // Anular movimiento
      await tx.movimiento.update({
        where: { id: gasto.movimientoId },
        data: { estado: 'ANULADO' },
      });

      // Delete gasto
      await tx.gastoTarjeta.delete({ where: { id: gastoId } });

      // Recalculate balance
      await actualizarSaldoCuenta(gasto.tarjeta.cuentaFinancieraId, tx);
    });

    res.json({ message: 'Gasto eliminado' });
  } catch (error) {
    console.error('[Gastos] deleteGasto error:', error);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
}
