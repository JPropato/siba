-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('CAJA_CHICA', 'CUENTA_CORRIENTE', 'CAJA_AHORRO', 'BILLETERA_VIRTUAL', 'INVERSION');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'MERCADOPAGO');

-- CreateEnum
CREATE TYPE "CategoriaIngreso" AS ENUM ('COBRO_FACTURA', 'ANTICIPO_CLIENTE', 'REINTEGRO', 'RENDIMIENTO_INVERSION', 'RESCATE_INVERSION', 'OTRO_INGRESO');

-- CreateEnum
CREATE TYPE "CategoriaEgreso" AS ENUM ('MATERIALES', 'MANO_DE_OBRA', 'COMBUSTIBLE', 'HERRAMIENTAS', 'VIATICOS', 'SUBCONTRATISTA', 'IMPUESTOS', 'SERVICIOS', 'TRASPASO_INVERSION', 'OTRO_EGRESO');

-- CreateEnum
CREATE TYPE "EstadoMovimiento" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'CONCILIADO', 'ANULADO');

-- CreateTable
CREATE TABLE "bancos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_corto" TEXT NOT NULL,
    "logo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bancos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_financieras" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "banco_id" INTEGER,
    "numero_cuenta" TEXT,
    "cbu" TEXT,
    "alias" TEXT,
    "saldo_inicial" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_actual" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "tipo_inversion" TEXT,
    "tasa_anual" DECIMAL(6,4),
    "fecha_vencimiento" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_financieras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "categoria_ingreso" "CategoriaIngreso",
    "categoria_egreso" "CategoriaEgreso",
    "medio_pago" "MedioPago" NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'ARS',
    "descripcion" TEXT NOT NULL,
    "comprobante" TEXT,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuenta_id" INTEGER NOT NULL,
    "cliente_id" INTEGER,
    "ticket_id" INTEGER,
    "obra_id" INTEGER,
    "empleado_id" INTEGER,
    "estado" "EstadoMovimiento" NOT NULL DEFAULT 'PENDIENTE',
    "registrado_por_id" INTEGER NOT NULL,
    "importacion_id" INTEGER,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importaciones_masivas" (
    "id" SERIAL NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "total_registros" INTEGER NOT NULL,
    "registros_ok" INTEGER NOT NULL DEFAULT 0,
    "registros_error" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'PROCESANDO',
    "errores" TEXT,
    "fecha_importacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" INTEGER NOT NULL,

    CONSTRAINT "importaciones_masivas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bancos_codigo_key" ON "bancos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "bancos_nombre_key" ON "bancos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_financieras_cbu_key" ON "cuentas_financieras"("cbu");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_codigo_key" ON "movimientos"("codigo");

-- CreateIndex
CREATE INDEX "movimientos_fecha_movimiento_idx" ON "movimientos"("fecha_movimiento");

-- CreateIndex
CREATE INDEX "movimientos_cuenta_id_idx" ON "movimientos"("cuenta_id");

-- CreateIndex
CREATE INDEX "movimientos_tipo_idx" ON "movimientos"("tipo");

-- CreateIndex
CREATE INDEX "movimientos_estado_idx" ON "movimientos"("estado");

-- AddForeignKey
ALTER TABLE "cuentas_financieras" ADD CONSTRAINT "cuentas_financieras_banco_id_fkey" FOREIGN KEY ("banco_id") REFERENCES "bancos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas_financieras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_importacion_id_fkey" FOREIGN KEY ("importacion_id") REFERENCES "importaciones_masivas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importaciones_masivas" ADD CONSTRAINT "importaciones_masivas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
