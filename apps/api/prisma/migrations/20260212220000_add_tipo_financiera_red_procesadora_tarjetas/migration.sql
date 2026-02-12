-- CreateEnum
CREATE TYPE "TipoTarjetaFinanciera" AS ENUM ('CREDITO', 'DEBITO', 'PREPAGA');

-- CreateEnum
CREATE TYPE "RedProcesadora" AS ENUM ('VISA', 'MASTERCARD', 'CABAL', 'NARANJA', 'AMERICAN_EXPRESS', 'MAESTRO');

-- AlterTable
ALTER TABLE "tarjetas_precargables"
ADD COLUMN "tipo_tarjeta_financiera" "TipoTarjetaFinanciera",
ADD COLUMN "red_procesadora" "RedProcesadora";
