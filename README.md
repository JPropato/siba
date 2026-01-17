# Sistema Bauman

Sistema de gestión interno para empresa de construcción, obras y mantenimiento.

## 📋 Descripción

ERP interno que permite:
- Gestionar clientes y sucursales
- Administrar tickets de servicio técnico
- Presupuestar y controlar obras
- Gestionar finanzas (gastos, ingresos, contribuciones)

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 + Vite + TypeScript + shadcn/ui |
| Backend | Express 5 + TypeScript + Prisma |
| Base de datos | PostgreSQL 16 |
| Storage | MinIO (S3-compatible) |
| Infraestructura | Docker + Dokploy |

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

Ver [`docs/preparacion-proyecto/README.md`](./docs/preparacion-proyecto/README.md) para:
- Stack tecnológico detallado
- Lineamientos de arquitectura
- Diseño visual
- Roadmap de desarrollo
- Modelo de datos

## 🌿 Branches

| Branch | Propósito |
|--------|-----------|
| `main` | Producción |
| `uat` | Testing/Pre-producción (default) |

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
