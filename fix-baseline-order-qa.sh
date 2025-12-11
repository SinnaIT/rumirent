#!/bin/bash

# Script para regenerar el baseline DENTRO del contenedor de QA
# Esto soluciona el error de orden de columnas

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
APP_CONTAINER="${1:-rumirent-qa-app}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     REGENERAR BASELINE CON ORDEN CORRECTO EN QA          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_info "Contenedor: $APP_CONTAINER"
echo ""

# Verificar que el contenedor existe
if ! docker ps | grep -q "$APP_CONTAINER"; then
    print_error "Contenedor '$APP_CONTAINER' no está corriendo"
    print_info "Contenedores disponibles:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
    exit 1
fi

print_success "Contenedor verificado"
echo ""

# Regenerar el baseline dentro del contenedor
print_info "Regenerando baseline con orden correcto..."
echo ""

docker exec "$APP_CONTAINER" sh -c "cd /app && npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20251210075009_baseline_production_ready/migration.sql"

if [ $? -eq 0 ]; then
    print_success "Baseline regenerado con orden correcto"
else
    print_error "Error al regenerar baseline"
    exit 1
fi

echo ""
print_info "Verificando el SQL generado..."
echo ""

# Mostrar las primeras líneas del SQL para verificar
docker exec "$APP_CONTAINER" sh -c "head -50 /app/prisma/migrations/20251210075009_baseline_production_ready/migration.sql"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ BASELINE REGENERADO                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "El baseline ha sido regenerado con el orden correcto"
print_warning "PRÓXIMO PASO: Ejecutar apply-baseline-sql-docker.sh nuevamente"
echo ""
echo "  ./apply-baseline-sql-docker.sh"
echo ""
