-- CreateEnum
CREATE TYPE "public"."TipoImagenUrl" AS ENUM ('URL', 'UPLOAD');

-- AlterTable
ALTER TABLE "public"."imagenes_edificio" ADD COLUMN     "imageType" "public"."TipoImagenUrl" NOT NULL DEFAULT 'URL';
