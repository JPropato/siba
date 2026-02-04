/*
  Warnings:

  - The values [PROGRAMADO] on the enum `EstadoTicket` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `prioridad` on the `tickets` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoTicket" AS ENUM ('SEA', 'SEP', 'SN');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoTicket_new" AS ENUM ('NUEVO', 'ASIGNADO', 'EN_CURSO', 'PENDIENTE_CLIENTE', 'FINALIZADO', 'CANCELADO');
ALTER TABLE "tickets" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "tickets" ALTER COLUMN "estado" TYPE "EstadoTicket_new" USING ("estado"::text::"EstadoTicket_new");
ALTER TYPE "EstadoTicket" RENAME TO "EstadoTicket_old";
ALTER TYPE "EstadoTicket_new" RENAME TO "EstadoTicket";
DROP TYPE "EstadoTicket_old";
ALTER TABLE "tickets" ALTER COLUMN "estado" SET DEFAULT 'NUEVO';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RubroTicket" ADD VALUE 'REFRIGERACION';
ALTER TYPE "RubroTicket" ADD VALUE 'LIMPIEZA';
ALTER TYPE "RubroTicket" ADD VALUE 'TERMINACIONES';

-- AlterTable
ALTER TABLE "sucursales" ADD COLUMN     "area_interna" TEXT,
ADD COLUMN     "imagen_sucursal" TEXT,
ADD COLUMN     "metros_cuadrados" DOUBLE PRECISION,
ADD COLUMN     "region_operativa" TEXT,
ADD COLUMN     "uso_destino" TEXT;

-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "prioridad",
ADD COLUMN     "hora_ejecucion" TIMESTAMP(3),
ADD COLUMN     "motivo_rechazo" TEXT,
ADD COLUMN     "tipo_ticket" "TipoTicket" NOT NULL DEFAULT 'SN';

-- DropEnum
DROP TYPE "PrioridadTicket";
