# Sistema Bauman - Plan de Implementación

> **Versión**: 1.0  
> **Metodología**: Iteración por Bloques  
> **Estado**: PASO 1 - Estructura de Alto Nivel

---

## 📊 Estructura de Alto Nivel

### Fase 0: Setup e Infraestructura
**Duración estimada**: 1 semana  
**Objetivo**: Proyecto desplegado con "Hello World" full stack

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 0.1 | Inicializar monorepo con workspaces | 🔴 Alta |
| 0.2 | Configurar Frontend (Vite + React + shadcn) | 🔴 Alta |
| 0.3 | Configurar Backend (Express + Prisma) | 🔴 Alta |
| 0.4 | Docker Compose (PostgreSQL + MinIO) | 🔴 Alta |
| 0.5 | ESLint + Prettier + Husky | 🟡 Media |
| 0.6 | Deploy inicial en VPS (Dokploy) | 🔴 Alta |
| 0.7 | CI/CD básico (GitHub Actions) | 🟡 Media |

---

### Fase 1: Seguridad + Maestros Base
**Duración estimada**: 2-3 semanas  
**Objetivo**: Login funcional + CRUD de datos básicos

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 1.1 | Modelo de datos (User, Role, Permission) | 🔴 Alta |
| 1.2 | Autenticación JWT + Refresh Tokens | 🔴 Alta |
| 1.3 | Middleware de autorización (RBAC) | 🔴 Alta |
| 1.4 | CRUD Usuarios (admin only) | 🔴 Alta |
| 1.5 | Layout base responsive (Sidebar + Header) | 🔴 Alta |
| 1.6 | Theme toggle (Light/Dark) | 🟡 Media |
| 1.7 | CRUD Clientes | 🔴 Alta |
| 1.8 | CRUD Sucursales | 🔴 Alta |
| 1.9 | CRUD Zonas | 🟡 Media |
| 1.10 | CRUD Vehículos | 🟢 Baja |

---

### Fase 2: Materiales y Costeo
**Duración estimada**: 2 semanas  
**Objetivo**: Catálogo de materiales con historial de precios

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 2.1 | Modelo de datos (Material, PrecioMaterial) | 🔴 Alta |
| 2.2 | CRUD Materiales | 🔴 Alta |
| 2.3 | Historial de precios con log | 🔴 Alta |
| 2.4 | Importación masiva CSV | 🟡 Media |
| 2.5 | CRUD Cuentas Bancarias | 🟡 Media |
| 2.6 | Dashboard inicial (métricas básicas) | 🟢 Baja |

---

### Fase 3: Tickets
**Duración estimada**: 3-4 semanas  
**Objetivo**: Flujo completo de ticket de servicio

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 3.1 | Modelo de datos (Ticket, Estado, Trabajo) | 🔴 Alta |
| 3.2 | Crear ticket (cliente + sucursal) | 🔴 Alta |
| 3.3 | Prioridades y asignación de técnico | 🔴 Alta |
| 3.4 | Cambio de estados con log | 🔴 Alta |
| 3.5 | Registro de trabajos realizados | 🔴 Alta |
| 3.6 | Subida de imágenes (MinIO) | 🟡 Media |
| 3.7 | Filtros y búsqueda avanzada | 🟡 Media |
| 3.8 | Vista mobile para técnicos | 🟡 Media |

---

### Fase 4: Obras y Presupuestos
**Duración estimada**: 3-4 semanas  
**Objetivo**: Presupuesto descargable en PDF

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 4.1 | Modelo de datos (Obra, PresupuestoItem) | 🔴 Alta |
| 4.2 | Crear obra (desde ticket o independiente) | 🔴 Alta |
| 4.3 | Agregar materiales al presupuesto | 🔴 Alta |
| 4.4 | Calcular totales con precios vigentes | 🔴 Alta |
| 4.5 | Generación de PDF | 🔴 Alta |
| 4.6 | Estados de obra | 🟡 Media |
| 4.7 | Derivar ticket a obra | 🟡 Media |

---

