#!/bin/bash

# Script de Validación de Restauración QA
# Compara los datos entre el backup de producción y la base de datos de QA

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
BACKUP_FILE="${1:-backup/backup-20251210.sql}"
QA_CONTAINER="${POSTGRES_CONTAINER_NAME:-rumirent-qa-db}"
QA_USER="${POSTGRES_USER:-rumirent_qa}"
QA_DATABASE="${POSTGRES_DB:-rumirent_qa_db}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          VALIDAR RESTAURACIÓN DE QA vs BACKUP            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_info "Configuración:"
echo "  Backup de producción: $BACKUP_FILE"
echo "  Contenedor QA: $QA_CONTAINER"
echo "  Usuario QA: $QA_USER"
echo "  Database QA: $QA_DATABASE"
echo ""

# Verificar que el backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Archivo de backup no encontrado: $BACKUP_FILE"
    exit 1
fi

print_success "Backup encontrado"
echo ""

# Verificar contenedor
if ! docker ps | grep -q "$QA_CONTAINER"; then
    print_error "Contenedor '$QA_CONTAINER' no está corriendo"
    exit 1
fi

print_success "Contenedor QA corriendo"
echo ""

# ============================================================================
# PASO 1: Analizar el backup de producción
# ============================================================================

print_info "PASO 1: Analizando backup de producción..."
echo ""

# Contar registros en el backup
print_info "📊 Conteos en el BACKUP de producción:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PROD_USERS=$(grep -c "^[0-9a-f-]\{36\}" "$BACKUP_FILE" | head -1 || echo "0")
print_info "Estimando registros del backup (puede no ser exacto)..."

# Buscar líneas de datos en el backup
PROD_USERS_DATA=$(grep "COPY public.users" "$BACKUP_FILE" -A 1000 | grep -c "^[a-z0-9]" || echo "0")
PROD_EMPRESAS_DATA=$(grep "COPY public.empresas" "$BACKUP_FILE" -A 1000 | grep -c "^[a-z0-9]" || echo "0")
PROD_EDIFICIOS_DATA=$(grep "COPY public.edificios" "$BACKUP_FILE" -A 1000 | grep -c "^[a-z0-9]" || echo "0")
PROD_LEADS_DATA=$(grep "COPY public.leads" "$BACKUP_FILE" -A 1000 | grep -c "^[a-z0-9]" || echo "0")

echo "  Users estimados: ~$PROD_USERS_DATA líneas de datos"
echo "  Empresas estimadas: ~$PROD_EMPRESAS_DATA líneas de datos"
echo "  Edificios estimados: ~$PROD_EDIFICIOS_DATA líneas de datos"
echo "  Leads estimados: ~$PROD_LEADS_DATA líneas de datos"
echo ""

# Verificar integridad del backup
print_info "🔍 Verificando integridad del backup..."
if grep -q "PostgreSQL database dump complete" "$BACKUP_FILE"; then
    print_success "Backup está completo (tiene marca de finalización)"
else
    print_warning "Backup podría estar incompleto (no tiene marca de finalización)"
fi

if grep -q "COPY public.users" "$BACKUP_FILE"; then
    print_success "Backup contiene tabla 'users'"
else
    print_error "Backup NO contiene tabla 'users'"
fi

if grep -q "COPY public.empresas" "$BACKUP_FILE"; then
    print_success "Backup contiene tabla 'empresas'"
else
    print_error "Backup NO contiene tabla 'empresas'"
fi

echo ""

# ============================================================================
# PASO 2: Verificar base de datos de QA
# ============================================================================

print_info "PASO 2: Verificando base de datos de QA..."
echo ""

# Verificar que la DB existe
print_info "🔍 Verificando que la base de datos existe..."
if docker exec "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" -c "SELECT 1" > /dev/null 2>&1; then
    print_success "Base de datos '$QA_DATABASE' existe y es accesible"
else
    print_error "No se puede conectar a la base de datos '$QA_DATABASE'"
    print_info "Bases de datos disponibles:"
    docker exec "$QA_CONTAINER" psql -U "$QA_USER" -d postgres -c "\l"
    exit 1
fi

echo ""

# Contar registros en QA
print_info "📊 Conteos ACTUALES en QA:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker exec "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" <<'SQL'
DO $$
DECLARE
    users_count INT;
    empresas_count INT;
    edificios_count INT;
    unidades_count INT;
    clientes_count INT;
    leads_count INT;
