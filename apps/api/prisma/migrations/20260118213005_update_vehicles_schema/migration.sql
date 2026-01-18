/*
  Warnings:

  - A unique constraint covering the columns `[codigo_interno]` on the table `sucursales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigo_interno]` on the table `vehiculos` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[codigo]` on the table `zonas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fecha_actualizacion` to the `vehiculos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "vehiculos" DROP CONSTRAINT "vehiculos_zona_id_fkey";

-- AlterTable
ALTER TABLE "sucursales" ADD COLUMN     "codigo_externo" TEXT,
ADD COLUMN     "codigo_interno" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "vehiculos" ADD COLUMN     "codigo_interno" SERIAL NOT NULL,
ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
ADD COLUMN     "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "kilometros" INTEGER,
ALTER COLUMN "zona_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "zonas" ADD COLUMN     "codigo" SERIAL NOT NULL;

-- CreateTable
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
    "precio_costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "porcentaje_rentabilidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_precios" (
    "id" SERIAL NOT NULL,
    "material_id" INTEGER NOT NULL,
    "precio_costo" DECIMAL(10,2) NOT NULL,
    "precio_venta" DECIMAL(10,2) NOT NULL,
    "porcentaje_rentabilidad" DOUBLE PRECISION NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_precios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materiales_codigo_interno_key" ON "materiales"("codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "materiales_codigo_articulo_key" ON "materiales"("codigo_articulo");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_codigo_interno_key" ON "sucursales"("codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_codigo_interno_key" ON "vehiculos"("codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_codigo_key" ON "zonas"("codigo");

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