### Fase 5: Finanzas Básico
**Duración estimada**: 3-4 semanas  
**Objetivo**: Control de gastos por obra

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 5.1 | Modelo de datos (Gasto, TipoGasto, Movimiento) | 🔴 Alta |
| 5.2 | Registrar gastos (asociar a ticket/obra) | 🔴 Alta |
| 5.3 | Ver gastos por obra | 🔴 Alta |
| 5.4 | Calcular contribución (presupuesto vs gastos) | 🔴 Alta |
| 5.5 | Ingresos y egresos corrientes | 🟡 Media |
| 5.6 | Saldos de cuentas bancarias | 🟡 Media |

---

### Fase 6: Finanzas Avanzado
**Duración estimada**: 2-3 semanas  
**Objetivo**: Dashboard financiero completo

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 6.1 | Pagos de sueldos | 🟡 Media |
| 6.2 | Dashboard financiero | 🔴 Alta |
| 6.3 | Reportes exportables (Excel/PDF) | 🟡 Media |
| 6.4 | Alertas de límite de gastos | 🟡 Media |
| 6.5 | Rendición de gastos de empleados | 🟡 Media |

---

### Fase 7: Pulido y Go-Live
**Duración estimada**: 2 semanas  
**Objetivo**: Sistema en producción

| # | Tarea Principal | Criticidad |
|---|-----------------|------------|
| 7.1 | Testing end-to-end | 🔴 Alta |
| 7.2 | Optimización de performance | 🟡 Media |
| 7.3 | Backup automatizado | 🔴 Alta |
| 7.4 | Documentación de usuario | 🟡 Media |
| 7.5 | Capacitación | 🟡 Media |
| 7.6 | Go-live | 🔴 Alta |

---

## 📅 Timeline Resumen

| Fase | Semanas | Acumulado |
|------|---------|-----------|
| 0 - Setup | 1 | 1 |
| 1 - Seguridad + Maestros | 2-3 | 4 |
| 2 - Materiales | 2 | 6 |
| 3 - Tickets | 3-4 | 10 |
| 4 - Obras | 3-4 | 14 |
| 5 - Finanzas Básico | 3-4 | 18 |
| 6 - Finanzas Avanzado | 2-3 | 21 |
| 7 - Go-Live | 2 | **23** |

**Total estimado**: ~5-6 meses

---

## ⏭️ Siguiente Paso

Una vez validada esta estructura, procederemos con el **Desglose Detallado de la Fase 0** que incluirá:
- Subtareas anidadas
- Definición de "Hecho" (DoD)
- Métricas de éxito
- Riesgos asociados
- Puntos de control

---

# 🔧 FASE 0: Setup e Infraestructura - DESGLOSE DETALLADO

> **Duración**: 1 semana  
> **Objetivo**: Proyecto desplegado con "Hello World" full stack  
> **Criterio de éxito global**: App accesible en URL de producción mostrando conexión frontend-backend-db

---

## 0.1 Inicializar Monorepo con Workspaces

### Subtareas

| # | Subtarea | Tiempo est. |
|---|----------|-------------|
| 0.1.1 | Crear estructura de carpetas (apps/, packages/) | 10 min |
| 0.1.2 | Configurar `package.json` root con workspaces | 15 min |
| 0.1.3 | Crear `.gitignore` completo | 5 min |
| 0.1.4 | Crear `.env.example` | 10 min |
| 0.1.5 | Configurar scripts root (`dev`, `build`, `lint`) | 15 min |

### Definición de "Hecho" (DoD)
- [ ] Estructura de carpetas creada: `apps/web`, `apps/api`, `packages/shared`
- [ ] `npm install` en root instala dependencias de todos los workspaces
- [ ] `npm run dev` levanta frontend y backend simultáneamente

### Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
| Comando `npm install` exitoso | 100% |
| Workspaces detectados correctamente | 3/3 |

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Conflictos de versiones npm | Baja | Usar `engines` en package.json |
| Path aliases no funcionan | Media | Configurar `tsconfig.json` paths correctamente |

---

## 0.2 Configurar Frontend (Vite + React + shadcn)

### Subtareas