BEGIN
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO empresas_count FROM empresas;
    SELECT COUNT(*) INTO edificios_count FROM edificios;
    SELECT COUNT(*) INTO unidades_count FROM unidades;
    SELECT COUNT(*) INTO clientes_count FROM clientes;
    SELECT COUNT(*) INTO leads_count FROM leads;

    RAISE NOTICE '  Users: %', users_count;
    RAISE NOTICE '  Empresas: %', empresas_count;
    RAISE NOTICE '  Edificios: %', edificios_count;
    RAISE NOTICE '  Unidades: %', unidades_count;
    RAISE NOTICE '  Clientes: %', clientes_count;
    RAISE NOTICE '  Leads: %', leads_count;
END $$;
SQL

echo ""

# Verificar algunas tablas específicas
print_info "🔍 Verificando estructura de tablas en QA..."

# Verificar columnas de users
print_info "Columnas en tabla 'users':"
docker exec "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;" | head -20

echo ""

# Verificar columnas de empresas
print_info "Columnas en tabla 'empresas':"
docker exec "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'empresas' ORDER BY ordinal_position;"

echo ""

# ============================================================================
# PASO 3: Diagnóstico de problemas comunes
# ============================================================================

print_info "PASO 3: Diagnóstico de problemas comunes..."
echo ""

# Problema 1: La DB no se recreó antes de restaurar
print_info "❓ Verificando si hay conflictos de datos..."
HAS_DATA=$(docker exec "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')

if [ "$HAS_DATA" = "0" ]; then
    print_warning "La base de datos NO tiene datos de users"
    print_info "Posibles causas:"
    echo "  1. El backup no se restauró correctamente"
    echo "  2. La tabla se creó pero sin datos"
    echo "  3. El archivo de backup está vacío o corrupto"
else
    print_success "La base de datos tiene $HAS_DATA usuarios"
fi

echo ""

# Problema 2: El backup tiene formato incorrecto
print_info "❓ Verificando formato del backup..."
BACKUP_FORMAT=$(head -1 "$BACKUP_FILE")
if [[ "$BACKUP_FORMAT" == *"PostgreSQL database dump"* ]]; then
    print_success "Backup tiene formato pg_dump correcto"
else
    print_warning "Backup podría tener formato incorrecto"
    print_info "Primera línea del backup:"
    head -1 "$BACKUP_FILE"
fi

echo ""

# Problema 3: Permisos o propietario incorrecto
print_info "❓ Verificando propietario de las tablas..."
docker exec "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" -c "SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" | head -15

echo ""

# ============================================================================
# PASO 4: Recomendaciones
# ============================================================================

print_info "PASO 4: Recomendaciones..."
echo ""

if [ "$HAS_DATA" = "0" ]; then
    print_error "❌ La restauración NO funcionó correctamente"
    echo ""
    print_info "📋 Pasos para solucionar:"
    echo ""
    echo "1. Verificar que el backup está completo:"
    echo "   tail -5 $BACKUP_FILE"
    echo "   # Debe terminar con: PostgreSQL database dump complete"
    echo ""
    echo "2. Hacer una restauración LIMPIA (--fresh):"
    echo "   chmod +x restore-to-qa.sh"
    echo "   ./restore-to-qa.sh $BACKUP_FILE --fresh"
    echo ""
    echo "3. Si el problema persiste, restaurar manualmente:"
    echo "   # Eliminar y recrear DB"
    echo "   docker exec $QA_CONTAINER psql -U $QA_USER -d postgres -c \"DROP DATABASE IF EXISTS $QA_DATABASE;\""
    echo "   docker exec $QA_CONTAINER psql -U $QA_USER -d postgres -c \"CREATE DATABASE $QA_DATABASE;\""
    echo ""
    echo "   # Restaurar backup"
    echo "   cat $BACKUP_FILE | docker exec -i $QA_CONTAINER psql -U $QA_USER -d $QA_DATABASE"
    echo ""
else
    print_success "✅ La base de datos tiene datos"
    print_info "Si los datos no coinciden con producción, prueba:"
    echo ""
    echo "1. Hacer una restauración LIMPIA:"
    echo "   ./restore-to-qa.sh $BACKUP_FILE --fresh"
    echo ""
    echo "2. Verificar que estás usando el backup correcto de producción"
    echo ""
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 VALIDACIÓN COMPLETADA                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
