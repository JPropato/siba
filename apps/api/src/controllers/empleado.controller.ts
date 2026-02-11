import { Request, Response } from 'express';
import { z } from 'zod';
import {
  Prisma,
  TipoEmpleado,
  TipoContrato,
  CategoriaLaboral,
  EstadoCivil,
  EstadoPreocupacional,
  EstadoEmpleado,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas ---
const createEmpleadoSchema = z.object({
  // Datos personales
  nombre: z.string().min(2).max(100),
  apellido: z.string().min(2).max(100),
  email: z.string().email().optional().nullable(),
  direccion: z.string().max(255).optional().nullable(),
  telefono: z.string().max(50).optional().nullable(),
  cuil: z.string().max(20).optional().nullable(),
  dni: z.string().max(20).optional().nullable(),
  fechaNacimiento: z.string().datetime().or(z.date()).optional().nullable(),
  estadoCivil: z.nativeEnum(EstadoCivil).optional().nullable(),
  cantidadHijos: z.number().int().min(0).optional().nullable(),
  telefonoSecundario: z.string().max(50).optional().nullable(),
  dniBeneficiario: z.string().max(20).optional().nullable(),

  // Datos laborales
  inicioRelacionLaboral: z.string().datetime().or(z.date()),
  tipo: z.nativeEnum(TipoEmpleado),
  tipoContrato: z.nativeEnum(TipoContrato).optional().nullable(),
  esReferente: z.boolean().optional().default(false),
  puesto: z.string().max(100).optional().nullable(),
  legajo: z.string().max(50).optional().nullable(),
  estado: z.nativeEnum(EstadoEmpleado).optional().default('ACTIVO'),
  categoriaLaboral: z.nativeEnum(CategoriaLaboral).optional().nullable(),
  convenioSeccion: z.string().max(100).optional().nullable(),
  lugarTrabajo: z.string().max(200).optional().nullable(),
  horario: z.string().max(100).optional().nullable(),
  ieric: z.boolean().optional().default(false),
  obraSocial: z.string().max(100).optional().nullable(),
  fechaBaja: z.string().datetime().or(z.date()).optional().nullable(),
  motivoBaja: z.string().max(500).optional().nullable(),

  // Datos bancarios
  banco: z.string().max(100).optional().nullable(),
  cbu: z.string().max(30).optional().nullable(),
  estadoBanco: z.string().max(50).optional().nullable(),

  // Datos salariales
  sueldoBruto: z.number().or(z.string()).optional().nullable(),
  sueldoNeto: z.number().or(z.string()).optional().nullable(),
  fechaActualizacionSueldo: z.string().datetime().or(z.date()).optional().nullable(),

  // Documentacion
  preocupacionalEstado: z.nativeEnum(EstadoPreocupacional).optional().nullable(),
  preocupacionalFecha: z.string().datetime().or(z.date()).optional().nullable(),
  foto: z.string().max(500).optional().nullable(),
  notas: z.string().max(2000).optional().nullable(),
  fechaVencimientoSeguro: z.string().datetime().or(z.date()).optional().nullable(),
  fechaVencimientoRegistro: z.string().datetime().or(z.date()).optional().nullable(),

  // Relaciones
  zonaId: z.number().int().optional().nullable(),
  usuarioId: z.number().int().optional().nullable(),
});

const updateEmpleadoSchema = createEmpleadoSchema.partial();

// Helper to convert date strings
function toDateOrNull(value: string | Date | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value as string);
}

function toDateOrUndefined(value: string | Date | undefined): Date | undefined {
  if (value === undefined) return undefined;
  return new Date(value as string);
}

// --- Controller Methods ---

