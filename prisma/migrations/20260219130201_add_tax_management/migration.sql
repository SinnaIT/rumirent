-- CreateEnum
CREATE TYPE "public"."TaxNature" AS ENUM ('ADDITIVE', 'DEDUCTIVE');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "commission_tax_type_id" TEXT;

-- CreateTable
CREATE TABLE "public"."tax_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nature" "public"."TaxNature" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_rates" (
    "id" TEXT NOT NULL,
    "taxTypeId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_types_name_key" ON "public"."tax_types"("name");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_commission_tax_type_id_fkey" FOREIGN KEY ("commission_tax_type_id") REFERENCES "public"."tax_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tax_rates" ADD CONSTRAINT "tax_rates_taxTypeId_fkey" FOREIGN KEY ("taxTypeId") REFERENCES "public"."tax_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
