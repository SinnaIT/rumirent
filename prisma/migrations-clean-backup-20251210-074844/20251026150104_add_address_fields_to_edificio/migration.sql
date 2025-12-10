/*
  Warnings:

  - Added the required column `ciudad` to the `edificios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `comuna` to the `edificios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `edificios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add columns with temporary default values
ALTER TABLE "public"."edificios" ADD COLUMN "ciudad" TEXT NOT NULL DEFAULT 'Santiago',
ADD COLUMN "codigoPostal" TEXT,
ADD COLUMN "comuna" TEXT NOT NULL DEFAULT 'Santiago',
ADD COLUMN "region" TEXT NOT NULL DEFAULT 'Región Metropolitana';

-- Remove default values (they will be set properly in seed)
ALTER TABLE "public"."edificios" ALTER COLUMN "ciudad" DROP DEFAULT;
ALTER TABLE "public"."edificios" ALTER COLUMN "comuna" DROP DEFAULT;
ALTER TABLE "public"."edificios" ALTER COLUMN "region" DROP DEFAULT;
