-- AlterTable
ALTER TABLE "public"."contratos" ADD COLUMN     "conciliado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaConciliacion" TIMESTAMP(3);
