-- CreateEnum
CREATE TYPE "EstadoEmpleado" AS ENUM ('ACTIVO', 'RENUNCIA', 'BAJA', 'LICENCIA');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('RELACION_DEPENDENCIA', 'MONOTRIBUTO', 'PASANTIA');

-- CreateEnum
CREATE TYPE "CategoriaLaboral" AS ENUM ('OFICIAL', 'MEDIO_OFICIAL', 'AYUDANTE', 'ADMINISTRATIVO', 'ENCARGADO');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_CONVIVENCIAL');

-- CreateEnum
CREATE TYPE "EstadoPreocupacional" AS ENUM ('PENDIENTE', 'APTO', 'NO_APTO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoSeguroAP" AS ENUM ('PEDIDO_ALTA', 'ACTIVO', 'PEDIDO_BAJA', 'BAJA');

-- AlterTable
ALTER TABLE "empleados" ADD COLUMN     "banco" TEXT,
ADD COLUMN     "cantidad_hijos" INTEGER DEFAULT 0,
ADD COLUMN     "categoria_laboral" "CategoriaLaboral",
ADD COLUMN     "cbu" TEXT,
ADD COLUMN     "convenio_seccion" TEXT,
ADD COLUMN     "cuil" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "dni_beneficiario" TEXT,
ADD COLUMN     "estado" "EstadoEmpleado" NOT NULL DEFAULT 'ACTIVO',
ADD COLUMN     "estado_banco" TEXT,
ADD COLUMN     "estado_civil" "EstadoCivil",
ADD COLUMN     "fecha_actualizacion_sueldo" TIMESTAMP(3),
ADD COLUMN     "fecha_baja" TIMESTAMP(3),
ADD COLUMN     "fecha_nacimiento" TIMESTAMP(3),
ADD COLUMN     "horario" TEXT,
ADD COLUMN     "ieric" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legajo" TEXT,
ADD COLUMN     "lugar_trabajo" TEXT,
ADD COLUMN     "motivo_baja" TEXT,
ADD COLUMN     "obra_social" TEXT,
ADD COLUMN     "preocupacional_estado" "EstadoPreocupacional",
ADD COLUMN     "preocupacional_fecha" TIMESTAMP(3),
ADD COLUMN     "sueldo_bruto" DECIMAL(12,2),
ADD COLUMN     "sueldo_neto" DECIMAL(12,2),
ADD COLUMN     "telefono_secundario" TEXT,
ADD COLUMN     "tipo_contrato" "TipoContrato";

-- CreateTable
CREATE TABLE "seguros_ap" (
    "id" SERIAL NOT NULL,
    "empleado_id" INTEGER NOT NULL,
    "estado" "EstadoSeguroAP" NOT NULL DEFAULT 'PEDIDO_ALTA',
    "fecha_solicitud_alta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_alta_efectiva" TIMESTAMP(3),
    "fecha_solicitud_baja" TIMESTAMP(3),
    "fecha_baja_efectiva" TIMESTAMP(3),
    "destino" TEXT,
    "observaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seguros_ap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seguros_ap_empleado_id_idx" ON "seguros_ap"("empleado_id");

-- CreateIndex
CREATE INDEX "seguros_ap_estado_idx" ON "seguros_ap"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_cuil_key" ON "empleados"("cuil");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_dni_key" ON "empleados"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_legajo_key" ON "empleados"("legajo");

-- CreateIndex
CREATE INDEX "empleados_estado_idx" ON "empleados"("estado");

-- CreateIndex
CREATE INDEX "empleados_legajo_idx" ON "empleados"("legajo");

-- AddForeignKey
ALTER TABLE "seguros_ap" ADD CONSTRAINT "seguros_ap_empleado_id_fkey" FOREIGN KEY ("empleado_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