export const getAll = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const estado = req.query.estado as string;
    const tipo = req.query.tipo as string;
    const zonaId = req.query.zonaId ? Number(req.query.zonaId) : undefined;
    const categoriaLaboral = req.query.categoriaLaboral as string;
    const tipoContrato = req.query.tipoContrato as string;

    const skip = (page - 1) * limit;

    const whereClause: Prisma.EmpleadoWhereInput = {
      fechaEliminacion: null,
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cuil: { contains: search, mode: 'insensitive' } },
        { legajo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (estado) {
      whereClause.estado = estado as EstadoEmpleado;
    }
    if (tipo) {
      whereClause.tipo = tipo as TipoEmpleado;
    }
    if (zonaId) {
      whereClause.zonaId = zonaId;
    }
    if (categoriaLaboral) {
      whereClause.categoriaLaboral = categoriaLaboral as CategoriaLaboral;
    }
    if (tipoContrato) {
      whereClause.tipoContrato = tipoContrato as TipoContrato;
    }

    const [total, empleados] = await prisma.$transaction([
      prisma.empleado.count({ where: whereClause }),
      prisma.empleado.findMany({
        where: whereClause,
        include: {
          zona: { select: { nombre: true } },
          usuario: { select: { email: true } },
          _count: { select: { segurosAP: true } },
          segurosAP: {
            where: { estado: { in: ['ACTIVO', 'PEDIDO_ALTA'] } },
            select: { id: true, estado: true },
            take: 1,
            orderBy: { fechaCreacion: 'desc' },
          },
        },
        skip,
        take: limit,
        orderBy: { apellido: 'asc' },
      }),
    ]);

    res.json({
      data: empleados,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const empleado = await prisma.empleado.findFirst({
      where: { id, fechaEliminacion: null },
      include: {
        zona: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, email: true, nombre: true, apellido: true } },
        segurosAP: { orderBy: { fechaCreacion: 'desc' } },
      },
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Excluir campos salariales si el usuario no tiene permiso
    const permisos = (req.user as { permisos?: string[] })?.permisos || [];
    if (!permisos.includes('empleados:salarios')) {
      const { sueldoBruto, sueldoNeto, fechaActualizacionSueldo, ...sinSalario } = empleado;
      return res.json(sinSalario);
    }

    res.json(empleado);
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const body = createEmpleadoSchema.parse(req.body);

    // Validar email único si se proporciona
    if (body.email) {
      const existingEmail = await prisma.empleado.findFirst({
        where: { email: body.email, fechaEliminacion: null },
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Ya existe un empleado con ese email.' });
      }
    }

    // Validar CUIL único
    if (body.cuil) {
      const existingCuil = await prisma.empleado.findFirst({
        where: { cuil: body.cuil, fechaEliminacion: null },
      });
      if (existingCuil) {
        return res.status(400).json({ error: 'Ya existe un empleado con ese CUIL.' });
      }
    }

    // Validar DNI único
    if (body.dni) {
      const existingDni = await prisma.empleado.findFirst({
        where: { dni: body.dni, fechaEliminacion: null },
      });
      if (existingDni) {
        return res.status(400).json({ error: 'Ya existe un empleado con ese DNI.' });
      }
    }

    // Validar legajo único
    if (body.legajo) {
      const existingLegajo = await prisma.empleado.findFirst({
        where: { legajo: body.legajo, fechaEliminacion: null },
      });
      if (existingLegajo) {
        return res.status(400).json({ error: 'Ya existe un empleado con ese legajo.' });
      }
    }

    // Validar zona si se proporciona
    if (body.zonaId) {
      const zona = await prisma.zona.findFirst({
        where: { id: body.zonaId, fechaEliminacion: null },
      });
      if (!zona) {
        return res.status(400).json({ error: 'La zona seleccionada no existe.' });
      }
    }

    // Validar usuario si se proporciona
    if (body.usuarioId) {
      const usuario = await prisma.usuario.findFirst({
        where: { id: body.usuarioId, fechaEliminacion: null },
      });
      if (!usuario) {
        return res.status(400).json({ error: 'El usuario seleccionado no existe.' });
      }
      const existingEmpleado = await prisma.empleado.findFirst({
        where: { usuarioId: body.usuarioId, fechaEliminacion: null },
      });
      if (existingEmpleado) {
        return res.status(400).json({ error: 'El usuario ya está asociado a otro empleado.' });
      }
    }

    const newEmpleado = await prisma.empleado.create({
      data: {
        ...body,
        inicioRelacionLaboral: new Date(body.inicioRelacionLaboral as string),
        fechaNacimiento: toDateOrNull(body.fechaNacimiento),
        fechaBaja: toDateOrNull(body.fechaBaja),
        fechaVencimientoSeguro: toDateOrNull(body.fechaVencimientoSeguro),
        fechaVencimientoRegistro: toDateOrNull(body.fechaVencimientoRegistro),
        preocupacionalFecha: toDateOrNull(body.preocupacionalFecha),
        fechaActualizacionSueldo: toDateOrNull(body.fechaActualizacionSueldo),
        sueldoBruto: body.sueldoBruto != null ? new Prisma.Decimal(body.sueldoBruto) : null,
        sueldoNeto: body.sueldoNeto != null ? new Prisma.Decimal(body.sueldoNeto) : null,
        zonaId: body.zonaId ?? null,
        usuarioId: body.usuarioId ?? null,
      },
      include: {
        zona: { select: { nombre: true } },
        usuario: { select: { email: true } },
      },
    });

    res.status(201).json(newEmpleado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al crear empleado:', error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = updateEmpleadoSchema.parse(req.body);

    const empleado = await prisma.empleado.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Validar email único si cambia
    if (body.email && body.email !== empleado.email) {
      const existingEmail = await prisma.empleado.findFirst({
        where: { email: body.email, fechaEliminacion: null },
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Ya existe otro empleado con ese email.' });
      }
    }

    // Validar CUIL único si cambia
    if (body.cuil && body.cuil !== empleado.cuil) {
      const existingCuil = await prisma.empleado.findFirst({
        where: { cuil: body.cuil, fechaEliminacion: null },
      });
      if (existingCuil) {
        return res.status(400).json({ error: 'Ya existe otro empleado con ese CUIL.' });
      }
    }

    // Validar DNI único si cambia
    if (body.dni && body.dni !== empleado.dni) {
      const existingDni = await prisma.empleado.findFirst({
        where: { dni: body.dni, fechaEliminacion: null },
      });
      if (existingDni) {
        return res.status(400).json({ error: 'Ya existe otro empleado con ese DNI.' });
      }
    }

    // Validar legajo único si cambia
    if (body.legajo && body.legajo !== empleado.legajo) {
      const existingLegajo = await prisma.empleado.findFirst({
        where: { legajo: body.legajo, fechaEliminacion: null },
      });
      if (existingLegajo) {
        return res.status(400).json({ error: 'Ya existe otro empleado con ese legajo.' });
      }
    }

    // Validar zona si cambia
    if (body.zonaId) {
      const zona = await prisma.zona.findFirst({
        where: { id: body.zonaId, fechaEliminacion: null },
      });
      if (!zona) {
        return res.status(400).json({ error: 'La zona seleccionada no existe.' });
      }
    }

    // Validar usuario si cambia
    if (body.usuarioId && body.usuarioId !== empleado.usuarioId) {
      const usuario = await prisma.usuario.findFirst({
        where: { id: body.usuarioId, fechaEliminacion: null },
      });
      if (!usuario) {
        return res.status(400).json({ error: 'El usuario seleccionado no existe.' });
      }
      const existingEmpleado = await prisma.empleado.findFirst({
        where: { usuarioId: body.usuarioId, fechaEliminacion: null },
      });
      if (existingEmpleado) {
        return res.status(400).json({ error: 'El usuario ya está asociado a otro empleado.' });
      }
    }

    // Si cambia a BAJA o RENUNCIA y no tiene fechaBaja, setearla automáticamente
    if (
      body.estado &&
      (body.estado === 'BAJA' || body.estado === 'RENUNCIA') &&
      !body.fechaBaja &&
      !empleado.fechaBaja
    ) {
      body.fechaBaja = new Date().toISOString();
    }

    const updated = await prisma.empleado.update({
      where: { id },
      data: {
        ...body,
        inicioRelacionLaboral: toDateOrUndefined(body.inicioRelacionLaboral),
        fechaNacimiento:
          body.fechaNacimiento === undefined ? undefined : toDateOrNull(body.fechaNacimiento),
        fechaBaja: body.fechaBaja === undefined ? undefined : toDateOrNull(body.fechaBaja),
        fechaVencimientoSeguro:
          body.fechaVencimientoSeguro === undefined
            ? undefined
            : toDateOrNull(body.fechaVencimientoSeguro),
        fechaVencimientoRegistro:
          body.fechaVencimientoRegistro === undefined
            ? undefined
            : toDateOrNull(body.fechaVencimientoRegistro),
        preocupacionalFecha:
          body.preocupacionalFecha === undefined
            ? undefined
            : toDateOrNull(body.preocupacionalFecha),
        fechaActualizacionSueldo:
          body.fechaActualizacionSueldo === undefined
            ? undefined
            : toDateOrNull(body.fechaActualizacionSueldo),
        sueldoBruto:
          body.sueldoBruto === undefined
            ? undefined
            : body.sueldoBruto != null
              ? new Prisma.Decimal(body.sueldoBruto)
              : null,
        sueldoNeto:
          body.sueldoNeto === undefined
            ? undefined
            : body.sueldoNeto != null
              ? new Prisma.Decimal(body.sueldoNeto)
              : null,
        zonaId: body.zonaId === undefined ? undefined : (body.zonaId ?? null),
        usuarioId: body.usuarioId === undefined ? undefined : (body.usuarioId ?? null),
      },
      include: {
        zona: { select: { nombre: true } },
        usuario: { select: { email: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
};

export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const empleado = await prisma.empleado.findFirst({
      where: { id, fechaEliminacion: null },
    });
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Soft Delete
    await prisma.empleado.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
};
