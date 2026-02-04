import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createClientSchema = z.object({
  razonSocial: z.string().min(3).max(200),
  cuit: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccionFiscal: z.string().max(255).optional().nullable(),
});

const updateClientSchema = createClientSchema.partial();

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause: {
      fechaEliminacion: null;
      OR?: {
        razonSocial?: { contains: string; mode: 'insensitive' };
        cuit?: { contains: string; mode: 'insensitive' };
      }[];
    } = {
      fechaEliminacion: null, // Soft delete filter
    };

    if (search) {
      whereClause.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { cuit: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, clients] = await prisma.$transaction([
      prisma.cliente.count({ where: whereClause }),
      prisma.cliente.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { codigo: 'asc' },
      }),
    ]);

    res.json({
      data: clients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const client = await prisma.cliente.findFirst({
      where: {
        id,
        fechaEliminacion: null,
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    console.log('[ClientController] Creating client with body:', req.body);
    const body = createClientSchema.parse(req.body);

    // Check for duplicate CUIT if provided
    if (body.cuit) {
      const existing = await prisma.cliente.findUnique({
        where: { cuit: body.cuit },
      });
      if (existing) {
        console.warn('[ClientController] Duplicate CUIT:', body.cuit);
        return res.status(400).json({ error: 'El CUIT ya está registrado' });
      }
    }

    // Generate incremental human-readable code
    const lastClient = await prisma.cliente.findFirst({
      orderBy: { codigo: 'desc' },
      select: { codigo: true },
    });

    const nextCodigo = (lastClient?.codigo || 0) + 1;
    console.log('[ClientController] Next code:', nextCodigo);

    const newClient = await prisma.cliente.create({
      data: {
        ...body,
        codigo: nextCodigo,
      },
    });

    console.log('[ClientController] Client created:', newClient.id);
    res.status(201).json(newClient);
  } catch (error) {
    console.error('[ClientController] ERROR:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res
      .status(500)
      .json({
        error: 'Error al crear cliente',
        details: error instanceof Error ? error.message : String(error),
      });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    console.log('[ClientController] Updating client:', req.params.id, req.body);
    const id = Number(req.params.id);
    const body = updateClientSchema.parse(req.body);

    const client = await prisma.cliente.findFirst({
      where: { id, fechaEliminacion: null },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Check for duplicate CUIT if updated
    if (body.cuit && body.cuit !== client.cuit) {
      const existing = await prisma.cliente.findUnique({
        where: { cuit: body.cuit },
      });
      if (existing) {
        return res.status(400).json({ error: 'El CUIT ya está registrado por otro cliente' });
      }
    }

    const updatedClient = await prisma.cliente.update({
      where: { id },
      data: body,
    });

    res.json(updatedClient);
  } catch (error) {
    console.error('[ClientController] UPDATE ERROR:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res
      .status(500)
      .json({
        error: 'Error al actualizar cliente',
        details: error instanceof Error ? error.message : String(error),
      });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const client = await prisma.cliente.findUnique({ where: { id } });
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Validar si tiene sedes (sucursales) asociadas
    const hasSedes = await prisma.sucursal.findFirst({
      where: { clienteId: id, fechaEliminacion: null },
    });

    if (hasSedes) {
      return res.status(400).json({
        error:
          'No se puede eliminar el cliente porque tiene sedes (sucursales) asociadas. Por favor, elimine las sedes primero.',
      });
    }

    // Soft Delete
    await prisma.cliente.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};
