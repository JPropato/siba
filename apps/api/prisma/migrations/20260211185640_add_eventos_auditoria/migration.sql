-- CreateTable
CREATE TABLE "eventos_auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "entidad_id" INTEGER,
    "entidad_tipo" TEXT,
    "descripcion" TEXT NOT NULL,
    "detalle" TEXT,
    "ip" TEXT,
    "obra_id" INTEGER,
    "ticket_id" INTEGER,
    "cliente_id" INTEGER,
    "fecha_evento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_auditoria_usuario_id_idx" ON "eventos_auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "eventos_auditoria_modulo_idx" ON "eventos_auditoria"("modulo");

-- CreateIndex
CREATE INDEX "eventos_auditoria_fecha_evento_idx" ON "eventos_auditoria"("fecha_evento");

-- CreateIndex
CREATE INDEX "eventos_auditoria_entidad_tipo_entidad_id_idx" ON "eventos_auditoria"("entidad_tipo", "entidad_id");

-- CreateIndex
CREATE INDEX "eventos_auditoria_obra_id_idx" ON "eventos_auditoria"("obra_id");

-- CreateIndex
CREATE INDEX "eventos_auditoria_ticket_id_idx" ON "eventos_auditoria"("ticket_id");

-- CreateIndex
CREATE INDEX "eventos_auditoria_cliente_id_idx" ON "eventos_auditoria"("cliente_id");

-- AddForeignKey
ALTER TABLE "eventos_auditoria" ADD CONSTRAINT "eventos_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
