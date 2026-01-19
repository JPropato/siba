-- CreateTable
CREATE TABLE "archivos" (
    "id" SERIAL NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "nombre_storage" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'siba-files',
    "url" TEXT,
    "orden_trabajo_id" INTEGER,
    "ticket_id" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "archivos_nombre_storage_key" ON "archivos"("nombre_storage");

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_orden_trabajo_id_fkey" FOREIGN KEY ("orden_trabajo_id") REFERENCES "ordenes_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
