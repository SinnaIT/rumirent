#!/bin/bash

# Script para Limpiar Migraciones Antiguas y Aplicar Baseline en QA
# Para cuando el código está DENTRO de contenedores Docker
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
echo "║   LIMPIAR MIGRACIONES ANTIGUAS Y APLICAR BASELINE EN QA   ║"
echo "║              (Código en Contenedores Docker)              ║"
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

# Paso 1: Verificar estado actual
print_info "PASO 1: Verificando estado actual de migraciones..."
echo ""

print_info "Migraciones en el código (dentro del contenedor):"
docker exec "$APP_CONTAINER" sh -c "ls -1 /app/prisma/migrations/ 2>/dev/null | grep -v migration_lock.toml" || {
    docker exec "$APP_CONTAINER" sh -c "ls -1 prisma/migrations/ 2>/dev/null | grep -v migration_lock.toml" || {
        print_warning "No se pudo listar migraciones en el contenedor"
    }
}
echo ""

print_info "Migraciones aplicadas en la base de datos:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;" 2>/dev/null || {
    print_warning "No se pudo leer la tabla _prisma_migrations"
}
echo ""

# Paso 2: Confirmar acción
print_warning "ATENCIÓN: Este script va a:"
echo "  1. Eliminar TODOS los registros de _prisma_migrations"
echo "  2. Marcar la migración baseline como aplicada (dentro del contenedor)"
echo "  3. Mantener los datos intactos (NO elimina tablas)"
echo ""

read -p "¿Continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

echo ""

# Paso 3: Hacer backup de _prisma_migrations
print_info "PASO 2: Creando backup de _prisma_migrations..."

BACKUP_FILE="backup-prisma-migrations-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "COPY _prisma_migrations TO STDOUT;" > "$BACKUP_FILE" 2>/dev/null || {
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

docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
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
COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM _prisma_migrations;")
print_info "Registros en _prisma_migrations: $COUNT"
echo ""

# Paso 6: Identificar migración baseline dentro del contenedor
print_info "PASO 4: Identificando migración baseline..."

BASELINE=$(docker exec "$APP_CONTAINER" sh -c "ls -1 /app/prisma/migrations/ 2>/dev/null | grep -E 'baseline|production_ready' | head -1" || \
           docker exec "$APP_CONTAINER" sh -c "ls -1 prisma/migrations/ 2>/dev/null | grep -E 'baseline|production_ready' | head -1")

if [ -z "$BASELINE" ]; then
    print_error "No se encontró migración baseline en el contenedor"
    print_info "Intentando listar migraciones:"
    docker exec "$APP_CONTAINER" sh -c "ls -1 /app/prisma/migrations/ 2>/dev/null || ls -1 prisma/migrations/ 2>/dev/null"
    exit 1
fi

print_success "Migración baseline encontrada: $BASELINE"
echo ""

# Paso 7: Marcar baseline como aplicada (DENTRO del contenedor)
print_info "PASO 5: Marcando baseline como aplicada (SIN ejecutarla)..."
print_warning "Ejecutando 'npx prisma migrate resolve' dentro del contenedor..."
echo ""

# Intentar en /app primero, luego en el directorio actual del contenedor
docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate resolve --applied '$BASELINE'" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate resolve --applied '$BASELINE'"

if [ $? -eq 0 ]; then
    print_success "Baseline marcada como aplicada"
else
    print_error "Error al marcar baseline como aplicada"
    exit 1
fi

echo ""

# Paso 8: Verificar estado de Prisma (dentro del contenedor)
print_info "PASO 6: Verificando estado de Prisma..."
echo ""

docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate status" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate status"

echo ""

# Paso 9: Generar Prisma Client (dentro del contenedor)
print_info "PASO 7: Generando Prisma Client..."
docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma generate" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma generate"

echo ""

# Paso 10: Verificación final
print_info "PASO 8: Verificación final..."
echo ""

print_info "Migraciones en _prisma_migrations:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

echo ""

print_info "Tablas en la base de datos (primeras 20):"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | head -20

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Migraciones limpiadas y baseline aplicada"
print_info "Próximo paso: Reiniciar la aplicación"
echo ""
echo "  docker restart $APP_CONTAINER"
echo "  # o"
echo "  docker-compose restart rumirent-qa-app"
echo ""

print_warning "Monitorear logs después de reiniciar:"
echo "  docker logs -f $APP_CONTAINER"
echo ""

print_info "Si el script se usó correctamente y quieres reiniciar automáticamente:"
read -p "¿Reiniciar el contenedor de la aplicación ahora? (y/n): " restart

if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    print_info "Reiniciando $APP_CONTAINER..."
    docker restart "$APP_CONTAINER"
    print_success "Contenedor reiniciado"
    echo ""
    print_info "Ver logs:"
    echo "  docker logs -f $APP_CONTAINER"
fi

echo ""
