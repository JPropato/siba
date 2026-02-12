-- CreateEnum
CREATE TYPE "TipoCuentaContable" AS ENUM ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO');

-- CreateTable: cuentas_contables
CREATE TABLE "cuentas_contables" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuentaContable" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "imputable" BOOLEAN NOT NULL DEFAULT true,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuentas_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable: centros_costo
CREATE TABLE "centros_costo" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "parent_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_costo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_contables_codigo_key" ON "cuentas_contables"("codigo");
CREATE INDEX "cuentas_contables_parent_id_idx" ON "cuentas_contables"("parent_id");
CREATE INDEX "cuentas_contables_tipo_idx" ON "cuentas_contables"("tipo");
CREATE UNIQUE INDEX "centros_costo_codigo_key" ON "centros_costo"("codigo");
CREATE INDEX "centros_costo_parent_id_idx" ON "centros_costo"("parent_id");

-- AddForeignKey
ALTER TABLE "cuentas_contables" ADD CONSTRAINT "cuentas_contables_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "centros_costo" ADD CONSTRAINT "centros_costo_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "centros_costo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- SEED: Plan de Cuentas Contables
-- ============================================================

-- Nivel 1: Rubros principales (no imputables)
INSERT INTO "cuentas_contables" ("codigo", "nombre", "tipo", "nivel", "imputable", "fecha_actualizacion") VALUES
('1', 'Activo', 'ACTIVO', 1, false, NOW()),
('2', 'Pasivo', 'PASIVO', 1, false, NOW()),
('3', 'Patrimonio Neto', 'PATRIMONIO', 1, false, NOW()),
('4', 'Ingresos', 'INGRESO', 1, false, NOW()),
('5', 'Gastos', 'GASTO', 1, false, NOW());

