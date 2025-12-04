-- CreateEnum
CREATE TYPE "public"."TipoEntidad" AS ENUM ('COMPANY', 'INVESTOR');

-- AlterTable
ALTER TABLE "public"."empresas" ADD COLUMN     "tipoEntidad" "public"."TipoEntidad" NOT NULL DEFAULT 'COMPANY';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
