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

# Aplicar solo las columnas faltantes
print_info "PASO 2: Agregando columnas faltantes..."
echo ""

docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
-- Add missing columns to tipos_unidad_edificio
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "activo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "descripcion" TEXT;
ALTER TABLE "tipos_unidad_edificio" ADD COLUMN IF NOT EXISTS "plantillaOrigenId" TEXT;
UPDATE "clientes" SET telefono='1' WHERE telefono IS NULL;

-- Add missing column to empresas
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

-- Add missing columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastPasswordChange" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- Add foreign key if plantillas_tipo_unidad exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plantillas_tipo_unidad') THEN
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
print_info "Columnas agregadas a tipos_unidad_edificio:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'tipos_unidad_edificio' AND column_name IN ('activo', 'descripcion', 'plantillaOrigenId');"

echo ""
print_info "Columnas agregadas a empresas:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'tipoEntidad';"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Columnas agregadas exitosamente"
print_info "Backup: $BACKUP_FILE"
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
