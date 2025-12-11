#!/bin/bash

# Script to fix missing uploads volume in production
# This script recreates the containers with the new volume configuration

set -e

echo "=========================================="
echo "Fix Uploads Volume in Production"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "✓ Loaded .env.production"
else
    echo "❌ Error: .env.production not found"
    exit 1
fi

echo ""
echo "This script will:"
echo "1. Stop the production containers"
echo "2. Pull the latest image from GHCR"
echo "3. Recreate containers with persistent uploads volume"
echo "4. Start the production environment"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Stopping production containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.production down

echo ""
echo "Step 2: Pulling latest image..."
docker pull ghcr.io/${GITHUB_REPOSITORY}:latest

echo ""
echo "Step 3: Starting production with new volume configuration..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo ""
echo "Step 4: Waiting for containers to be healthy..."
sleep 10

echo ""
echo "Step 5: Checking container status..."
docker-compose -f docker-compose.prod.yml --env-file .env.production ps

echo ""
echo "Step 6: Verifying uploads directory..."
docker exec rumirent-prod-app ls -la /app/public/uploads/

echo ""
echo "=========================================="
echo "✓ Production environment updated!"
echo "=========================================="
echo ""
echo "The uploads volume is now persistent at: uploads_prod_data"
echo "Images will persist across container restarts and redeployments."
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f prod-app"
echo ""
echo "To check volume:"
echo "  docker volume inspect rumirent-app_uploads_prod_data"
echo ""
