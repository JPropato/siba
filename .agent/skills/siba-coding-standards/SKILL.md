---
name: siba-coding-standards
description: Estándares de código consolidados para el proyecto SIBA (Sistema Bauman). Usar SIEMPRE al desarrollar cualquier funcionalidad. Incluye convenciones de naming, estructura, commits, y referencias a skills relacionadas.
---

# Estándares de Código SIBA

> Sistema de gestión interno (ERP) para empresa de construcción.

---

## 📋 Quick Reference

### Stack Tecnológico

| Capa         | Tecnología                                          |
| ------------ | --------------------------------------------------- |
| **Frontend** | React 19 + Vite + TypeScript + shadcn/ui + Tailwind |
| **Backend**  | Express 5 + TypeScript + Prisma + Zod               |
| **Database** | PostgreSQL 16                                       |
| **Storage**  | MinIO (S3-compatible)                               |
| **Deploy**   | Docker + Dokploy                                    |

### Usuarios

- 5-30 empleados internos
- Solo acceso autenticado
- Sin necesidad de SEO

---

## ⚠️ Reglas Críticas (NUNCA violar)

### 1. Soft Delete Obligatorio

```typescript
// ❌ PROHIBIDO - Delete físico
await prisma.cliente.delete({ where: { id } });

// ✅ CORRECTO - Soft delete
await prisma.cliente.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// ✅ CORRECTO - Buscar solo activos
await prisma.cliente.findMany({
  where: { deletedAt: null },
});
```

### 2. Responsive Obligatorio

- Funciona desde **375px** (iPhone SE)
- Desktop-first design
- Sidebar como Sheet en mobile

### 3. Dual Mode Obligatorio

- Light mode + Dark mode
- Usar `dark:` prefix en Tailwind
- NUNCA colores hardcodeados

### 4. Sin Emojis

- Usar **Lucide React** para iconos
- NUNCA emojis en UI

### 5. Commits con Validación

- Esperar que el usuario apruebe antes de commit
- Usar conventional commits

---

## 📁 Estructura del Proyecto

```
siba/
├── apps/
│   ├── web/                    # Frontend React
│   │   └── src/
│   │       ├── components/     # Componentes reutilizables
│   │       │   ├── ui/         # shadcn/ui
│   │       │   ├── layout/     # Layout components
│   │       │   └── common/     # Otros comunes
│   │       ├── features/       # Módulos por dominio
│   │       │   ├── auth/
│   │       │   ├── clientes/
│   │       │   ├── tickets/
│   │       │   └── obras/
│   │       ├── hooks/          # Hooks globales
│   │       ├── lib/            # Utilidades
│   │       ├── routes/         # Rutas
│   │       └── stores/         # Zustand stores
│   │
│   └── api/                    # Backend Express
│       └── src/
│           ├── modules/        # Módulos por dominio
│           │   ├── auth/
│           │   ├── users/
│           │   └── clientes/
│           ├── middleware/     # Middleware Express
│           ├── lib/            # Utilidades
│           └── types/          # Tipos globales
│
└── packages/
    └── shared/                 # Código compartido
        ├── types/
        └── validators/
```

---

## 🎨 Nomenclatura

### Archivos

| Tipo                  | Convención         | Ejemplo              |
| --------------------- | ------------------ | -------------------- |
| Componentes React     | PascalCase         | `ClienteForm.tsx`    |
| Servicios/controllers | camelCase          | `clienteService.ts`  |
| Rutas backend         | camelCase + routes | `clientes.routes.ts` |
| Hooks                 | camelCase + use    | `useClientes.ts`     |
| Stores                | camelCase + Store  | `authStore.ts`       |
| Types                 | camelCase          | `cliente.types.ts`   |

### Variables y Funciones

| Tipo             | Convención  | Ejemplo                        |
| ---------------- | ----------- | ------------------------------ |
| Variables        | camelCase   | `clienteActivo`                |
| Constantes       | UPPER_SNAKE | `MAX_UPLOAD_SIZE`              |
| Types/Interfaces | PascalCase  | `interface Cliente {}`         |
| Enums            | PascalCase  | `enum EstadoTicket {}`         |
| React Components | PascalCase  | `const ClienteCard = () => {}` |

