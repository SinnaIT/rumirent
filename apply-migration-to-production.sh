#!/bin/bash

# Script para Aplicar Migración de Columnas Faltantes en PRODUCCIÓN (Docker)
# ⚠️  USAR CON PRECAUCIÓN - ESTO MODIFICA LA BASE DE DATOS DE PRODUCCIÓN ⚠️
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
DB_CONTAINER="${1:-rumirent-prod-db}"
APP_CONTAINER="${2:-rumirent-prod-app}"
DB_USER="${3:-rumirent_prod}"
DB_NAME="${4:-rumirent_prod_db}"
MIGRATION_NAME="20251211000000_add_missing_columns"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      ⚠️  APLICAR MIGRACIÓN EN PRODUCCIÓN ⚠️              ║"
echo "║         Agrega 8 columnas faltantes                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_warning "⚠️  ATENCIÓN: ESTE SCRIPT MODIFICA LA BASE DE DATOS DE PRODUCCIÓN ⚠️"
echo ""

print_info "Configuración:"
echo "  DB Container: $DB_CONTAINER"
echo "  APP Container: $APP_CONTAINER"
echo "  DB User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Migration: $MIGRATION_NAME"
echo ""

# Primera confirmación
print_error "ADVERTENCIA: Estás a punto de modificar la base de datos de PRODUCCIÓN"
print_warning "Asegúrate de haber probado esta migración en QA primero"
echo ""
read -p "¿Has probado esta migración en QA y funcionó correctamente? (escribe 'SI' para confirmar): " qa_confirmed

if [ "$qa_confirmed" != "SI" ]; then
    print_error "Por favor prueba primero en QA antes de aplicar en producción"
    exit 0
fi

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

# Verificar que no hay usuarios conectados (opcional pero recomendado)
print_info "Verificando conexiones activas..."
ACTIVE_CONNECTIONS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" | tr -d ' ')

if [ "$ACTIVE_CONNECTIONS" -gt 5 ]; then
    print_warning "Hay $ACTIVE_CONNECTIONS conexiones activas a la base de datos"
    print_warning "Se recomienda aplicar esta migración en horario de bajo tráfico"
    echo ""
    read -p "¿Continuar de todas formas? (escribe 'SI' para confirmar): " continue_anyway
    if [ "$continue_anyway" != "SI" ]; then
        print_error "Operación cancelada"
        exit 0
    fi
fi

echo ""

# Segunda confirmación (más específica)
print_error "ÚLTIMA CONFIRMACIÓN"
print_warning "Vas a aplicar la migración '$MIGRATION_NAME' en PRODUCCIÓN"
echo ""
read -p "Para continuar, escribe exactamente 'SI EN PRODUCCION': " final_confirmation

if [ "$final_confirmation" != "SI EN PRODUCCION" ]; then
    print_error "Confirmación incorrecta. Operación cancelada por seguridad."
    exit 0
fi

echo ""

# Backup OBLIGATORIO de seguridad
print_info "PASO 1: Creando backup OBLIGATORIO de producción..."
print_warning "Este paso NO se puede omitir"
echo ""

BACKUP_FILE="backup-production-before-migration-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>&1

if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
    print_error "FALLO AL CREAR BACKUP DE PRODUCCIÓN"
    print_error "NO SE PUEDE CONTINUAR SIN BACKUP"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
print_success "Backup guardado: $BACKUP_FILE ($BACKUP_SIZE)"
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
print_info "PASO 3: Aplicando migración en PRODUCCIÓN..."
print_warning "Este proceso puede tardar dependiendo del tamaño de la base de datos"
echo ""

MIGRATION_LOG="migration-production-$(date +%Y%m%d-%H%M%S).log"
docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma migrate deploy" 2>&1 | tee "$MIGRATION_LOG"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    print_success "Migración aplicada exitosamente en PRODUCCIÓN"
else
    print_error "ERROR AL APLICAR MIGRACIÓN EN PRODUCCIÓN"
    print_error "La base de datos puede estar en estado inconsistente"
    print_info "Log guardado en: $MIGRATION_LOG"
    print_warning "ACCIÓN INMEDIATA REQUERIDA:"
    echo "  1. Revisar el log: $MIGRATION_LOG"
    echo "  2. Verificar el estado de la DB"
    echo "  3. Si es necesario, hacer rollback: ./restore-from-backup.sh $BACKUP_FILE"
    exit 1
fi

echo ""

# Generar Prisma Client
print_info "PASO 4: Generando Prisma Client..."

docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma generate"

print_success "Prisma Client generado"
echo ""

# Verificación exhaustiva
print_info "PASO 5: Verificando columnas agregadas..."
echo ""

print_info "Verificando tipos_unidad_edificio.descripcion:"
DESCRIPCION_EXISTS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'tipos_unidad_edificio' AND column_name = 'descripcion';" | tr -d ' ')
if [ "$DESCRIPCION_EXISTS" = "1" ]; then
    print_success "tipos_unidad_edificio.descripcion agregada correctamente"
else
    print_error "tipos_unidad_edificio.descripcion NO fue agregada"
fi

print_info "Verificando empresas.tipoEntidad:"
TIPO_ENTIDAD_EXISTS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'tipoEntidad';" | tr -d ' ')
if [ "$TIPO_ENTIDAD_EXISTS" = "1" ]; then
    print_success "empresas.tipoEntidad agregada correctamente"
else
    print_error "empresas.tipoEntidad NO fue agregada"
fi

print_info "Verificando users.resetToken:"
RESET_TOKEN_EXISTS=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'resetToken';" | tr -d ' ')
if [ "$RESET_TOKEN_EXISTS" = "1" ]; then
    print_success "users.resetToken agregada correctamente"
else
    print_error "users.resetToken NO fue agregada"
fi

echo ""
print_info "Estado de migraciones:"
docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma migrate status"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           ✅ MIGRACIÓN COMPLETADA EN PRODUCCIÓN            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Migración aplicada exitosamente en PRODUCCIÓN"
print_info "Backup guardado: $BACKUP_FILE ($BACKUP_SIZE)"
print_info "Log guardado: $MIGRATION_LOG"
echo ""

print_warning "PRÓXIMOS PASOS:"
echo ""
echo "  1. Reiniciar la aplicación de producción"
echo "     docker restart $APP_CONTAINER"
echo ""
echo "  2. Monitorear logs para detectar errores"
echo "     docker logs -f $APP_CONTAINER"
echo ""
echo "  3. Verificar que la aplicación funciona correctamente"
echo "     - Probar páginas que antes daban error"
echo "     - Verificar funcionalidad de tipos de unidad"
echo "     - Verificar funcionalidad de empresas"
echo ""
echo "  4. Guardar el backup en lugar seguro"
echo "     mv $BACKUP_FILE /ruta/a/backups/permanentes/"
echo ""

print_info "¿Reiniciar el contenedor de la aplicación ahora?"
read -p "(y/n): " restart

if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    print_info "Reiniciando $APP_CONTAINER..."
    docker restart "$APP_CONTAINER"
    print_success "Contenedor reiniciado"
    echo ""
    print_info "Esperando 10 segundos para que la app inicie..."
    sleep 10
    echo ""
    print_success "La aplicación debería estar funcionando ahora"
    print_warning "MONITOREA LOS LOGS CUIDADOSAMENTE"
    echo ""
    print_info "Presiona Ctrl+C cuando hayas verificado que todo funciona"
    sleep 2
    docker logs -f "$APP_CONTAINER"
fi

echo ""
print_success "Proceso completado"
echo ""
