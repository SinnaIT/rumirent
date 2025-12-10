# 🚀 Pasos para Aplicar en Producción

## ✅ Lo que se Aplicó en Desarrollo

Se completaron los siguientes pasos en desarrollo:

1. ✅ Aplicadas todas las migraciones pendientes
2. ✅ Creado backup de migraciones antiguas: `prisma/migrations-clean-backup-20251210-074844/`
3. ✅ Eliminadas 13 migraciones antiguas "sucias"
4. ✅ Creada 1 migración baseline limpia: `20251210075009_baseline_production_ready`
5. ✅ Marcada como aplicada en desarrollo
6. ✅ Generado Prisma Client
7. ✅ Verificado estado: "Database schema is up to date!"

---

## 📦 Estado Actual

### Antes (13 migraciones)
```
❌ 20250924201153_init_with_optional_commission
❌ 20251022140456_add_edificio_mejoras_completas
❌ 20251023183046_add_metas_mensuales
❌ 20251023190700_make_broker_id_optional_in_metas
❌ 20251023190919_add_user_birth_date
❌ 20251023233728_add_bedrooms_bathrooms_to_tipo_unidad
❌ 20251024111244_add_image_type_to_imagenes
❌ 20251026150104_add_address_fields_to_edificio
❌ 20251026202147_make_broker_optional_in_cliente
❌ 20251124103958_add_tipo_entidad_to_empresa
❌ 20251125202639_update_estado_lead_enum
❌ 20251130002926_add_plantillas_tipo_unidad
❌ 20251130202752_add_entregado_cancelado
```

### Ahora (1 migración limpia)
```
✅ 20251210075009_baseline_production_ready  ← TODO EN UNO
```

---

## 🎯 Pasos para Producción

### Paso 1: Commit y Push de Cambios

```bash
# Verificar cambios
git status

# Deberías ver:
# - modified: prisma/schema.prisma
# - new: prisma/migrations/20251210075009_baseline_production_ready/
# - deleted: prisma/migrations/<varias migraciones antiguas>/

# Agregar cambios
git add prisma/migrations/
git add prisma/schema.prisma

# Commit
git commit -m "chore: consolidate migrations into baseline for production

- Consolidated 13 migrations into single baseline
- Migration: 20251210075009_baseline_production_ready
- Ready for production deployment
- Backup: prisma/migrations-clean-backup-20251210-074844"

# Push
git push origin main
```

### Paso 2: Backup de Producción (CRÍTICO)

**⚠️ OBLIGATORIO antes de continuar**

```bash
# En el servidor de producción o desde tu máquina local
export DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db"

# Opción A: Usando el script (si lo tienes en producción)
./backup-production-db.sh

# Opción B: Manual con pg_dump
pg_dump "$DATABASE_URL_PRODUCTION" > backup-prod-before-baseline-$(date +%Y%m%d-%H%M%S).sql

# Verificar que el backup se creó
ls -lh backup-prod-*.sql
```

**NO CONTINUAR** sin un backup verificado.

---

### Paso 3: Aplicar en Producción

En tu servidor de producción:

```bash
# 1. Ir al directorio de la aplicación
cd /path/to/rumirent-app

# 2. Pull de los cambios
git pull origin main

# 3. Instalar dependencias (si es necesario)
npm install

# 4. Aplicar migración baseline
npx prisma migrate deploy

# Deberías ver:
# "Applying migration `20251210075009_baseline_production_ready`"
# "All migrations have been successfully applied."

# 5. Generar Prisma Client
npx prisma generate

# 6. Verificar estado
npx prisma migrate status
# Debe decir: "Database schema is up to date!"
```

### Paso 4: Reiniciar Aplicación

```bash
# Opción A: PM2
pm2 restart rumirent-prod

# Opción B: Docker
docker restart rumirent-prod-app

# Opción C: Systemd
sudo systemctl restart rumirent

# Opción D: Manualmente
# (detener proceso anterior y volver a ejecutar)
```

---

### Paso 5: Verificación Post-Migración

```bash
# 1. Verificar que la aplicación está corriendo
pm2 status
# O
docker ps | grep rumirent

# 2. Verificar health check
curl https://tudominio.com/api/health
# Debe responder 200 OK

# 3. Verificar logs (buscar errores)
pm2 logs rumirent-prod --lines 50
# O
docker logs rumirent-prod-app --tail 50

# 4. Verificar estado de migraciones en DB
npx prisma migrate status

# 5. Verificar conteo de tablas
psql "$DATABASE_URL_PRODUCTION" <<'SQL'
SELECT
  'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'edificios', COUNT(*) FROM edificios
UNION ALL
SELECT 'unidades', COUNT(*) FROM unidades
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
ORDER BY tabla;
SQL
```

---

### Paso 6: Pruebas Funcionales

**Probar las funcionalidades críticas:**

1. ✅ Login de usuarios (admin y broker)
2. ✅ Crear/Editar cliente (validar teléfono único)
3. ✅ Crear/Editar edificio
4. ✅ Crear/Editar unidad
5. ✅ Crear/Editar lead
6. ✅ Ver reportes
7. ✅ Dashboard de broker
8. ✅ Dashboard de admin

**Si algo falla, ver Plan de Rollback abajo.**

---

## 🚨 Plan de Rollback

Si algo sale mal durante la migración:

### Rollback Rápido (Restaurar Backup)

