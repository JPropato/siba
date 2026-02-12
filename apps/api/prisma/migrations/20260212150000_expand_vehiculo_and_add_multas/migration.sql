-- CreateEnum
CREATE TYPE "TipoMultaVehiculo" AS ENUM ('ARBA_PATENTE', 'INFRACCION_CABA', 'INFRACCION_PROVINCIA');

-- CreateEnum
CREATE TYPE "EstadoMultaVehiculo" AS ENUM ('PENDIENTE', 'PAGADA', 'EN_GESTION');

-- AlterTable
ALTER TABLE "vehiculos" ADD COLUMN "fecha_cambio_aceite" TIMESTAMP(3),
ADD COLUMN "proximos_km" INTEGER,
ADD COLUMN "proximo_service" TIMESTAMP(3),
ADD COLUMN "tecnico_referente_id" INTEGER,
ADD COLUMN "tecnico_id" INTEGER,
ADD COLUMN "conductor_id" INTEGER;

-- CreateTable
CREATE TABLE "multas_vehiculo" (
    "id" SERIAL NOT NULL,
    "vehiculo_id" INTEGER NOT NULL,
    "tipo" "TipoMultaVehiculo" NOT NULL,
    "estado" "EstadoMultaVehiculo" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "numero_acta" TEXT,
    "descripcion" TEXT,
    "fecha_pago" TIMESTAMP(3),
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multas_vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "multas_vehiculo_vehiculo_id_idx" ON "multas_vehiculo"("vehiculo_id");
CREATE INDEX "multas_vehiculo_tipo_idx" ON "multas_vehiculo"("tipo");
CREATE INDEX "multas_vehiculo_estado_idx" ON "multas_vehiculo"("estado");
CREATE INDEX "multas_vehiculo_fecha_idx" ON "multas_vehiculo"("fecha");

-- CreateIndex vehiculos
CREATE INDEX "vehiculos_tecnico_referente_id_idx" ON "vehiculos"("tecnico_referente_id");
CREATE INDEX "vehiculos_tecnico_id_idx" ON "vehiculos"("tecnico_id");
CREATE INDEX "vehiculos_conductor_id_idx" ON "vehiculos"("conductor_id");

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_tecnico_referente_id_fkey" FOREIGN KEY ("tecnico_referente_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_conductor_id_fkey" FOREIGN KEY ("conductor_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "multas_vehiculo" ADD CONSTRAINT "multas_vehiculo_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
