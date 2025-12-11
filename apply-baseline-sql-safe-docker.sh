#!/bin/bash

# Script Mejorado para Aplicar Baseline en QA (Docker)
# Maneja el caso donde las tablas ya existen pero les faltan columnas
# Ejecutar desde el HOST (no dentro del contenedor)

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

# Configuración
DB_CONTAINER="${1:-rumirent-qa-db}"
APP_CONTAINER="${2:-rumirent-qa-app}"
DB_USER="${3:-rumirent_qa}"
DB_NAME="${4:-rumirent_qa_db}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   APLICAR BASELINE EN QA (MÉTODO SEGURO - DOCKER)        ║"
echo "║        Maneja tablas existentes con columnas faltantes    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_info "Configuración:"
echo "  DB Container: $DB_CONTAINER"
echo "  APP Container: $APP_CONTAINER"
echo "  DB User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Verificar que los contenedores existen
print_info "Verificando contenedores..."

if ! docker ps | grep -q "$DB_CONTAINER"; then
    print_error "Contenedor de DB '$DB_CONTAINER' no está corriendo"
    print_info "Contenedores disponibles:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

if ! docker ps | grep -q "$APP_CONTAINER"; then
    print_error "Contenedor de APP '$APP_CONTAINER' no está corriendo"
    print_info "Contenedores disponibles:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

print_success "Contenedores verificados"
echo ""

# Paso 1: Buscar baseline
print_info "PASO 1: Buscando archivo SQL del baseline..."

BASELINE_DIR=$(docker exec "$APP_CONTAINER" sh -c "ls -1d /app/prisma/migrations/*baseline* 2>/dev/null | head -1" || \
               docker exec "$APP_CONTAINER" sh -c "ls -1d prisma/migrations/*baseline* 2>/dev/null | head -1")

if [ -z "$BASELINE_DIR" ]; then
    print_error "No se encontró directorio de baseline en el contenedor"
    exit 1
fi

print_success "Directorio baseline: $BASELINE_DIR"

SQL_FILE="$BASELINE_DIR/migration.sql"
if ! docker exec "$APP_CONTAINER" sh -c "test -f $SQL_FILE"; then
    print_error "No se encontró $SQL_FILE"
    exit 1
fi

print_success "Archivo SQL encontrado: $SQL_FILE"
echo ""

# Paso 2: Backup
print_info "PASO 2: Creando backup de seguridad..."

BACKUP_FILE="backup-qa-before-baseline-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
    print_warning "No se pudo crear backup completo"
}

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_success "Backup guardado: $BACKUP_FILE"
fi

echo ""

# Paso 3: Confirmar
print_warning "ATENCIÓN: Vas a aplicar el baseline en QA"
echo ""
echo "Esto va a:"
echo "  1. Agregar columnas faltantes a tablas existentes"
echo "  2. Crear tablas que no existan"
echo "  3. Crear enums, índices, constraints"
echo ""
echo "Backup creado: $BACKUP_FILE"
echo ""

read -p "¿Continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

echo ""

# Paso 4: Copiar SQL del contenedor al host
print_info "PASO 3: Preparando SQL..."

TMP_SQL="/tmp/baseline-migration-$$.sql"
docker exec "$APP_CONTAINER" cat "$SQL_FILE" > "$TMP_SQL"

if [ ! -f "$TMP_SQL" ] || [ ! -s "$TMP_SQL" ]; then
    print_error "No se pudo copiar el archivo SQL"
    exit 1
fi

print_success "SQL preparado"
echo ""

# Paso 5: Agregar columnas faltantes primero (ANTES de las foreign keys)
print_info "PASO 4: Agregando columnas faltantes..."
echo ""

# Script SQL que agrega columnas específicas que sabemos que pueden faltar
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL' 2>&1 | grep -v "already exists" | grep -v "^$" || true
-- Agregar plantillaOrigenId si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tipos_unidad_edificio'
        AND column_name = 'plantillaOrigenId'
    ) THEN
        ALTER TABLE "tipos_unidad_edificio" ADD COLUMN "plantillaOrigenId" TEXT;
        RAISE NOTICE 'Columna plantillaOrigenId agregada';
    ELSE
        RAISE NOTICE 'Columna plantillaOrigenId ya existe';
    END IF;
