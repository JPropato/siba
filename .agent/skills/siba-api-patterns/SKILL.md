---
name: siba-api-patterns
description: Convenciones y patrones para desarrollar endpoints de la API de SIBA con Express, Prisma y Zod
---

# SIBA API Patterns

Lineamientos para crear y mantener endpoints de API en el proyecto SIBA.

## Cuándo Usar

Usa esta skill cuando:

- Crees un **nuevo endpoint** o controller
- Implementes **paginación, filtros o búsqueda**
- Agregues **validación** con Zod
- Necesites **soft delete** o historial de cambios

---

## Estructura de Archivos

```
apps/api/src/
├── controllers/       # Lógica de negocio
│   └── [entidad].controller.ts
├── routes/            # Definición de rutas
│   └── [entidad].routes.ts
├── services/          # Servicios compartidos
├── middlewares/       # Auth, validación, etc.
├── lib/               # Prisma client, utils
└── utils/             # Helpers
```

---

## Patrón de Controller

### Estructura Base

```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// --- Schemas de Validación ---
const createSchema = z.object({
    nombre: z.string().min(1).max(100),
    descripcion: z.string().optional(),
});

const updateSchema = createSchema.partial();

// --- Helper para obtener userId ---
const getUserId = (req: Request): number => {
    const user = (req as Request & { user?: { id: number } }).user;
    return user?.id || 1;
};

// --- Métodos del Controller ---
export const getAll = async (req: Request, res: Response) => { ... };
export const getById = async (req: Request, res: Response) => { ... };
export const create = async (req: Request, res: Response) => { ... };
export const update = async (req: Request, res: Response) => { ... };
export const deleteOne = async (req: Request, res: Response) => { ... };
```

---

## Paginación Estándar

Siempre usar este patrón para listar con paginación:

```typescript
export const getAll = async (req: Request, res: Response) => {
  try {
    // 1. Parsear query params
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    // 2. Construir where clause
    const whereClause: Prisma.EntidadWhereInput = {
      fechaEliminacion: null, // Solo no eliminados
    };

    if (search) {
      whereClause.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 3. Ejecutar en transacción
    const [total, data] = await prisma.$transaction([
      prisma.entidad.count({ where: whereClause }),
      prisma.entidad.findMany({
        where: whereClause,
        include: {
          /* relaciones */
        },
        skip,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
      }),
    ]);

    // 4. Responder con meta
    res.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener entidades:', error);
    res.status(500).json({ error: 'Error al obtener entidades' });
  }
};
```

---

## Soft Delete

Nunca eliminar registros físicamente. Usar soft delete:

```typescript
export const deleteOne = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const entity = await prisma.entidad.findFirst({
      where: { id, fechaEliminacion: null },
    });

    if (!entity) {
      return res.status(404).json({ error: 'Entidad no encontrada' });
    }

    // ✅ Soft Delete
    await prisma.entidad.update({
      where: { id },
      data: { fechaEliminacion: new Date() },
    });

    res.json({ message: 'Eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
};
```

---

## Validación con Zod

### Create vs Update

```typescript
// Schema base para crear
const createSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  descripcion: z.string().max(500).optional(),
});

// Schema para actualizar (todos opcionales)
const updateSchema = createSchema.partial();

// Uso en controller
export const create = async (req: Request, res: Response) => {
  try {
    const body = createSchema.parse(req.body);
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    // ...
  }
};
```

---

## Patrón de Rutas

```typescript
import { Router } from 'express';
import * as controller from '../controllers/entidad.controller.js';

const router = Router();

// CRUD básico
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.deleteOne);

// Acciones especiales con PATCH
router.patch('/:id/estado', controller.cambiarEstado);
router.patch('/:id/activar', controller.activar);

export default router;
```

### Convenciones de Rutas

| Método | Ruta                      | Acción                |
| ------ | ------------------------- | --------------------- |
| GET    | `/entidades`              | Listar con paginación |
| GET    | `/entidades/:id`          | Obtener uno           |
| POST   | `/entidades`              | Crear                 |
| PUT    | `/entidades/:id`          | Actualizar completo   |
| PATCH  | `/entidades/:id/[accion]` | Acción específica     |
| DELETE | `/entidades/:id`          | Soft delete           |

---

## Historial de Cambios

Para entidades con trazabilidad (tickets, OTs):

```typescript
const logHistorial = async (
  entidadId: number,
  usuarioId: number,
  campo: string,
  valorAnterior: string | null,
  valorNuevo: string | null,
  observacion?: string
) => {
  await prisma.entidadHistorial.create({
    data: {
      entidadId,
      usuarioId,
      campoModificado: campo,
      valorAnterior,
      valorNuevo,
      observacion,
    },
  });
};

// Uso
await logHistorial(ticket.id, userId, 'estado', 'NUEVO', 'ASIGNADO');
```

---

## Checklist para Nuevo Endpoint

- [ ] Crear schema Zod en el controller
- [ ] Usar `partial()` para schema de update
- [ ] Incluir `fechaEliminacion: null` en todos los queries
- [ ] Implementar paginación con meta
- [ ] Usar soft delete
- [ ] Registrar historial si aplica
- [ ] Validar relaciones antes de crear/actualizar
- [ ] Loguear errores con `console.error`
