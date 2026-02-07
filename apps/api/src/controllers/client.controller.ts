import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors.js';

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
// Note: Express 5 automatically catches rejected promises from async handlers
// and forwards them to the error-handling middleware (ARCH-002).
// ZodError, PrismaClientKnownRequestError, and AppError are all classified
// by the centralized error handler in error.middleware.ts.

export const getAll = async (req: Request, res: Response) => {
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
};

export const getOne = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const client = await prisma.cliente.findFirst({
    where: {
      id,
      fechaEliminacion: null,
    },
  });

  if (!client) {
    throw new NotFoundError('Cliente no encontrado');
  }

  res.json(client);
};

export const create = async (req: Request, res: Response) => {
  // ZodError will be caught by the centralized error handler
  const body = createClientSchema.parse(req.body);

  // Check for duplicate CUIT if provided
  if (body.cuit) {
    const existing = await prisma.cliente.findUnique({
      where: { cuit: body.cuit },
    });
    if (existing) {
      throw new ConflictError('El CUIT ya está registrado', [
        { field: 'cuit', message: 'El CUIT ya está registrado' },
      ]);
    }
  }

  // Generate incremental human-readable code
  const lastClient = await prisma.cliente.findFirst({
    orderBy: { codigo: 'desc' },
    select: { codigo: true },
  });

  const nextCodigo = (lastClient?.codigo || 0) + 1;

  const newClient = await prisma.cliente.create({
    data: {
      ...body,
      codigo: nextCodigo,
    },
  });

  res.status(201).json(newClient);
};

export const update = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  // ZodError will be caught by the centralized error handler
  const body = updateClientSchema.parse(req.body);

  const client = await prisma.cliente.findFirst({
    where: { id, fechaEliminacion: null },
  });

  if (!client) {
    throw new NotFoundError('Cliente no encontrado');
  }

  // Check for duplicate CUIT if updated
  if (body.cuit && body.cuit !== client.cuit) {
    const existing = await prisma.cliente.findUnique({
      where: { cuit: body.cuit },
    });
    if (existing) {
      throw new ConflictError('El CUIT ya está registrado por otro cliente', [
        { field: 'cuit', message: 'El CUIT ya está registrado por otro cliente' },
      ]);
    }
  }

  const updatedClient = await prisma.cliente.update({
    where: { id },
    data: body,
  });

  res.json(updatedClient);
};

export const deleteOne = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const client = await prisma.cliente.findUnique({ where: { id } });
  if (!client) {
    throw new NotFoundError('Cliente no encontrado');
  }

  // Validar si tiene sedes (sucursales) asociadas
  const hasSedes = await prisma.sucursal.findFirst({
    where: { clienteId: id, fechaEliminacion: null },
  });

  if (hasSedes) {
    throw new BadRequestError(
      'No se puede eliminar el cliente porque tiene sedes (sucursales) asociadas. Por favor, elimine las sedes primero.'
    );
  }

  // Soft Delete
  await prisma.cliente.update({
    where: { id },
    data: { fechaEliminacion: new Date() },
  });

  res.json({ message: 'Cliente eliminado correctamente' });
};
