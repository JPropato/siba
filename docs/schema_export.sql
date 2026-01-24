-- SQL Export for SIBA Database
-- Generated from schema.prisma

-- ============ ENUMS ============

CREATE TYPE "TipoEmpleado" AS ENUM ('TECNICO', 'ADMINISTRATIVO', 'GERENTE');
CREATE TYPE "TipoContratacion" AS ENUM ('CONTRATO_MARCO');

-- ============ SEGURIDAD ============

CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "clave_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "ultimo_acceso" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "modulo" TEXT NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usuario_roles" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "fecha_asignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rol_permisos" (
    "id" SERIAL NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("id")
);

-- ============ MAESTROS ============

CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion_fiscal" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "zonas" (
    "id" SERIAL NOT NULL,
    "codigo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sucursales" (
    "id" SERIAL NOT NULL,
    "codigo_interno" SERIAL NOT NULL,
    "codigo_externo" TEXT,
    "cliente_id" INTEGER NOT NULL,
    "zona_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "contacto_nombre" TEXT,
    "contacto_telefono" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehiculos" (
    "id" SERIAL NOT NULL,
    "codigo_interno" SERIAL NOT NULL,
    "zona_id" INTEGER,
    "patente" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "anio" INTEGER,
    "tipo" TEXT,
    "kilometros" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "materiales" (
    "id" SERIAL NOT NULL,
    "codigo_interno" SERIAL NOT NULL,
    "codigo_articulo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "presentacion" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "categoria" TEXT,
    "stock_minimo" DOUBLE PRECISION DEFAULT 0,
    "precio_costo" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "porcentaje_rentabilidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "historial_precios" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "precio_costo" DECIMAL(10, 2) NOT NULL,
    "precio_venta" DECIMAL(10, 2) NOT NULL,
    "porcentaje_rentabilidad" DOUBLE PRECISION NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_precios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "inicio_relacion_laboral" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoEmpleado" NOT NULL,
    "contratacion" "TipoContratacion" NOT NULL,
    "zona_id" INTEGER,
    "usuario_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- ============ INDICES & UNIQUES ============

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");
CREATE UNIQUE INDEX "usuario_roles_usuario_id_rol_id_key" ON "usuario_roles"("usuario_id", "rol_id");
CREATE UNIQUE INDEX "rol_permisos_rol_id_permiso_id_key" ON "rol_permisos"("rol_id", "permiso_id");
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");
CREATE UNIQUE INDEX "clientes_cuit_key" ON "clientes"("cuit");
CREATE UNIQUE INDEX "zonas_codigo_key" ON "zonas"("codigo");
CREATE UNIQUE INDEX "zonas_nombre_key" ON "zonas"("nombre");
CREATE UNIQUE INDEX "sucursales_codigo_interno_key" ON "sucursales"("codigo_interno");
CREATE UNIQUE INDEX "vehiculos_codigo_interno_key" ON "vehiculos"("codigo_interno");
CREATE UNIQUE INDEX "vehiculos_patente_key" ON "vehiculos"("patente");
CREATE UNIQUE INDEX "materiales_codigo_interno_key" ON "materiales"("codigo_interno");
CREATE UNIQUE INDEX "materiales_codigo_articulo_key" ON "materiales"("codigo_articulo");
CREATE UNIQUE INDEX "empleados_email_key" ON "empleados"("email");
CREATE UNIQUE INDEX "empleados_usuario_id_key" ON "empleados"("usuario_id");

-- ============ FOREIGN KEYS ============

ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "empleados" ADD CONSTRAINT "empleados_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
