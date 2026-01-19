# Plan de Implementación: Módulo de Obras y Presupuestos (Fase 4)

Este módulo gestiona obras mayores (derivadas de Tickets/OT) y servicios menores, permitiendo la creación, versionado y envío de presupuestos en PDF, así como el seguimiento de la ejecución.

---

## 🏗️ Objetivos de Negocio

1. **Centralizar la gestión de Obras**: Unificar obras del Correo Argentino y trabajos particulares.
2. **Presupuestos Profesionales**: Generar PDFs con membrete, ítems detallados y versiones.
3. **Control de Estados**: Flujo estricto desde Borrador hasta Facturado para evitar ediciones no autorizadas.
4. **Historial y Versiones**: Permitir negociación con el cliente manteniendo registro de todos los cambios.
5. **Integración con Finanzas**: Vincular gastos de obra con movimientos financieros.

---

## 💾 Schema Database (Prisma)

### 1. Enums

```prisma
enum TipoObra {
  OBRA_MAYOR      // Derivada de Ticket/OT (ej: Correo Argentino)
  SERVICIO_MENOR  // Trabajo particular (puede o no tener presupuesto)
}

enum EstadoObra {
  BORRADOR        // Edición libre
  PRESUPUESTADO   // PDF generado, espera respuesta
  APROBADO        // Cliente aceptó
  RECHAZADO       // Cliente rechazó (permite reabrir)
  EN_EJECUCION    // Trabajo en curso
  FINALIZADO      // Trabajo terminado
  FACTURADO       // Ciclo cerrado (factura externa en AFIP)
}

enum TipoItemPresupuesto {
  MATERIAL        // Del catálogo
  MANO_DE_OBRA    // Horas hombre
  TERCERO         // Subcontratista
  OTRO            // Adicionales
}

enum ModoEjecucion {
  CON_PRESUPUESTO   // Flujo completo: presupuesto -> aprobación -> ejecución
  EJECUCION_DIRECTA // Sin presupuesto previo (servicios menores urgentes)
}
```

### 2. Modelo Obra

```prisma
model Obra {
  id                Int           @id @default(autoincrement())
  codigo            String        @unique  // OBR-00001
  tipo              TipoObra
  modoEjecucion     ModoEjecucion @default(CON_PRESUPUESTO) @map("modo_ejecucion")
  estado            EstadoObra    @default(BORRADOR)
  
  // Descripción
  titulo            String
  descripcion       String?       @db.Text
  
  // Fechas
  fechaSolicitud    DateTime      @map("fecha_solicitud")
  fechaInicioEstimada DateTime?   @map("fecha_inicio_estimada")
  fechaFinEstimada  DateTime?     @map("fecha_fin_estimada")
  fechaInicioReal   DateTime?     @map("fecha_inicio_real")
  fechaFinReal      DateTime?     @map("fecha_fin_real")
  
  // Relaciones contextuales
  clienteId         Int           @map("cliente_id")
  sucursalId        Int?          @map("sucursal_id")
  ticketId          Int?          @unique @map("ticket_id")  // Si viene de un ticket
  
  // Montos consolidados (calculados desde versión vigente + gastos)
  montoPresupuestado Decimal      @default(0) @map("monto_presupuestado") @db.Decimal(12, 2)
  montoGastado      Decimal       @default(0) @map("monto_gastado") @db.Decimal(12, 2)
  
  // Condiciones comerciales (TBD: IVA, descuentos)
  condicionesPago   String?       @map("condiciones_pago")
  validezDias       Int?          @default(30) @map("validez_dias")
  
  // Factura externa
  numeroFactura     String?       @map("numero_factura")  // Ej: FC-A-0001-00012345
  fechaFacturacion  DateTime?     @map("fecha_facturacion")
  
  // Auditoría
  creadoPorId       Int           @map("creado_por_id")
  fechaCreacion     DateTime      @default(now()) @map("fecha_creacion")
  fechaActualizacion DateTime     @updatedAt @map("fecha_actualizacion")
  
  // Relations
  cliente           Cliente       @relation(fields: [clienteId], references: [id])
  sucursal          Sucursal?     @relation(fields: [sucursalId], references: [id])
  ticket            Ticket?       @relation(fields: [ticketId], references: [id])
  
  versiones         VersionPresupuesto[]
  archivos          ArchivoObra[]
  
  @@index([clienteId])
  @@index([estado])
  @@index([fechaSolicitud])
  @@map("obras")
}
```

### 3. Modelo VersionPresupuesto

