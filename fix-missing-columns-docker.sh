#!/bin/bash

# Script para Agregar TODAS las Columnas Faltantes en QA
# Compara schema.prisma con la DB actual y genera ALTER TABLE
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
echo "║     AGREGAR COLUMNAS FALTANTES EN QA (DOCKER)            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_info "Configuración:"
echo "  DB Container: $DB_CONTAINER"
echo "  APP Container: $APP_CONTAINER"
echo "  DB User: $DB_USER"
echo "  Database: $DB_NAME"
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

# Paso 1: Introspección de la DB actual
print_info "PASO 1: Obteniendo esquema actual de la DB..."
echo ""

# Crear un schema temporal basado en la DB actual
docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma db pull --print" > /tmp/current-schema.prisma 2>/dev/null || {
    print_error "No se pudo hacer introspección de la DB"
    exit 1
}

print_success "Esquema actual obtenido"
echo ""

# Paso 2: Generar diff (lo que falta agregar)
print_info "PASO 2: Generando SQL para columnas faltantes..."
echo ""

# Generar SQL de diferencias
DIFF_SQL="/tmp/add-missing-columns-$$.sql"

docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma migrate diff --from-schema-datamodel /dev/stdin --to-schema-datamodel prisma/schema.prisma --script" < /tmp/current-schema.prisma > "$DIFF_SQL" 2>/dev/null || {
    print_error "No se pudo generar el diff"
    exit 1
}

# Verificar que se generó SQL
if [ ! -s "$DIFF_SQL" ]; then
    print_warning "No hay diferencias entre el schema actual y el deseado"
    print_success "La base de datos ya está actualizada"
    rm -f /tmp/current-schema.prisma "$DIFF_SQL"
    exit 0
fi

print_success "SQL de diferencias generado"
echo ""

print_info "Cambios a aplicar:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$DIFF_SQL" | head -50
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Paso 3: Confirmar
print_warning "ATENCIÓN: Se van a aplicar estos cambios a la DB de QA"
echo ""
read -p "¿Continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    rm -f /tmp/current-schema.prisma "$DIFF_SQL"
    exit 0
fi

echo ""

# Paso 4: Backup
print_info "PASO 3: Creando backup..."

BACKUP_FILE="backup-qa-before-columns-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
    print_warning "No se pudo crear backup"
}

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_success "Backup guardado: $BACKUP_FILE"
fi

echo ""

# Paso 5: Aplicar SQL
print_info "PASO 4: Aplicando cambios..."
echo ""

EXECUTION_LOG="add-columns-$(date +%Y%m%d-%H%M%S).log"

docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$DIFF_SQL" 2>&1 | tee "$EXECUTION_LOG"

SQL_EXIT_CODE=${PIPESTATUS[0]}

# Limpiar temporales
rm -f /tmp/current-schema.prisma "$DIFF_SQL"

if [ $SQL_EXIT_CODE -ne 0 ]; then
    print_error "Hubo errores al aplicar los cambios"
    print_info "Log guardado en: $EXECUTION_LOG"
    echo ""
    print_info "Si necesitas hacer rollback:"
    echo "  ./restore-to-qa.sh $BACKUP_FILE --fresh"
    exit 1
fi

print_success "Cambios aplicados"
echo ""

# Paso 6: Generar Prisma Client
print_info "PASO 5: Generando Prisma Client..."

docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma generate" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma generate"

echo ""

# Paso 7: Verificación
print_info "PASO 6: Verificando columnas problemáticas..."
echo ""

print_info "Verificando tipos_unidad_edificio.descripcion:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tipos_unidad_edificio' AND column_name = 'descripcion';"

echo ""
print_info "Verificando empresas.tipoEntidad:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'tipoEntidad';"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Columnas faltantes agregadas"
print_info "Backup guardado: $BACKUP_FILE"
print_info "Log de ejecución: $EXECUTION_LOG"
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
    sleep 3
    docker logs -f "$APP_CONTAINER"
fi

echo ""
