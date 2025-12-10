-- AlterEnum: Update EstadoLead enum
-- This migration safely updates the EstadoLead enum and migrates existing data

-- Step 1: Create new enum type with all new values
CREATE TYPE "EstadoLead_new" AS ENUM (
  'INGRESADO',
  'EN_EVALUACION',
  'OBSERVADO',
  'APROBADO',
  'RESERVA_PAGADA',
  'CONTRATO_FIRMADO',
  'CONTRATO_PAGADO',
  'DEPARTAMENTO_ENTREGADO',
  'RECHAZADO'
);

-- Step 2: Migrate existing data to new enum
-- ENTREGADO -> DEPARTAMENTO_ENTREGADO
-- APROBADO -> APROBADO (no change)
-- RESERVA_PAGADA -> RESERVA_PAGADA (no change)
-- RECHAZADO -> RECHAZADO (no change)
ALTER TABLE "leads"
  ALTER COLUMN "estado" DROP DEFAULT,
  ALTER COLUMN "estado" TYPE "EstadoLead_new"
    USING (
      CASE "estado"::text
        WHEN 'ENTREGADO' THEN 'DEPARTAMENTO_ENTREGADO'::text
        WHEN 'APROBADO' THEN 'APROBADO'::text
        WHEN 'RESERVA_PAGADA' THEN 'RESERVA_PAGADA'::text
        WHEN 'RECHAZADO' THEN 'RECHAZADO'::text
        ELSE 'INGRESADO'::text
      END
    )::"EstadoLead_new",
  ALTER COLUMN "estado" SET DEFAULT 'INGRESADO'::"EstadoLead_new";

-- Step 3: Drop old enum and rename new one
DROP TYPE "EstadoLead";
ALTER TYPE "EstadoLead_new" RENAME TO "EstadoLead";
