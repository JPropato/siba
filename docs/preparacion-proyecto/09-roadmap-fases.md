# Sistema Bauman - Roadmap y Fases de Desarrollo

> **Versión**: 1.0  
> **Fecha**: 2026-01-17

---

## 📋 Visión General del Sistema

Sistema de gestión para empresa de construcción, obras y mantenimiento que permite:
- Gestionar clientes y sus sedes/sucursales
- Recibir y administrar tickets de servicio técnico
- Presupuestar y gestionar obras
- Controlar finanzas (gastos, ingresos, contribuciones por obra)

---

## 🎯 Módulos del Sistema

### 1. Seguridad (Usuarios y Permisos)
- Alta/baja/modificación de usuarios
- Restablecimiento de contraseñas
- Roles y permisos granulares
- Estado activo/inactivo de usuarios
- Auditoría de accesos

### 2. Maestros
| Entidad | Relación | Notas |
|---------|----------|-------|
| **Clientes** | Independiente | Datos básicos, CUIT, contacto |
| **Sucursales/Sedes** | → Cliente | Dirección, zona, contacto |
| **Zonas** | ← Sucursales | Agrupación geográfica |
| **Vehículos** | → Zona | Patente, tipo, asignación |
| **Materiales** | Independiente | Código propio, descripción |
| **Precios Materiales** | → Material | Historial de costos con log |
| **Cuentas Bancarias** | Independiente | Para finanzas |

### 3. Tickets
- Solicitud de servicio técnico
- Asociado a Cliente + Sucursal
- Prioridades (baja, media, alta, urgente)
- Estados (abierto, en progreso, pendiente, resuelto, cancelado)
- Asignación a técnico
- Registro de trabajos realizados
- Generación de órdenes de trabajo
- Asociación de gastos
- Puede derivar en Obra/Presupuesto

### 4. Obras / Presupuestos
- Puede originarse de un Ticket o ser independiente
- Asociada a Cliente + Sucursal
- Presupuesto con materiales y precios vigentes
- Generación de PDF de presupuesto
- Estados (borrador, enviado, aprobado, en ejecución, finalizado, rechazado)
- Control de gastos asociados
- Límite de gastos / contribución

### 5. Finanzas
- Gastos asociados a Tickets u Obras
- Egresos e ingresos corrientes
- Pagos de sueldos
- Saldos de cuentas bancarias
- Tipos de gastos / categorías
- Reportes de contribución por obra

---

## 📅 Fases de Desarrollo

### Fase 0: Setup (1 semana)
**Objetivo**: Proyecto funcionando con deploy básico

- [ ] Inicializar monorepo (apps/web + apps/api)
- [ ] Configurar Vite + React + shadcn/ui
- [ ] Configurar Express + Prisma
- [ ] Docker Compose (postgres, minio)
- [ ] ESLint + Prettier + Husky
- [ ] Deploy inicial en VPS con Dokploy
- [ ] CI/CD básico (GitHub Actions)

**Entregable**: App vacía desplegada, "Hello World" full stack

---

### Fase 1: Seguridad + Maestros Base (2-3 semanas)
**Objetivo**: Login funcional + datos básicos

#### Seguridad
- [ ] Modelo de datos: User, Role, Permission
- [ ] Login / Logout con JWT
- [ ] Middleware de autenticación
- [ ] CRUD de usuarios (solo admin)
- [ ] Asignación de roles
- [ ] Layout base con Sidebar responsive

#### Maestros (solo estructura)
- [ ] CRUD Clientes
- [ ] CRUD Sucursales (con relación a cliente)
- [ ] CRUD Zonas
- [ ] CRUD Vehículos

**Entregable**: Admin puede crear usuarios, roles, clientes, sucursales

---

### Fase 2: Maestros Completos + Materiales (2 semanas)
**Objetivo**: Catálogo de materiales con costeo

- [ ] CRUD Materiales (código propio, descripción)
- [ ] Historial de precios de materiales
- [ ] Importación masiva de materiales (CSV)
- [ ] CRUD Cuentas Bancarias
- [ ] Dashboard inicial (métricas básicas)

