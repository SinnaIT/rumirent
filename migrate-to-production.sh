#!/bin/bash

# Script de Migración a Producción - Rumirent App
# Uso: ./migrate-to-production.sh [escenario]
# Escenarios: nueva | existente | verificar

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Verificar que existe DATABASE_URL_PRODUCTION
if [ -z "$DATABASE_URL_PRODUCTION" ]; then
    print_error "Variable DATABASE_URL_PRODUCTION no está definida"
    echo "Ejemplo: export DATABASE_URL_PRODUCTION='postgresql://user:pass@host:port/db'"
    exit 1
fi

ESCENARIO=${1:-"verificar"}
BACKUP_FILE="backup-rumirent-$(date +%Y%m%d-%H%M%S).sql"

# Función para crear backup
crear_backup() {
    print_info "Creando backup de la base de datos..."
    pg_dump "$DATABASE_URL_PRODUCTION" > "$BACKUP_FILE"

    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        print_success "Backup creado: $BACKUP_FILE (Tamaño: $BACKUP_SIZE)"
    else
        print_error "No se pudo crear el backup"
        exit 1
    fi
}

# Función para verificar estado
verificar_estado() {
    print_info "Verificando estado de la base de datos de producción..."

    echo ""
    echo "=== Versión de PostgreSQL ==="
    psql "$DATABASE_URL_PRODUCTION" -c "SELECT version();"

    echo ""
    echo "=== Tamaño de la base de datos ==="
    psql "$DATABASE_URL_PRODUCTION" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

    echo ""
    echo "=== Tablas existentes ==="
    psql "$DATABASE_URL_PRODUCTION" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

    echo ""
    echo "=== Conteo de registros ==="
    psql "$DATABASE_URL_PRODUCTION" <<'SQL'
SELECT
  COALESCE((SELECT COUNT(*)::text FROM users), '0') as users,
  COALESCE((SELECT COUNT(*)::text FROM edificios), 'tabla no existe') as edificios,
  COALESCE((SELECT COUNT(*)::text FROM unidades), 'tabla no existe') as unidades,
  COALESCE((SELECT COUNT(*)::text FROM clientes), 'tabla no existe') as clientes,
  COALESCE((SELECT COUNT(*)::text FROM leads), 'tabla no existe') as leads;
SQL
}

# Función para DB nueva
migrar_db_nueva() {
    print_warning "ATENCIÓN: Vas a crear una base de datos NUEVA desde cero"
    print_warning "Esto BORRARÁ todos los datos existentes (si los hay)"

    read -p "¿Estás seguro? (escribe 'SI' para continuar): " confirmacion

    if [ "$confirmacion" != "SI" ]; then
        print_error "Migración cancelada"
        exit 0
    fi

    crear_backup

    print_info "Aplicando schema completo..."
    psql "$DATABASE_URL_PRODUCTION" < migration-production-baseline.sql

    print_info "Creando registro en _prisma_migrations..."
    psql "$DATABASE_URL_PRODUCTION" <<'SQL'
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  id VARCHAR(36) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" (id, checksum, migration_name, logs, applied_steps_count, started_at, finished_at)
VALUES (
  gen_random_uuid()::text,
  'baseline',
  'baseline_from_development',
  'Applied complete baseline schema',
  1,
  now(),
  now()
);
SQL

    print_success "Migración completada exitosamente"
    print_info "Ejecutando verificaciones..."
    verificar_estado
}

# Función para DB existente
migrar_db_existente() {
    print_warning "ATENCIÓN: Vas a aplicar cambios incrementales a una base de datos EXISTENTE"

    crear_backup

    print_info "Generando SQL incremental..."
    npx prisma migrate diff \
        --from-url "$DATABASE_URL_PRODUCTION" \
        --to-schema-datamodel prisma/schema.prisma \
        --script > migration-production-incremental.sql

    print_warning "SQL incremental generado en: migration-production-incremental.sql"
    print_warning "REVISA MANUALMENTE este archivo antes de continuar"

    echo ""
    echo "=== Previsualización del SQL ==="
    head -n 50 migration-production-incremental.sql
    echo ""

    read -p "¿Quieres aplicar estos cambios? (escribe 'SI' para continuar): " confirmacion

    if [ "$confirmacion" != "SI" ]; then
        print_error "Migración cancelada"
        print_info "El archivo migration-production-incremental.sql se mantuvo para revisión"
        exit 0
    fi

    print_info "Aplicando cambios incrementales..."
    psql "$DATABASE_URL_PRODUCTION" < migration-production-incremental.sql

    if [ $? -eq 0 ]; then
        print_success "Migración aplicada exitosamente"
        print_info "Ejecutando verificaciones..."
        verificar_estado
    else
        print_error "Error durante la migración"
        print_warning "Puedes restaurar desde: $BACKUP_FILE"
        print_info "Comando de restauración: psql \$DATABASE_URL_PRODUCTION < $BACKUP_FILE"
        exit 1
    fi
}

# Main
case $ESCENARIO in
    "nueva")
        migrar_db_nueva
        ;;
    "existente")
        migrar_db_existente
        ;;
    "verificar")
        verificar_estado
        ;;
    *)
        echo "Uso: $0 [escenario]"
        echo ""
        echo "Escenarios disponibles:"
        echo "  nueva      - Crear base de datos nueva desde cero (BORRA datos existentes)"
        echo "  existente  - Aplicar cambios incrementales a DB existente"
        echo "  verificar  - Solo verificar estado de la base de datos"
        echo ""
        echo "Ejemplo:"
        echo "  export DATABASE_URL_PRODUCTION='postgresql://user:pass@host:port/db'"
        echo "  $0 verificar"
        echo "  $0 existente"
        exit 1
        ;;
esac
