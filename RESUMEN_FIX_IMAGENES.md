# 🎯 Resumen: Fix Imágenes en Producción

## ❌ El Problema Real

Las imágenes **SÍ se subían** al servidor, pero **NO se mostraban** en la página porque:

**Next.js con `output: 'standalone'` NO sirve archivos de `/public` automáticamente**

- Las imágenes se guardaban en `/public/uploads/edificios/`
- Las URLs eran: `/uploads/edificios/imagen.jpg`
- Estas URLs no funcionan en standalone mode porque Next.js no tiene servidor estático para `/public`
- Resultado: Error 404 al intentar cargar las imágenes

---

## ✅ La Solución

### 1️⃣ Crear API Route para servir imágenes

**Archivo:** `src/app/api/uploads/[...path]/route.ts`

Este endpoint API sirve las imágenes desde el sistema de archivos:
- Acepta rutas como `/api/uploads/edificios/imagen.jpg`
- Lee el archivo desde `public/uploads/edificios/imagen.jpg`
- Lo sirve con los headers correctos (Content-Type, Cache-Control)

### 2️⃣ Cambiar generación de URLs

**Archivo:** `src/lib/uploadUtils.ts`

```diff
- const publicUrl = `/uploads/${subfolder}/${filename}`
+ const publicUrl = `/api/uploads/${subfolder}/${filename}`
```

### 3️⃣ Migrar URLs existentes en BD

**Script:** `migrate-image-urls.sql`

Actualiza todas las URLs existentes en la base de datos:
```sql
UPDATE "ImagenEdificio"
SET url = REPLACE(url, '/uploads/', '/api/uploads/')
WHERE url LIKE '/uploads/%' AND "imageType" = 'UPLOAD';
```

### 4️⃣ Agregar volumen persistente

**Archivos:** `docker-compose.prod.yml`, `docker-compose.qa.yml`

Volumen Docker para que las imágenes NO se pierdan al reiniciar:
```yaml
volumes:
  - uploads_prod_data:/app/public/uploads
```

---

## 🚀 Cómo Aplicar la Solución

### Paso 1: Commit y Push

```bash
git add .
git commit -m "fix: serve uploaded images via API route for standalone mode"
git push origin main
```

### Paso 2: Esperar build de GitHub Actions

Verificar en: https://github.com/YOUR_ORG/rumirent-app/actions

### Paso 3: En el servidor de producción

```bash
# SSH al servidor
ssh usuario@servidor-produccion
cd /path/to/rumirent-app

# Pull de los cambios
git pull origin main

# Aplicar fix de contenedores (crea volumen)
./fix-uploads-production.sh

# Migrar URLs en la base de datos
./fix-image-urls-production.sh
```

---

## 📋 Checklist de Verificación

Después de aplicar los cambios:

- [ ] Contenedor reiniciado con nueva imagen
- [ ] Volumen `uploads_prod_data` creado
- [ ] URLs migradas en la base de datos
- [ ] Subir una nueva imagen desde Admin → Proyectos
- [ ] Verificar que se guarda con URL `/api/uploads/...`
- [ ] Verificar que la imagen se muestra correctamente
- [ ] Reiniciar el contenedor y verificar que la imagen persiste
- [ ] Hacer redeploy y verificar que la imagen persiste

---

## 🔍 Comandos de Diagnóstico

### Verificar que el endpoint API existe
```bash
docker exec rumirent-prod-app ls -la /app/src/app/api/uploads/
```

### Verificar que las imágenes existen en el volumen
```bash
docker exec rumirent-prod-app ls -la /app/public/uploads/edificios/
```

### Verificar URLs en la base de datos
```bash
docker exec rumirent-prod-db psql -U postgres -d rumirent -c "
SELECT id, url, \"imageType\"
FROM \"ImagenEdificio\"
WHERE \"imageType\" = 'UPLOAD'
LIMIT 5;
"
```

### Probar el endpoint directamente
```bash
curl -I https://desk.rumirent.com/api/uploads/edificios/NOMBRE_IMAGEN.jpg
# Debería retornar: HTTP/1.1 200 OK, Content-Type: image/jpeg
```

### Ver logs del contenedor
```bash
docker logs rumirent-prod-app --tail 100 -f
```

---

## 📁 Archivos Modificados/Creados

### Nuevos
- ✅ `src/app/api/uploads/[...path]/route.ts` - Endpoint API para servir imágenes
- ✅ `migrate-image-urls.sql` - Script SQL para migrar URLs
- ✅ `fix-image-urls-production.sh` - Script bash para aplicar migración
- ✅ `fix-uploads-production.sh` - Script bash para actualizar contenedores
- ✅ `UPLOADS_FIX.md` - Documentación detallada
- ✅ `RESUMEN_FIX_IMAGENES.md` - Este archivo

### Modificados
- ✅ `src/lib/uploadUtils.ts` - Cambio de `/uploads/*` a `/api/uploads/*`
- ✅ `docker-compose.prod.yml` - Agregado volumen `uploads_prod_data`
- ✅ `docker-compose.qa.yml` - Agregado volumen `uploads_qa_data`
- ✅ `Dockerfile` - Creación de directorio con permisos

---

## 💡 Por qué esto funciona

1. **API Route**: Next.js SIEMPRE sirve los API routes, incluso en standalone mode
2. **Sistema de archivos**: El endpoint lee archivos directamente del disco
3. **Volumen Docker**: Los datos persisten fuera del contenedor
4. **Cache-Control**: Las imágenes se cachean en el navegador (1 año)

---

## ⚠️ Notas Importantes

- Las imágenes **externas** (URLs de otros sitios) NO se ven afectadas
- Solo se migran imágenes con `imageType = 'UPLOAD'`
- El volumen Docker almacena las imágenes de forma permanente
- Se recomienda hacer backup del volumen periódicamente

---

## 📞 Soporte

Si después de aplicar estos cambios las imágenes aún no cargan:

1. Verificar logs: `docker logs rumirent-prod-app -f`
2. Verificar que el endpoint existe: `curl https://desk.rumirent.com/api/uploads/edificios/test.jpg`
3. Verificar permisos: `docker exec rumirent-prod-app ls -la /app/public/uploads/`
4. Verificar URLs en BD: Ejecutar query de verificación arriba
