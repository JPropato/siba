-- AlterEnum
ALTER TYPE "CategoriaEgreso" ADD VALUE 'TRANSFERENCIA_SALIDA';

-- AlterEnum
ALTER TYPE "CategoriaIngreso" ADD VALUE 'TRANSFERENCIA_ENTRADA';

-- AlterTable
ALTER TABLE "movimientos" ADD COLUMN     "transferencia_ref" TEXT;
