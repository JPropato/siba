/*
  Warnings:

  - You are about to drop the column `fecha_vencimiento_vtv` on the `empleados` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "empleados" DROP COLUMN "fecha_vencimiento_vtv",
ADD COLUMN     "fecha_vencimiento_registro" TIMESTAMP(3);
