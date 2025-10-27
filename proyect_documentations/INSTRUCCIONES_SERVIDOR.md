# 🚀 Instrucciones para el Servidor VPS

## Situación Actual

Hiciste push de los cambios que corrigen el problema de las migraciones, PERO la imagen Docker en GitHub Container Registry todavía no se ha actualizado. GitHub Actions está construyendo la nueva imagen (toma ~5-10 minutos).

## ✅ Opción 1: Fix Inmediato (RECOMENDADO AHORA)

Ejecuta esto en tu servidor VPS **AHORA** sin esperar:

```bash
# 1. Ir al directorio de la app
cd /opt/rumirent-app

# 2. Verificar que las migraciones están en el servidor
ls -la prisma/migrations/
# Deberías ver 9 carpetas con migraciones

# 3. Copiar manualmente las migraciones al contenedor
docker cp prisma/migrations rumirent-app:/app/prisma/

# 4. Verificar que se copiaron
docker exec rumirent-app ls -la /app/prisma/migrations/

# 5. Ejecutar las migraciones
docker exec rumirent-app npx prisma migrate deploy

# 6. Verificar estado
docker exec rumirent-app npx prisma migrate status
```

Deberías ver:
```
9 migrations found in prisma/migrations
✔ Applied migration(s): [lista de migraciones]
Database schema is up to date!
```

## ⏳ Opción 2: Esperar y Usar Nueva Imagen (Más Limpio)

Si prefieres esperar a que GitHub Actions termine:

```bash
# 1. Monitorear GitHub Actions
# Ve a: https://github.com/SinnaIT/rumirent/actions
# Espera a que termine el workflow (~5-10 minutos)

# 2. Una vez que termine, en el servidor:
cd /opt/rumirent-app
./deploy.sh

# O manualmente:
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d --force-recreate
sleep 30
docker exec rumirent-app npx prisma migrate deploy
```

## 🔍 Verificación Final

Después de cualquiera de las opciones:

```bash
# Verificar que la app está corriendo
curl http://localhost:3000/api/test

# Ver logs
docker logs rumirent-app -f

# Verificar migraciones
docker exec rumirent-app npx prisma migrate status
```

## ❓ ¿Qué Cambió?

- **Dockerfile**: Ahora copia la carpeta `prisma/migrations/` completa a la imagen
- **Deploy script**: Usa `npx prisma migrate deploy` directamente (más robusto)

## 🆘 Si Algo Sale Mal

```bash
# Ver logs completos
docker logs rumirent-app

# Entrar al contenedor
docker exec -it rumirent-app sh

# Dentro del contenedor:
ls -la /app/prisma/
npx prisma migrate status
```

## 📞 Siguiente Deployment

Desde ahora, cada vez que hagas deployment, las migraciones se aplicarán automáticamente porque están incluidas en la imagen Docker.

```bash
cd /opt/rumirent-app
./deploy.sh
```

¡Eso es todo! ✨
