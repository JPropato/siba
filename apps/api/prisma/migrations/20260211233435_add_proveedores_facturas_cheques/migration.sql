-- CreateEnum
CREATE TYPE "CondicionIva" AS ENUM ('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'NO_RESPONSABLE', 'CONSUMIDOR_FINAL');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_CREDITO_A', 'NOTA_CREDITO_B', 'NOTA_CREDITO_C', 'NOTA_DEBITO_A', 'NOTA_DEBITO_B', 'NOTA_DEBITO_C', 'RECIBO', 'TICKET', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoFacturaProveedor" AS ENUM ('PENDIENTE', 'PAGO_PARCIAL', 'PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoCheque" AS ENUM ('FISICO', 'ECHEQ');

-- CreateEnum
CREATE TYPE "EstadoCheque" AS ENUM ('CARTERA', 'DEPOSITADO', 'COBRADO', 'ENDOSADO', 'RECHAZADO', 'ANULADO');

-- AlterEnum
ALTER TYPE "MedioPago" ADD VALUE 'ECHEQ';

-- CreateTable
CREATE TABLE "proveedores" (
    "id" SERIAL NOT NULL,
    "codigo" SERIAL NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "condicion_iva" "CondicionIva" NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "contacto_nombre" TEXT,
    "contacto_telefono" TEXT,
    "notas" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_proveedor" (
    "id" SERIAL NOT NULL,
    "proveedor_id" INTEGER NOT NULL,
    "tipo_comprobante" "TipoComprobante" NOT NULL,
    "punto_venta" INTEGER NOT NULL,
    "numero_comprobante" TEXT NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "monto_iva_21" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_iva_10_5" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_iva_27" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_exento" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_no_gravado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percepcion_iibb" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percepcion_iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otros_impuestos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "retencion_ganancias" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "retencion_iva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "retencion_iibb" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "retencion_suss" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_a_pagar" DECIMAL(12,2) NOT NULL,
    "monto_pagado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoFacturaProveedor" NOT NULL DEFAULT 'PENDIENTE',
    "cuenta_contable_id" INTEGER,
    "centro_costo_id" INTEGER,
    "obra_id" INTEGER,
    "archivo_pdf" TEXT,
    "descripcion" TEXT,
    "registrado_por_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facturas_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_factura" (
    "id" SERIAL NOT NULL,
    "factura_id" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "medio_pago" "MedioPago" NOT NULL,
    "movimiento_id" INTEGER,
    "cheque_id" INTEGER,
    "comprobante_pago" TEXT,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "TipoCheque" NOT NULL,
    "banco_emisor" TEXT NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_cobro" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "beneficiario" TEXT,
    "emisor" TEXT,
    "estado" "EstadoCheque" NOT NULL DEFAULT 'CARTERA',
    "cuenta_destino_id" INTEGER,
    "fecha_deposito" TIMESTAMP(3),
    "fecha_acreditacion" TIMESTAMP(3),
    "endosado_a" TEXT,
    "fecha_endoso" TIMESTAMP(3),
    "motivo_rechazo" TEXT,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cheques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_codigo_key" ON "proveedores"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_cuit_key" ON "proveedores"("cuit");

-- CreateIndex
CREATE INDEX "proveedores_condicion_iva_idx" ON "proveedores"("condicion_iva");

-- CreateIndex
CREATE INDEX "facturas_proveedor_proveedor_id_idx" ON "facturas_proveedor"("proveedor_id");

-- CreateIndex
CREATE INDEX "facturas_proveedor_estado_idx" ON "facturas_proveedor"("estado");

-- CreateIndex
CREATE INDEX "facturas_proveedor_fecha_emision_idx" ON "facturas_proveedor"("fecha_emision");

-- CreateIndex
CREATE INDEX "facturas_proveedor_cuenta_contable_id_idx" ON "facturas_proveedor"("cuenta_contable_id");

-- CreateIndex
CREATE INDEX "facturas_proveedor_centro_costo_id_idx" ON "facturas_proveedor"("centro_costo_id");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_proveedor_proveedor_id_tipo_comprobante_punto_vent_key" ON "facturas_proveedor"("proveedor_id", "tipo_comprobante", "punto_venta", "numero_comprobante");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_factura_movimiento_id_key" ON "pagos_factura"("movimiento_id");

-- CreateIndex
CREATE INDEX "pagos_factura_factura_id_idx" ON "pagos_factura"("factura_id");

-- CreateIndex
CREATE UNIQUE INDEX "cheques_numero_key" ON "cheques"("numero");

-- CreateIndex
CREATE INDEX "cheques_estado_idx" ON "cheques"("estado");

-- CreateIndex
CREATE INDEX "cheques_fecha_cobro_idx" ON "cheques"("fecha_cobro");

-- CreateIndex
CREATE INDEX "cheques_tipo_idx" ON "cheques"("tipo");

-- AddForeignKey
ALTER TABLE "facturas_proveedor" ADD CONSTRAINT "facturas_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_proveedor" ADD CONSTRAINT "facturas_proveedor_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_proveedor" ADD CONSTRAINT "facturas_proveedor_centro_costo_id_fkey" FOREIGN KEY ("centro_costo_id") REFERENCES "centros_costo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_proveedor" ADD CONSTRAINT "facturas_proveedor_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_proveedor" ADD CONSTRAINT "facturas_proveedor_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_factura" ADD CONSTRAINT "pagos_factura_factura_id_fkey" FOREIGN KEY ("factura_id") REFERENCES "facturas_proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_factura" ADD CONSTRAINT "pagos_factura_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_factura" ADD CONSTRAINT "pagos_factura_cheque_id_fkey" FOREIGN KEY ("cheque_id") REFERENCES "cheques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheques" ADD CONSTRAINT "cheques_cuenta_destino_id_fkey" FOREIGN KEY ("cuenta_destino_id") REFERENCES "cuentas_financieras"("id") ON DELETE SET NULL ON UPDATE CASCADE;
