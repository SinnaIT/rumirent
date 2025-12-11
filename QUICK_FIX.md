# 🚀 Quick Fix: Imágenes en Producción

## TL;DR

Las imágenes no cargan porque Next.js standalone no sirve `/public`. Solución: API route.

---

## 🎯 Aplicar Fix en 3 Pasos

### 1. Commit y Push

```bash
git add .
git commit -m "fix: serve uploaded images via API route for standalone mode"
git push origin main
```

### 2. En el servidor (después del build)

```bash
ssh usuario@servidor-produccion
cd /path/to/rumirent-app
git pull origin main

# Aplicar fix
./fix-uploads-production.sh
./fix-image-urls-production.sh
```

### 3. Verificar

```bash
# Abrir navegador y probar subir una imagen
# Admin → Proyectos → [Proyecto] → Tab Imágenes → Agregar Imagen
```

---

## ✅ Verificación Rápida

```bash
# 1. ¿Existe el endpoint?
curl -I https://desk.rumirent.com/api/uploads/edificios/test.jpg

# 2. ¿Volumen creado?
docker volume ls | grep uploads

# 3. ¿URLs migradas?
docker exec rumirent-prod-db psql -U postgres -d rumirent -c "
SELECT COUNT(*) FROM \"ImagenEdificio\" WHERE url LIKE '/api/uploads/%';
"
```

---

## 📋 Archivos Importantes

- `src/app/api/uploads/[...path]/route.ts` - Endpoint para servir imágenes
- `src/lib/uploadUtils.ts` - URLs cambiadas a `/api/uploads/*`
- `migrate-image-urls.sql` - Script SQL de migración
- `docker-compose.prod.yml` - Volumen agregado

---

## 🆘 Si algo sale mal

1. Ver logs: `docker logs rumirent-prod-app -f`
2. Revisar: [RESUMEN_FIX_IMAGENES.md](RESUMEN_FIX_IMAGENES.md)
3. Documentación completa: [UPLOADS_FIX.md](UPLOADS_FIX.md)
