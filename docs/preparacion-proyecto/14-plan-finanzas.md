# Plan de Implementación: Módulo de Finanzas (Fase 6)

**🎯 El módulo core del sistema.** Todo el flujo de Tickets → Obras → Presupuestos converge aquí para registrar el impacto financiero real.

---

## 💡 Filosofía del Módulo

> **"Cada peso que entra o sale debe tener contexto"**

No es solo un libro de caja. Cada movimiento responde: ¿De dónde vino? ¿A qué trabajo corresponde? ¿Qué tipo de gasto/ingreso es?

---

## 🎯 Objetivos de Negocio

1. **Visibilidad Total**: Saber en todo momento el estado de caja y bancos.
2. **Trazabilidad**: Vincular movimientos a Tickets, Obras, Clientes.
3. **Categorización**: Tipificar gastos/ingresos para análisis.
4. **Conciliación**: Comparar movimientos internos vs. extractos bancarios.
5. **Agilidad**: Carga rápida individual y masiva (CSV/Excel).

---

## 📊 Modelo Conceptual

```
┌─────────────────────────────────────────────────────────────┐
│                    CUENTAS (Orígenes)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Caja   │  │ Banco   │  │ Banco   │  │MercadoP │        │
│  │ Chica   │  │ Nación  │  │ Galicia │  │  (*)    │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴─────┬──────┴────────────┘              │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │    MOVIMIENTOS        │                      │
│              │  (Ingresos/Egresos)   │                      │
│              └───────────┬───────────┘                      │
│                          │                                  │
│    ┌─────────────────────┼─────────────────────┐           │
│    ▼                     ▼                     ▼            │
│ ┌──────┐           ┌──────────┐          ┌─────────┐       │
│ │Ticket│           │   Obra   │          │ Cliente │       │
│ │ #142 │           │  #45     │          │ Correo  │       │
│ └──────┘           └──────────┘          └─────────┘       │
│                                                             │
│ + Categoría: MATERIALES | MANO_OBRA | COMBUSTIBLE | etc.   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Schema Database (Prisma)

### 1. Enums

```prisma
enum TipoMovimiento {
  INGRESO
  EGRESO
}

enum TipoCuenta {
  CAJA_CHICA
  CUENTA_CORRIENTE
  CAJA_AHORRO
  BILLETERA_VIRTUAL
  INVERSION           // FCI, Plazo Fijo, etc.
}

enum MedioPago {
  EFECTIVO
  TRANSFERENCIA
  CHEQUE
  TARJETA_DEBITO
  TARJETA_CREDITO
  MERCADOPAGO
}

enum CategoriaIngreso {
  COBRO_FACTURA
  ANTICIPO_CLIENTE
  REINTEGRO
  RENDIMIENTO_INVERSION  // Intereses, ganancias FCI
  RESCATE_INVERSION      // Vuelta de plazo fijo, rescate FCI
  OTRO_INGRESO
}

enum CategoriaEgreso {
  MATERIALES
  MANO_DE_OBRA
  COMBUSTIBLE
  HERRAMIENTAS
  VIATICOS
  SUBCONTRATISTA
  IMPUESTOS
  SERVICIOS
  TRASPASO_INVERSION     // Constitución de plazo fijo, suscripción FCI
  OTRO_EGRESO
}

