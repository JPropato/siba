-- CreateEnum
CREATE TYPE "RubroTicket" AS ENUM ('CIVIL', 'ELECTRICIDAD', 'SANITARIOS', 'VARIOS');

-- CreateEnum
CREATE TYPE "PrioridadTicket" AS ENUM ('PROGRAMADO', 'EMERGENCIA', 'URGENCIA');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('NUEVO', 'PROGRAMADO', 'EN_CURSO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "codigo_interno" SERIAL NOT NULL,
    "codigo_cliente" TEXT,
    "descripcion" TEXT NOT NULL,
    "trabajo" TEXT,
    "observaciones" TEXT,
    "rubro" "RubroTicket" NOT NULL,
    "prioridad" "PrioridadTicket" NOT NULL,
    "estado" "EstadoTicket" NOT NULL DEFAULT 'NUEVO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_programada" TIMESTAMP(3),
    "fecha_finalizacion" TIMESTAMP(3),
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMP(3),
    "sucursal_id" INTEGER NOT NULL,
    "tecnico_id" INTEGER,
    "creado_por_id" INTEGER NOT NULL,
    "actualizado_por_id" INTEGER,
    "ticket_relacionado_id" INTEGER,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_historial" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campo_modificado" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "observacion" TEXT,

    CONSTRAINT "ticket_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes_trabajo" (
    "id" SERIAL NOT NULL,
    "numero_ot" SERIAL NOT NULL,
    "fecha_ot" TIMESTAMP(3) NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "sucursal_id" INTEGER NOT NULL,
    "tecnico_id" INTEGER NOT NULL,
    "descripcion_trabajo" TEXT NOT NULL,
    "materiales_usados" TEXT,
    "firma_responsable" TEXT,
    "aclaracion_responsable" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_codigo_interno_key" ON "tickets"("codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_numero_ot_key" ON "ordenes_trabajo"("numero_ot");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_trabajo_ticket_id_key" ON "ordenes_trabajo"("ticket_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_actualizado_por_id_fkey" FOREIGN KEY ("actualizado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticket_relacionado_id_fkey" FOREIGN KEY ("ticket_relacionado_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historial" ADD CONSTRAINT "ticket_historial_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historial" ADD CONSTRAINT "ticket_historial_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_trabajo" ADD CONSTRAINT "ordenes_trabajo_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
