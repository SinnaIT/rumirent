#!/bin/bash

# Script para Aplicar Baseline en Producción (con migraciones antiguas)
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

# Función para cargar .env
load_env() {
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    fi
}

load_env

# Configuración
DATABASE_URL="${DATABASE_URL:-}"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     APLICAR BASELINE EN PRODUCCIÓN (MÉTODO SEGURO)        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

print_warning "⚠️  ADVERTENCIA: Este script va a modificar la tabla _prisma_migrations en PRODUCCIÓN"
print_warning "⚠️  Asegúrate de tener un BACKUP VERIFICADO antes de continuar"
echo ""

# Verificar que DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL no está definida"
    print_info "Definela en .env o como variable de entorno"
    exit 1
fi

print_info "DATABASE_URL configurada: ${DATABASE_URL:0:30}..."
echo ""

# Paso 1: Verificar estado actual
print_info "PASO 1: Verificando estado actual..."
echo ""

print_info "Migraciones en el código:"
ls -1 prisma/migrations/ | grep -v migration_lock.toml
echo ""

print_info "Migraciones aplicadas en producción:"
psql "$DATABASE_URL" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;" || {
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
    echo "  pg_dump \"\$DATABASE_URL\" > backup-prod-\$(date +%Y%m%d-%H%M%S).sql"
    exit 1
fi

print_success "Backup verificado: $BACKUP_FILE"
echo ""

# Paso 3: Confirmación final
print_warning "ATENCIÓN: Este script va a:"
echo "  1. Eliminar TODOS los registros de _prisma_migrations"
echo "  2. Marcar el baseline como aplicado"
echo "  3. NO modificará datos ni estructura de tablas"
echo ""
echo "Base de datos: ${DATABASE_URL:0:50}..."
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
psql "$DATABASE_URL" -c "COPY _prisma_migrations TO STDOUT;" > "$MIGRATIONS_BACKUP" 2>/dev/null || {
    print_warning "No se pudo crear backup de _prisma_migrations"
}

if [ -f "$MIGRATIONS_BACKUP" ] && [ -s "$MIGRATIONS_BACKUP" ]; then
    print_success "Backup de _prisma_migrations: $MIGRATIONS_BACKUP"
fi

echo ""

# Paso 5: Limpiar _prisma_migrations
print_info "PASO 3: Limpiando registros de migraciones antiguas..."

psql "$DATABASE_URL" <<'SQL'
DELETE FROM "_prisma_migrations";
SQL

if [ $? -eq 0 ]; then
    print_success "Registros de migraciones antiguas eliminados"
else
    print_error "Error al limpiar _prisma_migrations"
    exit 1
fi

# Verificar
COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM _prisma_migrations;")
print_info "Registros en _prisma_migrations: $COUNT"
echo ""

# Paso 6: Identificar baseline
print_info "PASO 4: Identificando migración baseline..."

BASELINE=$(ls -1 prisma/migrations/ | grep -E "baseline|production_ready" | head -1)

if [ -z "$BASELINE" ]; then
    print_error "No se encontró migración baseline"
    exit 1
fi

print_success "Baseline encontrada: $BASELINE"
echo ""

# Paso 7: Marcar baseline como aplicada
print_info "PASO 5: Marcando baseline como aplicada (SIN ejecutar SQL)..."
echo ""

npx prisma migrate resolve --applied "$BASELINE"

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
psql "$DATABASE_URL" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

print_success "Baseline aplicado exitosamente en producción"
print_warning "PRÓXIMO PASO: Reiniciar la aplicación"
echo ""
echo "  # PM2:"
echo "  pm2 restart rumirent-prod"
echo ""
echo "  # Docker:"
echo "  docker restart rumirent-prod-app"
echo ""
echo "  # Systemd:"
echo "  sudo systemctl restart rumirent"
echo ""

print_warning "Monitorear logs después de reiniciar:"
echo "  pm2 logs rumirent-prod --lines 50"
echo "  # o"
echo "  docker logs -f rumirent-prod-app"
echo ""

print_info "Backups creados:"
echo "  - $BACKUP_FILE (completo)"
if [ -f "$MIGRATIONS_BACKUP" ]; then
    echo "  - $MIGRATIONS_BACKUP (_prisma_migrations)"
fi
echo ""
