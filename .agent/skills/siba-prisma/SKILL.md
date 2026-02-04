---
name: siba-prisma
description: Convenciones de modelado y uso de Prisma en el proyecto SIBA
---

# SIBA Prisma

Lineamientos para modelado de datos, migraciones y queries con Prisma.

## Cuándo Usar

- Crees un **nuevo modelo** en el schema
- Hagas **migraciones** de base de datos
- Escribas **queries** optimizadas
- Implementes **relaciones** entre modelos

---

## Estructura de Archivos

```
apps/api/
├── prisma/
│   ├── schema.prisma      # Definición de modelos
│   ├── migrations/        # Historial de migraciones
│   ├── seed.ts            # Datos de prueba
│   └── essentials.ts      # Datos esenciales (roles, etc.)
└── src/
    └── lib/
        └── prisma.ts      # Cliente Prisma singleton
```

---

## Cliente Prisma Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## Convenciones de Modelo

### Campos Estándar

Todos los modelos deben incluir:

```prisma
model Entidad {
    id              Int       @id @default(autoincrement())

    // ... campos específicos ...

    // Auditoría
    fechaCreacion      DateTime  @default(now())
    fechaActualizacion DateTime  @updatedAt
    fechaEliminacion   DateTime? // Soft delete

    // Relaciones de auditoría (opcional)
    creadoPorId        Int?
    creadoPor          Usuario?  @relation("creadoPor", fields: [creadoPorId], references: [id])
    actualizadoPorId   Int?
    actualizadoPor     Usuario?  @relation("actualizadoPor", fields: [actualizadoPorId], references: [id])

    @@map("entidades") // Nombre de tabla en plural, snake_case
}
```

### Naming Conventions

| Elemento      | Convención          | Ejemplo                          |
| ------------- | ------------------- | -------------------------------- |
| Modelo        | PascalCase singular | `Usuario`, `Ticket`              |
| Campo         | camelCase           | `fechaCreacion`, `codigoCliente` |
| Tabla (@@map) | snake_case plural   | `usuarios`, `tickets`            |
| Enum          | SCREAMING_SNAKE     | `ESTADO_TICKET`                  |
| Relación      | Nombre descriptivo  | `creadoPor`, `sucursal`          |

---

## Relaciones

### One-to-Many

```prisma
model Cliente {
    id         Int         @id @default(autoincrement())
    razonSocial String
    sucursales  Sucursal[]  // Array = lado "many"
}

model Sucursal {
    id        Int     @id @default(autoincrement())
    nombre    String
    clienteId Int     // FK
    cliente   Cliente @relation(fields: [clienteId], references: [id])
}
```

### Many-to-Many

```prisma
model Usuario {
    id    Int      @id @default(autoincrement())
    roles Rol[]    @relation("UsuarioRoles")
}

model Rol {
    id       Int       @id @default(autoincrement())
    nombre   String
    usuarios Usuario[] @relation("UsuarioRoles")
}
```

### Self-Relation

```prisma
model Ticket {
    id                  Int      @id @default(autoincrement())
    ticketRelacionadoId Int?
    ticketRelacionado   Ticket?  @relation("TicketRelacion", fields: [ticketRelacionadoId], references: [id])
    ticketsHijos        Ticket[] @relation("TicketRelacion")
}
```

---

## Enums

```prisma
enum EstadoTicket {
    NUEVO
    ASIGNADO
    EN_CURSO
    PENDIENTE_CLIENTE
    FINALIZADO
    CANCELADO
}

model Ticket {
    estado EstadoTicket @default(NUEVO)
}
```

---

## Queries Comunes

### Listar con Paginación

```typescript
const [total, items] = await prisma.$transaction([
  prisma.ticket.count({ where: whereClause }),
  prisma.ticket.findMany({
    where: whereClause,
    include: { sucursal: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { fechaCreacion: 'desc' },
  }),
]);
```

### Búsqueda Insensitiva

```typescript
where: {
    OR: [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
    ],
}
```

### Soft Delete Filter

```typescript
// SIEMPRE incluir en queries
where: {
    fechaEliminacion: null, // Solo activos
}
```

### Include vs Select

```typescript
// Include: trae todo + relaciones
const user = await prisma.usuario.findUnique({
  where: { id },
  include: { rol: true },
});

// Select: solo campos específicos (más eficiente)
const user = await prisma.usuario.findUnique({
  where: { id },
  select: {
    id: true,
    nombre: true,
    rol: { select: { nombre: true } },
  },
});
```

### Transacciones

```typescript
// Transacción implícita (array)
const [count, items] = await prisma.$transaction([
    prisma.ticket.count(),
    prisma.ticket.findMany(),
]);

// Transacción interactiva
await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.create({ data: {...} });
    await tx.ticketHistorial.create({
        data: { ticketId: ticket.id, ... }
    });
});
```

---

## Migraciones

```bash
# Crear migración en desarrollo
npm run db:migrate -- --name add_campo_x

# Aplicar migraciones en producción
npx prisma migrate deploy

# Reset base de datos (CUIDADO: borra todo)
npx prisma migrate reset

# Ver estado de migraciones
npx prisma migrate status
```

---

## Seed de Datos

```typescript
// prisma/essentials.ts
import { prisma } from '../src/lib/prisma';

async function main() {
  // Roles base
  await prisma.rol.createMany({
    data: [{ nombre: 'ADMIN' }, { nombre: 'SUPERVISOR' }, { nombre: 'TECNICO' }],
    skipDuplicates: true,
  });

  // Usuario admin
  await prisma.usuario.upsert({
    where: { email: 'admin@siba.com' },
    update: {},
    create: {
      email: 'admin@siba.com',
      password: await bcrypt.hash('admin123', 10),
      nombre: 'Administrador',
      rolId: 1,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Checklist

- [ ] Campos de auditoría en todos los modelos
- [ ] `fechaEliminacion` para soft delete
- [ ] `@@map` con nombre de tabla en plural
- [ ] Usar `mode: 'insensitive'` en búsquedas
- [ ] Transacciones para operaciones múltiples
- [ ] `select` en lugar de `include` cuando sea posible
- [ ] Índices en campos de búsqueda frecuente
- [ ] Migraciones con nombres descriptivos
