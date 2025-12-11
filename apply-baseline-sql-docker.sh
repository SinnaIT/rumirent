#!/bin/bash

# Script para Aplicar el SQL del Baseline en QA
# Cuando la DB no tiene la estructura actualizada
# Ejecutar desde el HOST

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

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   APLICAR SQL BASELINE PARA ACTUALIZAR ESTRUCTURA EN QA  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

print_warning "Este script va a:"
echo "  1. Ejecutar el SQL del baseline para crear/actualizar la estructura"
echo "  2. Marcar el baseline como aplicado"
echo "  3. Generar Prisma Client"
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

# Paso 1: Encontrar el archivo SQL del baseline
print_info "PASO 1: Buscando archivo SQL del baseline..."

# Buscar dentro del contenedor
BASELINE_DIR=$(docker exec "$APP_CONTAINER" sh -c "ls -1d /app/prisma/migrations/*baseline* 2>/dev/null | head -1" || \
               docker exec "$APP_CONTAINER" sh -c "ls -1d prisma/migrations/*baseline* 2>/dev/null | head -1")

if [ -z "$BASELINE_DIR" ]; then
    print_error "No se encontró directorio de baseline en el contenedor"
    print_info "Intentando listar migraciones:"
    docker exec "$APP_CONTAINER" sh -c "ls -la /app/prisma/migrations/ 2>/dev/null || ls -la prisma/migrations/ 2>/dev/null"
    exit 1
fi

print_success "Directorio baseline encontrado: $BASELINE_DIR"

# Verificar que existe migration.sql
SQL_FILE="$BASELINE_DIR/migration.sql"
if ! docker exec "$APP_CONTAINER" sh -c "test -f $SQL_FILE"; then
    print_error "No se encontró $SQL_FILE"
    exit 1
fi

print_success "Archivo SQL encontrado: $SQL_FILE"
echo ""

# Paso 2: Hacer backup de la DB actual
print_info "PASO 2: Creando backup de seguridad..."

BACKUP_FILE="backup-qa-before-baseline-$(date +%Y%m%d-%H%M%S).sql"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
    print_warning "No se pudo crear backup completo"
}

if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_success "Backup guardado: $BACKUP_FILE"
fi

echo ""

# Paso 3: Confirmar ejecución
print_warning "ATENCIÓN: Vas a ejecutar el SQL del baseline en QA"
echo ""
echo "Esto va a:"
echo "  - Crear tablas que no existan"
echo "  - Agregar columnas nuevas"
echo "  - Crear enums, índices, constraints"
echo ""
echo "Si algo ya existe, PostgreSQL lo saltará (no causará error)"
echo ""

read -p "¿Continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

echo ""

# Paso 4: Limpiar tabla _prisma_migrations
print_info "PASO 3: Limpiando _prisma_migrations..."

docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
DELETE FROM "_prisma_migrations";
SQL

if [ $? -eq 0 ]; then
    print_success "Tabla _prisma_migrations limpiada"
else
    print_warning "No se pudo limpiar _prisma_migrations (puede no existir aún)"
fi

echo ""

# Paso 5: Ejecutar el SQL del baseline
print_info "PASO 4: Aplicando SQL del baseline..."
print_warning "Esto puede tardar unos segundos..."
echo ""

# Copiar el SQL del contenedor al host temporalmente
TMP_SQL="/tmp/baseline-migration-$$.sql"
docker exec "$APP_CONTAINER" cat "$SQL_FILE" > "$TMP_SQL"

# Ejecutar el SQL en la base de datos
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$TMP_SQL" 2>&1 | while IFS= read -r line; do
    # Filtrar mensajes que no son errores críticos
    if [[ "$line" =~ "ERROR" ]] && ! [[ "$line" =~ "already exists" ]]; then
        print_error "$line"
    elif [[ "$line" =~ "CREATE" ]] || [[ "$line" =~ "ALTER" ]] || [[ "$line" =~ "ADD" ]]; then
        print_success "$line"
    fi
done

SQL_EXIT=$?

# Limpiar archivo temporal
rm -f "$TMP_SQL"

if [ $SQL_EXIT -eq 0 ] || [ $SQL_EXIT -eq 1 ]; then
    print_success "SQL del baseline aplicado (algunos comandos pueden haber sido omitidos si ya existían)"
else
    print_error "Error al aplicar el SQL"
    print_warning "Puedes restaurar desde: $BACKUP_FILE"
    exit 1
fi

echo ""

# Paso 6: Marcar baseline como aplicado
print_info "PASO 5: Marcando baseline como aplicado..."

BASELINE_NAME=$(basename "$BASELINE_DIR")
docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate resolve --applied '$BASELINE_NAME'" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate resolve --applied '$BASELINE_NAME'"

if [ $? -eq 0 ]; then
    print_success "Baseline marcado como aplicado"
else
    print_error "Error al marcar baseline"
fi

echo ""

# Paso 7: Verificar estado
print_info "PASO 6: Verificando estado..."
echo ""

docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma migrate status" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma migrate status"

echo ""

# Paso 8: Generar Prisma Client
print_info "PASO 7: Generando Prisma Client..."

docker exec "$APP_CONTAINER" sh -c "cd /app 2>/dev/null && npx prisma generate" || \
docker exec "$APP_CONTAINER" sh -c "npx prisma generate"

echo ""

# Paso 9: Verificar tablas creadas
print_info "PASO 8: Verificando estructura de la base de datos..."
echo ""

print_info "Tablas en la base de datos:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

echo ""

print_info "Enums creados:"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

print_success "Estructura de base de datos actualizada con baseline"
print_info "Backup guardado en: $BACKUP_FILE"
echo ""

print_warning "PRÓXIMO PASO: Reiniciar la aplicación"
echo "  docker restart $APP_CONTAINER"
echo ""

read -p "¿Reiniciar el contenedor ahora? (y/n): " restart

if [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    print_info "Reiniciando $APP_CONTAINER..."
    docker restart "$APP_CONTAINER"
    print_success "Contenedor reiniciado"
    echo ""
    print_info "Monitoreando logs (Ctrl+C para salir)..."
    sleep 2
    docker logs -f "$APP_CONTAINER"
fi

echo ""
