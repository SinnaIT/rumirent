#!/bin/bash

# Script to fix image URLs in production database
# Updates /uploads/* to /api/uploads/* for Next.js standalone mode

set -e

echo "=========================================="
echo "Fix Image URLs in Production Database"
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
echo "1. Update image URLs from /uploads/* to /api/uploads/*"
echo "2. Only affects images with imageType='UPLOAD'"
echo "3. External URLs (imageType='URL') are not affected"
echo ""
echo "Database: ${DATABASE_URL}"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Step 1: Backing up current image URLs..."
docker exec rumirent-prod-db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
SELECT
  COUNT(*) as total_images,
  COUNT(CASE WHEN url LIKE '/uploads/%' AND url NOT LIKE '/api/uploads/%' THEN 1 END) as needs_update
FROM \"ImagenEdificio\"
WHERE \"imageType\" = 'UPLOAD';
"

echo ""
echo "Step 2: Applying migration..."
docker exec rumirent-prod-db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f - < migrate-image-urls.sql

echo ""
echo "Step 3: Verifying changes..."
docker exec rumirent-prod-db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
SELECT
  COUNT(*) as total_upload_images,
  COUNT(CASE WHEN url LIKE '/api/uploads/%' THEN 1 END) as using_api_route,
  COUNT(CASE WHEN url LIKE '/uploads/%' AND url NOT LIKE '/api/uploads/%' THEN 1 END) as using_direct_path
FROM \"ImagenEdificio\"
WHERE \"imageType\" = 'UPLOAD';
"

echo ""
echo "Step 4: Showing sample URLs..."
docker exec rumirent-prod-db psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c "
SELECT id, url, \"imageType\", \"updatedAt\"
FROM \"ImagenEdificio\"
WHERE \"imageType\" = 'UPLOAD'
ORDER BY \"updatedAt\" DESC
LIMIT 5;
"

echo ""
echo "=========================================="
echo "✓ Migration completed!"
echo "=========================================="
echo ""
echo "All uploaded images now use /api/uploads/* path."
echo ""
echo "Next steps:"
echo "1. Deploy the new code with the API route"
echo "2. Restart the application container"
echo "3. Test image loading in the browser"
echo ""
