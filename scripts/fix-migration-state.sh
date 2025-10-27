#!/bin/bash

# Script para resolver el estado de migraciones en producción
# Cuando hay migraciones parcialmente aplicadas o la tabla _prisma_migrations está desincronizada

set -e

echo "🔧 Resolving Migration State..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.deploy.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.deploy.yml not found${NC}"
    echo "Run this script from /opt/rumirent-app"
    exit 1
fi

echo -e "${YELLOW}📋 Current migration status:${NC}"
docker exec rumirent-app npx prisma migrate status || true
echo ""

echo -e "${YELLOW}🔍 Checking database schema...${NC}"
echo ""

# Lista de migraciones en orden
MIGRATIONS=(
    "20250924201153_init_with_optional_commission"
    "20251022140456_add_edificio_mejoras_completas"
    "20251023183046_add_metas_mensuales"
    "20251023190700_make_broker_id_optional_in_metas"
    "20251023190919_add_user_birth_date"
    "20251023233728_add_bedrooms_bathrooms_to_tipo_unidad"
    "20251024111244_add_image_type_to_imagenes"
    "20251026150104_add_address_fields_to_edificio"
    "20251026202147_make_broker_optional_in_cliente"
)

echo -e "${YELLOW}📦 Found ${#MIGRATIONS[@]} migrations to check${NC}"
echo ""

# Función para verificar si una tabla/tipo existe
check_exists() {
    local check_query="$1"
    local result=$(docker exec rumirent-app sh -c "
        export DATABASE_URL=\"\${DATABASE_URL}\"
        npx prisma db execute --stdin <<< \"$check_query\"
    " 2>&1)

    if echo "$result" | grep -q "0 rows"; then
        return 1  # No existe
    else
        return 0  # Existe
    fi
}

echo -e "${YELLOW}🔍 Checking which migrations are already applied to the database...${NC}"
echo ""

# Verificar tablas principales que se crean en la primera migración
echo "Checking for existing database objects..."
docker exec rumirent-app sh -c "npx prisma db execute --stdin" <<'SQL' || true
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
SQL

echo ""
echo -e "${YELLOW}📝 Analysis:${NC}"
echo "The error shows that enum 'Role' already exists, which means the first migration"
echo "was partially applied. We need to mark it as resolved."
echo ""

read -p "Do you want to mark the first migration as already applied? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Marking first migration as resolved...${NC}"
    docker exec rumirent-app npx prisma migrate resolve --applied "${MIGRATIONS[0]}"
    echo ""

    echo -e "${YELLOW}🔄 Attempting to apply remaining migrations...${NC}"
    docker exec rumirent-app npx prisma migrate deploy
    echo ""

    echo -e "${GREEN}✅ Migration state resolved!${NC}"
    echo ""

    echo -e "${YELLOW}📊 Final status:${NC}"
    docker exec rumirent-app npx prisma migrate status
else
    echo -e "${YELLOW}⏭️  Skipped. Please resolve manually.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Done!${NC}"
