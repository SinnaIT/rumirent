-- Migración de datos paso a paso para RumiRent
-- Ejecutar en orden para migrar datos existentes

-- 1. Crear tabla de clientes
CREATE TABLE IF NOT EXISTS "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "contratistaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- 2. Crear índices únicos para clientes
CREATE UNIQUE INDEX IF NOT EXISTS "clientes_rut_key" ON "clientes"("rut");

-- 3. Crear tabla de comisiones
CREATE TABLE IF NOT EXISTS "comisiones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id")
);

-- 4. Crear índices únicos para comisiones
CREATE UNIQUE INDEX IF NOT EXISTS "comisiones_nombre_key" ON "comisiones"("nombre");
CREATE UNIQUE INDEX IF NOT EXISTS "comisiones_codigo_key" ON "comisiones"("codigo");

-- 5. Insertar comisiones base
INSERT INTO "comisiones" ("id", "nombre", "codigo", "porcentaje", "createdAt", "updatedAt") VALUES
('com_base_5', 'Comisión Base 5%', 'BASE_5', 0.05, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('com_base_7', 'Comisión Base 7%', 'BASE_7', 0.07, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('com_base_10', 'Comisión Base 10%', 'BASE_10', 0.10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 6. Crear tabla tipos_unidad_edificio
CREATE TABLE IF NOT EXISTS "tipos_unidad_edificio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "comisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "edificioId" TEXT NOT NULL,

    CONSTRAINT "tipos_unidad_edificio_pkey" PRIMARY KEY ("id")
);

-- 7. Crear índices únicos para tipos_unidad_edificio
CREATE UNIQUE INDEX IF NOT EXISTS "tipos_unidad_edificio_edificioId_codigo_key" ON "tipos_unidad_edificio"("edificioId", "codigo");

-- 8. Agregar comisionId a edificios (permitir NULL temporalmente)
ALTER TABLE "edificios" ADD COLUMN IF NOT EXISTS "comisionId" TEXT;

-- 9. Actualizar edificios con comisión base
UPDATE "edificios" SET "comisionId" = 'com_base_7' WHERE "comisionId" IS NULL;

-- 10. Hacer comisionId obligatorio en edificios
ALTER TABLE "edificios" ALTER COLUMN "comisionId" SET NOT NULL;

-- 11. Crear tipos de unidad basados en unidades existentes
INSERT INTO "tipos_unidad_edificio" ("id", "nombre", "codigo", "comisionId", "edificioId", "createdAt", "updatedAt")
SELECT
    CONCAT('tipo_', "edificioId", '_', "tipo") as "id",
    CASE "tipo"
        WHEN 'STUDIO' THEN 'Studio'
        WHEN 'UN_DORMITORIO' THEN '1 Dormitorio'
        WHEN 'DOS_DORMITORIOS' THEN '2 Dormitorios'
        WHEN 'TRES_DORMITORIOS' THEN '3 Dormitorios'
        WHEN 'PENTHOUSE' THEN 'Penthouse'
        ELSE "tipo"
    END as "nombre",
    "tipo" as "codigo",
    'com_base_7' as "comisionId",
    "edificioId",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM (
    SELECT DISTINCT "edificioId", "tipo"
    FROM "unidades"
    WHERE "tipo" IS NOT NULL
) as unique_types
ON CONFLICT DO NOTHING;

-- 12. Agregar tipoUnidadEdificioId a unidades
ALTER TABLE "unidades" ADD COLUMN IF NOT EXISTS "tipoUnidadEdificioId" TEXT;

-- 13. Actualizar unidades con tipoUnidadEdificioId
UPDATE "unidades"
SET "tipoUnidadEdificioId" = CONCAT('tipo_', "edificioId", '_', "tipo")
WHERE "tipoUnidadEdificioId" IS NULL AND "tipo" IS NOT NULL;

-- 14. Hacer tipoUnidadEdificioId obligatorio
ALTER TABLE "unidades" ALTER COLUMN "tipoUnidadEdificioId" SET NOT NULL;

-- 15. Crear clientes desde contratos existentes
INSERT INTO "clientes" ("id", "nombre", "rut", "email", "telefono", "contratistaId", "createdAt", "updatedAt")
SELECT
    CONCAT('cliente_', "id") as "id",
    "clienteNombre" as "nombre",
    CONCAT('12345678-', RIGHT("id", 1)) as "rut", -- RUT temporal
    "clienteEmail" as "email",
    "clienteTelefono" as "telefono",
    "contratistaId",
    "createdAt",
    "updatedAt"
FROM "contratos"
WHERE "clienteNombre" IS NOT NULL
ON CONFLICT ("rut") DO NOTHING;

-- 16. Agregar campos nuevos a contratos (permitir NULL temporalmente)
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "clienteId" TEXT;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "comision" DOUBLE PRECISION;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "edificioId" TEXT;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "totalContrato" DOUBLE PRECISION;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "montoUf" DOUBLE PRECISION;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "estado" TEXT DEFAULT 'ENTREGADO';
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "fechaPagoReserva" TIMESTAMP(3);
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "fechaPagoContrato" TIMESTAMP(3);
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "fechaCheckin" TIMESTAMP(3);
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "postulacion" TEXT;
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "codigoUnidad" TEXT;

-- 17. Actualizar contratos con nuevos datos
UPDATE "contratos" SET
    "clienteId" = CONCAT('cliente_', "id"),
    "comision" = COALESCE("comisionCalculada", 0.07),
    "edificioId" = (SELECT "edificioId" FROM "unidades" WHERE "unidades"."id" = "contratos"."unidadId" LIMIT 1),
    "totalContrato" = COALESCE("comisionCalculada" * 100, 1000000), -- Estimación
    "montoUf" = COALESCE("comisionCalculada" * 3, 30) -- Estimación
WHERE "clienteId" IS NULL;

-- 18. Hacer campos obligatorios
ALTER TABLE "contratos" ALTER COLUMN "clienteId" SET NOT NULL;
ALTER TABLE "contratos" ALTER COLUMN "comision" SET NOT NULL;
ALTER TABLE "contratos" ALTER COLUMN "edificioId" SET NOT NULL;
ALTER TABLE "contratos" ALTER COLUMN "totalContrato" SET NOT NULL;
ALTER TABLE "contratos" ALTER COLUMN "montoUf" SET NOT NULL;

-- 19. Agregar RUT a usuarios (permitir NULL temporalmente)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rut" TEXT;

-- 20. Actualizar usuarios con RUT temporal
UPDATE "users" SET "rut" = CONCAT('98765432-', RIGHT("id", 1)) WHERE "rut" IS NULL;

-- 21. Hacer RUT obligatorio y único
ALTER TABLE "users" ALTER COLUMN "rut" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_rut_key" ON "users"("rut");

-- 22. Actualizar cambios_comision_programados
ALTER TABLE "cambios_comision_programados" ADD COLUMN IF NOT EXISTS "tipoUnidadEdificioId" TEXT;

-- 23. Eliminar campos obsoletos (comentado para debug)
-- ALTER TABLE "unidades" DROP COLUMN IF EXISTS "precio";
-- ALTER TABLE "unidades" DROP COLUMN IF EXISTS "prioridad";
-- ALTER TABLE "unidades" DROP COLUMN IF EXISTS "tipo";
-- ALTER TABLE "contratos" DROP COLUMN IF EXISTS "clienteNombre";
-- ALTER TABLE "contratos" DROP COLUMN IF EXISTS "clienteEmail";
-- ALTER TABLE "contratos" DROP COLUMN IF EXISTS "clienteTelefono";
-- ALTER TABLE "contratos" DROP COLUMN IF EXISTS "comisionCalculada";
-- ALTER TABLE "contratos" DROP COLUMN IF EXISTS "comisionReal";
-- ALTER TABLE "contratos" DROP COLUMN IF EXISTS "comisionPagada";
-- ALTER TABLE "contratos" DROP COLUMN IF EXISTS "fechaVenta";

-- 24. Crear foreign keys
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "edificios" ADD CONSTRAINT "edificios_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "comisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "edificios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tipos_unidad_edificio" ADD CONSTRAINT "tipos_unidad_edificio_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "comisiones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_tipoUnidadEdificioId_fkey" FOREIGN KEY ("tipoUnidadEdificioId") REFERENCES "tipos_unidad_edificio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_edificioId_fkey" FOREIGN KEY ("edificioId") REFERENCES "edificios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;