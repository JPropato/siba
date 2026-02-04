# Sistema Bauman

Sistema de gestión interno para empresa de construcción, obras y mantenimiento.

## 📋 Descripción

ERP interno que permite:

- Gestionar clientes y sucursales
- Administrar tickets de servicio técnico
- Presupuestar y controlar obras
- Gestionar finanzas (gastos, ingresos, contribuciones)

## 🏗️ Stack Tecnológico

| Capa            | Tecnología                               |
| --------------- | ---------------------------------------- |
| Frontend        | React 19 + Vite + TypeScript + shadcn/ui |
| Backend         | Express 5 + TypeScript + Prisma          |
| Base de datos   | PostgreSQL 16                            |
| Storage         | MinIO (S3-compatible)                    |
| Infraestructura | Docker + Dokploy                         |

## 📁 Estructura

```
sistema-bauman/
├── apps/
│   ├── web/          # Frontend React
│   └── api/          # Backend Express
├── packages/
│   └── shared/       # Tipos y validadores compartidos
├── docs/
│   └── preparacion-proyecto/  # Documentación de planificación
└── docker-compose.yml
```

## 📄 Documentación

### Documentación Consolidada

- **[📊 Project Master Document](./docs/PROJECT_MASTER.md)** - Vista ejecutiva del proyecto: arquitectura, stack, deudas técnicas, roadmap
- **[🔍 Deudas Técnicas](./docs/deudas/)** - Inventario consolidado de ~50 deudas con plan de acción priorizado
  - [🔴 Seguridad Crítica](./docs/deudas/seguridad-critica.md) - 5 vulnerabilidades bloqueantes (2h)
  - [🟡 UX/Performance](./docs/deudas/ux-performance.md) - 25 mejoras (40h)
  - [🟢 Arquitectura](./docs/deudas/arquitectura-escalabilidad.md) - 6 refactorings (80h)
  - [📋 Roadmap Priorizado](./docs/deudas/PRIORIDADES_ROADMAP.md) - Plan con checklists y snippets

### Documentación de Planificación

Ver [`docs/preparacion-proyecto/`](./docs/preparacion-proyecto/) para:

- Stack tecnológico detallado
- Lineamientos de arquitectura
- Diseño visual
- Modelo de datos
- Planes de implementación

### Skills para Agentes IA

21 skills documentadas en [`.agent/skills/`](./.agent/skills/) - Ver [AGENTS.md](./AGENTS.md) para índice completo

## 🌿 Branches

| Branch | Propósito                        |
| ------ | -------------------------------- |
| `main` | Producción                       |
| `uat`  | Testing/Pre-producción (default) |

## 🚀 Setup (próximamente)

```bash
# Clonar
git clone https://github.com/JPropato/siba.git
cd siba

# Instalar dependencias
npm install

# Levantar servicios
docker-compose up -d

# Desarrollo
npm run dev
```

## 📝 Licencia

Privado - Bauman © 2026
