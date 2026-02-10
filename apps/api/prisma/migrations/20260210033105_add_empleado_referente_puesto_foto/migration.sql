-- AlterTable
ALTER TABLE "empleados" ADD COLUMN     "es_referente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "foto" TEXT,
ADD COLUMN     "puesto" TEXT;
