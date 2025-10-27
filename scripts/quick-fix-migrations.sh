#!/bin/bash

# Quick Fix: Copy migrations to running container
# Use this script on your VPS to immediately fix the migration issue

set -e

echo "🚑 Quick Fix: Copying migrations to container..."

# Check if we're in the right directory
if [ ! -f "docker-compose.deploy.yml" ]; then
    echo "❌ Error: docker-compose.deploy.yml not found"
    echo "Run this script from /opt/rumirent-app"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q rumirent-app; then
    echo "❌ Error: rumirent-app container is not running"
    exit 1
fi

# Get the local migrations from your repo
echo "📦 Step 1: Copying migrations to container..."
docker cp prisma/migrations rumirent-app:/app/prisma/

echo "✅ Migrations copied!"

# Verify migrations are there
echo "📋 Step 2: Verifying migrations..."
docker exec rumirent-app ls -la /app/prisma/migrations/ | head -10

# Run migrations
echo "🗄️ Step 3: Running migrations..."
docker exec rumirent-app npx prisma migrate deploy

# Check status
echo "✅ Step 4: Checking migration status..."
docker exec rumirent-app npx prisma migrate status

echo ""
echo "🎉 Quick fix completed!"
echo ""
echo "⚠️  IMPORTANT: This is a temporary fix. The next deployment will use"
echo "the new Docker image with migrations included automatically."
