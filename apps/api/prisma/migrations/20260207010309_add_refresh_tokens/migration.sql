-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "refresh_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "archivos_orden_trabajo_id_idx" ON "archivos"("orden_trabajo_id");

-- CreateIndex
CREATE INDEX "empleados_zona_id_idx" ON "empleados"("zona_id");

-- CreateIndex
CREATE INDEX "empleados_tipo_idx" ON "empleados"("tipo");

-- CreateIndex
CREATE INDEX "historial_precios_material_id_idx" ON "historial_precios"("material_id");

-- CreateIndex
CREATE INDEX "sucursales_cliente_id_idx" ON "sucursales"("cliente_id");

-- CreateIndex
CREATE INDEX "sucursales_zona_id_idx" ON "sucursales"("zona_id");

-- CreateIndex
CREATE INDEX "ticket_historial_ticket_id_idx" ON "ticket_historial"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_historial_fecha_cambio_idx" ON "ticket_historial"("fecha_cambio");

-- CreateIndex
CREATE INDEX "tickets_estado_idx" ON "tickets"("estado");

-- CreateIndex
CREATE INDEX "tickets_sucursal_id_idx" ON "tickets"("sucursal_id");

-- CreateIndex
CREATE INDEX "tickets_tecnico_id_idx" ON "tickets"("tecnico_id");

-- CreateIndex
CREATE INDEX "tickets_fecha_creacion_idx" ON "tickets"("fecha_creacion");

-- CreateIndex
CREATE INDEX "tickets_rubro_idx" ON "tickets"("rubro");

-- CreateIndex
CREATE INDEX "vehiculos_zona_id_idx" ON "vehiculos"("zona_id");

-- CreateIndex
CREATE INDEX "vehiculos_estado_idx" ON "vehiculos"("estado");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
