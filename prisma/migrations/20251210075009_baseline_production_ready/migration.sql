-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."TipoIcono" AS ENUM ('LUCIDE', 'URL', 'UPLOAD');

-- CreateEnum
CREATE TYPE "public"."TipoImagenUrl" AS ENUM ('URL', 'UPLOAD');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'BROKER');

-- CreateEnum
CREATE TYPE "public"."TipoEntidad" AS ENUM ('COMPANY', 'INVESTOR');

-- CreateEnum
CREATE TYPE "public"."EstadoUnidad" AS ENUM ('DISPONIBLE', 'RESERVADA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "public"."EstadoLead" AS ENUM ('INGRESADO', 'ENTREGADO', 'EN_EVALUACION', 'OBSERVADO', 'APROBADO', 'RESERVA_PAGADA', 'CONTRATO_FIRMADO', 'CONTRATO_PAGADO', 'DEPARTAMENTO_ENTREGADO', 'RECHAZADO', 'CANCELADO');

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
    "birthDate" TIMESTAMP(3),
    "lastPasswordChange" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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
    "tipoEntidad" "public"."TipoEntidad" NOT NULL DEFAULT 'COMPANY',

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
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
    "email" TEXT,
    "empresaId" TEXT NOT NULL,
    "telefono" TEXT,
    "urlGoogleMaps" TEXT,
    "ciudad" TEXT NOT NULL,
    "codigoPostal" TEXT,
    "comuna" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "edificios_pkey" PRIMARY KEY ("id")
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
    "imageType" "public"."TipoImagenUrl" NOT NULL DEFAULT 'URL',

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

-- CreateTable
CREATE TABLE "public"."tipos_unidad_edificio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bathrooms" INTEGER,
    "bedrooms" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "edificioId" TEXT NOT NULL,
    "comisionId" TEXT,
    "plantillaOrigenId" TEXT,

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
    "rut" TEXT,
    "email" TEXT,
    "telefono" TEXT NOT NULL,
    "brokerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "direccion" TEXT,
    "fechaNacimiento" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "codigoUnidad" TEXT,
    "totalLead" DOUBLE PRECISION NOT NULL,
    "montoUf" DOUBLE PRECISION,
    "comision" DOUBLE PRECISION NOT NULL,
    "estado" "public"."EstadoLead" NOT NULL DEFAULT 'INGRESADO',
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
    "comisionId" TEXT,
    "tipoUnidadEdificioId" TEXT,

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
    "ejecutado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cambios_comision_programados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."metas_mensuales" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "montoMeta" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_mensuales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plantillas_tipo_unidad" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_rut_key" ON "public"."users"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_rut_key" ON "public"."empresas"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_caracteristica_nombre_key" ON "public"."tipos_caracteristica"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_unidad_edificio_edificioId_codigo_key" ON "public"."tipos_unidad_edificio"("edificioId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_edificioId_numero_key" ON "public"."unidades"("edificioId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_telefono_key" ON "public"."clientes"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "leads_unidadId_key" ON "public"."leads"("unidadId");

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_nombre_key" ON "public"."comisiones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_codigo_key" ON "public"."comisiones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "metas_mensuales_brokerId_mes_anio_key" ON "public"."metas_mensuales"("brokerId", "mes", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_tipo_unidad_nombre_key" ON "public"."plantillas_tipo_unidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "plantillas_tipo_unidad_codigo_key" ON "public"."plantillas_tipo_unidad"("codigo");

-- AddForeignKey
ALTER TABLE "public"."edificios" ADD CONSTRAINT "edificios_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."edificios" ADD CONSTRAINT "edificios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "public"."empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."imagenes_edificio" ADD CONSTRAINT "imagenes_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."caracteristicas_edificio" ADD CONSTRAINT "caracteristicas_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."caracteristicas_edificio" ADD CONSTRAINT "caracteristicas_edificio_tipoCaracteristicaId_fkey" FOREIGN KEY ("tipoCaracteristicaId") REFERENCES "public"."tipos_caracteristica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_plantillaOrigenId_fkey" FOREIGN KEY ("plantillaOrigenId") REFERENCES "public"."plantillas_tipo_unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unidades" ADD CONSTRAINT "unidades_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unidades" ADD CONSTRAINT "unidades_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES "public"."tipos_unidad_edificio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_reglaComisionId_fkey" FOREIGN KEY ("reglaComisionId") REFERENCES "public"."reglas_comision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES "public"."tipos_unidad_edificio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "public"."unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reglas_comision" ADD CONSTRAINT "reglas_comision_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."metas_mensuales" ADD CONSTRAINT "metas_mensuales_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

