/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.
  - The required column `codigo` was added to the `clientes` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "codigo" TEXT NOT NULL,
ALTER COLUMN "cuit" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");
