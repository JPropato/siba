-- Migrate contratacion data to tipoContrato
UPDATE "empleados"
SET "tipo_contrato" = 'RELACION_DEPENDENCIA'
WHERE "contratacion" = 'CONTRATO_MARCO'
  AND "tipo_contrato" IS NULL;

-- Drop the deprecated column
ALTER TABLE "empleados" DROP COLUMN "contratacion";

-- Drop the deprecated enum
DROP TYPE "TipoContratacion";
