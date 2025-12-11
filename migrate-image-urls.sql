-- Migration script to update existing image URLs from /uploads/* to /api/uploads/*
-- This is needed for Next.js standalone mode in production

-- Backup current state (optional, for safety)
-- You can restore with: UPDATE "ImagenEdificio" SET url = REPLACE(url, '/api/uploads/', '/uploads/') WHERE url LIKE '/api/uploads/%';

-- Update all image URLs that start with /uploads/ to use /api/uploads/
UPDATE "ImagenEdificio"
SET url = REPLACE(url, '/uploads/', '/api/uploads/')
WHERE url LIKE '/uploads/%'
  AND url NOT LIKE '/api/uploads/%'
  AND "imageType" = 'UPLOAD';

-- Verify the changes
SELECT
  id,
  url,
  "imageType",
  "updatedAt"
FROM "ImagenEdificio"
WHERE "imageType" = 'UPLOAD'
ORDER BY "updatedAt" DESC
LIMIT 10;

-- Count affected rows
SELECT
  COUNT(*) as total_upload_images,
  COUNT(CASE WHEN url LIKE '/api/uploads/%' THEN 1 END) as using_api_route,
  COUNT(CASE WHEN url LIKE '/uploads/%' AND url NOT LIKE '/api/uploads/%' THEN 1 END) as using_direct_path
FROM "ImagenEdificio"
WHERE "imageType" = 'UPLOAD';
