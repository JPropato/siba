# Sistema Bauman - Lineamientos Generales del Proyecto

> **Fecha**: 2026-01-17  
> **Versión**: 1.0  
> **Basado en**: Descubrimiento de requisitos + Skills de arquitectura

---

## 📋 Resumen Ejecutivo

| Aspecto | Decisión |
|---------|----------|
| **Tipo de proyecto** | ERP interno para empresa de construcción |
| **Arquitectura** | Monolito modular (separación frontend/backend) |
| **Patrón de código** | Layered Architecture + Feature-based organization |
| **Frontend** | React 19 + Vite + TypeScript + shadcn/ui |
| **Backend** | Express 5 + TypeScript + Prisma + Zod |
| **Base de datos** | PostgreSQL 16 |
| **Infraestructura** | Docker + Dokploy + VPS único |
| **Usuarios** | 5-30 empleados internos |

---

## 🏗️ Arquitectura General

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTE                                │
│                    (Navegador Web)                              │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REVERSE PROXY (Caddy)                        │
│                 SSL automático + Routing                        │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
         /app/*     │                           │  /api/*
                    ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│        FRONTEND           │   │          BACKEND              │
│   React + Vite (static)   │   │    Express + TypeScript       │
│   Servido por Nginx       │   │    Puerto 3001                │
│   Puerto 80 (interno)     │   │                               │
└───────────────────────────┘   └───────────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────┐
                              │       PostgreSQL 16           │
                              │       Puerto 5432             │
                              └───────────────────────────────┘
                                              │
                              ┌───────────────────────────────┐
                              │          MinIO                │
                              │    (Storage de imágenes)      │
                              │       Puerto 9000             │
                              └───────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

### Monorepo Structure

```
sistema-bauman/
├── apps/
│   ├── web/                          # Frontend React
│   │   ├── src/
│   │   │   ├── components/           # Componentes reutilizables
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   └── common/           # Otros comunes
│   │   │   │
│   │   │   ├── features/             # Módulos por dominio
│   │   │   │   ├── auth/
│   │   │   │   │   ├── api/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   └── types/
│   │   │   │   ├── clientes/
│   │   │   │   ├── tickets/
│   │   │   │   ├── obras/
│   │   │   │   └── finanzas/
│   │   │   │
│   │   │   ├── hooks/                # Hooks globales
│   │   │   ├── lib/                  # Utilidades (apiClient, etc.)
│   │   │   ├── routes/               # Definición de rutas
│   │   │   └── types/                # Tipos globales
│   │   │
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                          # Backend Express
│       ├── src/
│       │   ├── modules/              # Módulos por dominio
│       │   │   ├── auth/
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.routes.ts
│       │   │   │   └── auth.validators.ts
│       │   │   ├── users/
│       │   │   ├── clientes/
│       │   │   ├── tickets/
│       │   │   ├── obras/
│       │   │   └── finanzas/
│       │   │
│       │   ├── middleware/           # Middleware Express
│       │   │   ├── auth.middleware.ts
│       │   │   ├── error.middleware.ts
│       │   │   └── validation.middleware.ts
│       │   │
│       │   ├── lib/                  # Utilidades
│       │   │   ├── prisma.ts
│       │   │   ├── jwt.ts
│       │   │   └── upload.ts
│       │   │
│       │   ├── types/                # Tipos globales
│       │   ├── app.ts                # Express setup
│       │   └── server.ts             # HTTP server
│       │
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       │
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                         # Código compartido
│   └── shared/
│       ├── types/                    # TypeScript types compartidos
│       │   ├── cliente.ts
│       │   ├── ticket.ts
│       │   └── index.ts
│       │
│       ├── validators/               # Zod schemas compartidos
│       │   ├── cliente.schema.ts
│       │   └── index.ts
│       │
│       └── package.json
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── nginx.conf
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
├── README.md
└── package.json                      # Monorepo root (workspaces)
```

---

## 🔧 Patrones de Desarrollo

### Backend: Layered Architecture

```
HTTP Request
    ↓
Routes (solo routing, sin lógica)
    ↓
Controllers (manejo de request/response)
    ↓
Services (lógica de negocio)
    ↓
Repositories (acceso a datos) [opcional]
    ↓
Prisma (ORM)
    ↓
PostgreSQL
```

**Reglas clave:**
1. Routes solo routean, delegan a controllers
2. Controllers manejan HTTP, llaman a services
3. Services contienen lógica de negocio
4. Toda validación con Zod
5. No usar `process.env` directamente, usar config centralizado

### Borrado Lógico (Soft Delete) - OBLIGATORIO

> ⚠️ **NUNCA eliminar registros físicamente de la base de datos**

Todas las tablas principales deben tener el campo `deleted_at`:

| Campo | Tipo | Significado |
|-------|------|-------------|
| `deleted_at` | TIMESTAMP NULL | `NULL` = activo, `fecha` = eliminado |

```typescript
// ❌ PROHIBIDO - Delete físico
await prisma.cliente.delete({ where: { id } });

// ✅ CORRECTO - Soft delete
await prisma.cliente.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// ✅ CORRECTO - Buscar solo activos
await prisma.cliente.findMany({
  where: { deletedAt: null }
});
```

**Middleware Prisma**: Implementar middleware que intercepte `delete` y lo convierta en `update` con `deletedAt`.

### Frontend: Feature-Based Organization

```
features/
  mi-feature/
    api/          → API calls (fetch, axios)
    components/   → UI components
    hooks/        → Custom hooks
    helpers/      → Utility functions
    types/        → TypeScript types
    index.ts      → Public exports
```

**Reglas clave:**
1. Lazy loading para componentes pesados
2. Suspense para estados de carga
3. TanStack Query para data fetching
4. No early returns con spinners (usar Suspense)
5. shadcn/ui como sistema de componentes

---

## 🔐 Seguridad

### Autenticación
- JWT con refresh tokens
- Tokens en httpOnly cookies (no localStorage)
- Bcrypt para hash de passwords (rounds: 12)
- Rate limiting en endpoints de login

### Autorización (RBAC)
```typescript
// Roles definidos
type Role = 'admin' | 'gerente' | 'comercial';

// Permisos por módulo
type Permission = 
  | 'usuarios:read' | 'usuarios:write' | 'usuarios:delete'
  | 'clientes:read' | 'clientes:write' | 'clientes:delete'
  | 'tickets:read' | 'tickets:write' | 'tickets:assign'
  | 'obras:read' | 'obras:write' | 'obras:presupuesto'
  | 'finanzas:read' | 'finanzas:write' | 'finanzas:admin';

// Roles iniciales
// admin - Acceso total al sistema
// gerente - Gestión general, finanzas, usuarios
// comercial - Solo tickets y obras
```

### Infraestructura
- HTTPS obligatorio (Caddy + Let's Encrypt)
- Headers de seguridad (helmet.js)
- CORS restringido a dominio propio
- Firewall: solo puertos 80, 443, 22

---

## 📊 Módulos del Sistema

| Módulo | Prioridad | Descripción |
|--------|-----------|-------------|
| **Seguridad** | P0 | Usuarios, roles, permisos, login |
| **Maestros** | P0 | Clientes, sucursales, zonas, empleados, vehículos |
| **Tickets** | P1 | Tickets de mantenimiento, estados, notificaciones |
| **Obras** | P1 | Gestión de obras, presupuestos PDF |
| **Artículos** | P2 | Maestro de artículos, listas de precios |
| **Finanzas** | P2 | Cuentas, gastos, facturas, rendiciones |
| **Dashboard** | P3 | Métricas y visualizaciones |
| **Reportes** | P3 | Exportación de datos |

---

## 🚀 Infraestructura y Deploy

### VPS Recomendado
- **Proveedor**: Hetzner, Contabo, o DigitalOcean
- **Specs**: 4 vCPU, 8GB RAM, 80GB SSD
- **Costo estimado**: €15-25/mes
- **Sistema**: Ubuntu 22.04 LTS

### Stack de Deploy
```
Dokploy (PaaS self-hosted)
    ↓
Docker Compose
    ├── bauman-web (Nginx + React build)
    ├── bauman-api (Node.js)
    ├── postgres (PostgreSQL 16)
    └── minio (Object storage)
```

### Backups
- PostgreSQL: pg_dump diario automático
- Retención: 7 días locales, 30 días externos
- MinIO: replicación opcional a S3

---

## 📈 Escalabilidad

### Fase 1: Actual (5-30 usuarios)
- VPS único con docker-compose
- PostgreSQL en mismo servidor
- Backups manuales/cron

### Fase 2: Crecimiento (si se necesita)
- PostgreSQL managed (Supabase, Neon, o RDS)
- CDN para assets estáticos
- Réplica de lectura si hay mucha carga

### Fase 3: Avanzado (poco probable)
- Kubernetes (solo si hay necesidad real)
- Microservicios (solo si hay necesidad real)

---

## 🛠️ Tooling y DX

### Desarrollo Local
```bash
# Instalar dependencias
npm install

# Levantar servicios (DB, MinIO)
docker-compose up -d postgres minio

# Desarrollo frontend
cd apps/web && npm run dev

# Desarrollo backend
cd apps/api && npm run dev
```

### Calidad de Código
- **ESLint**: Linting JavaScript/TypeScript
- **Prettier**: Formateo automático
- **TypeScript strict mode**: No `any`
- **Husky**: Pre-commit hooks

### Testing
- **Vitest**: Unit tests (frontend)
- **Jest**: Unit/integration tests (backend)
- **Supertest**: API testing

---

## 📚 Convenciones de Código

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivos componentes | PascalCase | `ClienteForm.tsx` |
| Archivos servicios | camelCase | `clienteService.ts` |
| Archivos rutas | camelCase | `clienteRoutes.ts` |
| Variables | camelCase | `clienteActivo` |
| Constantes | UPPER_SNAKE | `MAX_UPLOAD_SIZE` |
| Types/Interfaces | PascalCase | `interface Cliente {}` |
| Enums | PascalCase | `enum EstadoTicket {}` |

### Estructura de Commits
```
tipo(scope): descripción corta

Tipos: feat, fix, docs, style, refactor, test, chore
Scope: auth, clientes, tickets, obras, finanzas, infra
```

---

## ✅ Checklist Pre-Desarrollo

- [ ] VPS contratado y configurado
- [ ] Dominio apuntando al servidor
- [ ] Dokploy instalado
- [ ] Repositorio Git creado
- [ ] CI/CD básico configurado
- [ ] Estructura de proyecto inicializada
- [ ] Schema Prisma con modelo inicial
- [ ] Primer deploy exitoso (hello world)

---

## 🔄 Próximos Pasos

1. **Diseño de base de datos** (ERD con todas las entidades)
2. **Wireframes** de los módulos principales
3. **Setup del proyecto** con estructura definida
4. **MVP del módulo de Seguridad** (login, usuarios, roles)
5. **MVP del módulo de Maestros** (clientes, empleados)
