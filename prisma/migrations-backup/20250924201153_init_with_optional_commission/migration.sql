-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'BROKER');

-- CreateEnum
CREATE TYPE "public"."EstadoUnidad" AS ENUM ('DISPONIBLE', 'RESERVADA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "public"."EstadoLead" AS ENUM ('ENTREGADO', 'RESERVA_PAGADA', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "telefono" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'BROKER',
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
    "comisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edificios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tipos_unidad_edificio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "comisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "edificioId" TEXT NOT NULL,

    CONSTRAINT "tipos_unidad_edificio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unidades" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "estado" "public"."EstadoUnidad" NOT NULL DEFAULT 'DISPONIBLE',
    "descripcion" TEXT,
    "metros2" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "edificioId" TEXT NOT NULL,
    "tipoUnidadEdificioId" TEXT NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "brokerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "codigoUnidad" TEXT,
    "totalLead" DOUBLE PRECISION NOT NULL,
    "montoUf" DOUBLE PRECISION NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,
    "estado" "public"."EstadoLead" NOT NULL DEFAULT 'ENTREGADO',
    "fechaPagoReserva" TIMESTAMP(3),
    "fechaPagoLead" TIMESTAMP(3),
    "fechaCheckin" TIMESTAMP(3),
    "postulacion" TEXT,
    "observaciones" TEXT,
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "fechaConciliacion" TIMESTAMP(3),
    "reglaComisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brokerId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "unidadId" TEXT,
    "edificioId" TEXT NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comisiones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reglas_comision" (
    "id" TEXT NOT NULL,
    "cantidadMinima" DOUBLE PRECISION NOT NULL,
    "cantidadMaxima" DOUBLE PRECISION,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "comisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_comision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cambios_comision_programados" (
    "id" TEXT NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL,
    "comisionId" TEXT NOT NULL,
    "edificioId" TEXT NOT NULL,
    "tipoUnidadEdificioId" TEXT,
    "ejecutado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cambios_comision_programados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_rut_key" ON "public"."users"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_unidad_edificio_edificioId_codigo_key" ON "public"."tipos_unidad_edificio"("edificioId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_edificioId_numero_key" ON "public"."unidades"("edificioId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_rut_key" ON "public"."clientes"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "leads_unidadId_key" ON "public"."leads"("unidadId");

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_nombre_key" ON "public"."comisiones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_codigo_key" ON "public"."comisiones"("codigo");

-- AddForeignKey
ALTER TABLE "public"."edificios" ADD CONSTRAINT "edificios_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unidades" ADD CONSTRAINT "unidades_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unidades" ADD CONSTRAINT "unidades_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES "public"."tipos_unidad_edificio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "public"."unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_reglaComisionId_fkey" FOREIGN KEY ("reglaComisionId") REFERENCES "public"."reglas_comision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reglas_comision" ADD CONSTRAINT "reglas_comision_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES "public"."tipos_unidad_edificio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
