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
CREATE TABLE "public"."asignaciones_comision" (
    "id" TEXT NOT NULL,
    "comisionId" TEXT NOT NULL,
    "edificioId" TEXT NOT NULL,
    "tipoUnidad" "public"."TipoUnidad",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_comision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cambios_comision_programados" (
    "id" TEXT NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL,
    "comisionId" TEXT NOT NULL,
    "edificioId" TEXT NOT NULL,
    "tipoUnidad" "public"."TipoUnidad",
    "ejecutado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cambios_comision_programados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_nombre_key" ON "public"."comisiones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_codigo_key" ON "public"."comisiones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_comision_comisionId_edificioId_tipoUnidad_key" ON "public"."asignaciones_comision"("comisionId", "edificioId", "tipoUnidad");

-- AddForeignKey
ALTER TABLE "public"."asignaciones_comision" ADD CONSTRAINT "asignaciones_comision_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."asignaciones_comision" ADD CONSTRAINT "asignaciones_comision_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cambios_comision_programados" ADD CONSTRAINT "cambios_comision_programados_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "public"."edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
