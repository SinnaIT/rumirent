#!/bin/bash

# Script para Limpiar Migraciones y Crear Baseline Limpio
# Consolida todas las migraciones en una sola para producción

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
print_step() { echo -e "${BLUE}📍 PASO $1${NC}"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   LIMPIEZA DE MIGRACIONES Y CREACIÓN DE BASELINE LIMPIO   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Paso 1: Verificar estado actual
print_step "1: Verificando estado actual"
echo ""

if [ ! -d "prisma/migrations" ]; then
    print_error "No existe el directorio prisma/migrations"
    exit 1
fi

MIGRATION_COUNT=$(ls -1 prisma/migrations | wc -l)
print_info "Migraciones actuales: $MIGRATION_COUNT"
ls -1 prisma/migrations/
echo ""

print_warning "Este script va a:"
echo "  1. Crear backup de las migraciones actuales"
echo "  2. Crear backup de tu base de datos de desarrollo"
echo "  3. Eliminar todas las migraciones antiguas"
echo "  4. Crear UNA migración baseline limpia"
echo "  5. Marcarla como aplicada en desarrollo"
echo ""

read -p "¿Continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

# Paso 2: Crear backups
print_step "2: Creando backups de seguridad"
echo ""

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="prisma/migrations-backup-${TIMESTAMP}"

# Backup de migraciones
print_info "Respaldando migraciones en: $BACKUP_DIR"
cp -r prisma/migrations "$BACKUP_DIR"
print_success "Migraciones respaldadas"

# Backup de base de datos de desarrollo
print_info "Respaldando base de datos de desarrollo..."
BACKUP_DB="backup-dev-${TIMESTAMP}.sql"

if command -v pg_dump &> /dev/null; then
    if [ -n "$DATABASE_URL" ]; then
        pg_dump "$DATABASE_URL" > "$BACKUP_DB" 2>/dev/null || {
            print_warning "No se pudo crear backup de DB (puede ser normal si no hay pg_dump)"
        }
        if [ -f "$BACKUP_DB" ] && [ -s "$BACKUP_DB" ]; then
            print_success "Base de datos respaldada en: $BACKUP_DB"
        fi
    else
        print_warning "DATABASE_URL no está definida, saltando backup de DB"
    fi
else
    print_warning "pg_dump no disponible, saltando backup de DB"
fi

echo ""

# Paso 3: Verificar estado de Prisma antes de limpiar
print_step "3: Verificando estado de Prisma"
echo ""

print_info "Estado actual de migraciones:"
npx prisma migrate status || true
echo ""

# Paso 4: Eliminar migraciones antiguas
print_step "4: Eliminando migraciones antiguas"
echo ""

print_info "Eliminando contenido de prisma/migrations/..."
rm -rf prisma/migrations/*
print_success "Migraciones antiguas eliminadas"
echo ""

# Paso 5: Crear migración baseline
print_step "5: Creando migración baseline limpia"
echo ""

print_info "Generando migración baseline desde schema.prisma..."
npx prisma migrate dev --name baseline_production --create-only

if [ $? -eq 0 ]; then
    print_success "Migración baseline creada"
else
    print_error "Error al crear migración baseline"
    print_warning "Puedes restaurar desde: $BACKUP_DIR"
    exit 1
fi

# Verificar que se creó
BASELINE_DIR=$(ls -td prisma/migrations/*baseline* 2>/dev/null | head -1)
if [ -z "$BASELINE_DIR" ]; then
    print_error "No se encontró la migración baseline creada"
    exit 1
fi

print_info "Migración creada en: $BASELINE_DIR"
echo ""

# Mostrar contenido de la migración
print_info "Primeras líneas de la migración:"
head -n 20 "$BASELINE_DIR/migration.sql"
echo ""
print_info "..."
echo ""

# Paso 6: Marcar como aplicada en desarrollo
print_step "6: Marcando migración como aplicada en desarrollo"
echo ""

print_info "Tu base de datos de desarrollo ya tiene estos cambios,"
print_info "así que marcaremos la migración como aplicada SIN ejecutarla..."
echo ""

# Extraer el nombre de la migración
MIGRATION_NAME=$(basename "$BASELINE_DIR")
npx prisma migrate resolve --applied "$MIGRATION_NAME"

if [ $? -eq 0 ]; then
    print_success "Migración marcada como aplicada"
else
    print_error "Error al marcar migración como aplicada"
    exit 1
fi

echo ""

# Paso 7: Verificar estado final
print_step "7: Verificando estado final"
echo ""

print_info "Estado de migraciones:"
npx prisma migrate status

echo ""
print_info "Migraciones en el directorio:"
ls -1 prisma/migrations/
echo ""

# Resumen final
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ PROCESO COMPLETADO                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_success "Migraciones consolidadas exitosamente"
echo ""
echo "📊 Resumen:"
echo "  • Migraciones anteriores: $MIGRATION_COUNT"
echo "  • Migraciones actuales: 1 (baseline limpia)"
echo "  • Backup guardado en: $BACKUP_DIR"
if [ -f "$BACKUP_DB" ]; then
    echo "  • Backup DB guardado en: $BACKUP_DB"
fi
echo ""

print_warning "PRÓXIMOS PASOS:"
echo ""
echo "1. Verificar que tu aplicación funciona en desarrollo:"
echo "   npm run dev"
echo ""
echo "2. Hacer commit de los cambios:"
echo "   git add prisma/migrations/"
echo "   git add prisma/schema.prisma"
echo "   git commit -m 'chore: consolidate migrations into baseline for production'"
echo "   git push origin main"
echo ""
echo "3. En producción, ejecutar:"
echo "   git pull origin main"
echo "   npx prisma migrate deploy"
echo "   npx prisma generate"
echo "   pm2 restart rumirent-prod"
echo ""

print_info "Si algo sale mal, puedes restaurar desde: $BACKUP_DIR"
echo ""
