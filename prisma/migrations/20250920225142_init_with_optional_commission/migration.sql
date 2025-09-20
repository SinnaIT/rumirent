-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'CONTRATISTA');

-- CreateEnum
CREATE TYPE "public"."EstadoEdificio" AS ENUM ('PLANIFICACION', 'CONSTRUCCION', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "public"."EstadoUnidad" AS ENUM ('DISPONIBLE', 'RESERVADA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "public"."EstadoContrato" AS ENUM ('ENTREGADO', 'RESERVA_PAGADA', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
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
    "contratistaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contratos" (
    "id" TEXT NOT NULL,
    "codigoUnidad" TEXT,
    "totalContrato" DOUBLE PRECISION NOT NULL,
    "montoUf" DOUBLE PRECISION NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,
    "estado" "public"."EstadoContrato" NOT NULL DEFAULT 'ENTREGADO',
    "fechaPagoReserva" TIMESTAMP(3),
    "fechaPagoContrato" TIMESTAMP(3),
    "fechaCheckin" TIMESTAMP(3),
    "postulacion" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contratistaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "unidadId" TEXT,
    "edificioId" TEXT NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "contratos_unidadId_key" ON "public"."contratos"("unidadId");

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
ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "public"."unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contratos" ADD CONSTRAINT "contratos_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES "public"."tipos_unidad_edificio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