-- Nivel 2: Grupos (no imputables)
INSERT INTO "cuentas_contables" ("codigo", "nombre", "tipo", "nivel", "parent_id", "imputable", "fecha_actualizacion") VALUES
-- ACTIVO
('1.1', 'Activo Corriente', 'ACTIVO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='1'), false, NOW()),
('1.2', 'Activo No Corriente', 'ACTIVO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='1'), false, NOW()),
-- PASIVO
('2.1', 'Pasivo Corriente', 'PASIVO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='2'), false, NOW()),
('2.2', 'Pasivo No Corriente', 'PASIVO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='2'), false, NOW()),
-- PATRIMONIO
('3.1', 'Capital', 'PATRIMONIO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='3'), true, NOW()),
('3.2', 'Resultados Acumulados', 'PATRIMONIO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='3'), true, NOW()),
('3.3', 'Cuenta Particular Directores', 'PATRIMONIO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='3'), true, NOW()),
-- INGRESOS
('4.1', 'Ingresos por Servicios', 'INGRESO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='4'), false, NOW()),
('4.2', 'Ingresos Financieros', 'INGRESO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='4'), false, NOW()),
('4.3', 'Otros Ingresos', 'INGRESO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='4'), false, NOW()),
-- GASTOS
('5.1', 'Costos Directos de Obra', 'GASTO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='5'), false, NOW()),
('5.2', 'Gastos Operativos', 'GASTO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='5'), false, NOW()),
('5.3', 'Gastos de Personal', 'GASTO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='5'), false, NOW()),
('5.4', 'Gastos Administrativos', 'GASTO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='5'), false, NOW()),
('5.5', 'Gastos Financieros', 'GASTO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='5'), false, NOW()),
('5.6', 'Impuestos', 'GASTO', 2, (SELECT id FROM "cuentas_contables" WHERE codigo='5'), false, NOW());

-- Nivel 3: Cuentas imputables (hojas)
INSERT INTO "cuentas_contables" ("codigo", "nombre", "tipo", "nivel", "parent_id", "imputable", "fecha_actualizacion") VALUES
-- ACTIVO CORRIENTE
('1.1.01', 'Caja', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.02', 'Bancos Cuenta Corriente', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.03', 'Bancos Caja de Ahorro', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.04', 'Billeteras Virtuales', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.05', 'Inversiones Temporarias', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.06', 'Creditos por Ventas', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.07', 'Anticipos a Proveedores', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.08', 'Otros Creditos', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.09', 'IVA Credito Fiscal', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.10', 'Retenciones de IVA Sufridas', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.11', 'Retenciones de IIBB Sufridas', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.12', 'Retenciones de Ganancias Sufridas', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.13', 'Percepciones de IVA Sufridas', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.14', 'Percepciones de IIBB Sufridas', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
('1.1.15', 'Fondos de Reparo Retenidos', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.1'), true, NOW()),
-- ACTIVO NO CORRIENTE
('1.2.01', 'Rodados', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.2'), true, NOW()),
('1.2.02', 'Herramientas y Equipos', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.2'), true, NOW()),
('1.2.03', 'Muebles y Utiles', 'ACTIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='1.2'), true, NOW()),
-- PASIVO CORRIENTE
('2.1.01', 'Proveedores', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.02', 'Sueldos a Pagar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.03', 'Cargas Sociales a Pagar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.04', 'ART a Pagar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.05', 'Anticipos de Clientes', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.06', 'IVA Debito Fiscal', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.07', 'IVA Saldo a Pagar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.08', 'IIBB a Pagar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.09', 'Ganancias a Pagar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.10', 'Retenciones de IVA a Depositar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.11', 'Retenciones de IIBB a Depositar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.12', 'Retenciones de Ganancias a Depositar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.13', 'Otros Impuestos a Pagar', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
('2.1.14', 'Fondos de Reparo a Devolver', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.1'), true, NOW()),
-- PASIVO NO CORRIENTE
('2.2.01', 'Prestamos Bancarios', 'PASIVO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='2.2'), true, NOW()),
-- INGRESOS POR SERVICIOS
('4.1.01', 'Cobros de Facturas', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.1'), true, NOW()),
('4.1.02', 'Cobros de Obras', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.1'), true, NOW()),
('4.1.03', 'Certificados de Obra', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.1'), true, NOW()),
-- INGRESOS FINANCIEROS
('4.2.01', 'Intereses Ganados', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.2'), true, NOW()),
('4.2.02', 'Rendimiento FCI', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.2'), true, NOW()),
('4.2.03', 'Diferencia de Cambio a Favor', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.2'), true, NOW()),
-- OTROS INGRESOS
('4.3.01', 'Reintegros', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.3'), true, NOW()),
('4.3.02', 'Recupero de Seguros', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.3'), true, NOW()),
('4.3.03', 'Otros Ingresos Varios', 'INGRESO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='4.3'), true, NOW()),
-- COSTOS DIRECTOS DE OBRA
('5.1.01', 'Materiales', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.1'), true, NOW()),
('5.1.02', 'Mano de Obra Directa', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.1'), true, NOW()),
('5.1.03', 'Subcontratistas', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.1'), true, NOW()),
('5.1.04', 'Alquiler de Equipos y Maquinaria', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.1'), true, NOW()),
('5.1.05', 'Fletes y Transporte de Materiales', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.1'), true, NOW()),
-- GASTOS OPERATIVOS
('5.2.01', 'Combustible y Lubricantes', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.2'), true, NOW()),
('5.2.02', 'Viaticos y Movilidad', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.2'), true, NOW()),
('5.2.03', 'Mantenimiento de Herramientas', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.2'), true, NOW()),
('5.2.04', 'Mantenimiento de Rodados', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.2'), true, NOW()),
('5.2.05', 'Peajes y Estacionamiento', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.2'), true, NOW()),
('5.2.06', 'Indumentaria y EPP', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.2'), true, NOW()),
-- GASTOS DE PERSONAL
('5.3.01', 'Sueldos y Jornales', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.3'), true, NOW()),
('5.3.02', 'Cargas Sociales', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.3'), true, NOW()),
('5.3.03', 'ART', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.3'), true, NOW()),
('5.3.04', 'Seguro de Vida Obligatorio', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.3'), true, NOW()),
('5.3.05', 'Capacitacion', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.3'), true, NOW()),
('5.3.06', 'Fondo de Cese Laboral', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.3'), true, NOW()),
('5.3.07', 'Aporte IERIC', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.3'), true, NOW()),
-- GASTOS ADMINISTRATIVOS
('5.4.01', 'Alquiler de Oficina', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.02', 'Servicios', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.03', 'Telefonia e Internet', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.04', 'Seguros', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.05', 'Utiles y Papeleria', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.06', 'Honorarios Profesionales', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.07', 'Sistemas y Software', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.08', 'Seguros de Caucion', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
('5.4.09', 'Seguros Todo Riesgo Construccion', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.4'), true, NOW()),
-- GASTOS FINANCIEROS
('5.5.01', 'Comisiones Bancarias', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.5'), true, NOW()),
('5.5.02', 'Intereses Pagados', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.5'), true, NOW()),
('5.5.03', 'Impuesto al Cheque', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.5'), true, NOW()),
('5.5.04', 'Diferencia de Cambio en Contra', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.5'), true, NOW()),
('5.5.05', 'Gastos de Mantenimiento de Cuenta', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.5'), true, NOW()),
-- IMPUESTOS
('5.6.01', 'IIBB', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.6'), true, NOW()),
('5.6.02', 'Tasa Municipal / ABL', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.6'), true, NOW()),
('5.6.03', 'Impuesto a las Ganancias', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.6'), true, NOW()),
('5.6.04', 'Bienes Personales', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.6'), true, NOW()),
('5.6.05', 'Otros Impuestos y Tasas', 'GASTO', 3, (SELECT id FROM "cuentas_contables" WHERE codigo='5.6'), true, NOW());

-- ============================================================
-- SEED: Centros de Costo
-- ============================================================

INSERT INTO "centros_costo" ("codigo", "nombre", "descripcion", "fecha_actualizacion") VALUES
('ADM', 'Administracion', 'Gastos administrativos generales', NOW()),
('OP', 'Operaciones', 'Area operativa', NOW()),
('COM', 'Comercial', 'Area comercial y ventas', NOW()),
('LOG', 'Logistica', 'Area de logistica y transporte', NOW());

INSERT INTO "centros_costo" ("codigo", "nombre", "parent_id", "descripcion", "fecha_actualizacion") VALUES
('OP.ZN', 'Zona Norte', (SELECT id FROM "centros_costo" WHERE codigo='OP'), 'Operaciones Zona Norte', NOW()),
('OP.ZS', 'Zona Sur', (SELECT id FROM "centros_costo" WHERE codigo='OP'), 'Operaciones Zona Sur', NOW()),
('OP.ZO', 'Zona Oeste', (SELECT id FROM "centros_costo" WHERE codigo='OP'), 'Operaciones Zona Oeste', NOW());

-- ============================================================
-- Add new columns to movimientos
-- ============================================================

ALTER TABLE "movimientos" ADD COLUMN "cuenta_contable_id" INTEGER;
ALTER TABLE "movimientos" ADD COLUMN "centro_costo_id" INTEGER;

-- CreateIndex
CREATE INDEX "movimientos_cuenta_contable_id_idx" ON "movimientos"("cuenta_contable_id");
CREATE INDEX "movimientos_centro_costo_id_idx" ON "movimientos"("centro_costo_id");

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cuenta_contable_id_fkey" FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_centro_costo_id_fkey" FOREIGN KEY ("centro_costo_id") REFERENCES "centros_costo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Migrate existing category data to cuenta_contable_id
-- ============================================================

-- Egreso categories
UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.1.01')
WHERE "categoria_egreso" = 'MATERIALES' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.1.02')
WHERE "categoria_egreso" = 'MANO_DE_OBRA' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.2.01')
WHERE "categoria_egreso" = 'COMBUSTIBLE' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.2.03')
WHERE "categoria_egreso" = 'HERRAMIENTAS' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.2.02')
WHERE "categoria_egreso" = 'VIATICOS' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.1.03')
WHERE "categoria_egreso" = 'SUBCONTRATISTA' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.6.05')
WHERE "categoria_egreso" = 'IMPUESTOS' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.4.02')
WHERE "categoria_egreso" = 'SERVICIOS' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='5.4.06')
WHERE "categoria_egreso" = 'OTRO_EGRESO' AND "cuenta_contable_id" IS NULL;

-- Ingreso categories
UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='4.1.01')
WHERE "categoria_ingreso" = 'COBRO_FACTURA' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='2.1.05')
WHERE "categoria_ingreso" = 'ANTICIPO_CLIENTE' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='4.3.01')
WHERE "categoria_ingreso" = 'REINTEGRO' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='4.2.01')
WHERE "categoria_ingreso" = 'RENDIMIENTO_INVERSION' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='4.2.02')
WHERE "categoria_ingreso" = 'RESCATE_INVERSION' AND "cuenta_contable_id" IS NULL;

UPDATE "movimientos" SET "cuenta_contable_id" = (SELECT id FROM "cuentas_contables" WHERE codigo='4.3.03')
WHERE "categoria_ingreso" = 'OTRO_INGRESO' AND "cuenta_contable_id" IS NULL;

-- Transfer categories stay NULL (TRANSFERENCIA_ENTRADA, TRANSFERENCIA_SALIDA, TRASPASO_INVERSION)

-- ============================================================
-- Drop old columns and enums
-- ============================================================

ALTER TABLE "movimientos" DROP COLUMN "categoria_ingreso";
ALTER TABLE "movimientos" DROP COLUMN "categoria_egreso";

DROP TYPE "CategoriaIngreso";
DROP TYPE "CategoriaEgreso";
