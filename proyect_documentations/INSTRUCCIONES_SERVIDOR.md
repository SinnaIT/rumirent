# 🚀 Instrucciones para el Servidor VPS

## ⚠️ ACTUALIZACIÓN: Múltiples Conflictos de Migración

**Estado Actual**:
- ✅ Las migraciones YA están en el contenedor
- ❌ Hay múltiples conflictos con objetos existentes en la base de datos
- 📝 La base de datos tiene un estado inconsistente con muchas migraciones parciales

## 🔥 SOLUCIÓN RECOMENDADA: Reset Completo

### ⚠️ IMPORTANTE: Esto borrará todos los datos actuales

**Si tienes datos importantes, haz un backup primero** (instrucciones abajo).

Si NO tienes datos importantes o puedes volver a crearlos:

```bash
cd /opt/rumirent-app

# Ejecutar el script de reset (te pedirá confirmación DOS veces)
bash scripts/reset-database.sh
```

**Qué hace este script:**
1. ✅ Borra todas las tablas y datos
2. ✅ Aplica las 9 migraciones desde cero
3. ✅ Carga datos de seed (usuarios, edificios de ejemplo, comisiones, etc.)

**Usuarios que se crearán:**
- Admin: `admin@rumirent.com` / `admin123`
- Broker: `broker@rumirent.com` / `broker123`

### 💾 Backup Opcional (Antes de Reset)

Si quieres guardar los datos actuales:

```bash
# Crear backup
mkdir -p /opt/rumirent-app/backups
docker exec rumirent-db pg_dump -U rumirent_prod rumirent_db | gzip > /opt/rumirent-app/backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verificar backup
ls -lh /opt/rumirent-app/backups/
```

### ✅ Verificar Después del Reset

```bash
# Estado de migraciones
docker exec rumirent-app npx prisma migrate status

# Probar la API
curl http://localhost:3000/api/test
```

Deberías ver:
```
9 migrations found in prisma/migrations

Database schema is up to date!
```

---

## 🛠️ ALTERNATIVA: Resolver Migración por Migración (NO Recomendado)

Si realmente necesitas conservar los datos actuales y resolver conflicto por conflicto:

```bash
# Marcar migraciones conflictivas como aplicadas
docker exec rumirent-app npx prisma migrate resolve --applied "20250924201153_init_with_optional_commission"

# Intentar aplicar las restantes
docker exec rumirent-app npx prisma migrate deploy

# Si hay más conflictos, repite el proceso para cada migración con error
```

⚠️ **Advertencia**: Este método es tedioso y propenso a errores. El reset es más limpio y rápido.

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
