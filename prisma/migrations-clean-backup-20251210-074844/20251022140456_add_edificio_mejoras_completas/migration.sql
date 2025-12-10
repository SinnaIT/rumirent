/*
  Warnings:

  - Added the required column `empresaId` to the `edificios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TipoIcono" AS ENUM ('LUCIDE', 'URL', 'UPLOAD');

-- AlterTable
ALTER TABLE "public"."clientes" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "fechaNacimiento" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."edificios" ADD COLUMN     "email" TEXT,
ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "urlGoogleMaps" TEXT;

-- AlterTable
ALTER TABLE "public"."leads" ADD COLUMN     "comisionId" TEXT,
ADD COLUMN     "tipoUnidadEdificioId" TEXT,
ALTER COLUMN "montoUf" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."imagenes_edificio" (
    "id" TEXT NOT NULL,
    "edificioId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imagenes_edificio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tipos_caracteristica" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_caracteristica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."caracteristicas_edificio" (
    "id" TEXT NOT NULL,
    "edificioId" TEXT NOT NULL,
    "tipoCaracteristicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "mostrarEnResumen" BOOLEAN NOT NULL DEFAULT true,
    "icono" TEXT,
    "tipoIcono" "public"."TipoIcono" NOT NULL DEFAULT 'LUCIDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caracteristicas_edificio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_rut_key" ON "public"."empresas"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_caracteristica_nombre_key" ON "public"."tipos_caracteristica"("nombre");

-- AddForeignKey
ALTER TABLE "public"."edificios" ADD CONSTRAINT "edificios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imagenes_edificio" ADD CONSTRAINT "imagenes_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."caracteristicas_edificio" ADD CONSTRAINT "caracteristicas_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."caracteristicas_edificio" ADD CONSTRAINT "caracteristicas_edificio_tipoCaracteristicaId_fkey" FOREIGN KEY ("tipoCaracteristicaId") REFERENCES "public"."tipos_caracteristica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES "public"."tipos_unidad_edificio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
