-- CreateTable
CREATE TABLE "public"."metas_mensuales" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "montoMeta" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_mensuales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metas_mensuales_brokerId_mes_anio_key" ON "public"."metas_mensuales"("brokerId", "mes", "anio");

-- AddForeignKey
ALTER TABLE "public"."metas_mensuales" ADD CONSTRAINT "metas_mensuales_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
