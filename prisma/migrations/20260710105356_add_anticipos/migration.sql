-- CreateEnum
CREATE TYPE "AnticipoStatus" AS ENUM ('PENDIENTE', 'APLICADO', 'ANULADO');

-- CreateTable
CREATE TABLE "anticipos" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "status" "AnticipoStatus" NOT NULL DEFAULT 'PENDIENTE',
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anticipos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "anticipos" ADD CONSTRAINT "anticipos_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
