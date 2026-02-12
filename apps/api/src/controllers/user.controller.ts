import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthService } from '../services/auth.service.js';

// --- Schemas ---
const createUserSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  password: z.string().min(6),
  rolId: z.number().int().positive(), // Por ahora asignamos un solo rol principal
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  rolId: z.number().int().positive().optional(),
});

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
        nombre?: { contains: string; mode: 'insensitive' };
        apellido?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }[];
    } = {
      fechaEliminacion: null, // Solo activos
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await prisma.$transaction([
      prisma.usuario.count({ where: whereClause }),
      prisma.usuario.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
        include: {
          roles: {
            include: {
              rol: true,
            },
          },
        },
      }),
    ]);

    // Limpiar passwords
    const safeUsers = users.map((u) => {
      const { claveHash: _claveHash, ...rest } = u;
      return {
        ...rest,
        roles: u.roles.map((r) => r.rol.nombre),
      };
    });

    res.json({
      data: safeUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const getOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const user = await AuthService.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createUserSchema.parse(req.body);

    // Verificar email duplicado
    const existing = await prisma.usuario.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await AuthService.hashPassword(body.password);

    const matchRole = await prisma.rol.findUnique({
      where: { id: body.rolId },
    });

    if (!matchRole) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Crear usuario + Relación Rol
    const newUser = await prisma.usuario.create({
      data: {
        email: body.email,
        nombre: body.nombre,
        apellido: body.apellido,
        claveHash: hashedPassword,
        roles: {
          create: {
            rolId: body.rolId, // Asignar rol
          },
        },
      },
    });

    const { claveHash: _claveHash, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateUserSchema.parse(req.body);

    const user = await prisma.usuario.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const dataToUpdate: { nombre?: string; apellido?: string; email?: string; claveHash?: string } =
      {
        nombre: body.nombre,
        apellido: body.apellido,
        email: body.email,
      };

    if (body.password) {
      dataToUpdate.claveHash = await AuthService.hashPassword(body.password);
    }

    // Si cambia rol
    // Esto es complejo porque es N:N (aunque modelado 1:N en la UI por ahora)
    // Para simplificar, si viene rolId, borramos los anteriores y ponemos el nuevo
    // OJO: En production requeriría transacción
    if (body.rolId) {
      await prisma.usuarioRol.deleteMany({ where: { usuarioId: id } });
      await prisma.usuarioRol.create({
        data: {
          usuarioId: id,
          rolId: body.rolId,
        },
      });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
    });

    const { claveHash: _claveHash, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    // Soft Delete
    await prisma.usuario.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
