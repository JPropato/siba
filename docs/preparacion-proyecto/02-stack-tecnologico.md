# Sistema Bauman - Recomendación de Stack Tecnológico

> **Fecha**: 2026-01-17  
> **Basado en**: Descubrimiento de requisitos (01-descubrimiento-respuestas.md)

---

## 📊 Análisis de Requisitos → Stack

### Factores Determinantes

| Factor | Valor | Implicación |
|--------|-------|-------------|
| Usuarios máximos | 20-30 | No requiere arquitectura distribuida |
| Desarrollador único | 1 (apoyado en IA) | Priorizar DX y simplicidad |
| Naturaleza de datos | Relacional | PostgreSQL como elección obvia |
| Integraciones | N8N, APIs | Backend debe exponer REST API |
| Archivos | Imágenes de celular | Storage de objetos (S3-compatible) |
| Budget | Ajustado | VPS único con docker-compose |
| Mantenimiento | Fin de semana | No requiere zero-downtime |

---

## 🏗️ Stack Recomendado

### Opción Principal: **TypeScript Full-Stack Monolito**

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  React + Vite + TanStack Query + React Router               │
│  UI: shadcn/ui (Radix + Tailwind)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          BACKEND                            │
│  Node.js + Express + TypeScript                             │
│  ORM: Prisma                                                │
│  Auth: JWT + bcrypt (custom, simple)                        │
│  Validación: Zod                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATABASE                            │
│  PostgreSQL 16                                              │
│  Backups: pg_dump automático                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          STORAGE                            │
│  MinIO (S3-compatible, self-hosted)                         │
│  Para: Imágenes de tickets/obras                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Detalle del Stack

### Frontend

| Tecnología | Propósito | Alternativa |
|------------|-----------|-------------|
| **React 19** | Framework UI | - |
| **Vite** | Build tool (rapidísimo) | Create React App (NO) |
| **TypeScript** | Tipado estático | - |
| **TanStack Query** | Data fetching + cache | SWR |
| **React Router v7** | Navegación | TanStack Router |
| **shadcn/ui** | Componentes UI | MUI, Chakra |
| **Tailwind CSS** | Estilos | CSS Modules |
| **React Hook Form** | Formularios | Formik |
| **Zod** | Validación (compartida con backend) | Yup |

### Backend

| Tecnología | Propósito | Alternativa |
|------------|-----------|-------------|
| **Node.js 22 LTS** | Runtime | Bun |
| **Express 5** | Framework HTTP | Fastify, Hono |
| **TypeScript** | Tipado estático | - |
| **Prisma** | ORM + migraciones | Drizzle, TypeORM |
| **Zod** | Validación de inputs | Joi |
| **JWT** | Autenticación stateless | Sessions |
| **bcrypt** | Hash de passwords | Argon2 |
| **Winston/Pino** | Logging | - |

### Base de Datos

| Tecnología | Propósito | Alternativa |
|------------|-----------|-------------|
| **PostgreSQL 16** | BD relacional principal | MySQL |
| **Redis** | Cache + sessions (opcional) | - |

### Storage

| Tecnología | Propósito | Alternativa |
|------------|-----------|-------------|
| **MinIO** | Object storage S3-compatible | Cloudflare R2, AWS S3 |

### DevOps / Infraestructura

| Tecnología | Propósito | Alternativa |
|------------|-----------|-------------|
| **Docker** | Containerización | - |
| **docker-compose** | Orquestación local/prod | - |
| **Dokploy** | Deploy simplificado (PaaS self-hosted) | Coolify, Portainer |
| **Caddy/Traefik** | Reverse proxy + SSL automático | Nginx |
| **GitHub Actions** | CI/CD | GitLab CI |

---

## 🖥️ Infraestructura Recomendada

### VPS Único (Fase Inicial)

