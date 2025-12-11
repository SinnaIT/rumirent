# Fix: Imágenes no se muestran en Producción

## Problema Identificado

Las imágenes subidas para los proyectos no se mostraban en producción con el error "Error al cargar imagen".

### Causa Raíz

1. **Directorio no persistente**: El directorio `/public/uploads` se guardaba dentro del contenedor Docker sin un volumen persistente
2. **Pérdida de datos**: Al reiniciar o hacer redeploy del contenedor, todas las imágenes subidas se perdían
3. **Configuración faltante**:
   - El `Dockerfile` no creaba el directorio de uploads con los permisos correctos
   - El `docker-compose.prod.yml` no definía un volumen persistente para las imágenes

## Solución Implementada

### 1. Modificaciones al Dockerfile

Se agregó la creación explícita del directorio de uploads con los permisos correctos:

```dockerfile
# Create uploads directory for persistent storage
RUN mkdir -p ./public/uploads/edificios && chown -R nextjs:nodejs ./public/uploads
```

### 2. Modificaciones a docker-compose.prod.yml

Se agregó un volumen persistente para almacenar las imágenes:

```yaml
prod-app:
  volumes:
    - uploads_prod_data:/app/public/uploads

volumes:
  uploads_prod_data:
    driver: local
```

### 3. Modificaciones a docker-compose.qa.yml

Se aplicó la misma configuración para el ambiente de QA:

```yaml
qa-app:
  volumes:
    - uploads_qa_data:/app/public/uploads

volumes:
  uploads_qa_data:
    driver: local
```

## Aplicar la Solución en Producción

### Opción 1: Usando el script automatizado (Recomendado)

```bash
# En el servidor de producción
./fix-uploads-production.sh
```

### Opción 2: Manual

```bash
# 1. Detener los contenedores actuales
docker-compose -f docker-compose.prod.yml --env-file .env.production down

# 2. Hacer pull de la nueva imagen (después de hacer push con los cambios)
docker pull ghcr.io/YOUR_ORG/rumirent-app:latest

# 3. Levantar con la nueva configuración
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 4. Verificar que el directorio existe
docker exec rumirent-prod-app ls -la /app/public/uploads/
```

## Verificación

### 1. Verificar que el volumen fue creado

```bash
docker volume ls | grep uploads
# Debería mostrar: rumirent-app_uploads_prod_data
```

### 2. Inspeccionar el volumen

```bash
docker volume inspect rumirent-app_uploads_prod_data
```

### 3. Verificar permisos dentro del contenedor

```bash
docker exec rumirent-prod-app ls -la /app/public/uploads/
# Debería mostrar: drwxr-xr-x nextjs nodejs edificios
```

### 4. Probar subida de imagen

1. Ir a Admin → Proyectos → Seleccionar un proyecto
2. Tab "Imágenes"
3. Subir una imagen mediante archivo o URL
4. Verificar que se muestra correctamente
5. Reiniciar el contenedor: `docker restart rumirent-prod-app`
6. Verificar que la imagen sigue mostrándose correctamente

## Beneficios de esta Solución

✅ **Persistencia**: Las imágenes NO se pierden al reiniciar el contenedor
✅ **Sobreviven redeploys**: Las imágenes persisten aunque se despliegue una nueva versión de la app
✅ **Backup simple**: El volumen Docker puede respaldarse fácilmente
✅ **Mejor práctica**: Separación clara entre código (contenedor) y datos (volumen)

## Migración de Imágenes Existentes (si aplica)

Si ya había imágenes en URLs externas que quieres migrar al almacenamiento local:

```bash
# 1. Conectar al contenedor
docker exec -it rumirent-prod-app sh

# 2. Descargar imagen desde URL y guardarla localmente
# (esto se haría manualmente o con un script)
```

## Monitoreo del Volumen

### Ver espacio usado

```bash
docker system df -v | grep uploads
```

### Backup del volumen

```bash
# Backup
docker run --rm -v rumirent-app_uploads_prod_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz /data

# Restore
docker run --rm -v rumirent-app_uploads_prod_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/uploads-backup-YYYYMMDD.tar.gz -C /
```

## Notas Importantes

- ⚠️ **Limite de tamaño**: Cada imagen tiene un límite de 5MB (configurado en `uploadUtils.ts`)
- ⚠️ **Formatos válidos**: JPEG, PNG, WebP, GIF
- 💡 **Ubicación en disco**: Los volúmenes Docker se almacenan en `/var/lib/docker/volumes/` en Linux
- 💡 **Ambiente QA**: También se aplicó la misma configuración para demo.rumirent.com

## Próximos Pasos Recomendados

1. ✅ Aplicar cambios en producción
2. ⏭️ Considerar implementar CDN para mejor performance (opcional)
3. ⏭️ Implementar limpieza automática de imágenes huérfanas (opcional)
4. ⏭️ Configurar backups automáticos del volumen de uploads (recomendado)

## Referencias

- Código de subida: [src/lib/uploadUtils.ts](src/lib/uploadUtils.ts)
- API endpoint: [src/app/api/admin/edificios/[id]/imagenes/route.ts](src/app/api/admin/edificios/[id]/imagenes/route.ts)
- Vista admin: [src/app/admin/proyectos/[id]/page.tsx](src/app/admin/proyectos/[id]/page.tsx)
- Vista broker: [src/app/broker/proyectos/[id]/page.tsx](src/app/broker/proyectos/[id]/page.tsx)
