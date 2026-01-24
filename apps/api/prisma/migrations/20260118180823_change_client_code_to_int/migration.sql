/*
  Warnings:

  - Changed the type of `codigo` on the `clientes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "codigo",
ADD COLUMN     "codigo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");
