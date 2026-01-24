# API Endpoints - SIBA

> Documentación completa de endpoints para integración con n8n/Telegram

## 🔐 Autenticación

### Mecanismo de Autenticación

| Propiedad            | Valor                                      |
| -------------------- | ------------------------------------------ |
| **Tipo**             | JWT Bearer Token                           |
| **Header**           | `Authorization: Bearer <access_token>`     |
| **Access Token TTL** | ~15 minutos                                |
| **Refresh Token**    | Cookie HTTP-Only (`refreshToken`) - 7 días |

### Flujo de Autenticación

1. Login con credenciales → Obtener `accessToken`
2. Usar `accessToken` en header para todas las peticiones
3. Si token expira (401), llamar `/api/auth/refresh` para renovar
4. El refresh token se maneja automáticamente via cookies

---

## 📋 Índice de Endpoints

- [Auth](#auth-autenticación)
- [Tickets](#tickets)
- [Órdenes de Trabajo](#órdenes-de-trabajo)
- [Obras](#obras)
- [Finanzas](#finanzas)
- [Clientes](#clientes)
- [Sucursales](#sucursales-sedes)
- [Empleados](#empleados)
- [Usuarios](#usuarios)
- [Roles](#roles)
- [Zonas](#zonas)
- [Vehículos](#vehículos)
- [Materiales](#materiales)
- [Upload](#upload-archivos)

---

## Auth (Autenticación)

### POST `/api/auth/login`

> 🔓 **Público** - Login de usuario

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa (200):**

```json
{
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "roles": ["Admin"],
    "permisos": ["admin:leer", "admin:escribir", "tickets:leer"]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**

- `400` - Validación fallida
- `401` - Credenciales inválidas

---

### POST `/api/auth/refresh`

> 🔓 **Requiere Cookie** - Renovar access token

**Headers:**

```
Cookie: refreshToken=<token>
```

**Body:** Ninguno

**Respuesta exitosa (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

### POST `/api/auth/logout`

> 🔓 **Público** - Cerrar sesión

**Respuesta exitosa (200):**

```json
{
  "message": "Logout exitoso"
}
```

---

### GET `/api/auth/me`

> 🔒 **Autenticado** - Obtener usuario actual

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Respuesta exitosa (200):**

```json
{
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "roles": ["Admin"],
    "permisos": ["admin:leer", "admin:escribir"]
  }
}
```

---

## Tickets

### GET `/api/tickets`

> 🔓 **Público** - Listar tickets con paginación y filtros

**Query Parameters:**
| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `page` | number | Página actual | `1` |
| `limit` | number | Items por página | `10` |
| `search` | string | Búsqueda en descripción, código, trabajo | `"aire acondicionado"` |
| `estado` | enum | Filtrar por estado | `NUEVO`, `PROGRAMADO`, `EN_CURSO`, `FINALIZADO` |
| `rubro` | enum | Filtrar por rubro | `CIVIL`, `ELECTRICIDAD`, `SANITARIOS`, `VARIOS` |
| `prioridad` | enum | Filtrar por prioridad | `PROGRAMADO`, `EMERGENCIA`, `URGENCIA` |

**Ejemplo:**

```
GET /api/tickets?page=1&limit=10&estado=NUEVO&prioridad=EMERGENCIA
```

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Respuesta exitosa (200):**

```json
{
  "data": [
    {
      "id": 1,
      "codigoInterno": "TKT-00001",
      "descripcion": "Reparación aire acondicionado",
      "trabajo": "Revisar compresor",
      "rubro": "ELECTRICIDAD",
      "prioridad": "EMERGENCIA",
      "estado": "NUEVO",
      "fechaCreacion": "2025-01-20T10:00:00.000Z",
      "fechaProgramada": "2025-01-22T09:00:00.000Z",
      "sucursal": {
        "nombre": "Sucursal Centro",
        "cliente": { "razonSocial": "Empresa ABC S.A." }
      },
      "tecnico": { "nombre": "Carlos", "apellido": "García" },
      "creadoPor": { "nombre": "Juan", "apellido": "Pérez" }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET `/api/tickets/:id`

> 🔓 **Público** - Obtener ticket por ID

**Ejemplo:**

```
GET /api/tickets/123
```

**Respuesta exitosa (200):**

```json
{
  "id": 123,
  "codigoInterno": "TKT-00123",
  "descripcion": "Reparación de equipo de frío",
  "trabajo": "Cambiar filtros y revisar gas",
  "observaciones": "Cliente solicita visita en horario matutino",
  "rubro": "CLIMATIZACION",
  "prioridad": "NORMAL",
  "estado": "EN_CURSO",
  "fechaCreacion": "2025-01-15T08:30:00.000Z",
  "fechaProgramada": "2025-01-20T10:00:00.000Z",
  "sucursal": {
    "id": 5,
    "nombre": "Sucursal Norte",
    "direccion": "Av. Libertador 1234",
    "cliente": { "id": 2, "razonSocial": "Comercios XYZ" }
  },
  "tecnico": { "id": 3, "nombre": "Carlos", "apellido": "García" },
  "creadoPor": { "id": 1, "nombre": "Admin", "apellido": "Sistema" },
  "historial": [
    {
      "fechaCambio": "2025-01-16T09:00:00.000Z",
      "campoModificado": "estado",
      "valorAnterior": "PENDIENTE",
      "valorNuevo": "EN_CURSO",
      "usuario": { "nombre": "Carlos", "apellido": "García" }
    }
  ],
  "ordenTrabajo": { "id": 45 }
}
```

---

### POST `/api/tickets`

> 🔓 **Público** - Crear nuevo ticket

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Body:**

```json
{
  "descripcion": "Reparación urgente equipo de climatización",
  "trabajo": "Revisar compresor y recarga de gas",
  "observaciones": "Acceso por puerta trasera",
  "rubro": "ELECTRICIDAD",
  "prioridad": "EMERGENCIA",
  "estado": "NUEVO",
  "fechaProgramada": "2025-01-25T09:00:00.000Z",
  "sucursalId": 5,
  "tecnicoId": 3,
  "codigoCliente": "CLI-ABC-001"
}
```

| Campo                 | Tipo     | Requerido | Descripción                                     |
| --------------------- | -------- | --------- | ----------------------------------------------- |
| `descripcion`         | string   | ✅        | 5-1000 caracteres                               |
| `rubro`               | enum     | ✅        | `CIVIL`, `ELECTRICIDAD`, `SANITARIOS`, `VARIOS` |
| `prioridad`           | enum     | ✅        | `PROGRAMADO`, `EMERGENCIA`, `URGENCIA`          |
| `sucursalId`          | number   | ✅        | ID de sucursal existente                        |
| `trabajo`             | string   | ❌        | Descripción del trabajo                         |
| `observaciones`       | string   | ❌        | Notas adicionales                               |
| `estado`              | enum     | ❌        | Default: `NUEVO`                                |
| `fechaProgramada`     | ISO date | ❌        | Fecha programada                                |
| `tecnicoId`           | number   | ❌        | ID de técnico asignado                          |
| `codigoCliente`       | string   | ❌        | Código interno del cliente                      |
| `ticketRelacionadoId` | number   | ❌        | ID de ticket relacionado                        |

**Respuesta exitosa (201):**

```json
{
  "id": 124,
  "codigoInterno": "TKT-00124",
  "descripcion": "Reparación urgente equipo de climatización",
  ...
}
```

---

### PUT `/api/tickets/:id`

> 🔓 **Público** - Actualizar ticket

**Body:** Mismo esquema que POST (todos los campos opcionales)

---

### PATCH `/api/tickets/:id/estado`

> 🔓 **Público** - Cambiar estado de ticket

**Body:**

```json
{
  "estado": "EN_CURSO",
  "observacion": "Técnico en camino"
}
```

**Estados válidos:** `NUEVO`, `PROGRAMADO`, `EN_CURSO`, `FINALIZADO`

---

### DELETE `/api/tickets/:id`

> 🔓 **Público** - Eliminar ticket (soft delete)

**Respuesta exitosa (200):**

```json
{
  "message": "Ticket eliminado correctamente"
}
```

---

## Órdenes de Trabajo

### GET `/api/ordenes-trabajo`

> 🔓 **Público** - Listar órdenes de trabajo

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página actual |
| `limit` | number | Items por página |
| `ticketId` | number | Filtrar por ticket |

**Respuesta exitosa (200):**

```json
{
  "data": [
    {
      "id": 1,
      "ticketId": 123,
      "descripcionTrabajo": "Reparación realizada",
      "materialesUsados": "Gas R410, filtros",
      "fechaOT": "2025-01-20T10:00:00.000Z",
      "ticket": { "id": 123, "codigoInterno": "TKT-00123" },
      "cliente": { "id": 2, "razonSocial": "Empresa ABC" },
      "sucursal": { "id": 5, "nombre": "Sucursal Norte" },
      "tecnico": { "id": 3, "nombre": "Carlos", "apellido": "García" },
      "archivos": []
    }
  ],
  "meta": { "total": 20, "page": 1, "limit": 10, "totalPages": 2 }
}
```

---

### GET `/api/ordenes-trabajo/:id`

> 🔓 **Público** - Obtener OT por ID

---

### POST `/api/ordenes-trabajo`

> 🔓 **Público** - Crear orden de trabajo desde ticket

**Body:**

```json
{
  "ticketId": 123,
  "descripcionTrabajo": "Se realizó la reparación del equipo de aire",
  "materialesUsados": "Gas refrigerante R410a - 1kg, Filtro de aire",
  "fechaOT": "2025-01-20T10:00:00.000Z"
}
```

| Campo                | Tipo     | Requerido |
| -------------------- | -------- | --------- |
| `ticketId`           | number   | ✅        |
| `descripcionTrabajo` | string   | ✅        |
| `materialesUsados`   | string   | ❌        |
| `fechaOT`            | ISO date | ❌        |

---

### PUT `/api/ordenes-trabajo/:id`

> 🔓 **Público** - Actualizar OT

**Body:**

```json
{
  "descripcionTrabajo": "Trabajo actualizado",
  "materialesUsados": "Materiales actualizados",
  "firmaResponsable": "base64...",
  "aclaracionResponsable": "Juan Pérez"
}
```

---

### POST `/api/ordenes-trabajo/:id/finalizar`

> 🔓 **Público** - Finalizar OT y ticket

**Body:**

```json
{
  "firmaResponsable": "data:image/png;base64,...",
  "aclaracionResponsable": "Juan Pérez - Gerente"
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Orden de trabajo finalizada"
}
```

---

### DELETE `/api/ordenes-trabajo/:id`

> 🔓 **Público** - Eliminar OT

---

## Obras

### GET `/api/obras`

> 🔓 **Público** - Listar obras/presupuestos

**Query Parameters:**
| Parámetro | Tipo | Valores posibles |
|-----------|------|------------------|
| `page` | number | 1, 2, 3... |
| `limit` | number | 10, 20, 50... |
| `search` | string | Búsqueda en código/título |
| `estado` | enum | `BORRADOR`, `PRESUPUESTADO`, `APROBADO`, `RECHAZADO`, `EN_EJECUCION`, `FINALIZADO`, `FACTURADO` |
| `tipo` | enum | `MANTENIMIENTO`, `INSTALACION`, `REPARACION`, `OTRO` |
| `clienteId` | number | ID del cliente |

**Respuesta exitosa (200):**

```json
{
  "data": [
    {
      "id": 1,
      "codigo": "OBR-00001",
      "tipo": "MANTENIMIENTO",
      "modoEjecucion": "CON_PRESUPUESTO",
      "titulo": "Mantenimiento preventivo equipos",
      "estado": "PRESUPUESTADO",
      "fechaSolicitud": "2025-01-15T00:00:00.000Z",
      "cliente": { "id": 2, "razonSocial": "Empresa ABC", "codigo": 1 },
      "sucursal": { "id": 5, "nombre": "Sucursal Centro" }
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 10, "totalPages": 2 }
}
```

---

### POST `/api/obras`

> 🔓 **Público** - Crear obra/presupuesto

**Body:**

```json
{
  "tipo": "MANTENIMIENTO",
  "modoEjecucion": "CON_PRESUPUESTO",
  "titulo": "Instalación de sistema de climatización",
  "descripcion": "Instalación completa de 5 equipos split",
  "fechaSolicitud": "2025-01-20T00:00:00.000Z",
  "fechaInicioEstimada": "2025-02-01T00:00:00.000Z",
  "fechaFinEstimada": "2025-02-15T00:00:00.000Z",
  "clienteId": 2,
  "sucursalId": 5,
  "ticketId": 123,
  "condicionesPago": "50% anticipo, 50% contra entrega",
  "validezDias": 30
}
```

---

### PATCH `/api/obras/:id/estado`

> 🔓 **Público** - Cambiar estado de obra

**Body:**

```json
{
  "estado": "APROBADO",
  "observacion": "Aprobado por gerencia"
}
```

**Transiciones válidas:**

- `BORRADOR` → `PRESUPUESTADO`, `EN_EJECUCION`
- `PRESUPUESTADO` → `APROBADO`, `RECHAZADO`, `BORRADOR`
- `APROBADO` → `EN_EJECUCION`
- `RECHAZADO` → `BORRADOR`
- `EN_EJECUCION` → `FINALIZADO`
- `FINALIZADO` → `FACTURADO`

---

## Finanzas

> 🔒 **Requiere autenticación y permiso `finanzas:leer` o `finanzas:escribir`**

### GET `/api/finanzas/dashboard`

> Dashboard financiero con resumen

**Respuesta exitosa (200):**

```json
{
  "saldoTotal": 1500000.50,
  "ingresosMes": { "monto": 500000, "cantidad": 15 },
  "egresosMes": { "monto": 200000, "cantidad": 8 },
  "balanceMes": 300000,
  "cuentas": [
    { "id": 1, "nombre": "Cuenta Corriente", "tipo": "BANCO", "banco": "Santander", "saldoActual": 800000 }
  ],
  "ultimosMovimientos": [...]
}
```

---

### GET `/api/finanzas/saldos`

> Saldos de todas las cuentas

---

### GET `/api/finanzas/cuentas`

> Listar cuentas financieras

---

### POST `/api/finanzas/cuentas`

> Crear cuenta financiera

**Body:**

```json
{
  "nombre": "Cuenta Corriente Santander",
  "tipo": "BANCO",
  "bancoId": 1,
  "numeroCuenta": "123-456789/0",
  "cbu": "0720123456789012345678",
  "alias": "MI.CUENTA.EMPRESA",
  "saldoInicial": 100000,
  "moneda": "ARS"
}
```

---

### GET `/api/finanzas/movimientos`

> Listar movimientos con filtros

**Query Parameters:**
| Parámetro | Tipo |
|-----------|------|
| `cuentaId` | number |
| `tipo` | `INGRESO`, `EGRESO` |
| `estado` | `PENDIENTE`, `CONFIRMADO`, `ANULADO` |
| `fechaDesde` | ISO date |
| `fechaHasta` | ISO date |
| `search` | string |
| `page` | number |
| `limit` | number |

---

### POST `/api/finanzas/movimientos`

> Registrar movimiento financiero

**Body:**

```json
{
  "tipo": "INGRESO",
  "categoriaIngreso": "COBRANZA_CLIENTE",
  "medioPago": "TRANSFERENCIA",
  "monto": 50000,
  "moneda": "ARS",
  "descripcion": "Pago factura FC-0001234",
  "comprobante": "TRANSF-20250120",
  "fechaMovimiento": "2025-01-20T14:30:00.000Z",
  "cuentaId": 1,
  "clienteId": 2,
  "obraId": 5
}
```

---

### POST `/api/finanzas/movimientos/:id/confirmar`

> Confirmar movimiento pendiente

---

### POST `/api/finanzas/movimientos/:id/anular`

> Anular movimiento

**Body:**

```json
{
  "motivo": "Error en el monto registrado"
}
```

---

## Clientes

> 🔒 **Requiere autenticación y permiso `admin:leer` / `admin:escribir`**

### GET `/api/clients`

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página |
| `limit` | number | Items por página |
| `search` | string | Buscar por razón social o CUIT |

**Respuesta:**

```json
{
  "data": [
    {
      "id": 1,
      "codigo": 1,
      "razonSocial": "Empresa ABC S.A.",
      "cuit": "30-12345678-9",
      "email": "contacto@empresa.com",
      "telefono": "011-4555-1234",
      "direccionFiscal": "Av. Corrientes 1234, CABA"
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

---

### POST `/api/clients`

**Body:**

```json
{
  "razonSocial": "Nueva Empresa S.R.L.",
  "cuit": "30-98765432-1",
  "email": "info@nuevaempresa.com",
  "telefono": "011-5555-4321",
  "direccionFiscal": "Calle 123 Nro 456"
}
```

---

### GET `/api/clients/:id`

### PUT `/api/clients/:id`

### DELETE `/api/clients/:id`

---

## Sucursales (Sedes)

> 🔒 **Requiere autenticación y permiso `admin:leer` / `admin:escribir`**

### GET `/api/sedes`

---

### POST `/api/sedes`

**Body:**

```json
{
  "nombre": "Sucursal Norte",
  "direccion": "Av. Del Libertador 5678",
  "telefono": "011-4888-9999",
  "email": "norte@empresa.com",
  "clienteId": 1,
  "zonaId": 2,
  "codigoInterno": "SUC-NORTE-001"
}
```

---

## Empleados

> 🔓 **Público**

### GET `/api/empleados`

**Respuesta:**

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Carlos",
      "apellido": "García",
      "email": "carlos@empresa.com",
      "telefono": "11-5555-1234",
      "tipo": "TECNICO",
      "zonaId": 1
    }
  ],
  "meta": { ... }
}
```

---

### POST `/api/empleados`

**Body:**

```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@empresa.com",
  "telefono": "11-6666-7777",
  "tipo": "TECNICO",
  "zonaId": 1
}
```

**Tipos válidos:** `TECNICO`, `ADMINISTRATIVO`, `VENDEDOR`, `GERENTE`

---

## Usuarios

> 🔒 **Requiere permiso `seguridad:leer` / `seguridad:escribir`**

### GET `/api/users`

### GET `/api/users/:id`

### POST `/api/users`

### PUT `/api/users/:id`

### DELETE `/api/users/:id`

---

## Roles

> 🔒 **Requiere permiso `seguridad:leer` / `seguridad:escribir`**

### GET `/api/roles`

### GET `/api/roles/:id`

### GET `/api/roles/permisos`

> Lista todos los permisos disponibles en el sistema

### POST `/api/roles`

### PUT `/api/roles/:id`

### DELETE `/api/roles/:id`

---

## Zonas

> 🔒 **Requiere permiso `admin:leer` / `admin:escribir`**

### GET `/api/zones`

### POST `/api/zones`

### PUT `/api/zones/:id`

### DELETE `/api/zones/:id`

---

## Vehículos

> 🔒 **Requiere permiso `admin:leer` / `admin:escribir`**

### GET `/api/vehiculos`

### POST `/api/vehiculos`

### PUT `/api/vehiculos/:id`

### DELETE `/api/vehiculos/:id`

---

## Materiales

> 🔒 **Requiere permiso `admin:leer` / `admin:escribir`**

### GET `/api/materials`

### POST `/api/materials`

### PUT `/api/materials/:id`

### GET `/api/materials/:id/history`

> Historial de cambios de precio del material

---

## Upload (Archivos)

### POST `/api/upload`

> Subir archivo a MinIO

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer <accessToken>
```

**Form Data:**
| Campo | Tipo | Requerido |
|-------|------|-----------|
| `file` | File | ✅ |
| `ordenTrabajoId` | number | ❌ |
| `ticketId` | number | ❌ |

**Tipos permitidos:** JPEG, PNG, GIF, WebP, PDF, DOC, DOCX

**Límite:** 10 MB

**Respuesta exitosa (201):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombreOriginal": "foto_equipo.jpg",
    "nombreStorage": "abc123-foto_equipo.jpg",
    "mimeType": "image/jpeg",
    "tamanio": 245678,
    "bucket": "siba-uploads",
    "url": "http://minio:9000/siba-uploads/abc123-foto_equipo.jpg"
  }
}
```

---

### DELETE `/api/upload/:id`

> Eliminar archivo

---

## 🏥 Health Check

### GET `/api/health`

> 🔓 **Público** - Verificar estado del API

**Respuesta:**

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2025-01-20T14:30:00.000Z"
}
```

---

## 📋 Enums de Referencia

### Estados de Ticket

- `NUEVO` - Ticket recién creado (estado inicial)
- `PROGRAMADO` - Ticket programado para una fecha
- `EN_CURSO` - Trabajo en progreso
- `FINALIZADO` - Ticket completado

### Rubros de Ticket

- `CIVIL`
- `ELECTRICIDAD`
- `SANITARIOS`
- `VARIOS`

### Prioridades de Ticket

- `PROGRAMADO`
- `EMERGENCIA`
- `URGENCIA`

### Estados de Obra

- `BORRADOR`
- `PRESUPUESTADO`
- `APROBADO`
- `RECHAZADO`
- `EN_EJECUCION`
- `FINALIZADO`
- `FACTURADO`

### Tipos de Obra

- `MANTENIMIENTO`
- `INSTALACION`
- `REPARACION`
- `OTRO`

### Tipos de Movimiento Financiero

- `INGRESO`
- `EGRESO`

### Medios de Pago

- `EFECTIVO`
- `TRANSFERENCIA`
- `CHEQUE`
- `TARJETA`
- `OTRO`

### Estados de Movimiento

- `PENDIENTE`
- `CONFIRMADO`
- `ANULADO`

---

## 🔗 Ejemplo Completo para n8n

### 1. Login y obtener token

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@siba.com",
  "password": "password123"
}
```

### 2. Crear ticket nuevo

```http
POST {{baseUrl}}/api/tickets
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "descripcion": "Solicitud desde Telegram: Revisar instalación eléctrica",
  "rubro": "ELECTRICIDAD",
  "prioridad": "EMERGENCIA",
  "sucursalId": 1
}
```

### 3. Listar tickets pendientes

```http
GET {{baseUrl}}/api/tickets?estado=NUEVO&limit=5
Authorization: Bearer {{accessToken}}
```

### 4. Cambiar estado a EN_CURSO

```http
PATCH {{baseUrl}}/api/tickets/123/estado
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "estado": "EN_CURSO",
  "observacion": "Técnico asignado y en camino"
}
```
