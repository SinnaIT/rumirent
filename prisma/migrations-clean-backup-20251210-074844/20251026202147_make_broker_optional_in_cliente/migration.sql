-- DropForeignKey
ALTER TABLE "public"."clientes" DROP CONSTRAINT "clientes_brokerId_fkey";

-- AlterTable
ALTER TABLE "public"."clientes" ALTER COLUMN "brokerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."clientes" ADD CONSTRAINT "clientes_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
