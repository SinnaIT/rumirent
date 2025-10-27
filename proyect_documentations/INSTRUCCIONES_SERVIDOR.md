# 🚀 Instrucciones para el Servidor VPS

## ⚠️ ERROR DETECTADO: Migración Parcialmente Aplicada

**Estado Actual**:
- ✅ Las migraciones YA están en el contenedor
- ❌ La primera migración falló porque el enum `Role` ya existe en la base de datos
- 📝 Esto significa que la base de datos tiene objetos de migraciones anteriores

## 🔥 SOLUCIÓN (Ejecuta AHORA en el servidor)

### Paso 1: Marcar la primera migración como aplicada

```bash
cd /opt/rumirent-app

# Marcar la primera migración como ya aplicada (resolve el error)
docker exec rumirent-app npx prisma migrate resolve --applied "20250924201153_init_with_optional_commission"
```

### Paso 2: Aplicar las migraciones restantes

```bash
# Ahora ejecutar todas las migraciones restantes
docker exec rumirent-app npx prisma migrate deploy
```

### Paso 3: Verificar que todo está bien

```bash
# Verificar estado final
docker exec rumirent-app npx prisma migrate status
```

Deberías ver:
```
9 migrations found in prisma/migrations

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

## ❓ ¿Qué Pasó y Por Qué?

### Problema Original
Cuando se construía la imagen Docker, la carpeta `prisma/migrations/` no se copiaba correctamente, por lo que al ejecutar el script de deployment, Prisma no encontraba las migraciones SQL.

### Error Actual (Migración Parcial)
Al copiar las migraciones manualmente y ejecutarlas, Prisma intentó aplicar la primera migración `20250924201153_init_with_optional_commission`, pero falló porque:

1. La base de datos YA tenía algunos objetos creados (enum `Role`, tablas, etc.)
2. Prisma mantiene un registro de migraciones en la tabla `_prisma_migrations`
3. Esta tabla probablemente NO tenía registrada la primera migración
4. Cuando Prisma intentó aplicarla, chocó con objetos que ya existían

### Solución: `prisma migrate resolve`
El comando `prisma migrate resolve --applied` le dice a Prisma:
> "Esta migración ya fue aplicada antes, márcala como completada en la tabla `_prisma_migrations` sin ejecutar el SQL nuevamente"

Después de marcar la primera migración, las siguientes 8 migraciones se aplican normalmente.

### Cambios Permanentes
- **Dockerfile**: Ahora copia la carpeta `prisma/migrations/` completa a la imagen
- **Deploy script**: Usa `npx prisma migrate deploy` directamente (más robusto)
- Próximos deployments aplicarán migraciones automáticamente sin problemas

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