```
┌─────────────────────────────────────────────────────┐
│              VPS (Hetzner/Contabo/DO)               │
│                  4 vCPU / 8GB RAM                   │
│                    ~€15-25/mes                      │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Caddy     │  │   Dokploy   │  │   MinIO     │ │
│  │  (reverse   │  │   (PaaS)    │  │  (storage)  │ │
│  │   proxy)    │  │             │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │              Docker Compose                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────┐   │   │
│  │  │Frontend │ │ Backend │ │ PostgreSQL  │   │   │
│  │  │ (Nginx) │ │ (Node)  │ │             │   │   │
│  │  └─────────┘ └─────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Proveedores Recomendados

| Proveedor | Precio aprox. | Ubicación | Notas |
|-----------|---------------|-----------|-------|
| **Hetzner** | €10-20/mes | Europa | Mejor precio/rendimiento |
| **Contabo** | €8-15/mes | Europa/USA | Más barato, menos soporte |
| **DigitalOcean** | $24-48/mes | Global | Más caro, mejor UX |
| **Hostinger VPS** | $10-20/mes | Global | Buen balance |

---

## 🔐 Seguridad (Nivel Medio)

### Implementar desde el inicio:

1. **Autenticación**
   - JWT con refresh tokens
   - Passwords hasheados con bcrypt (salt rounds: 12)
   - Rate limiting en login

2. **Autorización**
   - RBAC (Role-Based Access Control)
   - Middleware de permisos por ruta
   - Validación de ownership en recursos

3. **Infraestructura**
   - HTTPS obligatorio (Caddy/Let's Encrypt)
   - Headers de seguridad (Helmet.js)
   - CORS configurado correctamente
   - Firewall (UFW): solo puertos 80, 443, 22

4. **Base de datos**
   - Conexión solo desde localhost/docker network
   - Usuario con permisos mínimos (no superuser)
   - Backups diarios automáticos

---

## 📁 Estructura de Proyecto Sugerida

```
sistema-bauman/
├── apps/
│   ├── web/                    # Frontend React
│   │   ├── src/
│   │   │   ├── components/     # Componentes reutilizables
│   │   │   ├── features/       # Módulos por feature
│   │   │   │   ├── auth/
│   │   │   │   ├── clientes/
│   │   │   │   ├── tickets/
│   │   │   │   ├── obras/
│   │   │   │   └── finanzas/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── routes/
│   │   └── package.json
│   │
│   └── api/                    # Backend Express
│       ├── src/
│       │   ├── modules/        # Módulos por dominio
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── clientes/
│       │   │   ├── tickets/
│       │   │   ├── obras/
│       │   │   └── finanzas/
│       │   ├── middleware/
│       │   ├── lib/
│       │   └── index.ts
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/                   # Código compartido
│   └── shared/
│       ├── types/              # TypeScript types
│       └── validators/         # Zod schemas
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## ✅ Justificación de Decisiones

| Decisión | Por qué |
|----------|---------|
| **Monolito** | 1 dev, <30 usuarios, complejidad innecesaria en microservicios |
| **TypeScript everywhere** | Tipado compartido, menos bugs, mejor DX con IA |
| **React + Vite** | Ecosistema maduro, shadcn/ui para UI rápida |
| **Express** | Simplicidad, documentación abundante, fácil de debuggear |
| **Prisma** | Mejor DX, migraciones automáticas, type-safe |
| **PostgreSQL** | Robusto, gratuito, mejor soporte que MySQL |
| **Docker Compose** | Deploy reproducible, fácil de escalar luego |
| **VPS único** | Costo bajo, suficiente para 30 usuarios |

---

## 🚫 Lo que NO recomiendo

| Tecnología | Por qué NO |
|------------|------------|
| Next.js | Overkill para app interna, complejidad SSR innecesaria |
| Microservicios | 1 desarrollador, sin necesidad de escala horizontal |
| Kubernetes | Overkill absoluto para este tamaño |
| MongoDB | Datos son relacionales, SQL es mejor fit |
| Firebase/Supabase | Menor control, vendor lock-in |
| Serverless | Complejidad para este caso de uso |

---

## 📅 Próximos Pasos

1. [ ] Validar stack con el cliente/stakeholders
2. [ ] Definir modelo de datos (ERD)
3. [ ] Diseñar wireframes de los módulos principales
4. [ ] Setup inicial del monorepo
5. [ ] Configurar CI/CD básico
6. [ ] Desarrollar MVP del módulo de Seguridad