**Entregable**: Sistema de inventario/materiales funcionando

---

### Fase 3: Tickets (3-4 semanas)
**Objetivo**: Gestión completa de tickets de servicio

- [ ] Modelo de datos: Ticket, TicketEstado, TrabajoRealizado
- [ ] Crear ticket (asociado a cliente/sucursal)
- [ ] Asignar prioridad y técnico
- [ ] Cambio de estados con log
- [ ] Registro de trabajos realizados
- [ ] Subida de imágenes
- [ ] Notificaciones (opcional: email)
- [ ] Filtros y búsqueda avanzada
- [ ] Vista mobile para técnicos

**Entregable**: Flujo completo de ticket desde creación hasta cierre

---

### Fase 4: Obras y Presupuestos (3-4 semanas)
**Objetivo**: Presupuestar obras con materiales

- [ ] Modelo de datos: Obra, PresupuestoItem, ObraEstado
- [ ] Crear obra (desde ticket o independiente)
- [ ] Agregar materiales al presupuesto
- [ ] Calcular totales con precios vigentes
- [ ] Generación de PDF de presupuesto
- [ ] Estados de obra
- [ ] Derivar ticket a obra

**Entregable**: Presupuesto descargable en PDF

---

### Fase 5: Finanzas Básico (3-4 semanas)
**Objetivo**: Control de gastos y contribuciones

- [ ] Modelo de datos: Gasto, TipoGasto, Movimiento
- [ ] Registrar gastos (asociar a ticket/obra opcional)
- [ ] Ver gastos por obra
- [ ] Calcular contribución (presupuesto vs gastos)
- [ ] Ingresos y egresos corrientes
- [ ] Saldos de cuentas bancarias
- [ ] Tipos/categorías de gastos

**Entregable**: Ver cuánto se gastó en cada obra

---

### Fase 6: Finanzas Avanzado (2-3 semanas)
**Objetivo**: Reportes y control completo

- [ ] Pagos de sueldos
- [ ] Dashboard financiero
- [ ] Reportes exportables (Excel/PDF)
- [ ] Alertas de límite de gastos
- [ ] Rendición de gastos de empleados
- [ ] Gráficos de tendencia

**Entregable**: Dashboard financiero completo

---

### Fase 7: Pulido + Producción (2 semanas)
**Objetivo**: Sistema listo para uso real

- [ ] Testing end-to-end
- [ ] Optimización de performance
- [ ] Backup automatizado
- [ ] Documentación de usuario
- [ ] Capacitación
- [ ] Go-live

**Entregable**: Sistema en producción

---

## 📊 Resumen de Tiempos

| Fase | Duración Estimada | Acumulado |
|------|-------------------|-----------|
| Fase 0: Setup | 1 semana | 1 semana |
| Fase 1: Seguridad + Maestros | 2-3 semanas | 4 semanas |
| Fase 2: Materiales | 2 semanas | 6 semanas |
| Fase 3: Tickets | 3-4 semanas | 10 semanas |
| Fase 4: Obras | 3-4 semanas | 14 semanas |
| Fase 5: Finanzas Básico | 3-4 semanas | 18 semanas |
| Fase 6: Finanzas Avanzado | 2-3 semanas | 21 semanas |
| Fase 7: Pulido | 2 semanas | **~23 semanas** |

**Tiempo total estimado: 5-6 meses** (trabajando solo)

---

## 🔄 Enfoque Iterativo

> Las estimaciones son aproximadas. Durante el desarrollo de cada fase iremos:
> - Refinando el modelo de datos
> - Ajustando funcionalidades según feedback
> - Priorizando lo más urgente para el negocio

---

## ⚠️ Notas Importantes

1. **Finanzas es crítico** pero depende de tener gastos asociados a tickets/obras
2. **Tickets y Obras están muy relacionados** (ticket puede derivar a obra)
3. **Los materiales son base** para presupuestar obras
4. **MVP usable**: Después de Fase 3 ya hay valor de negocio
