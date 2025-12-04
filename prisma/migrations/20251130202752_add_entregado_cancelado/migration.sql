-- Agregar ENTREGADO y CANCELADO al enum EstadoLead
-- PostgreSQL no permite ALTER TYPE ADD VALUE en transacciones
-- Por lo tanto, estos comandos deben ejecutarse fuera de bloques BEGIN/COMMIT

-- Verificar y agregar valores si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ENTREGADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'ENTREGADO' AFTER 'INGRESADO';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'CANCELADO';
    END IF;
END
$$;
