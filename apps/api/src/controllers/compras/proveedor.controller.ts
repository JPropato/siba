import { Request, Response } from 'express';
import { z } from 'zod';
import { CondicionIva, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// SCHEMAS DE VALIDACION
// =====================================================

const createProveedorSchema = z.object({
  razonSocial: z.string().min(2).max(200),
  cuit: z.string().min(11).max(13),
  condicionIva: z.nativeEnum(CondicionIva),
  telefono: z.string().max(50).optional().nullable(),
  email: z
    .string()
    .email()
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  direccion: z.string().max(255).optional().nullable(),
  contactoNombre: z.string().max(100).optional().nullable(),
  contactoTelefono: z.string().max(50).optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
});

// =====================================================
// PROVEEDORES
// =====================================================

export const getProveedores = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;

    const skip = (page - 1) * limit;

    const where: Prisma.ProveedorWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { cuit: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [total, proveedores] = await Promise.all([
      prisma.proveedor.count({ where }),
      prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { codigo: 'asc' },
      }),
    ]);

    res.json({
      data: proveedores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Compras] getProveedores error:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

export const getProveedorById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        facturas: {
          where: { estado: { not: 'ANULADA' } },
          select: {
            id: true,
            estado: true,
            total: true,
            saldoPendiente: true,
          },
        },
      },
    });

    if (!proveedor || proveedor.fechaEliminacion) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const facturaSummary = {
      cantidad: proveedor.facturas.length,
      totalPendiente: proveedor.facturas.reduce((sum, f) => sum + Number(f.saldoPendiente), 0),
    };

    const { facturas, ...proveedorData } = proveedor;
    res.json({ ...proveedorData, facturaSummary });
  } catch (error) {
    console.error('[Compras] getProveedorById error:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};

export const createProveedor = async (req: Request, res: Response) => {
  try {
    const data = createProveedorSchema.parse(req.body);

    const proveedor = await prisma.proveedor.create({
      data: {
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        condicionIva: data.condicionIva,
        telefono: data.telefono ?? null,
        email: data.email ?? null,
        direccion: data.direccion ?? null,
        contactoNombre: data.contactoNombre ?? null,
        contactoTelefono: data.contactoTelefono ?? null,
        notas: data.notas ?? null,
      },
    });

    res.status(201).json(proveedor);
  } catch (error) {
    console.error('[Compras] createProveedor error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un proveedor con ese CUIT' });
    }
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

export const updateProveedor = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.proveedor.findUnique({ where: { id } });
    if (!existing || existing.fechaEliminacion) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    const data = createProveedorSchema.partial().parse(req.body);

    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: {
        ...(data.razonSocial !== undefined && { razonSocial: data.razonSocial }),
        ...(data.cuit !== undefined && { cuit: data.cuit }),
        ...(data.condicionIva !== undefined && { condicionIva: data.condicionIva }),
        ...(data.telefono !== undefined && { telefono: data.telefono ?? null }),
        ...(data.email !== undefined && { email: data.email ?? null }),
        ...(data.direccion !== undefined && { direccion: data.direccion ?? null }),
        ...(data.contactoNombre !== undefined && { contactoNombre: data.contactoNombre ?? null }),
        ...(data.contactoTelefono !== undefined && {
          contactoTelefono: data.contactoTelefono ?? null,
        }),
        ...(data.notas !== undefined && { notas: data.notas ?? null }),
      },
    });

    res.json(proveedor);
  } catch (error) {
    console.error('[Compras] updateProveedor error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un proveedor con ese CUIT' });
    }
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

export const deleteProveedor = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.proveedor.findUnique({ where: { id } });
    if (!existing || existing.fechaEliminacion) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Check for pending invoices
    const facturasPendientes = await prisma.facturaProveedor.count({
      where: {
        proveedorId: id,
        estado: { in: ['PENDIENTE', 'PAGO_PARCIAL'] },
      },
    });

    if (facturasPendientes > 0) {
      return res.status(400).json({
        error: `No se puede eliminar: tiene ${facturasPendientes} factura(s) pendiente(s) de pago`,
      });
    }

    await prisma.proveedor.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    console.error('[Compras] deleteProveedor error:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};
