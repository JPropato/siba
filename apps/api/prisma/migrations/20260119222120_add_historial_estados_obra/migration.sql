-- CreateTable
CREATE TABLE "historial_estados_obra" (
    "id" SERIAL NOT NULL,
    "obra_id" INTEGER NOT NULL,
    "estado_anterior" "EstadoObra" NOT NULL,
    "estado_nuevo" "EstadoObra" NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,

    CONSTRAINT "historial_estados_obra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_estados_obra_obra_id_idx" ON "historial_estados_obra"("obra_id");

-- AddForeignKey
ALTER TABLE "historial_estados_obra" ADD CONSTRAINT "historial_estados_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_estados_obra" ADD CONSTRAINT "historial_estados_obra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