enum EstadoMovimiento {
  PENDIENTE     // Registrado, no confirmado
  CONFIRMADO    // Validado
  CONCILIADO    // Matcheado con extracto bancario
  ANULADO
}
```

### 2. Maestro de Bancos

```prisma
model Banco {
  id              Int       @id @default(autoincrement())
  codigo          String    @unique  // "011" (Nación), "007" (Galicia), etc.
  nombre          String    @unique  // "Banco de la Nación Argentina"
  nombreCorto     String    @map("nombre_corto")  // "Banco Nación"
  logo            String?   // URL del logo
  activo          Boolean   @default(true)
  
  cuentas         CuentaFinanciera[]
  
  @@map("bancos")
}
```

### 3. Modelo CuentaFinanciera

```prisma
model CuentaFinanciera {
  id              Int         @id @default(autoincrement())
  nombre          String      // "Caja Chica Oficina", "Banco Nación CC"
  tipo            TipoCuenta
  bancoId         Int?        @map("banco_id")  // FK al maestro de bancos
  numeroCuenta    String?     @map("numero_cuenta")
  cbu             String?     @unique
  alias           String?
  saldoInicial    Decimal     @default(0) @map("saldo_inicial") @db.Decimal(12, 2)
  saldoActual     Decimal     @default(0) @map("saldo_actual") @db.Decimal(12, 2)
  moneda          String      @default("ARS")
  activa          Boolean     @default(true)
  
  // Campos específicos para inversiones
  tipoInversion   String?     @map("tipo_inversion")  // "PLAZO_FIJO", "FCI", "CAUCIONES"
  tasaAnual       Decimal?    @map("tasa_anual") @db.Decimal(6, 4)  // 0.4500 = 45% TNA
  fechaVencimiento DateTime?  @map("fecha_vencimiento")  // Para plazos fijos
  
  fechaCreacion   DateTime    @default(now()) @map("fecha_creacion")
  fechaActualizacion DateTime @updatedAt @map("fecha_actualizacion")
  
  banco           Banco?      @relation(fields: [bancoId], references: [id])
  movimientos     Movimiento[]
  
  @@map("cuentas_financieras")
}
```

### 4. Modelo Movimiento

```prisma
model Movimiento {
  id                Int               @id @default(autoincrement())
  codigo            String            @unique @default(cuid()) // MOV-xxxxx
  
  // Clasificación
  tipo              TipoMovimiento
  categoriaIngreso  CategoriaIngreso?  @map("categoria_ingreso")
  categoriaEgreso   CategoriaEgreso?   @map("categoria_egreso")
  medioPago         MedioPago          @map("medio_pago")
  
  // Montos
  monto             Decimal           @db.Decimal(12, 2)
  moneda            String            @default("ARS")
  
  // Contexto
  descripcion       String
  comprobante       String?           // Nro factura, recibo, etc.
  
  // Fechas
  fechaMovimiento   DateTime          @map("fecha_movimiento")
  fechaRegistro     DateTime          @default(now()) @map("fecha_registro")
  
  // Origen/Cuenta
  cuentaId          Int               @map("cuenta_id")
  cuenta            CuentaFinanciera  @relation(fields: [cuentaId], references: [id])
  
  // Vinculaciones opcionales (contexto)
  clienteId         Int?              @map("cliente_id")
  ticketId          Int?              @map("ticket_id")
  obraId            Int?              @map("obra_id")
  empleadoId        Int?              @map("empleado_id")  // Quien recibió viático, etc.
  
  // Estado y auditoría
  estado            EstadoMovimiento  @default(PENDIENTE)
  registradoPorId   Int               @map("registrado_por_id")
  
  // Carga masiva
  importacionId     Int?              @map("importacion_id")
  
  fechaActualizacion DateTime         @updatedAt @map("fecha_actualizacion")
  
  // Relations
  cliente           Cliente?          @relation(fields: [clienteId], references: [id])
  importacion       ImportacionMasiva? @relation(fields: [importacionId], references: [id])
  
  @@index([fechaMovimiento])
  @@index([cuentaId])
  @@index([tipo])
  @@index([estado])
  @@map("movimientos")
}
```

### 5. Modelo ImportacionMasiva (para CSV/Excel)

```prisma
model ImportacionMasiva {
  id              Int       @id @default(autoincrement())
  nombreArchivo   String    @map("nombre_archivo")
  cuentaId        Int       @map("cuenta_id")
  
  totalRegistros  Int       @map("total_registros")
  registrosOk     Int       @default(0) @map("registros_ok")
  registrosError  Int       @default(0) @map("registros_error")
  
  estado          String    @default("PROCESANDO") // PROCESANDO, COMPLETADO, ERROR
  errores         String?   @db.Text  // JSON con detalle de errores
  
  fechaImportacion DateTime @default(now()) @map("fecha_importacion")
  usuarioId       Int       @map("usuario_id")
  
  movimientos     Movimiento[]
  
  @@map("importaciones_masivas")
}
```

---

## 🎨 Frontend Architecture

### 📍 Páginas Principales

#### 1. `/finanzas` - Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│  💰 Panel Financiero                        [+ Movimiento]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Saldo Total │ │  Ingresos   │ │  Egresos    │           │
│  │ $1,234,567  │ │  $500,000   │ │  $250,000   │           │
│  │    (Mes)    │ │   ▲ 12%     │ │   ▼ 5%      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Saldos por Cuenta                                    │   │
│  ├──────────────────────┬──────────────────────────────┤   │
│  │ 🏦 Banco Nación CC   │ $850,000                     │   │
│  │ 🏦 Banco Galicia     │ $350,000                     │   │
│  │ 💵 Caja Chica        │ $34,567                      │   │
│  └──────────────────────┴──────────────────────────────┘   │
│                                                             │
│  [Ver todos los movimientos →]                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2. `/finanzas/movimientos` - Listado
- Tabla con filtros: Fecha, Cuenta, Tipo, Categoría, Estado
- Búsqueda por descripción/comprobante
- Acciones: Ver, Editar, Anular
- Botón "Importar CSV" (abre modal)

#### 3. `/finanzas/cuentas` - Gestión de Cuentas
- CRUD de cuentas bancarias/cajas
- Ver movimientos por cuenta
- Historial de saldos

#### 4. `/finanzas/inversiones` - Gestión de Inversiones
```
┌─────────────────────────────────────────────────────────────┐
│  📈 Inversiones                              [+ Inversión]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Total Invertido: $2,500,000     Rendimiento: $45,000│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Inversión      │ Tipo       │ Capital  │ Rend. │ Vto  ││
│  ├────────────────┼────────────┼──────────┼───────┼──────┤│
│  │ PF Nación #1   │ Plazo Fijo │ $1.5M    │ 45%   │15/02 ││
│  │ FCI Galicia    │ FCI        │ $800K    │ +2.3% │ -    ││
│  │ Cauciones BYMA │ Cauciones  │ $200K    │ 38%   │ Día  ││
│  └────────────────┴────────────┴──────────┴───────┴──────┘│
│                                                             │
│  [Registrar Rendimiento]  [Rescatar Inversión]             │
└─────────────────────────────────────────────────────────────┘
```

### 🗄️ Componentes Clave

```
features/finanzas/
├── components/
│   ├── MovimientoForm.tsx      # Form de alta/edición
│   ├── MovimientoCard.tsx      # Card en listado
│   ├── SaldoCard.tsx           # Indicador de saldo
│   ├── CuentaSelector.tsx      # Dropdown de cuentas
│   ├── CategoriaChip.tsx       # Badge de categoría
│   ├── ContextoVinculo.tsx     # Link a Ticket/Obra/Cliente
│   ├── ImportadorCSV.tsx       # Modal de importación
│   └── FiltrosMovimientos.tsx  # Panel de filtros
├── hooks/
│   ├── useMovimientos.ts
│   ├── useCuentas.ts
│   └── useSaldos.ts
└── pages/
    ├── FinanzasDashboard.tsx
    ├── MovimientosPage.tsx
    └── CuentasPage.tsx
