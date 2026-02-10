-- AlterTable
ALTER TABLE "empleados" ADD COLUMN     "fecha_vencimiento_seguro" TIMESTAMP(3),
ADD COLUMN     "fecha_vencimiento_vtv" TIMESTAMP(3),
ADD COLUMN     "notas" TEXT;
