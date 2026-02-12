-- CreateEnum
CREATE TYPE "TipoTarjeta" AS ENUM ('PRECARGABLE', 'CORPORATIVA');

-- CreateEnum
CREATE TYPE "EstadoTarjeta" AS ENUM ('ACTIVA', 'SUSPENDIDA', 'BAJA');

-- CreateEnum
CREATE TYPE "CategoriaGastoTarjeta" AS ENUM ('GAS', 'FERRETERIA', 'ESTACIONAMIENTO', 'LAVADERO', 'NAFTA', 'REPUESTOS', 'MATERIALES_ELECTRICOS', 'PEAJES', 'COMIDA', 'HERRAMIENTAS', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoRendicion" AS ENUM ('ABIERTA', 'CERRADA', 'APROBADA', 'RECHAZADA');

-- CreateTable: config_categorias_gasto
CREATE TABLE "config_categorias_gasto" (
    "id" SERIAL NOT NULL,
    "categoria" "CategoriaGastoTarjeta" NOT NULL,
    "label" TEXT NOT NULL,
    "cuenta_contable_id" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_categorias_gasto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "config_categorias_gasto_categoria_key" ON "config_categorias_gasto"("categoria");

-- CreateTable: tarjetas_precargables
CREATE TABLE "tarjetas_precargables" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoTarjeta" NOT NULL,
    "estado" "EstadoTarjeta" NOT NULL DEFAULT 'ACTIVA',
    "numero_tarjeta" TEXT,
    "alias" TEXT,
    "empleado_id" INTEGER NOT NULL,
    "cuenta_financiera_id" INTEGER NOT NULL,
    "banco_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "tarjetas_precargables_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tarjetas_precargables_numero_tarjeta_key" ON "tarjetas_precargables"("numero_tarjeta");
CREATE INDEX "tarjetas_precargables_empleado_id_idx" ON "tarjetas_precargables"("empleado_id");
CREATE INDEX "tarjetas_precargables_tipo_idx" ON "tarjetas_precargables"("tipo");
CREATE INDEX "tarjetas_precargables_estado_idx" ON "tarjetas_precargables"("estado");

-- CreateTable: cargas_tarjeta
CREATE TABLE "cargas_tarjeta" (
    "id" SERIAL NOT NULL,
    "tarjeta_id" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "comprobante" TEXT,
    "movimiento_id" INTEGER NOT NULL,
    "registrado_por_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargas_tarjeta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cargas_tarjeta_movimiento_id_key" ON "cargas_tarjeta"("movimiento_id");
CREATE INDEX "cargas_tarjeta_tarjeta_id_idx" ON "cargas_tarjeta"("tarjeta_id");
CREATE INDEX "cargas_tarjeta_fecha_idx" ON "cargas_tarjeta"("fecha");

-- CreateTable: gastos_tarjeta
CREATE TABLE "gastos_tarjeta" (
    "id" SERIAL NOT NULL,
    "tarjeta_id" INTEGER NOT NULL,
    "categoria" "CategoriaGastoTarjeta" NOT NULL,
    "categoria_otro" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "ticket_id" INTEGER,
    "centro_costo_id" INTEGER,
    "movimiento_id" INTEGER NOT NULL,
    "rendicion_id" INTEGER,
    "registrado_por_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_tarjeta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gastos_tarjeta_movimiento_id_key" ON "gastos_tarjeta"("movimiento_id");
CREATE INDEX "gastos_tarjeta_tarjeta_id_idx" ON "gastos_tarjeta"("tarjeta_id");
CREATE INDEX "gastos_tarjeta_categoria_idx" ON "gastos_tarjeta"("categoria");
CREATE INDEX "gastos_tarjeta_fecha_idx" ON "gastos_tarjeta"("fecha");
CREATE INDEX "gastos_tarjeta_rendicion_id_idx" ON "gastos_tarjeta"("rendicion_id");

-- CreateTable: rendiciones
CREATE TABLE "rendiciones" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "tarjeta_id" INTEGER NOT NULL,
    "estado" "EstadoRendicion" NOT NULL DEFAULT 'ABIERTA',
    "fecha_desde" TIMESTAMP(3) NOT NULL,
    "fecha_hasta" TIMESTAMP(3) NOT NULL,
    "total_gastos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cantidad_gastos" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "motivo_rechazo" TEXT,
    "aprobado_por_id" INTEGER,
    "fecha_aprobacion" TIMESTAMP(3),
    "creado_por_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rendiciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rendiciones_codigo_key" ON "rendiciones"("codigo");
CREATE INDEX "rendiciones_tarjeta_id_idx" ON "rendiciones"("tarjeta_id");
CREATE INDEX "rendiciones_estado_idx" ON "rendiciones"("estado");

-- AlterTable: archivos (add gasto_tarjeta_id)
ALTER TABLE "archivos" ADD COLUMN "gasto_tarjeta_id" INTEGER;
CREATE INDEX "archivos_gasto_tarjeta_id_idx" ON "archivos"("gasto_tarjeta_id");

-- AddForeignKey
ALTER TABLE "config_categorias_gasto" ADD CONSTRAINT "config_categorias_gasto_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tarjetas_precargables" ADD CONSTRAINT "tarjetas_precargables_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tarjetas_precargables" ADD CONSTRAINT "tarjetas_precargables_cuenta_financiera_id_fkey" FOREIGN KEY ("cuenta_financiera_id") REFERENCES "cuentas_financieras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tarjetas_precargables" ADD CONSTRAINT "tarjetas_precargables_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cargas_tarjeta" ADD CONSTRAINT "cargas_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas_precargables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cargas_tarjeta" ADD CONSTRAINT "cargas_tarjeta_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cargas_tarjeta" ADD CONSTRAINT "cargas_tarjeta_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas_precargables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_centro_costo_id_fkey" FOREIGN KEY ("centro_costo_id") REFERENCES "centros_costo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_rendicion_id_fkey" FOREIGN KEY ("rendicion_id") REFERENCES "rendiciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rendiciones" ADD CONSTRAINT "rendiciones_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas_precargables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rendiciones" ADD CONSTRAINT "rendiciones_aprobado_por_id_fkey" FOREIGN KEY ("aprobado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rendiciones" ADD CONSTRAINT "rendiciones_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "archivos" ADD CONSTRAINT "archivos_gasto_tarjeta_id_fkey" FOREIGN KEY ("gasto_tarjeta_id") REFERENCES "gastos_tarjeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
