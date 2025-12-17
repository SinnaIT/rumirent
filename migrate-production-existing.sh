#!/bin/bash

# Script para Migrar Base de Datos EXISTENTE de Producción
# Este script agrega las columnas faltantes a una DB que ya tiene las migraciones antiguas
# NO usar en ambientes nuevos (usar prisma migrate deploy para esos)

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }


# Función para cargar .env
load_env() {
    if [ -f ".env" ]; then
        print_info "Cargando configuración desde .env..."
        export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    fi
}

load_env

# Configuración
DB_CONTAINER="${POSTGRES_CONTAINER_NAME:-rumirent-qa-db}"
APP_CONTAINER="${APP_CONTAINER_NAME:-rumirent-qa-app}"
DB_USER="${POSTGRES_USER:-rumirent_qa}"
DB_NAME="${POSTGRES_DB:-rumirent_qa_db}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   MIGRAR PRODUCCIÓN EXISTENTE (Solo Columnas Faltantes)  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_warning "⚠️  ESTE SCRIPT ES SOLO PARA PRODUCCIÓN/QA CON MIGRACIONES ANTIGUAS ⚠️"
print_info "Si es un ambiente NUEVO, usa: npx prisma migrate deploy"
echo ""

# Verificar contenedores
if ! docker ps | grep -q "$DB_CONTAINER"; then
    print_error "Contenedor de DB '$DB_CONTAINER' no está corriendo"
    exit 1
fi

if ! docker ps | grep -q "$APP_CONTAINER"; then
    print_error "Contenedor de APP '$APP_CONTAINER' no está corriendo"
    exit 1
fi

print_success "Contenedores verificados"
echo ""

# Confirmar
read -p "¿Esta es una base de datos EXISTENTE con datos de producción? (escribe 'SI'): " confirmacion
if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

echo ""

# Backup
print_info "PASO 1: Creando backup..."
BACKUP_FILE="backup-prod-before-columns-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_success "Backup guardado: $BACKUP_FILE"
fi

echo ""

# Aplicar cambios de estructura
print_info "PASO 2: Actualizando estructura de la base de datos..."
print_info "  - Actualizando enums (EstadoLead, TipoEntidad)"
print_info "  - Creando tabla plantillas_tipo_unidad"
print_info "  - Agregando columnas faltantes"
print_info "  - Agregando foreign keys"
print_info "  - Corrigiendo datos"
echo ""

docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
-- ============================================================================
-- 1. Actualizar Enums (agregar valores faltantes)
-- ============================================================================

-- Actualizar EstadoLead enum (agregar valores nuevos)
DO $$
BEGIN
    -- Agregar INGRESADO si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'INGRESADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'INGRESADO';
    END IF;

    -- Agregar EN_EVALUACION si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'EN_EVALUACION' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'EN_EVALUACION';
    END IF;

    -- Agregar OBSERVADO si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OBSERVADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'OBSERVADO';
    END IF;

    -- Agregar CONTRATO_FIRMADO si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CONTRATO_FIRMADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'CONTRATO_FIRMADO';
    END IF;

    -- Agregar CONTRATO_PAGADO si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CONTRATO_PAGADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'CONTRATO_PAGADO';
    END IF;

    -- Agregar DEPARTAMENTO_ENTREGADO si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DEPARTAMENTO_ENTREGADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'DEPARTAMENTO_ENTREGADO';
    END IF;

    -- Agregar CANCELADO si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELADO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')) THEN
        ALTER TYPE "EstadoLead" ADD VALUE 'CANCELADO';
    END IF;
END $$;

-- ============================================================================
-- 2. Crear tabla plantillas_tipo_unidad si no existe
-- ============================================================================

CREATE TABLE IF NOT EXISTS "plantillas_tipo_unidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantillas_tipo_unidad_pkey" PRIMARY KEY ("id")
);

