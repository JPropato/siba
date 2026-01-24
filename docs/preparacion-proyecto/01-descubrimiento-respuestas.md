# Sistema Bauman - Descubrimiento de Requisitos

> **Fecha**: 2026-01-17  
> **Entrevistado**: Julian Propato (Desarrollador principal)  
> **Empresa**: Bauman (Construcción, Obras y Mantenimiento)

---

## 1. 🏢 Contexto del Negocio

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1.1 | **Propósito principal** | Sistema de gestión completo para la empresa Bauman. La empresa se dedica a construcción, obras y mantenimiento. El sistema debe ordenar toda la información comercial y financiera de la empresa. |
| 1.2 | **Usuarios concurrentes iniciales** | 4-5 usuarios con posibilidad de escalar algunos más |
| 1.3 | **Proyección a 5 años** | No más de 20-30 usuarios |
| 1.4 | **Tipo de acceso** | Sistema interno (intranet), solo para empleados con distintos permisos de acceso |
| 1.5 | **Compliance** | No hay requisitos formales, pero sí seguridad entre usuarios. Se busca hacer lo mejor posible |
| 1.6 | **Presupuesto** | No definido, pero debe ser razonable para el tamaño de la empresa |

---

## 2. 👥 Equipo y Capacidades

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 2.1 | **Desarrolladores** | 1 desarrollador: Julian Propato |
| 2.2 | **Stack actual** | Ninguno en desarrollos actuales (usan Google Sheets básico). El desarrollador se apoya principalmente en LLMs e IA |
| 2.3 | **Experiencia DevOps** | Sí |
| 2.4 | **Personal adicional** | No de momento |
| 2.5 | **Preferencias tecnológicas** | Sin preferencias específicas. Se busca algo de mercado, con mucha documentación, sencillo, simple pero robusto |

---

## 3. 🔧 Funcionalidades Clave

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 3.1 | **Módulos principales** | Ver detalle abajo |
| 3.2 | **Autenticación** | No super avanzada, pero robusta |
| 3.3 | **Integraciones** | Sí, con N8N para automatizaciones. APIs para obtener datos (clientes, presupuestos, etc.) |
| 3.4 | **Tiempo real** | No clarificado (no es requisito crítico) |
| 3.5 | **Archivos pesados** | No muy pesados, pero se subirán imágenes desde teléfonos móviles (tickets y obras) |
| 3.6 | **Reportes/Analytics** | Dashboard con métricas sencillas pero visuales |

### Detalle de Módulos (3.1)

```
📁 MÓDULOS DEL SISTEMA BAUMAN
├── 🔐 Seguridad
│   ├── Gestión de usuarios
│   ├── Roles
│   └── Permisos
│
├── 📋 Maestros
│   ├── Clientes
│   ├── Sucursales (por cliente)
│   ├── Zonas
│   ├── Empleados
│   └── Vehículos de la empresa
│
├── 🎫 Tickets
│   ├── Tickets de mantenimiento (asociados a sedes)
│   ├── Manejo de estados
│   └── Notificaciones
│
├── 🏗️ Obras
│   ├── Entidad obras
│   ├── Presupuestos en PDF
│   ├── Maestro de artículos
│   └── Listas de precios
│
└── 💰 Finanzas
    ├── Cuentas bancarias
    ├── Tarjetas de empleados
    ├── Registro de gastos / tipos de gastos
    ├── Saldos e inversiones
    ├── Compras y ventas
    ├── Facturas
    ├── Rendición de gastos de empleados
    └── Exportación de datos
```

---

## 4. 📊 Datos y Persistencia

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 4.1 | **Volumen estimado** | No debe superar 10GB de BD |
| 4.2 | **Tipo de datos** | Principalmente relacionales |
| 4.3 | **Full-text search** | No clarificado |
| 4.4 | **Caching** | No especificado |
| 4.5 | **Auditoría** | No especificado |
| 4.6 | **Backups** | Lo manejará el hosting automáticamente |

---

## 5. 🚀 Despliegue e Infraestructura

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 5.1 | **Modelo** | Cloud |
| 5.2 | **Proveedor preferido** | Sin preferencia, se han evaluado VPS |
| 5.3 | **Servidor existente** | No |
| 5.4 | **Alta disponibilidad** | Sí (asumido como deseable) |
| 5.5 | **Región geográfica** | No especificado (asumir Argentina/LATAM) |
| 5.6 | **CDN** | No clarificado |

---

## 6. 📈 Escalabilidad

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 6.1 | **Picos predecibles** | No hay picos predecibles |
| 6.2 | **Tipo de crecimiento** | Lineal esperado, sin proyección definida |
| 6.3 | **Escalado automático** | No clarificado |
| 6.4 | **Partes con más carga** | Tickets/Obras y Finanzas (carga de gastos, facturas) |

---

## 7. 🔒 Seguridad

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 7.1 | **Nivel requerido** | Básico a medio |
| 7.2 | **Datos sensibles** | Financieros propios basados en carga manual |
| 7.3 | **Encriptación** | No especificado |
| 7.4 | **Penetration testing** | No requerido |

---

## 8. 🛠️ Mantenimiento y Operaciones

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 8.1 | **Responsable operación** | No definido |
| 8.2 | **Monitoreo 24/7** | No requerido |
| 8.3 | **Ventana de mantenimiento** | 1-2 días en fin de semana |
| 8.4 | **Zero-downtime deploys** | No requerido |

---

## 📌 Resumen Ejecutivo

**Sistema Bauman** es un ERP interno para una empresa de construcción con:
- 👥 5-30 usuarios máximo
- 📦 5 módulos principales (Seguridad, Maestros, Tickets, Obras, Finanzas)
- 🔧 1 desarrollador full-stack apoyado en IA
- ☁️ Despliegue en cloud (VPS)
- 💾 BD relacional < 10GB
- 🔐 Seguridad básica-media con roles y permisos
