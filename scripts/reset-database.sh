#!/bin/bash

# Script para RESETEAR completamente la base de datos y aplicar seed
# ⚠️ ADVERTENCIA: Este script BORRARÁ TODOS LOS DATOS de la base de datos

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  ADVERTENCIA: RESET COMPLETO DE BASE DE DATOS${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Este script:${NC}"
echo "  1. Borrará TODOS los datos de la base de datos"
echo "  2. Eliminará todas las tablas"
echo "  3. Aplicará todas las migraciones desde cero"
echo "  4. Cargará los datos de seed"
echo ""
echo -e "${RED}⚠️  TODOS LOS DATOS ACTUALES SE PERDERÁN${NC}"
echo ""

# Confirmar con el usuario
read -p "¿Estás SEGURO de que quieres continuar? (escribe 'SI' para confirmar): " -r
echo ""

if [ "$REPLY" != "SI" ]; then
    echo -e "${YELLOW}❌ Cancelado por el usuario${NC}"
    exit 0
fi

echo -e "${YELLOW}📋 Segunda confirmación...${NC}"
read -p "¿REALMENTE quieres BORRAR TODOS LOS DATOS? (escribe 'CONFIRMO'): " -r
echo ""

if [ "$REPLY" != "CONFIRMO" ]; then
    echo -e "${YELLOW}❌ Cancelado por el usuario${NC}"
    exit 0
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.deploy.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.deploy.yml not found${NC}"
    echo "Run this script from /opt/rumirent-app"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Confirmado. Iniciando reset de base de datos...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Eliminar todas las tablas y datos
echo -e "${YELLOW}🗑️  Paso 1/4: Eliminando todas las tablas...${NC}"
docker exec rumirent-app npx prisma migrate reset --force --skip-seed

echo -e "${GREEN}✅ Tablas eliminadas${NC}"
echo ""

# 2. Aplicar todas las migraciones
echo -e "${YELLOW}📦 Paso 2/4: Aplicando todas las migraciones...${NC}"
docker exec rumirent-app npx prisma migrate deploy

echo -e "${GREEN}✅ Migraciones aplicadas${NC}"
echo ""

# 3. Generar Prisma Client (por si acaso)
echo -e "${YELLOW}🔧 Paso 3/4: Regenerando Prisma Client...${NC}"
docker exec rumirent-app npx prisma generate

echo -e "${GREEN}✅ Prisma Client regenerado${NC}"
echo ""

# 4. Cargar seed
echo -e "${YELLOW}🌱 Paso 4/4: Cargando datos de seed...${NC}"
# Intentar con pnpm primero, si falla usar npx tsx
if docker exec rumirent-app sh -c "pnpm db:seed" 2>/dev/null; then
    echo -e "${GREEN}✅ Seed cargado con pnpm${NC}"
elif docker exec rumirent-app sh -c "npx tsx prisma/seed.ts" 2>/dev/null; then
    echo -e "${GREEN}✅ Seed cargado con tsx${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo cargar el seed automáticamente${NC}"
    echo -e "${YELLOW}Intenta manualmente:${NC}"
    echo "  docker exec -it rumirent-app sh"
    echo "  pnpm db:seed"
fi
echo ""

# Verificar estado final
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 Verificando estado final...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Estado de migraciones:${NC}"
docker exec rumirent-app npx prisma migrate status

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Reset completado exitosamente!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ La base de datos ha sido reseteada y los datos de seed cargados${NC}"
echo ""
echo -e "${YELLOW}Usuarios creados por el seed:${NC}"
echo "  - Admin: admin@rumirent.com / admin123"
echo "  - Broker: broker@rumirent.com / broker123"
echo ""
echo -e "${YELLOW}Prueba la aplicación:${NC}"
echo "  curl http://localhost:3000/api/test"
echo ""