```prisma
model VersionPresupuesto {
  id              Int       @id @default(autoincrement())
  obraId          Int       @map("obra_id")
  version         Int       @default(1)  // 1, 2, 3...
  esVigente       Boolean   @default(true) @map("es_vigente")  // Solo una activa
  
  // Totales
  subtotal        Decimal   @default(0) @db.Decimal(12, 2)
  // TBD: IVA, descuentos
  total           Decimal   @default(0) @db.Decimal(12, 2)
  
  // Notas de esta versión
  notas           String?   @db.Text
  
  // PDF generado
  archivoPdfId    Int?      @map("archivo_pdf_id")
  
  fechaCreacion   DateTime  @default(now()) @map("fecha_creacion")
  
  obra            Obra      @relation(fields: [obraId], references: [id], onDelete: Cascade)
  items           ItemPresupuesto[]
  
  @@unique([obraId, version])
  @@map("versiones_presupuesto")
}
```

### 4. Modelo ItemPresupuesto

```prisma
model ItemPresupuesto {
  id                Int       @id @default(autoincrement())
  versionId         Int       @map("version_id")
  tipo              TipoItemPresupuesto
  orden             Int       @default(0)
  
  // Descripción
  descripcion       String
  
  // Cantidades
  cantidad          Decimal   @db.Decimal(10, 2)
  unidad            String    // "hs", "u", "m2", "ml", etc.
  
  // Precios
  costoUnitario     Decimal   @map("costo_unitario") @db.Decimal(12, 2)  // Costo interno
  precioUnitario    Decimal   @map("precio_unitario") @db.Decimal(12, 2) // Precio venta
  subtotal          Decimal   @db.Decimal(12, 2)  // cantidad * precioUnitario
  
  // Referencia a material del catálogo (opcional)
  materialId        Int?      @map("material_id")
  
  version           VersionPresupuesto @relation(fields: [versionId], references: [id], onDelete: Cascade)
  
  @@index([versionId])
  @@map("items_presupuesto")
}
```

### 5. Modelo ArchivoObra

```prisma
model ArchivoObra {
  id              Int       @id @default(autoincrement())
  obraId          Int       @map("obra_id")
  
  tipoArchivo     String    @map("tipo_archivo")  // "PLANO", "FOTO_ANTES", "FOTO_DESPUES", "PRESUPUESTO_PDF", "OTRO"
  nombreOriginal  String    @map("nombre_original")
  nombreStorage   String    @unique @map("nombre_storage")
  mimeType        String    @map("mime_type")
  tamanio         Int       // bytes
  url             String?
  
  fechaCreacion   DateTime  @default(now()) @map("fecha_creacion")
  
  obra            Obra      @relation(fields: [obraId], references: [id], onDelete: Cascade)
  
  @@map("archivos_obra")
}
```

---

## 🔗 Integración con Módulo Finanzas (Plan 14)

Los gastos de una obra pueden cargarse de **dos formas**:

### Opción A: Desde Finanzas
Al crear un movimiento de egreso en `/finanzas/movimientos`, se puede vincular a una obra usando el campo `obraId`.

### Opción B: Desde la Obra
En el Tab "Gastos" del `ObraDrawer`, botón "Registrar Gasto" que abre un form simplificado y crea el movimiento automáticamente con el `obraId` ya seteado.

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Gastos de Obra #OBR-00045                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Presupuestado: $150,000    Gastado: $85,000    Δ: $65,000 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[57%]━━━━━━━━━━━             │
│                                                             │
│  ┌────────────┬───────────────┬──────────┬─────────────┐   │
│  │ Fecha      │ Descripción   │ Categoría│ Monto       │   │
│  ├────────────┼───────────────┼──────────┼─────────────┤   │
│  │ 15/01/2026 │ Compra cables │ Material │ $25,000     │   │
│  │ 16/01/2026 │ Jornales      │ M.Obra   │ $40,000     │   │
│  │ 17/01/2026 │ Electricista  │ Tercero  │ $20,000     │   │
│  └────────────┴───────────────┴──────────┴─────────────┘   │
│                                                             │
│                              [+ Registrar Gasto]            │
└─────────────────────────────────────────────────────────────┘
```

### Query para gastos de una obra
```typescript
const gastosObra = await prisma.movimiento.findMany({
  where: { obraId: obraId, tipo: 'EGRESO', estado: { not: 'ANULADO' } },
  orderBy: { fechaMovimiento: 'desc' }
});
```

---

## 🎨 Frontend Architecture (Drawer UI)

### 📍 ObrasPage

- Tabla listado con filtros (Estado, Cliente, Tipo).
- Badges de estado con colores semánticos.
- Toggle "Con Presupuesto / Ejecución Directa".
- Botón "Nueva Obra".

### 🗄️ ObraDrawer (Componente Principal)

Cabecera: Código, Título, Cliente/Sucursal, Estado, Acciones Globales.

#### Tabs:

1. **📋 Datos Generales**
   - Tipo de obra (Mayor / Servicio Menor)
   - Modo de ejecución (Con Presupuesto / Directo)
   - Fechas (Solicitud, Inicio estimado/real, Fin estimado/real)
   - Origen (Link al Ticket si existe)
   - Condiciones de pago y validez

2. **💰 Presupuesto** (Solo si `modoEjecucion = CON_PRESUPUESTO`)
   - Selector de versiones (Historial)
   - Tabla de ítems editable (si BORRADOR)
   - Acciones: "Generar PDF", "Nueva Versión", "Enviar Email (mock)"

3. **📊 Gastos** (Integrado con Finanzas)
   - Barra de progreso Presupuesto vs Gastado
   - Lista de movimientos vinculados a la obra
   - Botón "Registrar Gasto" → crea movimiento en Finanzas

4. **📎 Archivos**
   - Categorías: Planos, Fotos Antes, Fotos Después, PDFs
   - Upload drag & drop
   - Preview de imágenes/PDFs

---

## 🚀 Backend Implementation

### API Endpoints

```typescript
// === OBRAS ===
GET    /api/obras                     // Listar con filtros y paginación
POST   /api/obras                     // Crear obra
GET    /api/obras/:id                 // Detalle con versiones y gastos
PUT    /api/obras/:id                 // Actualizar datos generales
POST   /api/obras/:id/cambiar-estado  // Transición de estado

