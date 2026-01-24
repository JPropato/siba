---
description: Actualizar la documentación de la base de datos (ERD, SQL Export, DBML) tras cambios en el schema.prisma
---

Sigue estos pasos para mantener la documentación de la base de datos sincronizada con el código:

1.  **Analizar el esquema actual**:
    - Lee el contenido de `apps/api/prisma/schema.prisma` para entender los últimos cambios en el modelo de datos.

2.  **Actualizar Diagrama Mermaid (ERD)**:
    - Genera el código Mermaid actualizado reflejando todas las entidades, campos y relaciones.
    - Sobreescribe el archivo `docs/ERD_Schema.md` con el nuevo diagrama.
    - Asegúrate de usar la sintaxis `erDiagram` y de incluir tipos de datos y claves (PK, FK, UK).

3.  **Actualizar Exportación SQL**:
    - Genera el DDL SQL completo (CREATE TABLE, índices, FKs) equivalente al esquema actual.
    - Puedes basarte en `schema.prisma` y revisar las carpetas de `apps/api/prisma/migrations` para asegurar la precisión de los tipos de datos de PostgreSQL.
    - Sobreescribe el archivo `docs/schema_export.sql`.

4.  **Actualizar Definición DBML**:
    - Genera la definición DBML actualizada basada en `schema.prisma`.
    - Sobreescribe el archivo `docs/schema.dbml`.
    - Incluye definiciones de tablas, columnas con sus tipos y propiedades (pk, unique, not null, default), e índices.
    - Define las relaciones (Refs) al final del archivo.

5.  **Confirmación**:
    - Notifica al usuario que la documentación ha sido actualizada.