| # | Subtarea | Tiempo est. |
|---|----------|-------------|
| 0.2.1 | Crear proyecto Vite con template React-TS | 5 min |
| 0.2.2 | Configurar Tailwind CSS | 15 min |
| 0.2.3 | Inicializar shadcn/ui (base zinc, dark mode) | 10 min |
| 0.2.4 | Instalar componentes base (Button, Input, Card) | 10 min |
| 0.2.5 | Configurar React Router v7 | 15 min |
| 0.2.6 | Crear página de prueba "Hello Frontend" | 10 min |
| 0.2.7 | Configurar proxy a backend en vite.config.ts | 10 min |

### Definición de "Hecho" (DoD)
- [ ] `npm run dev` levanta frontend en localhost:5173
- [ ] shadcn/ui funciona con theme zinc
- [ ] Toggle dark/light mode funcional
- [ ] React Router navegando entre 2 páginas

### Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
| Build sin errores TypeScript | 0 errores |
| Lighthouse Performance (dev) | > 90 |
| Componente shadcn renderiza | ✅ |

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Conflicto Tailwind + shadcn | Baja | Seguir docs oficiales de shadcn |
| CSS no aplica correctamente | Media | Verificar orden de imports en index.css |

---

## 0.3 Configurar Backend (Express + Prisma)

### Subtareas

| # | Subtarea | Tiempo est. |
|---|----------|-------------|
| 0.3.1 | Inicializar proyecto Node con TypeScript | 10 min |
| 0.3.2 | Configurar Express 5 con estructura base | 20 min |
| 0.3.3 | Configurar Prisma con PostgreSQL | 15 min |
| 0.3.4 | Crear schema.prisma inicial (User básico) | 15 min |
| 0.3.5 | Configurar middleware de errores | 20 min |
| 0.3.6 | Crear endpoint `/api/health` | 10 min |
| 0.3.7 | Configurar variables de entorno (dotenv) | 10 min |
| 0.3.8 | Configurar CORS | 10 min |

### Definición de "Hecho" (DoD)
- [ ] `npm run dev` levanta backend en localhost:3001
- [ ] GET `/api/health` retorna `{ status: "ok", db: "connected" }`
- [ ] Prisma conecta a PostgreSQL y crea tabla User
- [ ] Errores retornan JSON estructurado

### Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
| Endpoint /health responde | < 100ms |
| Conexión a DB exitosa | ✅ |
| TypeScript compila | 0 errores |

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Prisma no conecta a Docker DB | Media | Verificar DATABASE_URL y network |
| Express 5 no disponible | Baja | Usar Express 4 como fallback |

---

## 0.4 Docker Compose (PostgreSQL + MinIO)

### Subtareas

| # | Subtarea | Tiempo est. |
|---|----------|-------------|
| 0.4.1 | Crear docker-compose.yml con postgres y minio | 20 min |
| 0.4.2 | Configurar volúmenes persistentes | 10 min |
| 0.4.3 | Configurar networks | 10 min |
| 0.4.4 | Crear Dockerfile.api | 30 min |
| 0.4.5 | Crear Dockerfile.web | 20 min |
| 0.4.6 | Probar `docker-compose up` local | 15 min |

### Definición de "Hecho" (DoD)
- [ ] `docker-compose up -d` levanta postgres, minio sin errores
- [ ] PostgreSQL accesible en localhost:5432
- [ ] MinIO accesible en localhost:9000
- [ ] Datos persisten entre reinicios

### Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
| Contenedores healthy | 2/2 |
| DB data persiste | ✅ |
| Tiempo de startup | < 30s |

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Puertos en uso | Media | Documentar puertos alternativos |
| Permisos de volúmenes (Windows) | Media | Usar named volumes |

---

## 0.5 ESLint + Prettier + Husky

### Subtareas

| # | Subtarea | Tiempo est. |
|---|----------|-------------|
| 0.5.1 | Configurar ESLint en root | 20 min |
| 0.5.2 | Configurar Prettier | 10 min |
| 0.5.3 | Agregar reglas de TypeScript strict | 15 min |
| 0.5.4 | Configurar Husky + lint-staged | 20 min |
| 0.5.5 | Probar pre-commit hook | 10 min |

