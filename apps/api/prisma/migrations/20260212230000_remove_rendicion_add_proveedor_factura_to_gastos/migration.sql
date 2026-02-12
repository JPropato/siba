-- AlterTable gastos_tarjeta: remove rendicion_id, add proveedor_id and factura_proveedor_id

-- Drop foreign key constraint for rendicion_id
ALTER TABLE "gastos_tarjeta" DROP CONSTRAINT IF EXISTS "gastos_tarjeta_rendicion_id_fkey";

-- Drop index for rendicion_id
DROP INDEX IF EXISTS "gastos_tarjeta_rendicion_id_idx";

-- Drop rendicion_id column
ALTER TABLE "gastos_tarjeta" DROP COLUMN IF EXISTS "rendicion_id";

-- Add proveedor_id column
ALTER TABLE "gastos_tarjeta" ADD COLUMN "proveedor_id" INTEGER;

-- Add factura_proveedor_id column
ALTER TABLE "gastos_tarjeta" ADD COLUMN "factura_proveedor_id" INTEGER;

-- Add index on proveedor_id
CREATE INDEX "gastos_tarjeta_proveedor_id_idx" ON "gastos_tarjeta"("proveedor_id");

-- Add foreign key constraints
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_factura_proveedor_id_fkey" FOREIGN KEY ("factura_proveedor_id") REFERENCES "facturas_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
