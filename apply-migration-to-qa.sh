#!/bin/bash

# Script para Aplicar Migración de Columnas Faltantes en QA (Docker)
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
MIGRATION_NAME="20251211000000_add_missing_columns"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      APLICAR MIGRACIÓN EN QA (Docker)                    ║"
echo "║      Agrega 8 columnas faltantes                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_info "Configuración:"
echo "  DB Container: $DB_CONTAINER"
echo "  APP Container: $APP_CONTAINER"
echo "  DB User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Migration: $MIGRATION_NAME"
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

# Verificar que la migración existe en el contenedor
print_info "Verificando archivo de migración..."

MIGRATION_PATH="/app/prisma/migrations/$MIGRATION_NAME/migration.sql"
if ! docker exec "$APP_CONTAINER" sh -c "test -f $MIGRATION_PATH"; then
    print_error "No se encontró $MIGRATION_PATH en el contenedor"
    print_info "Asegúrate de que el código está actualizado en el contenedor"
    exit 1
fi

print_success "Archivo de migración encontrado"
echo ""

# Mostrar qué va a hacer
print_info "Esta migración va a agregar las siguientes columnas:"
echo ""
echo "  tipos_unidad_edificio:"
echo "    - activo (Boolean, default: true)"
echo "    - descripcion (Text, nullable)"
echo "    - plantillaOrigenId (Text, nullable)"
echo ""
echo "  empresas:"
echo "    - tipoEntidad (TipoEntidad enum, default: COMPANY)"
echo ""
echo "  users:"
echo "    - lastPasswordChange (DateTime, nullable)"
echo "    - mustChangePassword (Boolean, default: false)"
echo "    - resetToken (Text, nullable)"
echo "    - resetTokenExpiry (DateTime, nullable)"
echo ""

# Confirmar
read -p "¿Continuar con la migración en QA? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

echo ""

# Backup de seguridad
print_info "PASO 1: Creando backup de seguridad..."

BACKUP_FILE="backup-qa-before-migration-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
    print_warning "No se pudo crear backup completo"
}

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_success "Backup guardado: $BACKUP_FILE"
fi

echo ""

# Limpiar migraciones antiguas (baseline problemático)
print_info "PASO 2: Limpiando migraciones antiguas..."

docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL' 2>&1 | grep -v "^$" || true
-- Eliminar registros de baseline antiguo si existen
DELETE FROM "_prisma_migrations"
WHERE migration_name LIKE '%baseline%';
SQL

print_success "Migraciones antiguas limpiadas"
echo ""

# Aplicar la migración usando Prisma
print_info "PASO 3: Aplicando migración..."
echo ""

docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma migrate deploy" 2>&1 | tee migration-qa-$(date +%Y%m%d-%H%M%S).log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Migración aplicada exitosamente"
else
    print_error "Error al aplicar migración"
    print_info "Revisa el log para más detalles"
    print_warning "Si necesitas hacer rollback:"
    echo "  ./restore-to-qa.sh $BACKUP_FILE --fresh"
    exit 1
fi

echo ""

# Generar Prisma Client
print_info "PASO 4: Generando Prisma Client..."

docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma generate"

print_success "Prisma Client generado"
echo ""

# Verificación
print_info "PASO 5: Verificando columnas agregadas..."
echo ""

print_info "Columnas de tipos_unidad_edificio:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'tipos_unidad_edificio' ORDER BY ordinal_position;" | head -20

echo ""
print_info "Columnas de empresas:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'empresas' ORDER BY ordinal_position;" | head -20

echo ""
print_info "Columnas de users (últimas 5):"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('lastPasswordChange', 'mustChangePassword', 'resetToken', 'resetTokenExpiry', 'birthDate');"

echo ""
print_info "Estado de migraciones:"
docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma migrate status"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Migración aplicada exitosamente en QA"
print_info "Backup guardado: $BACKUP_FILE"
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
    print_info "Esperando 5 segundos para que la app inicie..."
    sleep 5
    echo ""
    print_success "La aplicación debería estar funcionando ahora"
    print_info "Verifica que las páginas ya no dan error"
    echo ""
    print_warning "Monitoreando logs (Ctrl+C para salir)..."
    sleep 2
    docker logs -f "$APP_CONTAINER"
fi

echo ""
