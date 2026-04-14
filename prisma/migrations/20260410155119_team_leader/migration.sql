-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEAM_LEADER';

-- DropForeignKey
ALTER TABLE "cambios_comision_programados" DROP CONSTRAINT IF EXISTS "cambios_comision_programados_tipoUnidadEdificioId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "clientes_rut_key";

-- AlterTable
ALTER TABLE "cambios_comision_programados" DROP COLUMN IF EXISTS "tipoUnidadEdificioId";

-- AlterTable
ALTER TABLE "clientes" ALTER COLUMN "rut" DROP NOT NULL,
ALTER COLUMN "telefono" SET NOT NULL;

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "estado" SET DEFAULT 'INGRESADO';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "team_leader_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_telefono_key" ON "clientes"("telefono");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_leader_id_fkey" FOREIGN KEY ("team_leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
