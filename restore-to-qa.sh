#!/bin/bash

# Script de Restauración a QA - Rumirent App
# Restaura un backup de producción en el contenedor Docker de QA

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

# Configuración (ajustar según tu entorno)
QA_CONTAINER="${QA_CONTAINER:-rumirent-qa-db}"
QA_USER="${QA_USER:-rumirent_qa}"
QA_DATABASE="${QA_DATABASE:-rumirent_qa_db}"
BACKUP_FILE="$1"

# Función de ayuda
show_help() {
    echo "Uso: $0 <archivo-backup.sql> [opciones]"
    echo ""
    echo "Opciones:"
    echo "  -c, --container NAME    Nombre del contenedor Docker (default: rumirent-qa-db)"
    echo "  -u, --user USER         Usuario de PostgreSQL (default: rumirent_qa)"
    echo "  -d, --database DB       Nombre de la base de datos (default: rumirent_qa_db)"
    echo "  -f, --fresh             Eliminar y recrear la base de datos (limpia)"
    echo "  -h, --help              Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno:"
    echo "  QA_CONTAINER            Nombre del contenedor"
    echo "  QA_USER                 Usuario de PostgreSQL"
    echo "  QA_DATABASE             Nombre de la base de datos"
    echo ""
    echo "Ejemplos:"
    echo "  $0 backup-rumirent-20251209.sql"
    echo "  $0 backup.sql --fresh"
    echo "  QA_CONTAINER=postgres_qa $0 backup.sql"
}

# Parsear argumentos
FRESH_DB=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--container)
            QA_CONTAINER="$2"
            shift 2
            ;;
        -u|--user)
            QA_USER="$2"
            shift 2
            ;;
        -d|--database)
            QA_DATABASE="$2"
            shift 2
            ;;
        -f|--fresh)
            FRESH_DB=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            fi
            shift
            ;;
    esac
done

# Verificar que se proporcionó archivo de backup
if [ -z "$BACKUP_FILE" ]; then
    print_error "Debes proporcionar un archivo de backup"
    echo ""
    show_help
    exit 1
fi

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Archivo no encontrado: $BACKUP_FILE"
    exit 1
fi

# Verificar que Docker está disponible
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado o no está en el PATH"
    exit 1
fi

# Verificar que el contenedor existe y está corriendo
if ! docker ps --format '{{.Names}}' | grep -q "^${QA_CONTAINER}$"; then
    print_error "Contenedor '$QA_CONTAINER' no está corriendo"
    print_info "Contenedores disponibles:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

print_info "Configuración:"
echo "  Contenedor: $QA_CONTAINER"
echo "  Usuario: $QA_USER"
echo "  Base de datos: $QA_DATABASE"
echo "  Archivo backup: $BACKUP_FILE"
echo "  Restauración limpia: $FRESH_DB"
echo ""

# Confirmar acción
print_warning "ATENCIÓN: Esta operación SOBRESCRIBIRÁ los datos en QA"
read -p "¿Continuar? (escribe 'SI' para confirmar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    print_error "Operación cancelada"
    exit 0
fi

# Crear backup de QA antes de restaurar (por seguridad)
print_info "Creando backup de seguridad de QA actual..."
QA_BACKUP="backup-qa-before-restore-$(date +%Y%m%d-%H%M%S).sql"
docker exec -t "$QA_CONTAINER" pg_dump -U "$QA_USER" "$QA_DATABASE" > "$QA_BACKUP" 2>/dev/null || {
    print_warning "No se pudo crear backup de QA (puede ser que la DB no exista aún)"
}

if [ -f "$QA_BACKUP" ] && [ -s "$QA_BACKUP" ]; then
    print_success "Backup de QA guardado: $QA_BACKUP"
fi

# Si se pidió restauración limpia, eliminar y recrear la base de datos
if [ "$FRESH_DB" = true ]; then
    print_info "Eliminando base de datos existente..."

    docker exec -i "$QA_CONTAINER" psql -U "$QA_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS "$QA_DATABASE";
CREATE DATABASE "$QA_DATABASE";
EOF

    if [ $? -eq 0 ]; then
        print_success "Base de datos recreada"
    else
        print_error "Error al recrear la base de datos"
        exit 1
    fi
fi

# Restaurar el backup
print_info "Restaurando backup en QA..."

# Copiar archivo al contenedor
docker cp "$BACKUP_FILE" "$QA_CONTAINER:/tmp/restore-backup.sql"

# Restaurar usando el archivo copiado
docker exec -i "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" -f /tmp/restore-backup.sql

if [ $? -eq 0 ]; then
    print_success "Backup restaurado exitosamente"
else
    print_error "Error durante la restauración"
    print_warning "Puedes restaurar el estado anterior desde: $QA_BACKUP"
    exit 1
fi

# Limpiar archivo temporal del contenedor
docker exec "$QA_CONTAINER" rm -f /tmp/restore-backup.sql

# Verificar la restauración
print_info "Verificando restauración..."

echo ""
echo "=== Tablas en la base de datos ==="
docker exec -i "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" -c "\dt"

echo ""
echo "=== Conteo de registros ==="
docker exec -i "$QA_CONTAINER" psql -U "$QA_USER" -d "$QA_DATABASE" <<'SQL'
SELECT
  'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'empresas', COUNT(*) FROM empresas
UNION ALL
SELECT 'edificios', COUNT(*) FROM edificios
UNION ALL
SELECT 'unidades', COUNT(*) FROM unidades
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
ORDER BY tabla;
SQL

echo ""
print_success "Restauración completada"
print_info "Base de datos QA lista para pruebas"

# Recordatorio sobre actualizar variables de entorno
echo ""
print_warning "RECORDATORIO: Asegúrate de que tu aplicación de QA usa la conexión correcta"
print_info "Variable de entorno: DATABASE_URL=postgresql://$QA_USER:password@$QA_CONTAINER:5432/$QA_DATABASE"
