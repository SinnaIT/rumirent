#!/bin/bash

# Script para Aplicar Baseline en Producción (con migraciones antiguas)
# Para cuando el código está DENTRO de contenedores Docker
# Ejecutar desde el HOST (no dentro del contenedor)
# ADVERTENCIA: Solo ejecutar en producción con backup verificado

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
DB_CONTAINER="${1:-rumirent-prod-db}"
APP_CONTAINER="${2:-rumirent-prod-app}"
DB_USER="${3:-rumirent_prod}"
DB_NAME="${4:-rumirent_db}"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     APLICAR BASELINE EN PRODUCCIÓN (MÉTODO SEGURO)        ║"
echo "║              (Código en Contenedores Docker)              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

print_warning "⚠️  ADVERTENCIA: Este script va a modificar la tabla _prisma_migrations en PRODUCCIÓN"
print_warning "⚠️  Asegúrate de tener un BACKUP VERIFICADO antes de continuar"
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
print_info "PASO 1: Verificando estado actual..."
echo ""

print_info "Migraciones en el código (dentro del contenedor):"
docker exec "$APP_CONTAINER" sh -c "ls -1 /app/prisma/migrations/ 2>/dev/null | grep -v migration_lock.toml" || \
docker exec "$APP_CONTAINER" sh -c "ls -1 prisma/migrations/ 2>/dev/null | grep -v migration_lock.toml" || {
    print_warning "No se pudo listar migraciones"
}
echo ""

print_info "Migraciones aplicadas en producción:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;" || {
    print_error "No se pudo conectar a la base de datos"
    exit 1
}
echo ""

# Paso 2: Confirmar backup
print_warning "⚠️  CHECKPOINT: ¿Tienes un backup de la base de datos?"
echo ""
read -p "Escribe el nombre del archivo de backup para continuar: " BACKUP_FILE

if [ -z "$BACKUP_FILE" ]; then
    print_error "Debes proporcionar el nombre del archivo de backup"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Archivo de backup no encontrado: $BACKUP_FILE"
    print_info "Crea un backup primero con:"
    echo "  docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > backup-prod-\$(date +%Y%m%d-%H%M%S).sql"
    exit 1
fi

print_success "Backup verificado: $BACKUP_FILE"
echo ""

# Paso 3: Confirmación final
print_warning "ATENCIÓN: Este script va a:"
echo "  1. Eliminar TODOS los registros de _prisma_migrations"
echo "  2. Marcar el baseline como aplicado (dentro del contenedor)"
echo "  3. NO modificará datos ni estructura de tablas"
echo ""
echo "Contenedor DB: $DB_CONTAINER"
echo "Contenedor APP: $APP_CONTAINER"
echo "Database: $DB_NAME"
echo "Backup disponible: $BACKUP_FILE"
echo ""

read -p "¿Estás COMPLETAMENTE SEGURO? (escribe 'SI EN PRODUCCION' para continuar): " confirmacion

if [ "$confirmacion" != "SI EN PRODUCCION" ]; then
    print_error "Operación cancelada"
    exit 0
fi

echo ""

# Paso 4: Hacer backup adicional de _prisma_migrations
print_info "PASO 2: Creando backup de _prisma_migrations..."

MIGRATIONS_BACKUP="backup-prisma-migrations-prod-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "COPY _prisma_migrations TO STDOUT;" > "$MIGRATIONS_BACKUP" 2>/dev/null || {
    print_warning "No se pudo crear backup de _prisma_migrations"
}

if [ -f "$MIGRATIONS_BACKUP" ] && [ -s "$MIGRATIONS_BACKUP" ]; then
    print_success "Backup de _prisma_migrations: $MIGRATIONS_BACKUP"
fi

echo ""

# Paso 5: Limpiar _prisma_migrations
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

# Verificar
COUNT=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM _prisma_migrations;")
print_info "Registros en _prisma_migrations: $COUNT"
echo ""

# Paso 6: Identificar baseline
print_info "PASO 4: Identificando migración baseline..."

BASELINE=$(docker exec "$APP_CONTAINER" sh -c "ls -1 /app/prisma/migrations/ 2>/dev/null | grep -E 'baseline|production_ready' | head -1" || \
           docker exec "$APP_CONTAINER" sh -c "ls -1 prisma/migrations/ 2>/dev/null | grep -E 'baseline|production_ready' | head -1")

if [ -z "$BASELINE" ]; then
    print_error "No se encontró migración baseline en el contenedor"
    exit 1
fi

print_success "Baseline encontrada: $BASELINE"
echo ""

# Paso 7: Marcar baseline como aplicada
print_info "PASO 5: Marcando baseline como aplicada (SIN ejecutar SQL)..."
echo ""

docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate resolve --applied '$BASELINE'" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate resolve --applied '$BASELINE'"

if [ $? -eq 0 ]; then
    print_success "Baseline marcada como aplicada"
else
    print_error "Error al marcar baseline"
    exit 1
fi

echo ""

# Paso 8: Verificar estado
print_info "PASO 6: Verificando estado de migraciones..."
echo ""

docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate status" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate status"

echo ""

# Paso 9: Generar Prisma Client
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
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

print_success "Baseline aplicado exitosamente en producción"
print_warning "PRÓXIMO PASO: Reiniciar la aplicación"
echo ""
echo "  docker restart $APP_CONTAINER"
echo "  # o"
echo "  docker-compose restart"
echo ""

print_warning "Monitorear logs después de reiniciar:"
echo "  docker logs -f $APP_CONTAINER"
echo ""

print_info "Backups creados:"
echo "  - $BACKUP_FILE (completo)"
if [ -f "$MIGRATIONS_BACKUP" ]; then
    echo "  - $MIGRATIONS_BACKUP (_prisma_migrations)"
fi
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
