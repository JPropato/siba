-- CreateEnum
CREATE TYPE "TipoEmpleado" AS ENUM ('TECNICO', 'ADMINISTRATIVO', 'GERENTE');

-- CreateEnum
CREATE TYPE "TipoContratacion" AS ENUM ('CONTRATO_MARCO');

-- CreateTable
CREATE TABLE "empleados" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "inicio_relacion_laboral" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoEmpleado" NOT NULL,
    "contratacion" "TipoContratacion" NOT NULL,
    "zona_id" INTEGER,
    "usuario_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empleados_email_key" ON "empleados"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuario_id_key" ON "empleados"("usuario_id");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