END $$;

-- Agregar otras columnas que puedan faltar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'birthDate'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "birthDate" TIMESTAMP(3);
        RAISE NOTICE 'Columna birthDate agregada';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'lastPasswordChange'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "lastPasswordChange" TIMESTAMP(3);
        RAISE NOTICE 'Columna lastPasswordChange agregada';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'mustChangePassword'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Columna mustChangePassword agregada';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'resetToken'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "resetToken" TEXT;
        RAISE NOTICE 'Columna resetToken agregada';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'resetTokenExpiry'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
        RAISE NOTICE 'Columna resetTokenExpiry agregada';
    END IF;
END $$;
SQL

print_success "Columnas faltantes agregadas"
echo ""

# Paso 6: Ejecutar el SQL del baseline (ahora debería funcionar)
print_info "PASO 5: Aplicando baseline SQL completo..."
print_warning "Esto puede tardar unos segundos..."
echo ""

EXECUTION_LOG="baseline-execution-$(date +%Y%m%d-%H%M%S).log"

# Ejecutar con manejo de errores mejorado
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$TMP_SQL" 2>&1 | \
grep -v "already exists" | \
grep -v "NOTICE" | \
grep -v "^$" | \
tee "$EXECUTION_LOG"

SQL_EXIT_CODE=${PIPESTATUS[0]}

# Limpiar archivo temporal
rm -f "$TMP_SQL"

if [ $SQL_EXIT_CODE -ne 0 ]; then
    print_error "Hubo errores al ejecutar el SQL"
    print_info "Log guardado en: $EXECUTION_LOG"
    print_warning "Revisa el log para ver los errores"
    echo ""
    print_info "Si necesitas hacer rollback:"
    echo "  ./restore-to-qa.sh $BACKUP_FILE --fresh"
    exit 1
fi

print_success "SQL ejecutado"
echo ""

# Paso 7: Limpiar _prisma_migrations
print_info "PASO 6: Limpiando _prisma_migrations..."

docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
DELETE FROM "_prisma_migrations";
SQL

if [ $? -eq 0 ]; then
    print_success "Tabla _prisma_migrations limpiada"
fi

echo ""

# Paso 8: Marcar baseline como aplicado
print_info "PASO 7: Marcando baseline como aplicado..."

BASELINE_NAME=$(basename "$BASELINE_DIR")
docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate resolve --applied '$BASELINE_NAME'" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate resolve --applied '$BASELINE_NAME'"

if [ $? -eq 0 ]; then
    print_success "Baseline marcado como aplicado"
fi

echo ""

# Paso 9: Generar Prisma Client
print_info "PASO 8: Generando Prisma Client..."

docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma generate" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma generate"

echo ""

# Paso 10: Verificación
print_info "PASO 9: Verificación final..."
echo ""

print_info "Estado de Prisma:"
docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate status" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate status"

echo ""
print_info "Migraciones registradas:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

echo ""
print_info "Verificando estructura de tipos_unidad_edificio:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "\d tipos_unidad_edificio" | head -30

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Baseline aplicado exitosamente"
print_info "Backup guardado: $BACKUP_FILE"
if [ -f "$EXECUTION_LOG" ]; then
    print_info "Log de ejecución: $EXECUTION_LOG"
fi
echo ""

print_warning "PRÓXIMO PASO: Reiniciar la aplicación"
echo ""
echo "  docker restart $APP_CONTAINER"
echo ""

print_info "¿Reiniciar el contenedor de la aplicación ahora?"
read -p "(y/n): " restart

if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    print_info "Reiniciando $APP_CONTAINER..."
    docker restart "$APP_CONTAINER"
    print_success "Contenedor reiniciado"
    echo ""
    print_warning "Monitoreando logs (Ctrl+C para salir)..."
    sleep 2
    docker logs -f "$APP_CONTAINER"
fi

echo ""
