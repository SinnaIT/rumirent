#!/bin/bash

# Script para Limpiar Migraciones Antiguas y Aplicar Baseline en QA
# Soluciona: "migrations are applied but missing from local directory"

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
        export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    fi
}

load_env

# Configuración
CONTAINER="${POSTGRES_CONTAINER_NAME:-rumirent-qa-db}"
USER="${POSTGRES_USER:-rumirent_qa}"
DATABASE="${POSTGRES_DB:-rumirent_qa_db}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   LIMPIAR MIGRACIONES ANTIGUAS Y APLICAR BASELINE EN QA   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_info "Configuración:"
echo "  Container: $CONTAINER"
echo "  User: $USER"
echo "  Database: $DATABASE"
echo ""

# Paso 1: Verificar estado actual
print_info "PASO 1: Verificando estado actual de migraciones..."
echo ""

print_info "Migraciones en el código:"
ls -1 prisma/migrations/ | grep -v migration_lock.toml
echo ""

print_info "Migraciones aplicadas en la base de datos:"
docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;" 2>/dev/null || {
    print_warning "No se pudo leer la tabla _prisma_migrations"
}
echo ""

# Paso 2: Confirmar acción
print_warning "ATENCIÓN: Este script va a:"
echo "  1. Eliminar TODOS los registros de _prisma_migrations"
echo "  2. Marcar la migración baseline como aplicada"
echo "  3. Mantener los datos intactos (NO elimina tablas)"
echo ""

read -p "¿Continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

echo ""

# Paso 3: Hacer backup de _prisma_migrations (por seguridad)
print_info "PASO 2: Creando backup de _prisma_migrations..."

BACKUP_FILE="backup-prisma-migrations-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -c "COPY _prisma_migrations TO STDOUT;" > "$BACKUP_FILE" 2>/dev/null || {
    print_warning "No se pudo crear backup (puede ser normal si la tabla está vacía)"
}

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_success "Backup guardado en: $BACKUP_FILE"
else
    print_warning "No hay datos para respaldar"
    rm -f "$BACKUP_FILE"
fi

echo ""

# Paso 4: Limpiar tabla _prisma_migrations
print_info "PASO 3: Limpiando registros de migraciones antiguas..."

docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" <<'SQL'
DELETE FROM "_prisma_migrations";
SQL

if [ $? -eq 0 ]; then
    print_success "Registros de migraciones antiguas eliminados"
else
    print_error "Error al limpiar _prisma_migrations"
    exit 1
fi

echo ""

# Paso 5: Verificar que la tabla está vacía
print_info "Verificando que la tabla está vacía..."
COUNT=$(docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -tAc "SELECT COUNT(*) FROM _prisma_migrations;")
print_info "Registros en _prisma_migrations: $COUNT"
echo ""

# Paso 6: Identificar migración baseline
print_info "PASO 4: Identificando migración baseline..."

BASELINE=$(ls -1 prisma/migrations/ | grep -E "baseline|production_ready" | head -1)

if [ -z "$BASELINE" ]; then
    print_error "No se encontró migración baseline en prisma/migrations/"
    print_info "Migraciones disponibles:"
    ls -1 prisma/migrations/ | grep -v migration_lock.toml
    exit 1
fi

print_success "Migración baseline encontrada: $BASELINE"
echo ""

# Paso 7: Marcar baseline como aplicada
print_info "PASO 5: Marcando baseline como aplicada (SIN ejecutarla)..."
print_warning "La base de datos ya tiene la estructura, solo actualizamos el registro"
echo ""

npx prisma migrate resolve --applied "$BASELINE"

if [ $? -eq 0 ]; then
    print_success "Baseline marcada como aplicada"
else
    print_error "Error al marcar baseline como aplicada"
    exit 1
fi

echo ""

# Paso 8: Verificar estado de Prisma
print_info "PASO 6: Verificando estado de Prisma..."
echo ""

npx prisma migrate status

echo ""

# Paso 9: Generar Prisma Client
print_info "PASO 7: Generando Prisma Client..."
npx prisma generate

echo ""

# Paso 10: Verificación final
print_info "PASO 8: Verificación final..."
echo ""

print_info "Migraciones en _prisma_migrations:"
docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

echo ""

print_info "Tablas en la base de datos:"
docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | head -20

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Migraciones limpiadas y baseline aplicada"
print_info "Próximo paso: Reiniciar la aplicación"
echo ""
echo "  docker restart rumirent-qa-app"
echo "  # o"
echo "  docker-compose restart rumirent-qa-app"
echo ""

print_warning "Monitorear logs después de reiniciar:"
echo "  docker logs -f rumirent-qa-app"
echo ""
