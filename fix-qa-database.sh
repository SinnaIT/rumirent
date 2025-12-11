#!/bin/bash

# Script para Solucionar "database does not exist" en QA
# Crea la base de datos y aplica las migraciones

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
CONTAINER="${POSTGRES_CONTAINER_NAME:-rumirent-qa-db}"
USER="${POSTGRES_USER:-rumirent_qa}"
DATABASE="${POSTGRES_DB:-rumirent_qa_db}"
PASSWORD="${POSTGRES_PASSWORD:-}"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║        SOLUCIÓN: Database Does Not Exist              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

print_info "Configuración:"
echo "  Container: $CONTAINER"
echo "  User: $USER"
echo "  Database: $DATABASE"
echo ""

# Verificar que el contenedor está corriendo
if ! docker ps | grep -q "$CONTAINER"; then
    print_error "Contenedor $CONTAINER no está corriendo"
    print_info "Iniciando contenedor..."
    docker start "$CONTAINER" 2>/dev/null || {
        print_error "No se pudo iniciar el contenedor"
        exit 1
    }
    sleep 3
fi

print_success "Contenedor está corriendo"
echo ""

# Paso 1: Verificar si la base de datos existe
print_info "Verificando si la base de datos existe..."
DB_EXISTS=$(docker exec "$CONTAINER" psql -U "$USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DATABASE'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    print_success "Base de datos '$DATABASE' ya existe"
else
    print_warning "Base de datos '$DATABASE' no existe, creándola..."

    # Crear la base de datos
    docker exec "$CONTAINER" psql -U "$USER" -d postgres -c "CREATE DATABASE $DATABASE;" 2>/dev/null || {
        print_error "No se pudo crear la base de datos"
        print_info "Intentando con usuario postgres..."
        docker exec "$CONTAINER" psql -U postgres -d postgres -c "CREATE DATABASE $DATABASE;" || {
            print_error "Fallo al crear la base de datos"
            exit 1
        }
    }

    print_success "Base de datos '$DATABASE' creada"
fi

echo ""

# Paso 2: Verificar si hay migraciones para aplicar
print_info "Verificando migraciones..."

if [ ! -d "prisma/migrations" ]; then
    print_error "No se encuentra el directorio prisma/migrations"
    print_info "Asegúrate de estar en el directorio raíz del proyecto"
    exit 1
fi

MIGRATION_COUNT=$(ls -1 prisma/migrations | grep -v migration_lock.toml | wc -l)
print_info "Migraciones encontradas: $MIGRATION_COUNT"

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    print_warning "No hay migraciones para aplicar"
else
    # Mostrar la migración
    ls -1 prisma/migrations | grep -v migration_lock.toml
fi

echo ""

# Paso 3: Verificar si _prisma_migrations existe
print_info "Verificando tabla _prisma_migrations..."
MIGRATIONS_TABLE=$(docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='_prisma_migrations'" 2>/dev/null || echo "")

if [ "$MIGRATIONS_TABLE" = "1" ]; then
    print_success "Tabla _prisma_migrations existe"

    # Mostrar migraciones aplicadas
    print_info "Migraciones aplicadas en la base de datos:"
    docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;" 2>/dev/null || echo "  (ninguna)"
else
    print_warning "Tabla _prisma_migrations no existe (DB nueva)"
fi

echo ""

# Paso 4: Aplicar migraciones
print_info "Aplicando migraciones con Prisma..."
echo ""

# Ejecutar prisma migrate deploy
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    print_success "Migraciones aplicadas exitosamente"
else
    print_error "Error al aplicar migraciones"
    echo ""
    print_info "Intentando solución alternativa..."

    # Limpiar tabla de migraciones y volver a intentar
    docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -c "DELETE FROM _prisma_migrations;" 2>/dev/null

    # Marcar baseline como aplicada
    BASELINE=$(ls -1 prisma/migrations | grep baseline | head -1)
    if [ -n "$BASELINE" ]; then
        print_info "Marcando baseline como aplicada: $BASELINE"
        npx prisma migrate resolve --applied "$BASELINE"
    fi
fi

echo ""

# Paso 5: Generar Prisma Client
print_info "Generando Prisma Client..."
npx prisma generate

echo ""

# Paso 6: Verificar estado final
print_info "Verificando estado final..."
npx prisma migrate status

echo ""

# Paso 7: Verificar tablas creadas
print_info "Tablas en la base de datos:"
docker exec "$CONTAINER" psql -U "$USER" -d "$DATABASE" -c "\dt" 2>/dev/null || echo "  (ninguna)"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                  ✅ PROCESO COMPLETADO                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

print_success "Base de datos configurada correctamente"
print_info "Ahora puedes reiniciar la aplicación:"
echo ""
echo "  docker-compose restart rumirent-qa-app"
echo "  # o"
echo "  docker restart rumirent-qa-app"
echo ""
