# Plan de Implementación: Módulo de Obras y Presupuestos (Fase 4)

Este módulo gestiona obras mayores (derivadas de Tickets/OT) y servicios menores, permitiendo la creación, versionado y envío de presupuestos en PDF, así como el seguimiento de la ejecución.

---

## 🏗️ Objetivos de Negocio

1.  **Centralizar la gestión de Obras**: Unificar obras del Correo Argentino y trabajos particulares.
2.  **Presupuestos Profesionales**: Generar PDFs con membrete, ítems detallados y versiones.
3.  **Control de Estados**: Flujo estricto desde Borrador hasta Facturado para evitar ediciones no autorizadas.
4.  **Historial y Versiones**: Permitir negociación con el cliente manteniendo registro de todos los cambios.

---

## 💾 Schema Database (Prisma)

### 1. Enums

```prisma
enum TipoObra {
  OBRA_MAYOR      // Derivada de Ticket/OT (ej: Correo Argentino)
  SERVICIO_MENOR  // Trabajo particular directo
}

enum EstadoObra {
  BORRADOR        // Edición libre
  PRESUPUESTADO   // PDF generado, espera respuesta
  APROBADO        // Cliente aceptó
  RECHAZADO       // Cliente rechazó (permite reabrir)
  EN_EJECUCION    // Trabajo en curso
  FINALIZADO      // Trabajo terminado
  FACTURADO       // Ciclo cerrado
}

enum TipoItemPresupuesto {
  MATERIAL        // Del catálogo
  MANO_DE_OBRA    // Horas hombre
  TERCERO         // Subcontratista
  OTRO            // Adicionales
}
```

### 2. Modelos

**Modelo `Obra`**: Cabecera principal.

- Relaciones: Cliente, Sucursal, Ticket (opcional), OT (opcional), Archivos.
- Campos financieros: `montoEstimado` (costo), `montoFinal` (real).

**Modelo `VersionPresupuesto`**: Snapshots del presupuesto.

- Campos: `version` (1, 2...), `esVigente`, `subtotal`, `iva`, `total`.
- Relación: `items` (ItemPresupuesto), `archivo` (PDF generado).

**Modelo `ItemPresupuesto`**: Líneas del detalle.

- Campos: `descripcion`, `cantidad`, `unidad`, `costoUnitario` (interno), `precioUnitario` (venta).
- Relación: `material` (opcional).

---

## 🎨 Frontend Architecture (Drawer UI)

Implementar un **Drawer Full-Width** para la gestión de la obra, dividido en Tabs para organizar la información sin saturar.

### 📍 ObrasPage

- Tabla listado con filtros (Estado, Cliente, Tipo).
- Badges de estado con colores semánticos.
- Botón "Nueva Obra".

### 🗄️ ObraDrawer (Componente Principal)

Cabecera: Título, Cliente/Sucursal, Estado, Acciones Globales (Cerrar).

#### Tabs:

1.  **📋 Datos Generales**
    - Formulario de información básica.
    - Fechas (Solicitud, Inicio, Fin).
    - Origen (Link al Ticket/OT).
    - Condiciones de pago y validez.

2.  **💰 Presupuesto (Core)**
    - Selector de versiones (Historial).
    - **Tabla de Ítems** (Editable si está en BORRADOR):
      - Agregar Material (buscador catálogo) / Mano de Obra / Otro.
      - Cálculos automáticos de subtotal/total.
    - **Acciones**:
      - "Generar PDF" (Pasa a PRESUPUESTADO).
      - "Crear Nueva Versión" (Si ya está presupuestado).
      - "Enviar por Email" (Mock por ahora).

3.  **📊 Gastos (MVP Mock)**
    - (Previsto para módulo de Gastos futuro).
    - Mostrar resumen mockeado de "Gastos vs Presupuesto".

4.  **📎 Archivos**
    - Lista de adjuntos (Planos, fotos antes/después).
    - PDFs de presupuestos generados automáticos.

---

## 🚀 Backend Implementation

### Routes & Controllers

- `obras.routes.ts`: CRUD Obra, cambio de estados.
- `presupuestos.routes.ts`: Gestión de items y versiones.
- `pdf.service.ts`: Generación de PDF (usando `pdfmake` o `@react-pdf/renderer` en backend/frontend).

### Reglas de Negocio

- **Bloqueo de Edición**: No se pueden editar items si el estado es `PRESUPUESTADO` o posterior.
- **Versionado**: Al editar un presupuesto enviado, se fuerza la creación de una nueva versión `BORRADOR`.
- **Transiciones**:
  - `Generar PDF` -> Cambia a `PRESUPUESTADO`.
  - `Aprobar` -> Cambia a `APROBADO`.
  - `Rechazar` -> Cambia a `RECHAZADO`.

---

## 📅 Roadmap Detallado

### Fase 4.1: Base de Datos y API

- [ ] Definir Schema Prisma y migración.
- [ ] Servicios y Controladores para `Obra` y `VersionPresupuesto`.
- [ ] Endpoints de listado y creación.

### Fase 4.2: Frontend - Gestión Básica

- [ ] `ObrasPage` (Listado).
- [ ] `ObraDrawer` con Tab de Datos Generales.
- [ ] Conexión "Generar Obra" desde OT (Ticket).

### Fase 4.3: Presupuestador

- [ ] Tab de Presupuesto con tabla de items editable.
- [ ] Lógica de versiones y cálculos de totales.
- [ ] Generación de PDF (Diseño con membrete).

### Fase 4.4: Flujo y Estados

- [ ] Implementar transiciones de estado.
- [ ] Validaciones de edición según estado.
- [ ] Visualización de archivos en Tab Archivos.
