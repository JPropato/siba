-- CreateEnum
CREATE TYPE "TipoObra" AS ENUM ('OBRA_MAYOR', 'SERVICIO_MENOR');

-- CreateEnum
CREATE TYPE "EstadoObra" AS ENUM ('BORRADOR', 'PRESUPUESTADO', 'APROBADO', 'RECHAZADO', 'EN_EJECUCION', 'FINALIZADO', 'FACTURADO');

-- CreateEnum
CREATE TYPE "TipoItemPresupuesto" AS ENUM ('MATERIAL', 'MANO_DE_OBRA', 'TERCERO', 'OTRO');

-- CreateEnum
CREATE TYPE "ModoEjecucion" AS ENUM ('CON_PRESUPUESTO', 'EJECUCION_DIRECTA');

-- CreateTable
CREATE TABLE "obras" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoObra" NOT NULL,
    "modo_ejecucion" "ModoEjecucion" NOT NULL DEFAULT 'CON_PRESUPUESTO',
    "estado" "EstadoObra" NOT NULL DEFAULT 'BORRADOR',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL,
    "fecha_inicio_estimada" TIMESTAMP(3),
    "fecha_fin_estimada" TIMESTAMP(3),
    "fecha_inicio_real" TIMESTAMP(3),
    "fecha_fin_real" TIMESTAMP(3),
    "cliente_id" INTEGER NOT NULL,
    "sucursal_id" INTEGER,
    "ticket_id" INTEGER,
    "monto_presupuestado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_gastado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "condiciones_pago" TEXT,
    "validez_dias" INTEGER DEFAULT 30,
    "numero_factura" TEXT,
    "fecha_facturacion" TIMESTAMP(3),
    "creado_por_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "versiones_presupuesto" (
    "id" SERIAL NOT NULL,
    "obra_id" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "es_vigente" BOOLEAN NOT NULL DEFAULT true,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "archivo_pdf_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versiones_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_presupuesto" (
    "id" SERIAL NOT NULL,
    "version_id" INTEGER NOT NULL,
    "tipo" "TipoItemPresupuesto" NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "unidad" TEXT NOT NULL,
    "costo_unitario" DECIMAL(12,2) NOT NULL,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "material_id" INTEGER,

    CONSTRAINT "items_presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos_obra" (
    "id" SERIAL NOT NULL,
    "obra_id" INTEGER NOT NULL,
    "tipo_archivo" TEXT NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "nombre_storage" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "url" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_obra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "obras_codigo_key" ON "obras"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "obras_ticket_id_key" ON "obras"("ticket_id");

-- CreateIndex
CREATE INDEX "obras_cliente_id_idx" ON "obras"("cliente_id");

-- CreateIndex
CREATE INDEX "obras_estado_idx" ON "obras"("estado");

-- CreateIndex
CREATE INDEX "obras_fecha_solicitud_idx" ON "obras"("fecha_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "versiones_presupuesto_obra_id_version_key" ON "versiones_presupuesto"("obra_id", "version");

-- CreateIndex
CREATE INDEX "items_presupuesto_version_id_idx" ON "items_presupuesto"("version_id");

-- CreateIndex
CREATE UNIQUE INDEX "archivos_obra_nombre_storage_key" ON "archivos_obra"("nombre_storage");

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obras" ADD CONSTRAINT "obras_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versiones_presupuesto" ADD CONSTRAINT "versiones_presupuesto_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "versiones_presupuesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_presupuesto" ADD CONSTRAINT "items_presupuesto_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos_obra" ADD CONSTRAINT "archivos_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