-- Crear índices únicos si no existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'plantillas_tipo_unidad_nombre_key'
    ) THEN
        ALTER TABLE "plantillas_tipo_unidad" ADD CONSTRAINT "plantillas_tipo_unidad_nombre_key" UNIQUE ("nombre");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'plantillas_tipo_unidad_codigo_key'
    ) THEN
        ALTER TABLE "plantillas_tipo_unidad" ADD CONSTRAINT "plantillas_tipo_unidad_codigo_key" UNIQUE ("codigo");
    END IF;
END $$;

-- ============================================================================
-- 3. Add missing columns to tipos_unidad_edificio
-- ============================================================================

ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "descripcion" TEXT;
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "plantillaOrigenId" TEXT;

-- ============================================================================
-- 4. Fix data issues (telefono in clientes must not be NULL if unique)
-- ============================================================================

UPDATE "clientes" SET telefono='1' WHERE telefono IS NULL;

-- ============================================================================
-- 5. Add missing column to empresas
-- ============================================================================

-- Create TipoEntidad enum if not exists
DO $$ BEGIN
    CREATE TYPE "TipoEntidad" AS ENUM ('COMPANY', 'INVESTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
-- 6. Add missing columns to users
-- ============================================================================

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- ============================================================================
-- 7. Add foreign key constraint for plantillaOrigenId
-- ============================================================================

DO $$
BEGIN
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
END $$;
SQL

print_success "Columnas agregadas"
echo ""

# Actualizar registro de migraciones
print_info "PASO 3: Actualizando registro de migraciones..."

docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
-- Limpiar migraciones antiguas si existen
DELETE FROM "_prisma_migrations" WHERE migration_name LIKE '%baseline%';

-- Insertar la nueva migración baseline si no existe
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
SELECT
    gen_random_uuid()::text,
    'manual_migration_20251211',
    NOW(),
    '20250924201153_init_with_optional_commission',
    NULL,
    NULL,
    NOW(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations"
    WHERE migration_name = '20250924201153_init_with_optional_commission'
);
SQL

print_success "Registro actualizado"
echo ""

# Generar Prisma Client
print_info "PASO 4: Generando Prisma Client..."
docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma generate"
print_success "Client generado"
echo ""

# Verificación
print_info "PASO 5: Verificación..."
echo ""

print_info "✅ Valores del enum EstadoLead:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead') ORDER BY enumsortorder;"

echo ""
print_info "✅ Columnas agregadas a tipos_unidad_edificio:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'tipos_unidad_edificio' AND column_name IN ('activo', 'descripcion', 'plantillaOrigenId');"

echo ""
print_info "✅ Columnas agregadas a empresas:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'tipoEntidad';"

echo ""
print_info "✅ Columnas agregadas a users:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('lastPasswordChange', 'mustChangePassword', 'resetToken', 'resetTokenExpiry');"

echo ""
print_info "✅ Tabla plantillas_tipo_unidad creada:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plantillas_tipo_unidad') as tabla_existe;"

echo ""
print_info "✅ Foreign key plantillaOrigenId:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_name = 'tipos_unidad_edificio_plantillaOrigenId_fkey';"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Estructura de base de datos actualizada exitosamente"
print_info "Cambios aplicados:"
echo "  - Enum EstadoLead: 7 valores nuevos agregados"
echo "  - Tabla plantillas_tipo_unidad: CREADA"
echo "  - Tabla tipos_unidad_edificio: 3 columnas agregadas + foreign key"
echo "  - Tabla empresas: 1 columna agregada"
echo "  - Tabla users: 4 columnas agregadas"
echo ""
print_info "Backup de seguridad: $BACKUP_FILE"
echo ""

print_warning "PRÓXIMO PASO: Reiniciar la aplicación"
echo "  docker restart $APP_CONTAINER"
echo ""

read -p "¿Reiniciar ahora? (y/n): " restart
if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    docker restart "$APP_CONTAINER"
    print_success "Aplicación reiniciada"
    sleep 3
    docker logs -f "$APP_CONTAINER"
fi