### Definición de "Hecho" (DoD)
- [ ] `npm run lint` ejecuta sin errores
- [ ] `npm run format` formatea código
- [ ] Pre-commit hook bloquea commits con errores

### Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
| Lint errors en código actual | 0 |
| Pre-commit ejecuta correctamente | ✅ |

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Reglas muy estrictas | Media | Ajustar reglas incrementalmente |
| Husky no funciona en Windows | Baja | Usar lefthook como alternativa |

---

## 0.6 Deploy Inicial (Dokploy)

### Subtareas

| # | Subtarea | Tiempo est. |
|---|----------|-------------|
| 0.6.1 | VPS configurado con Docker | (prerrequisito) |
| 0.6.2 | Instalar Dokploy en VPS | 30 min |
| 0.6.3 | Configurar proyecto en Dokploy | 20 min |
| 0.6.4 | Configurar dominio/subdomain | 15 min |
| 0.6.5 | Deploy de containers | 30 min |
| 0.6.6 | Verificar HTTPS funcional | 10 min |

### Definición de "Hecho" (DoD)
- [ ] App accesible en https://app.tudominio.com
- [ ] SSL funcionando (Let's Encrypt)
- [ ] Frontend muestra "Hello Frontend"
- [ ] Backend responde en /api/health

### Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
| Deploy exitoso | ✅ |
| TTFB (Time to First Byte) | < 500ms |
| SSL válido | ✅ |

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| VPS sin recursos suficientes | Baja | Monitorear RAM/CPU |
| DNS no propaga | Media | Usar TTL bajo inicialmente |
| Dokploy no compatible | Baja | Usar docker-compose directo |

---

## 0.7 CI/CD Básico (GitHub Actions)

### Subtareas

| # | Subtarea | Tiempo est. |
|---|----------|-------------|
| 0.7.1 | Crear workflow `.github/workflows/ci.yml` | 20 min |
| 0.7.2 | Job: lint on push | 15 min |
| 0.7.3 | Job: build on push | 15 min |
| 0.7.4 | Job: deploy on push to main | 30 min |
| 0.7.5 | Configurar secrets (SSH, env vars) | 15 min |

### Definición de "Hecho" (DoD)
- [ ] Push a `uat` ejecuta lint + build
- [ ] Push a `main` ejecuta lint + build + deploy
- [ ] Badge de status en README

### Métricas de Éxito
| Métrica | Objetivo |
|---------|----------|
| CI pasa en código actual | ✅ |
| Tiempo de CI | < 5 min |
| Deploy automático funciona | ✅ |

### Riesgos
| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Secrets expuestos | Baja | Usar GitHub Secrets |
| Deploy falla silenciosamente | Media | Agregar notificaciones |

---

## ✅ Puntos de Control - Fase 0

Antes de avanzar a Fase 1, verificar:

| # | Checkpoint | Verificación |
|---|------------|--------------|
| 1 | Monorepo funcional | `npm install && npm run dev` exitoso |
| 2 | Frontend renderiza | Página visible en localhost:5173 |
| 3 | Backend responde | GET /api/health retorna OK |
| 4 | DB conectada | Prisma migrate exitoso |
| 5 | Docker funciona | `docker-compose up` sin errores |
| 6 | Deploy exitoso | App en URL de producción |
| 7 | CI/CD funciona | Push dispara pipeline |

### Criterio de Avance
**Mínimo para avanzar**: Checkpoints 1-5 completados (local funciona)  
**Ideal**: Todos los checkpoints completados

---

## 📊 Resumen Fase 0

| Aspecto | Valor |
|---------|-------|
| **Tareas principales** | 7 |
| **Subtareas totales** | 38 |
| **Tiempo estimado** | 1 semana |
| **Riesgos identificados** | 12 |
| **Checkpoints** | 7 |

---

## ⏭️ Próximo Bloque

Una vez completada la Fase 0, procederemos con el **Desglose Detallado de la Fase 1: Seguridad + Maestros Base**.
