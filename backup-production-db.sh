#!/bin/bash

# Script de Backup de Base de Datos - Rumirent App
# Maneja múltiples escenarios: pg_dump local, Docker, remoto

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }

# Función para cargar variables del archivo .env
load_env() {
    local env_file="${1:-.env}"

    if [ ! -f "$env_file" ]; then
        return 1
    fi

    print_info "Cargando configuración desde $env_file..."

    # Leer archivo .env y exportar variables (ignorando comentarios y líneas vacías)
    while IFS='=' read -r key value; do
        # Ignorar comentarios y líneas vacías
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue

        # Eliminar comillas del valor si existen
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

        # Exportar la variable si no está ya definida
        if [ -z "${!key}" ]; then
            export "$key=$value"
        fi
    done < "$env_file"

    return 0
}

# Intentar cargar .env si existe
load_env ".env" || true

# Verificar DATABASE_URL (puede venir del .env o de variables de entorno)
if [ -z "$DATABASE_URL_PRODUCTION" ]; then
    # Intentar construir desde variables individuales del .env
    if [ -n "$POSTGRES_USER" ] && [ -n "$POSTGRES_PASSWORD" ] && [ -n "$POSTGRES_DB" ]; then
        POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
        POSTGRES_PORT="${POSTGRES_PORT:-5432}"
        DATABASE_URL_PRODUCTION="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
        print_info "DATABASE_URL_PRODUCTION construida desde .env"
    else
        print_error "Variable DATABASE_URL_PRODUCTION no está definida"
        echo ""
        echo "Opciones:"
        echo "  1. Definir DATABASE_URL_PRODUCTION:"
        echo "     DATABASE_URL_PRODUCTION='postgresql://user:pass@host:port/db' $0"
        echo ""
        echo "  2. O tener un archivo .env con:"
        echo "     POSTGRES_USER=user"
        echo "     POSTGRES_PASSWORD=pass"
        echo "     POSTGRES_HOST=host"
        echo "     POSTGRES_PORT=5432"
        echo "     POSTGRES_DB=database"
        exit 1
    fi
fi

# Crear nombre de archivo con timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="backup-rumirent-${TIMESTAMP}.sql"
BACKUP_DIR="./backups"

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

print_info "Archivo de backup: ${BACKUP_DIR}/${BACKUP_FILE}"

# Función para extraer componentes de DATABASE_URL
parse_database_url() {
    # Formato: postgresql://user:pass@host:port/dbname
    local url="$1"

    # Extraer componentes usando regex
    if [[ $url =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        return 0
    else
        return 1
    fi
}

# Intentar método 1: pg_dump directo
backup_with_pgdump_direct() {
    print_info "Método 1: Intentando pg_dump con URL directa..."

    if command -v pg_dump &> /dev/null; then
        pg_dump "$DATABASE_URL_PRODUCTION" > "${BACKUP_DIR}/${BACKUP_FILE}"
        return $?
    else
        print_warning "pg_dump no está disponible en el PATH"
        return 1
    fi
}

# Intentar método 2: pg_dump con parámetros separados
backup_with_pgdump_params() {
    print_info "Método 2: Intentando pg_dump con parámetros separados..."

    if ! command -v pg_dump &> /dev/null; then
        print_warning "pg_dump no está instalado"
        return 1
    fi

    if ! parse_database_url "$DATABASE_URL_PRODUCTION"; then
        print_error "No se pudo parsear DATABASE_URL_PRODUCTION"
        return 1
    fi

    export PGPASSWORD="$DB_PASS"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"
    local result=$?
    unset PGPASSWORD

    return $result
}

# Intentar método 3: Docker
backup_with_docker() {
    print_info "Método 3: Intentando backup desde contenedor Docker..."

    if ! command -v docker &> /dev/null; then
        print_warning "Docker no está disponible"
        return 1
    fi

    # Buscar contenedor de PostgreSQL
    local container=$(docker ps --filter "ancestor=postgres" --format "{{.Names}}" | head -n 1)

    if [ -z "$container" ]; then
        container=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)
    fi

    if [ -z "$container" ]; then
        print_warning "No se encontró contenedor Docker de PostgreSQL"
        return 1
    fi

    print_info "Usando contenedor: $container"

    if ! parse_database_url "$DATABASE_URL_PRODUCTION"; then
        print_error "No se pudo parsear DATABASE_URL_PRODUCTION"
        return 1
    fi

    docker exec -t "$container" pg_dump -U "$DB_USER" "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}"
    return $?
}

# Intentar método 4: psql con COPY (alternativa)
backup_with_psql_copy() {
    print_info "Método 4: Intentando backup con psql COPY..."

    if ! command -v psql &> /dev/null; then
        print_warning "psql no está disponible"
        return 1
    fi

    print_warning "Este método solo exporta datos, no estructura"
    print_warning "Solo usar si los otros métodos fallan"

    # Este es un backup parcial, solo como último recurso
    return 1
}

# Ejecutar métodos en orden hasta que uno funcione
print_info "Iniciando backup de base de datos..."

if backup_with_pgdump_direct; then
    print_success "Backup completado con pg_dump (método directo)"
elif backup_with_pgdump_params; then
    print_success "Backup completado con pg_dump (método parámetros)"
elif backup_with_docker; then
    print_success "Backup completado con Docker"
elif backup_with_psql_copy; then
    print_success "Backup completado con psql COPY"
else
    print_error "Todos los métodos de backup fallaron"
    echo ""
    echo "Soluciones posibles:"
    echo "1. Instalar PostgreSQL client:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "   CentOS/RHEL: sudo yum install postgresql"
    echo "   macOS: brew install postgresql"
    echo ""
    echo "2. Usar Docker si la DB está en contenedor"
    echo ""
    echo "3. Hacer backup manual desde tu proveedor de DB (Heroku, AWS RDS, etc.)"
    exit 1
fi

# Verificar que el backup se creó y tiene contenido
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    print_success "Backup guardado: ${BACKUP_DIR}/${BACKUP_FILE}"
    print_info "Tamaño: ${BACKUP_SIZE}"

    # Verificar que no esté vacío
    if [ ! -s "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        print_error "El archivo de backup está vacío!"
        exit 1
    fi

    echo ""
    echo "Primeras líneas del backup:"
    head -n 10 "${BACKUP_DIR}/${BACKUP_FILE}"

    print_success "Backup completado exitosamente"
else
    print_error "El archivo de backup no se creó"
    exit 1
fi
