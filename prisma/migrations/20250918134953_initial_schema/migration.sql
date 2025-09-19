-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'CONTRATISTA');

-- CreateEnum
CREATE TYPE "public"."EstadoEdificio" AS ENUM ('PLANIFICACION', 'CONSTRUCCION', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "public"."TipoUnidad" AS ENUM ('STUDIO', 'UN_DORMITORIO', 'DOS_DORMITORIOS', 'TRES_DORMITORIOS', 'PENTHOUSE');

-- CreateEnum
CREATE TYPE "public"."EstadoUnidad" AS ENUM ('DISPONIBLE', 'RESERVADA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "public"."PrioridadVenta" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'CONTRATISTA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."edificios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "public"."EstadoEdificio" NOT NULL DEFAULT 'PLANIFICACION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edificios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unidades" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "public"."TipoUnidad" NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "estado" "public"."EstadoUnidad" NOT NULL DEFAULT 'DISPONIBLE',
    "prioridad" "public"."PrioridadVenta" NOT NULL DEFAULT 'BAJA',
    "descripcion" TEXT,
    "metros2" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "edificioId" TEXT NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contratos" (
    "id" TEXT NOT NULL,
    "fechaVenta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comisionCalculada" DOUBLE PRECISION NOT NULL,
    "comisionReal" DOUBLE PRECISION,
    "comisionPagada" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "clienteNombre" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "clienteTelefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contratistaId" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."configuracion_comisiones" (
    "id" TEXT NOT NULL,
    "tipoUnidad" "public"."TipoUnidad" NOT NULL,
    "comisionBase" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_edificioId_numero_key" ON "public"."unidades"("edificioId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_unidadId_key" ON "public"."contratos"("unidadId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_comisiones_tipoUnidad_key" ON "public"."configuracion_comisiones"("tipoUnidad");

-- AddForeignKey
ALTER TABLE "public"."unidades" ADD CONSTRAINT "unidades_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "public"."unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
