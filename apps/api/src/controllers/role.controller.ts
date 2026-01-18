import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';

// Schemas de validación
const createRoleSchema = z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    descripcion: z.string().optional(),
    permisoIds: z.array(z.number()).optional(),
});

const updateRoleSchema = z.object({
    nombre: z.string().min(2).optional(),
    descripcion: z.string().optional(),
    permisoIds: z.array(z.number()).optional(),
});

// GET /roles - Listar todos los roles con sus permisos
export const getAll = async (req: Request, res: Response) => {
    try {
        const roles = await prisma.rol.findMany({
            where: { fechaEliminacion: null },
            include: {
                permisos: {
                    include: {
                        permiso: true
                    }
                },
                _count: {
                    select: { usuarios: true }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        // Transformar para el frontend
        const rolesFormatted = roles.map(rol => ({
            id: rol.id,
            nombre: rol.nombre,
            descripcion: rol.descripcion,
            fechaCreacion: rol.fechaCreacion,
            usuariosCount: rol._count.usuarios,
            permisos: rol.permisos.map(rp => ({
                id: rp.permiso.id,
                codigo: rp.permiso.codigo,
                descripcion: rp.permiso.descripcion,
                modulo: rp.permiso.modulo,
            }))
        }));

        res.json(rolesFormatted);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
};

// GET /roles/:id - Obtener un rol
export const getOne = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rol = await prisma.rol.findUnique({
            where: { id: Number(id) },
            include: {
                permisos: {
                    include: { permiso: true }
                }
            }
        });

        if (!rol || rol.fechaEliminacion) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        res.json({
            ...rol,
            permisos: rol.permisos.map(rp => rp.permiso)
        });
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Error al obtener rol' });
    }
};

// POST /roles - Crear rol
export const create = async (req: Request, res: Response) => {
    try {
        const data = createRoleSchema.parse(req.body);

        // Verificar nombre único
        const existing = await prisma.rol.findUnique({
            where: { nombre: data.nombre }
        });
        if (existing) {
            return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
        }

        // Crear rol
        const rol = await prisma.rol.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
            }
        });

        // Asignar permisos si se proporcionaron
        if (data.permisoIds && data.permisoIds.length > 0) {
            await prisma.rolPermiso.createMany({
                data: data.permisoIds.map(permisoId => ({
                    rolId: rol.id,
                    permisoId
                }))
            });
        }

        res.status(201).json(rol);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Error al crear rol' });
    }
};

// PUT /roles/:id - Actualizar rol
export const update = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateRoleSchema.parse(req.body);

        const existing = await prisma.rol.findUnique({
            where: { id: Number(id) }
        });
        if (!existing || existing.fechaEliminacion) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        // Proteger Super Admin de ser modificado
        if (existing.nombre === 'Super Admin' && data.nombre && data.nombre !== 'Super Admin') {
            return res.status(400).json({ error: 'No se puede renombrar el rol Super Admin' });
        }

        // Actualizar rol básico
        const rol = await prisma.rol.update({
            where: { id: Number(id) },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
            }
        });

        // Actualizar permisos si se proporcionaron
        if (data.permisoIds !== undefined) {
            // Eliminar permisos actuales
            await prisma.rolPermiso.deleteMany({
                where: { rolId: rol.id }
            });

            // Crear nuevos permisos
            if (data.permisoIds.length > 0) {
                await prisma.rolPermiso.createMany({
                    data: data.permisoIds.map(permisoId => ({
                        rolId: rol.id,
                        permisoId
                    }))
                });
            }
        }

        res.json(rol);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Error al actualizar rol' });
    }
};

// DELETE /roles/:id - Soft delete
export const deleteOne = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existing = await prisma.rol.findUnique({
            where: { id: Number(id) }
        });
        if (!existing || existing.fechaEliminacion) {
            return res.status(404).json({ error: 'Rol no encontrado' });
        }

        // Proteger Super Admin de ser eliminado
        if (existing.nombre === 'Super Admin') {
            return res.status(400).json({ error: 'No se puede eliminar el rol Super Admin' });
        }

        await prisma.rol.update({
            where: { id: Number(id) },
            data: { fechaEliminacion: new Date() }
        });

        res.json({ message: 'Rol eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Error al eliminar rol' });
    }
};

// GET /permisos - Listar todos los permisos disponibles (para el formulario de roles)
export const getAllPermisos = async (_req: Request, res: Response) => {
    try {
        const permisos = await prisma.permiso.findMany({
            orderBy: [{ modulo: 'asc' }, { codigo: 'asc' }]
        });

        // Agrupar por módulo
        const grouped = permisos.reduce((acc, p) => {
            if (!acc[p.modulo]) acc[p.modulo] = [];
            acc[p.modulo].push(p);
            return acc;
        }, {} as Record<string, typeof permisos>);

        res.json({ permisos, grouped });
    } catch (error) {
        console.error('Error fetching permisos:', error);
        res.status(500).json({ error: 'Error al obtener permisos' });
    }
};
