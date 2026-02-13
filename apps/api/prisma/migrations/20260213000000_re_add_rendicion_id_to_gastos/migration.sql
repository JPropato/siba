-- Re-add rendicion_id to gastos_tarjeta (was removed in migration 20260212230000 but still needed)

-- Add rendicion_id column
ALTER TABLE "gastos_tarjeta" ADD COLUMN "rendicion_id" INTEGER;

-- Add index on rendicion_id
CREATE INDEX "gastos_tarjeta_rendicion_id_idx" ON "gastos_tarjeta"("rendicion_id");

-- Add foreign key constraint
ALTER TABLE "gastos_tarjeta" ADD CONSTRAINT "gastos_tarjeta_rendicion_id_fkey" FOREIGN KEY ("rendicion_id") REFERENCES "rendiciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