### Base de Datos (Prisma)

| Tipo         | Convención        | Ejemplo                         |
| ------------ | ----------------- | ------------------------------- |
| Tablas       | snake_case plural | `clientes`, `tickets_historial` |
| Columnas     | snake_case        | `created_at`, `deleted_at`      |
| Foreign Keys | tabla_id          | `cliente_id`, `usuario_id`      |

---

## 📝 Commits

### Formato

```
tipo(scope): descripción corta

# Ejemplo:
feat(clientes): agregar formulario de creación
fix(auth): corregir expiración de JWT
docs(readme): actualizar instrucciones de setup
```

### Tipos Permitidos

| Tipo       | Uso                            |
| ---------- | ------------------------------ |
| `feat`     | Nueva funcionalidad            |
| `fix`      | Corrección de bug              |
| `docs`     | Documentación                  |
| `style`    | Formateo, sin cambio de lógica |
| `refactor` | Refactorización                |
| `test`     | Tests                          |
| `chore`    | Tareas de mantenimiento        |

### Scopes Comunes

`auth`, `clientes`, `tickets`, `obras`, `finanzas`, `usuarios`, `infra`, `ui`

---

## 🔐 Seguridad

### Autenticación

- JWT con httpOnly cookies (no localStorage)
- Refresh tokens
- Bcrypt con 12 rounds
- Rate limiting en login

### Autorización (RBAC)

```typescript
type Role = 'admin' | 'gerente' | 'comercial';

// admin     → Acceso total
// gerente   → Gestión, finanzas, usuarios
// comercial → Solo tickets y obras
```

### Validación

- SIEMPRE validar con Zod
- En backend Y frontend
- Sanitizar inputs

---

## 🚀 Deploy

### Branches

| Branch | Propósito                        |
| ------ | -------------------------------- |
| `main` | Producción                       |
| `uat`  | Testing/Pre-producción (default) |

### Workflow

1. Desarrollar en `uat`
2. Merge a `main` para producción
3. Deploy automático con Dokploy

---

## 🔗 Skills Relacionadas

### Obligatorias (siempre consultar)

| Skill                     | Uso                                 |
| ------------------------- | ----------------------------------- |
| `bauman-design-system`    | Colores, tipografía, componentes UI |
| `frontend-dev-guidelines` | Patrones React/TypeScript           |
| `backend-dev-guidelines`  | Patrones Express/Prisma             |

### Productividad

| Skill                  | Uso                 |
| ---------------------- | ------------------- |
| `git-pushing`          | Commits y push      |
| `systematic-debugging` | Debugging           |
| `dokploy-deploy`       | Deploy a producción |

### Testing

| Skill              | Uso           |
| ------------------ | ------------- |
| `testing-patterns` | Jest patterns |
| `playwright-skill` | E2E testing   |

---

## 📚 Documentación del Proyecto

| Documento              | Ruta                                                     |
| ---------------------- | -------------------------------------------------------- |
| Lineamientos Generales | `docs/preparacion-proyecto/03-lineamientos-generales.md` |
| Diseño Visual          | `docs/preparacion-proyecto/04-diseno-visual.md`          |
| Estándares Código      | `docs/preparacion-proyecto/05-estandares-codigo.md`      |
| Roadmap                | `docs/preparacion-proyecto/09-roadmap-fases.md`          |
| Plan Implementación    | `docs/preparacion-proyecto/11-plan-implementacion.md`    |

---

## ✅ Checklist Pre-Commit

- [ ] Código compila sin errores (`npm run build`)
- [ ] ESLint pasa (`npm run lint`)
- [ ] Tests pasan (si aplica)
- [ ] Funciona en mobile (375px+)
- [ ] Tiene dark mode
- [ ] No hay colores hardcodeados
- [ ] Usa Lucide React (no emojis)
- [ ] Soft delete (no DELETE físico)

---

**Skill Status**: ACTIVE ✅
