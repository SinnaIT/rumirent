# 🔄 Reset Completo de Base de Datos

## ⚠️ ADVERTENCIA

**Esto BORRARÁ TODOS los datos de la base de datos actual.**

Si tienes datos importantes, haz un backup primero.

## 🚀 Solución Rápida (RECOMENDADO)

Ejecuta este comando en tu servidor VPS:

```bash
cd /opt/rumirent-app

# Opción 1: Usando el script automatizado
bash scripts/reset-database.sh
```

El script te pedirá confirmación DOS veces antes de proceder.

## 🛠️ Solución Manual (Paso a Paso)

Si prefieres hacerlo manualmente:

```bash
cd /opt/rumirent-app

# 1. Eliminar todas las tablas y resetear migraciones
docker exec rumirent-app npx prisma migrate reset --force --skip-seed

# 2. Aplicar todas las migraciones desde cero
docker exec rumirent-app npx prisma migrate deploy

# 3. Regenerar Prisma Client
docker exec rumirent-app npx prisma generate

# 4. Cargar datos de seed
docker exec rumirent-app pnpm db:seed

# 5. Verificar estado
docker exec rumirent-app npx prisma migrate status
```

## ✅ Resultado Esperado

Después del reset deberías ver:

```
Status
9 migrations found in prisma/migrations

Following migrations have been applied:
[Lista de las 9 migraciones]

Database schema is up to date!
```

Y el seed habrá creado:

- ✅ 2 usuarios (admin y broker)
- ✅ 1 empresa
- ✅ Edificios de ejemplo con unidades
- ✅ Tipos de características
- ✅ Comisiones configuradas

## 👤 Usuarios Creados

Después del reset, puedes iniciar sesión con:

**Administrador:**
- Email: `admin@rumirent.com`
- Password: `admin123`

**Broker:**
- Email: `broker@rumirent.com`
- Password: `broker123`

## 🔍 Verificación

```bash
# Ver estado de migraciones
docker exec rumirent-app npx prisma migrate status

# Probar la API
curl http://localhost:3000/api/test

# Ver logs de la aplicación
docker logs rumirent-app -f
```

## 🆘 Troubleshooting

### Error: "Cannot connect to database"

```bash
# Verificar que la DB está corriendo
docker compose -f docker-compose.deploy.yml ps

# Ver logs de la base de datos
docker logs rumirent-db
```

### Error: "tsx not found" al ejecutar seed

```bash
# Entrar al contenedor
docker exec -it rumirent-app sh

# Verificar que node_modules existe
ls -la node_modules/

# Ejecutar seed directamente
npx tsx prisma/seed.ts
```

### El seed falla con errores

```bash
# Ver el error completo
docker logs rumirent-app

# Verificar que las migraciones se aplicaron
docker exec rumirent-app npx prisma migrate status
```

## 📋 Backup Antes de Reset (Opcional)

Si quieres guardar un backup antes de resetear:

```bash
# Crear directorio para backups
mkdir -p /opt/rumirent-app/backups

# Hacer backup
docker exec rumirent-db pg_dump -U rumirent_prod rumirent_db | gzip > /opt/rumirent-app/backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Ver backups disponibles
ls -lh /opt/rumirent-app/backups/
```

## 🔄 Restaurar desde Backup

Si necesitas restaurar un backup:

```bash
# Listar backups
ls -lh /opt/rumirent-app/backups/

# Restaurar (reemplaza FECHA con tu archivo)
gunzip < /opt/rumirent-app/backups/backup_FECHA.sql.gz | docker exec -i rumirent-db psql -U rumirent_prod rumirent_db
```

## ✨ Próximos Pasos

Después del reset:

1. **Verifica que la aplicación funciona**: `curl http://localhost:3000/api/test`
2. **Inicia sesión** con las credenciales de admin o broker
3. **Los próximos deployments** aplicarán migraciones automáticamente sin conflictos

---

**Última actualización**: 2025-10-27
