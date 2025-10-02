-- Migration script to add comisionId field to leads table
-- Run this manually when database is available

-- Add comisionId column to leads table
ALTER TABLE "public"."leads" ADD COLUMN "comisionId" TEXT;

-- Add foreign key constraint
ALTER TABLE "public"."leads"
ADD CONSTRAINT "leads_comisionId_fkey"
FOREIGN KEY ("comisionId") REFERENCES "public"."comisiones"("id")
ON DELETE SET NULL ON UPDATE CASCADE;