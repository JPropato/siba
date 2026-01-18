# 📋 Plan Maestro de Implementación - SIBA

Este archivo es la fuente de verdad para el progreso del desarrollo. Se actualiza después de cada sesión o hito importante.

## 🛠️ Estado General
- **Fase Actual**: Fase 1 (Seguridad + Maestros)
- **Progreso Global**: ~30% (Setup + Auth + Users + Clients completados)

---

## 📅 Roadmap de Implementación

### [ ] BLOQUE 1: Módulos Maestros (Próximo)
*Objetivo: Tener la base de datos de la empresa cargada.*
- [x] **Clientes**
    - [x] API: CRUD con validación de CUIT
    - [x] UI: Listado con filtros y Skeleton Loaders
    - [x] UI: Formulario de creación/edición (Modal)
- [x] **Zonas**
    - [x] API/UI: CRUD con identificación unívoca (Código)
    - [x] UI: Mejor reporte de errores en formulario
- [x] **Sucursales** (Sedes)
    - [x] API: Relación Client -> Zona -> Sucursal (Integridad Referencial)
    - [x] UI: Gestión de sedes por cliente
- [x] **Vehículos** (Flota)
    - [x] API: CRUD con Código Interno y Patente Única
    - [x] UI: Gestión de flota con vinculación a Zonas (opcional)

### [x] BLOQUE 2: Catálogo y Materiales
*Objetivo: Gestión de insumos y precios.*
- [x] Maestro de Materiales
- [x] Historial de precios y costeo dinámico

### [ ] BLOQUE 3: Flujo de Operaciones (CORE)
- [ ] Gestión de Tickets (Service Desk)
- [ ] Registro de Trabajos Realizados
- [ ] Gestión de Obras y Presupuestos (PDF)

### [ ] BLOQUE 4: Finanzas y Control
- [ ] Registro de Gastos por Obra
- [ ] Reportes de Contribución Marinal
- [ ] Dashboard Financiero para Gerencia

---

## ✅ Historial de Logros
- [x] **Setup**: Monorepo, Docker, CI/CD, Prisma.
- [x] **Infraestructura**: Resolución de puerto 3003, motor binario de Prisma para Windows y sincronización de permisos.
- [x] **Seguridad**: JWT, Middleware, RBAC.
- [x] **Core UI**: Dashboard, Sidebar, Dark Mode.
- [x] **Hotfix**: Restauración de selector de temas corporativos.
- [x] **Usuarios**: Gestión completa de usuarios y roles.
- [x] **Clientes**: CRUD completo con validación de CUIT, paginación y diseño institucional.

---
> **Instrucción para Gemini**: Al finalizar una tarea, busca este archivo y actualiza los checkboxes correspondientes.
