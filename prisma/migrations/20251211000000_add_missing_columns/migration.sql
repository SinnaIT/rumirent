-- Migration: Add Missing Columns to Production and QA
-- This migration adds 8 columns that exist in schema.prisma but not in production database
-- Safe to run: Only adds columns, does not delete or modify existing data

-- ============================================================================
-- 1. Add missing columns to tipos_unidad_edificio
-- ============================================================================

-- Add 'activo' column (business logic flag)
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true;

-- Add 'descripcion' column (unit type description)
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "descripcion" TEXT;

-- Add 'plantillaOrigenId' column (template reference)
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "plantillaOrigenId" TEXT;

-- ============================================================================
-- 2. Add missing column to empresas
-- ============================================================================

-- First ensure the TipoEntidad enum exists
DO $$ BEGIN
    CREATE TYPE "TipoEntidad" AS ENUM ('COMPANY', 'INVESTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add 'tipoEntidad' column (company classification)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'empresas' AND column_name = 'tipoEntidad'
    ) THEN
        ALTER TABLE "empresas" ADD COLUMN "tipoEntidad" "TipoEntidad" NOT NULL DEFAULT 'COMPANY';
    END IF;
END $$;

-- ============================================================================
-- 3. Add missing columns to users (password reset functionality)
-- ============================================================================

-- Add 'lastPasswordChange' column (track last password change)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3);

-- Add 'mustChangePassword' column (force password change flag)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- Add 'resetToken' column (password reset token)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;

-- Add 'resetTokenExpiry' column (token expiration)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- ============================================================================
-- 4. Add foreign key constraint for plantillaOrigenId (if not exists)
-- ============================================================================

-- First check if plantillas_tipo_unidad table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'plantillas_tipo_unidad'
    ) THEN
        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'tipos_unidad_edificio_plantillaOrigenId_fkey'
        ) THEN
            ALTER TABLE "tipos_unidad_edificio"
                ADD CONSTRAINT "tipos_unidad_edificio_plantillaOrigenId_fkey"
                FOREIGN KEY ("plantillaOrigenId")
                REFERENCES "plantillas_tipo_unidad"("id")
                ON DELETE SET NULL
                ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- This migration is idempotent: safe to run multiple times
-- PostgreSQL will skip commands for columns/constraints that already exist
