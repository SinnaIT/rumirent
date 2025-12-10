-- CreateTable
CREATE TABLE "plantillas_tipo_unidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_tipo_unidad_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN "plantillaOrigenId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_tipo_unidad_nombre_key" ON "plantillas_tipo_unidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_tipo_unidad_codigo_key" ON "plantillas_tipo_unidad"("codigo");

-- AddForeignKey
ALTER TABLE "tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_plantillaOrigenId_fkey" FOREIGN KEY ("plantillaOrigenId") REFERENCES "plantillas_tipo_unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropTable (if exists from previous schema changes)
DROP TABLE IF EXISTS "edificio_tipo_unidad";