// === PRESUPUESTOS ===
GET    /api/obras/:id/presupuesto           // Versión vigente con items
POST   /api/obras/:id/presupuesto/items     // Agregar item
PUT    /api/obras/:id/presupuesto/items/:itemId  // Editar item
DELETE /api/obras/:id/presupuesto/items/:itemId  // Eliminar item
POST   /api/obras/:id/presupuesto/nueva-version  // Crear nueva versión
POST   /api/obras/:id/presupuesto/generar-pdf    // Genera PDF y cambia estado

// === GASTOS (proxy a Finanzas) ===
GET    /api/obras/:id/gastos          // Lista movimientos vinculados
POST   /api/obras/:id/gastos          // Crea movimiento con obraId pre-seteado

// === ARCHIVOS ===
GET    /api/obras/:id/archivos
POST   /api/obras/:id/archivos
DELETE /api/obras/:id/archivos/:archivoId
```

### Reglas de Negocio

- **Bloqueo de Edición**: Items no editables si estado >= PRESUPUESTADO
- **Versionado**: Editar presupuesto enviado → fuerza nueva versión BORRADOR
- **Facturación Externa**: Solo se registra número de factura AFIP, no se genera

### Transiciones de Estado

```
BORRADOR ──────────────────────────────────> EN_EJECUCION (si ejecución directa)
    │
    ▼
PRESUPUESTADO ──> RECHAZADO ──> BORRADOR (reabrir)
    │
    ▼
APROBADO ──> EN_EJECUCION ──> FINALIZADO ──> FACTURADO
```

---

## 📅 Roadmap Detallado

### Fase 4.1: Base de Datos y API Core

- [ ] Schema Prisma: `Obra`, `VersionPresupuesto`, `ItemPresupuesto`, `ArchivoObra`
- [ ] Migración
- [ ] CRUD Obras y endpoints básicos
- [ ] Seed con datos demo

### Fase 4.2: Frontend - Gestión Básica

- [ ] `ObrasPage` (Listado con filtros)
- [ ] `ObraDrawer` con Tab Datos Generales
- [ ] Conexión "Generar Obra" desde OT/Ticket

### Fase 4.3: Presupuestador

- [ ] Tab Presupuesto con tabla de items editable
- [ ] Lógica de versiones y cálculos automáticos
- [ ] Generación de PDF (con membrete)

### Fase 4.4: Integración Finanzas

- [ ] Tab Gastos con listado de movimientos
- [ ] Form "Registrar Gasto" → crea movimiento en Finanzas
- [ ] Cálculo de montoGastado consolidado

### Fase 4.5: Flujo y Estados

- [ ] Transiciones de estado con validaciones
- [ ] Bloqueos de edición según estado
- [ ] Registro de número factura AFIP

### Fase 4.6: Archivos

- [ ] Upload/Download de archivos por categoría
- [ ] Preview de imágenes y PDFs
- [ ] Almacenamiento en MinIO

---

## ⚠️ Pendientes a Confirmar

- [ ] **IVA y Descuentos**: ¿Se aplican? ¿Configurables por obra?
- [ ] **Múltiples sucursales por obra**: ¿Es posible?
- [ ] **Diseño del PDF**: Membrete, datos a incluir, formato

---

## 🔗 Dependencias

- **Plan 10**: Clientes y Sucursales
- **Plan 11**: Tickets (origen de obras mayores)
- **Plan 14**: Finanzas (gastos vinculados)
