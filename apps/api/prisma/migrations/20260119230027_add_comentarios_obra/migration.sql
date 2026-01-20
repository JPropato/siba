-- CreateTable
CREATE TABLE "comentarios_obra" (
    "id" SERIAL NOT NULL,
    "obra_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_obra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comentarios_obra_obra_id_idx" ON "comentarios_obra"("obra_id");

-- AddForeignKey
ALTER TABLE "comentarios_obra" ADD CONSTRAINT "comentarios_obra_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_obra" ADD CONSTRAINT "comentarios_obra_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