```bash
# 1. Detener aplicación
pm2 stop rumirent-prod

# 2. Restaurar backup
psql "$DATABASE_URL_PRODUCTION" < backup-prod-before-baseline-YYYYMMDD-HHMMSS.sql

# 3. Verificar restauración
psql "$DATABASE_URL_PRODUCTION" -c "SELECT COUNT(*) FROM users;"

# 4. Volver al código anterior
git checkout HEAD~1  # Volver al commit anterior
npm install
npx prisma generate

# 5. Reiniciar aplicación
pm2 start rumirent-prod

# 6. Verificar que funciona
curl https://tudominio.com/api/health
```

### Rollback Completo (Si el rápido no funciona)

```bash
# 1. Ir a commit antes de los cambios
git log --oneline  # Ver historial
git checkout <commit-hash-anterior>

# 2. Restaurar backup de DB
psql "$DATABASE_URL_PRODUCTION" < backup-prod-before-baseline-*.sql

# 3. Reinstalar y regenerar
npm ci
npx prisma generate

# 4. Reiniciar
pm2 restart rumirent-prod

# 5. Notificar al equipo para investigar
```

---

## 📋 Checklist de Producción

### Pre-Despliegue
- [ ] ✅ Desarrollo limpio y funcionando
- [ ] ✅ Migración baseline creada (20251210075009_baseline_production_ready)
- [ ] ✅ Cambios commiteados y pusheados a main
- [ ] ⚠️ Backup de producción creado y verificado
- [ ] ⚠️ Ventana de mantenimiento programada (si es necesario)
- [ ] ⚠️ Equipo notificado

### Durante Despliegue
- [ ] `git pull` ejecutado exitosamente
- [ ] `npx prisma migrate deploy` sin errores
- [ ] `npx prisma generate` sin errores
- [ ] Aplicación reiniciada
- [ ] Logs monitoreados en tiempo real

### Post-Despliegue
- [ ] Health check respondiendo
- [ ] `npx prisma migrate status` muestra "up to date"
- [ ] Conteo de registros correcto
- [ ] Login funciona
- [ ] CRUD de clientes funciona (teléfono único validándose)
- [ ] CRUD de leads funciona
- [ ] Reportes funcionan
- [ ] No hay errores en logs
- [ ] Monitoreado por al menos 30 minutos

---

## 🎓 Notas Importantes

### Sobre la Migración Baseline

- **NO elimina datos**: La migración baseline solo actualiza el schema, no toca datos existentes
- **Idempotente**: Si falla, puedes volver a ejecutarla sin problemas
- **Completa**: Incluye TODAS las tablas, enums, constraints, indexes, y relaciones

### Sobre Prisma Migrate Deploy

- `prisma migrate deploy` ejecuta SOLO migraciones pendientes
- NO pregunta confirmación (pensado para CI/CD)
- NO modifica archivos locales
- Es seguro para producción

### Cambios Clave Incluidos en el Baseline

1. ✅ **EstadoLead** con `ENTREGADO` y `CANCELADO`
2. ✅ **Cliente.telefono** con constraint `@unique`
3. ✅ **TipoUnidadEdificio.plantillaOrigen** con `onDelete: SetNull`
4. ✅ **Tabla PlantillaTipoUnidad** completa
5. ✅ Todos los campos, relaciones y constraints actualizados

---

## 💡 Comandos de Diagnóstico

Si necesitas verificar estado en cualquier momento:

```bash
# Ver migraciones aplicadas
psql "$DATABASE_URL_PRODUCTION" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

# Ver tablas existentes
psql "$DATABASE_URL_PRODUCTION" -c "\dt"

# Ver estructura de una tabla
psql "$DATABASE_URL_PRODUCTION" -c "\d+ users"

# Ver enums
psql "$DATABASE_URL_PRODUCTION" -c "SELECT typname FROM pg_type WHERE typtype = 'e';"

# Ver constraints unique
psql "$DATABASE_URL_PRODUCTION" <<'SQL'
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE contype = 'u'
ORDER BY conrelid::regclass::text;
SQL

# Ver foreign keys
psql "$DATABASE_URL_PRODUCTION" <<'SQL'
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f'
ORDER BY table_name;
SQL
```

---

## 📞 Soporte

### Si encuentras problemas:

1. **No entrar en pánico** - Tienes backup
2. **Capturar logs**:
   ```bash
   pm2 logs rumirent-prod --lines 100 > error-logs.txt
   ```
3. **Verificar estado de DB**:
   ```bash
   npx prisma migrate status
   ```
4. **Si es necesario, hacer rollback** (ver sección arriba)
5. **Documentar el error** para análisis

---

## 🎉 ¿Todo Funcionó?

Si la migración fue exitosa:

1. ✅ Documenta la fecha y hora de despliegue
2. ✅ Guarda el backup en lugar seguro (por al menos 30 días)
3. ✅ Notifica al equipo que el despliegue fue exitoso
4. ✅ Mantén monitoreo activo durante 24 horas
5. ✅ Celebra 🎊

---

**Fecha de preparación:** 2025-12-10 07:50
**Migración baseline:** 20251210075009_baseline_production_ready
**Estado desarrollo:** ✅ Listo y verificado
**Estado producción:** ⏳ Pendiente de aplicar

---

**IMPORTANTE:** Este documento debe ser ejecutado por alguien con acceso a producción y conocimiento del sistema. Si tienes dudas, consulta con el equipo antes de proceder.
