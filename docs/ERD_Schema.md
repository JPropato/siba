# Entity Relationship Diagram (ERD)

Based on `apps/api/prisma/schema.prisma`.

```mermaid
erDiagram
    Usuario ||--o| Empleado : "linked to"
    Usuario ||--o{ UsuarioRol : "has roles"
    Rol ||--o{ UsuarioRol : "assigned to"
    Rol ||--o{ RolPermiso : "has permissions"
    Permiso ||--o{ RolPermiso : "assigned to"

    Cliente ||--o{ Sucursal : "has branches"
    Zona ||--o{ Sucursal : "contains branches"
    Zona ||--o{ Vehiculo : "assigned vehicles"
    Zona ||--o{ Empleado : "assigned employees"
    Material ||--o{ HistorialPrecio : "price history"

    Usuario {
        Int id PK
        String email UK
        String claveHash
        String nombre
        String apellido
        DateTime ultimoAcceso
        DateTime fechaCreacion
        DateTime fechaActualizacion
        DateTime fechaEliminacion
    }

    Rol {
        Int id PK
        String nombre UK
        String descripcion
        DateTime fechaCreacion
        DateTime fechaEliminacion
    }

    Permiso {
        Int id PK
        String codigo UK
        String descripcion
        String modulo
    }

    UsuarioRol {
        Int id PK
        Int usuarioId FK
        Int rolId FK
        DateTime fechaAsignacion
    }

    RolPermiso {
        Int id PK
        Int rolId FK
        Int permisoId FK
    }

    Cliente {
        Int id PK
        Int codigo UK
        String razonSocial
        String cuit UK
        String telefono
        String email
        String direccionFiscal
        DateTime fechaCreacion
        DateTime fechaActualizacion
        DateTime fechaEliminacion
    }

    Zona {
        Int id PK
        Int codigo UK
        String nombre UK
        String descripcion
        DateTime fechaCreacion
        DateTime fechaEliminacion
    }

    Sucursal {
        Int id PK
        Int codigoInterno UK
        String codigoExterno
        Int clienteId FK
        Int zonaId FK
        String nombre
        String direccion
        String telefono
        String contactoNombre
        String contactoTelefono
        DateTime fechaCreacion
        DateTime fechaActualizacion
        DateTime fechaEliminacion
    }

    Vehiculo {
        Int id PK
        Int codigoInterno UK
        Int zonaId FK
        String patente UK
        String marca
        String modelo
        Int anio
        String tipo
        Int kilometros
        String estado "Default: ACTIVO"
        DateTime fechaCreacion
        DateTime fechaActualizacion
        DateTime fechaEliminacion
    }

    Material {
        Int id PK
        Int codigoInterno UK
        String codigoArticulo UK
        String nombre
        String descripcion
        String presentacion
        String unidadMedida
        String categoria
        Float stockMinimo
        Decimal precioCosto
        Float porcentajeRentabilidad
        Decimal precioVenta
        DateTime fechaCreacion
        DateTime fechaActualizacion
        DateTime fechaEliminacion
    }

    HistorialPrecio {
        Int id PK
        Int materialId FK
        Decimal precioCosto
        Decimal precioVenta
        Float porcentajeRentabilidad
        DateTime fechaCambio
    }

    Empleado {
        Int id PK
        String nombre
        String apellido
        String email UK
        String direccion
        String telefono
        DateTime inicioRelacionLaboral
        TipoEmpleado tipo "TECNICO ADMINISTRATIVO GERENTE"
        TipoContratacion contratacion "CONTRATO_MARCO"
        Int zonaId FK
        Int usuarioId FK UK
        DateTime fechaCreacion
        DateTime fechaActualizacion
        DateTime fechaEliminacion
    }
```

## Enums

| Enum               | Values                           |
| ------------------ | -------------------------------- |
| `TipoEmpleado`     | TECNICO, ADMINISTRATIVO, GERENTE |
| `TipoContratacion` | CONTRATO_MARCO                   |