```

### 🔗 Formulario de Movimiento (UX Clave)

```
┌─────────────────────────────────────────────────────────────┐
│  Nuevo Movimiento                                      [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [◉ INGRESO]  [○ EGRESO]                                   │
│                                                             │
│  Cuenta *          [▼ Banco Nación CC              ]       │
│  Monto *           [$ ___________] ARS                      │
│  Fecha *           [📅 19/01/2026]                          │
│  Medio de Pago *   [▼ Transferencia                ]       │
│                                                             │
│  Categoría *       [▼ Cobro de Factura             ]       │
│  Comprobante       [FC-0001-00001234               ]       │
│  Descripción *     [Cobro factura Correo Enero     ]       │
│                                                             │
│  ── Vincular a (opcional) ──────────────────────────────   │
│  Cliente           [🔍 Buscar cliente...            ]       │
│  Obra              [▼ Sin vincular                  ]       │
│  Ticket            [▼ Sin vincular                  ]       │
│                                                             │
│              [Cancelar]  [💾 Guardar Movimiento]            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Backend Implementation

### API Endpoints

```typescript
// === BANCOS (Maestro) ===
GET    /api/finanzas/bancos               // Listar bancos
POST   /api/finanzas/bancos               // Crear banco
PUT    /api/finanzas/bancos/:id           // Actualizar banco

// === CUENTAS ===
GET    /api/finanzas/cuentas              // Listar cuentas con saldos
POST   /api/finanzas/cuentas              // Crear cuenta
GET    /api/finanzas/cuentas/:id          // Detalle cuenta
PUT    /api/finanzas/cuentas/:id          // Actualizar cuenta
DELETE /api/finanzas/cuentas/:id          // Desactivar cuenta

// === MOVIMIENTOS ===
GET    /api/finanzas/movimientos          // Listar con filtros y paginación
POST   /api/finanzas/movimientos          // Crear movimiento
GET    /api/finanzas/movimientos/:id      // Detalle
PUT    /api/finanzas/movimientos/:id      // Editar (si PENDIENTE)
POST   /api/finanzas/movimientos/:id/anular     // Anular
POST   /api/finanzas/movimientos/:id/confirmar  // Confirmar

// === IMPORTACIÓN ===
POST   /api/finanzas/importar             // Upload CSV, retorna job ID
GET    /api/finanzas/importar/:id/estado  // Estado de importación

// === REPORTES ===
GET    /api/finanzas/dashboard            // Métricas para dashboard
GET    /api/finanzas/saldos               // Saldos actuales por cuenta
GET    /api/finanzas/resumen-categorias   // Totales por categoría

// === INVERSIONES ===
GET    /api/finanzas/inversiones          // Listar cuentas tipo INVERSION
POST   /api/finanzas/inversiones/traspasar    // Traspaso cuenta → inversión
POST   /api/finanzas/inversiones/:id/rendimiento  // Registrar rendimiento
POST   /api/finanzas/inversiones/:id/rescatar     // Rescate total o parcial
```

### Servicio de Saldos

```typescript
// Al crear/anular movimiento, actualizar saldo de cuenta
async function actualizarSaldoCuenta(cuentaId: number) {
  const movimientos = await prisma.movimiento.aggregate({
    where: { cuentaId, estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });
  
  const ingresos = await prisma.movimiento.aggregate({
    where: { cuentaId, tipo: 'INGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });
  
  const egresos = await prisma.movimiento.aggregate({
    where: { cuentaId, tipo: 'EGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });
  
  const cuenta = await prisma.cuentaFinanciera.findUnique({ where: { id: cuentaId } });
  const saldoActual = cuenta.saldoInicial + ingresos._sum.monto - egresos._sum.monto;
  
  await prisma.cuentaFinanciera.update({
    where: { id: cuentaId },
    data: { saldoActual }
  });
}
```

---

## 📥 Importación Masiva (CSV Mock)

### Formato esperado del CSV

```csv
fecha,tipo,monto,categoria,descripcion,comprobante
2026-01-15,INGRESO,50000,COBRO_FACTURA,Cobro FC Correo,FC-0001-00005678
2026-01-16,EGRESO,5000,MATERIALES,Compra cables,RC-00123
2026-01-17,EGRESO,1500,COMBUSTIBLE,Carga nafta camioneta,RC-00124
```

### Flujo de Importación

1. Usuario selecciona cuenta destino
2. Sube archivo CSV
3. Sistema preview primeras filas
4. Usuario confirma → se crea `ImportacionMasiva`
5. Proceso asíncrono crea movimientos
6. Al terminar, notifica resultado

---

## 📅 Roadmap Detallado

### Fase 6.1: Base de Datos

- [ ] Schema Prisma: `Banco`, `CuentaFinanciera`, `Movimiento`, `ImportacionMasiva`
- [ ] Migración
- [ ] Seed: Bancos argentinos principales + cuentas demo

### Fase 6.2: API Core

- [ ] CRUD Cuentas
- [ ] CRUD Movimientos
- [ ] Servicio de actualización de saldos
- [ ] Endpoint dashboard/métricas

### Fase 6.3: Frontend - Dashboard y Listados

- [ ] `FinanzasDashboard.tsx` con cards de saldo
- [ ] `MovimientosPage.tsx` con tabla filtrable
- [ ] `CuentasPage.tsx`

### Fase 6.4: Frontend - Formularios

- [ ] `MovimientoForm.tsx` con vinculación a Cliente/Obra/Ticket
- [ ] Validaciones y estados de movimiento
- [ ] Anulación con motivo

### Fase 6.5: Importación Masiva (Mock)

- [ ] UI de upload CSV
- [ ] Parser y validación
- [ ] Vista de resultados de importación

### Fase 6.6: Inversiones

- [ ] Page `/finanzas/inversiones`
- [ ] Flujo de traspaso cuenta → inversión
- [ ] Registro de rendimientos (manual)
- [ ] Flujo de rescate inversión → cuenta

---

## 🔮 Consideraciones Futuras

1. **Conciliación Bancaria**: Comparar movimientos vs. extracto importado
2. **Presupuesto vs. Real por Obra**: Comparar gastos imputados vs. presupuestado
3. **Reportes Contables**: Exportar a formato para contador
4. **Multi-moneda**: Soporte USD con tipo de cambio
5. **Cobros Parciales**: Factura pagada en cuotas

---

## ⚠️ Dependencias

- **Plan 10**: Modelo de datos base (Clientes)
- **Plan 11**: Tickets (para vinculación)
- **Plan 12**: Obras (para vinculación e imputación de gastos)
