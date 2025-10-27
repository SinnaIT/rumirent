#!/bin/bash

# Script de Deployment Automático para VPS
# Uso: ./scripts/deploy-vps.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_DIR="/opt/rumirent-app"
COMPOSE_FILE="docker-compose.deploy.yml"
IMAGE_NAME="ghcr.io/\${GITHUB_REPOSITORY}:latest"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Rumirent App - Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar que estamos en el directorio correcto
cd $APP_DIR || {
    echo -e "${RED}❌ Error: Directory $APP_DIR not found${NC}"
    exit 1
}

# 1. Pull de la última imagen
echo -e "${YELLOW}📥 Step 1/7: Pulling latest image...${NC}"
docker compose -f $COMPOSE_FILE pull || {
    echo -e "${RED}❌ Error pulling image${NC}"
    exit 1
}
echo -e "${GREEN}✅ Image pulled successfully${NC}"
echo ""

# 2. Detener contenedores actuales
echo -e "${YELLOW}🛑 Step 2/7: Stopping current containers...${NC}"
docker compose -f $COMPOSE_FILE down || {
    echo -e "${RED}❌ Error stopping containers${NC}"
    exit 1
}
echo -e "${GREEN}✅ Containers stopped${NC}"
echo ""

# 3. Iniciar nuevos contenedores
echo -e "${YELLOW}🚀 Step 3/7: Starting new containers...${NC}"
docker compose -f $COMPOSE_FILE up -d || {
    echo -e "${RED}❌ Error starting containers${NC}"
    exit 1
}
echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# 4. Esperar a que los contenedores estén listos
echo -e "${YELLOW}⏳ Step 4/7: Waiting for containers to be ready...${NC}"
sleep 30
echo -e "${GREEN}✅ Containers should be ready${NC}"
echo ""

# 5. Ejecutar migraciones de base de datos
echo -e "${YELLOW}🗄️ Step 5/7: Running database migrations...${NC}"
docker compose -f $COMPOSE_FILE exec -T app sh -c "npx prisma migrate deploy" || {
    echo -e "${RED}❌ Migrations failed!${NC}"
    echo -e "${YELLOW}📋 Checking migration status...${NC}"
    docker compose -f $COMPOSE_FILE exec -T app sh -c "npx prisma migrate status" || true
    echo -e "${YELLOW}⚠️ Warning: Migrations might have failed, check logs above${NC}"
}
echo -e "${GREEN}✅ Migrations step completed${NC}"
echo ""

# 6. Limpiar imágenes antiguas
echo -e "${YELLOW}🧹 Step 6/7: Cleaning up old images...${NC}"
docker image prune -af --filter "until=72h" > /dev/null 2>&1
echo -e "${GREEN}✅ Old images cleaned${NC}"
echo ""

# 7. Verificar estado de los contenedores
echo -e "${YELLOW}📊 Step 7/7: Checking container status...${NC}"
docker compose -f $COMPOSE_FILE ps
echo ""

# Health check
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5

if curl -f http://localhost:3000/api/test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker compose -f $COMPOSE_FILE logs --tail=50 app
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}🌟 Application is now running!${NC}"
echo -e "📍 URL: http://localhost:3000"
echo -e "📊 View logs: docker compose -f $COMPOSE_FILE logs -f"
echo -e "🛑 Stop app: docker compose -f $COMPOSE_FILE down"
echo ""
