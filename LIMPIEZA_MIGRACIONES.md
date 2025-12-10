# 🧹 Guía de Limpieza de Migraciones

## 🎯 Objetivo

Consolidar múltiples migraciones "sucias" de desarrollo en **UNA SOLA migración limpia** para producción.

---

## 📊 Situación Actual vs Deseada

### ANTES (Estado Actual)
```
prisma/migrations/
├── 20250924201153_init_with_optional_commission/
├── 20251022140456_add_edificio_mejoras_completas/
├── 20251023183046_add_metas_mensuales/
├── 20251023190700_make_broker_id_optional_in_metas/
├── 20251023190919_add_user_birth_date/
├── 20251023233728_add_bedrooms_bathrooms_to_tipo_unidad/
├── 20251024111244_add_image_type_to_imagenes/
├── 20251026150104_add_address_fields_to_edificio/
├── 20251026202147_make_broker_optional_in_cliente/
├── 20251124103958_add_tipo_entidad_to_empresa/
├── 20251125202639_update_estado_lead_enum/
├── 20251130002926_add_plantillas_tipo_unidad/
├── 20251130202741_add_entregado_cancelado/  ← VACÍA
└── 20251130202752_add_entregado_cancelado/

❌ 14 migraciones (algunas duplicadas/vacías)
```

### DESPUÉS (Estado Deseado)
```
prisma/migrations/
└── 20251210HHMMSS_baseline_production/
    └── migration.sql  ← UNA sola migración con TODO

✅ 1 migración limpia y consolidada
```

---

## 🚀 Método 1: Script Automatizado (RECOMENDADO)

### Ejecución

```bash
# 1. Dar permisos
chmod +x clean-migrations.sh

# 2. Ejecutar (hace todo automáticamente)
./clean-migrations.sh

# 3. Verificar que tu app funciona
npm run dev
```

### Lo que hace el script:
1. ✅ Crea backup de migraciones antiguas
2. ✅ Crea backup de tu base de datos de desarrollo
3. ✅ Elimina migraciones antiguas
4. ✅ Crea UNA migración baseline limpia
5. ✅ La marca como aplicada en desarrollo
6. ✅ Verifica el estado final

---

## 🔧 Método 2: Paso a Paso Manual

Si prefieres hacerlo manualmente o el script falla:

### Paso 1: Backups de Seguridad

```bash
# Backup de migraciones
cp -r prisma/migrations prisma/migrations-backup-$(date +%Y%m%d)

# Backup de base de datos de desarrollo (opcional pero recomendado)
pg_dump $DATABASE_URL > backup-dev-$(date +%Y%m%d).sql
```

### Paso 2: Ver Estado Actual

```bash
# Ver migraciones actuales
ls -la prisma/migrations/

# Ver estado de Prisma
npx prisma migrate status
```

### Paso 3: Eliminar Migraciones Antiguas

```bash
# Linux/Mac
rm -rf prisma/migrations/*

# Windows (PowerShell)
Remove-Item -Recurse -Force prisma\migrations\*

# Windows (CMD)
rmdir /s /q prisma\migrations
mkdir prisma\migrations
```

### Paso 4: Crear Migración Baseline

```bash
# Generar migración baseline (NO la aplica, solo la crea)
npx prisma migrate dev --name baseline_production --create-only
```

**¿Qué hace este comando?**
- Lee tu `schema.prisma` actual
- Genera SQL para crear TODA la estructura
- Lo guarda en `prisma/migrations/YYYYMMDDHHMMSS_baseline_production/migration.sql`
- NO lo ejecuta (porque tu DB ya tiene esos cambios)

### Paso 5: Marcar como Aplicada en Desarrollo

```bash
# Tu DB de desarrollo ya tiene estos cambios, así que marcamos la migración
# como aplicada SIN ejecutarla
npx prisma migrate resolve --applied baseline_production
```

### Paso 6: Verificar Estado Final

```bash
# Verificar estado
npx prisma migrate status

# Deberías ver:
# "Database schema is up to date!"

# Ver la migración creada
ls -la prisma/migrations/
```

---

## 📤 Subir a Producción

### Paso 7: Commit y Push

```bash
# Verificar cambios
git status

# Agregar la nueva migración
git add prisma/migrations/
git add prisma/schema.prisma

# Commit
git commit -m "chore: consolidate migrations into baseline for production

- Consolidated 14 migrations into single baseline
- Ready for production deployment
- Backup saved in migrations-backup-YYYYMMDD"

# Push
git push origin main
```

### Paso 8: Aplicar en Producción

En tu servidor de producción:

```bash
# 1. Pull del código
git pull origin main

# 2. Aplicar migración (Prisma detectará que es nueva y la ejecutará)
npx prisma migrate deploy

# 3. Generar cliente Prisma
npx prisma generate

# 4. Reiniciar aplicación
pm2 restart rumirent-prod
# O según tu setup:
# docker restart rumirent-prod
# systemctl restart rumirent
```

---

## ✅ Verificación Post-Limpieza

### En Desarrollo

```bash
# 1. Estado de migraciones
npx prisma migrate status
# Debe decir: "Database schema is up to date!"

# 2. Cantidad de migraciones
ls -1 prisma/migrations/ | wc -l
# Debe ser: 1

# 3. Verificar que la app funciona
npm run dev
# Probar login, CRUD, etc.

# 4. Verificar estructura de la migración
cat prisma/migrations/*/migration.sql | head -n 50
# Debe contener CREATE TABLE, CREATE ENUM, etc.
```

### En Producción (después de aplicar)

```bash
# 1. Estado de migraciones
npx prisma migrate status

# 2. Verificar tablas
psql $DATABASE_URL_PRODUCTION -c "\dt"

# 3. Verificar que la app funciona
curl https://tudominio.com/api/health

# 4. Verificar logs
pm2 logs rumirent-prod --lines 50
```

---

## 🚨 Solución de Problemas

### Error: "Database schema is not in sync"

```bash
# Esto significa que tu schema.prisma no coincide con tu DB
# Solución: Sincronizar primero
npx prisma db pull

# Luego intentar de nuevo
./clean-migrations.sh
```

### Error: "Migration failed to apply"

```bash
# Si la migración falla al marcarla como aplicada
# Verificar estado de la tabla _prisma_migrations
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations;"

# Limpiar manualmente si es necesario
psql $DATABASE_URL -c "DELETE FROM _prisma_migrations;"

# Intentar de nuevo
npx prisma migrate resolve --applied baseline_production
```

### Error: Script no tiene permisos

```bash
# Linux/Mac
chmod +x clean-migrations.sh

# Windows (Git Bash)
bash clean-migrations.sh
```

### Quiero volver atrás

```bash
# Restaurar migraciones antiguas
cp -r prisma/migrations-backup-YYYYMMDD/* prisma/migrations/

# Restaurar base de datos (si es necesario)
psql $DATABASE_URL < backup-dev-YYYYMMDD.sql

# Reintentar
npx prisma migrate status
```

---

## 📋 Checklist Completo

### Pre-Limpieza
- [ ] Backup de producción creado ✅ (ya lo tienes)
- [ ] Backup de migraciones creado
- [ ] Backup de DB de desarrollo creado (opcional)
- [ ] `schema.prisma` refleja el estado actual
- [ ] Tu app de desarrollo funciona correctamente

### Durante Limpieza
- [ ] Migraciones antiguas eliminadas
- [ ] Migración baseline creada
- [ ] Migración marcada como aplicada en dev
- [ ] Estado de Prisma verificado
- [ ] App de desarrollo probada y funciona

### Post-Limpieza
- [ ] Solo 1 migración en `prisma/migrations/`
- [ ] `npx prisma migrate status` muestra "up to date"
- [ ] Cambios commiteados a Git
- [ ] Cambios pusheados a repositorio
- [ ] Aplicado en producción
- [ ] Producción verificada y funciona

---

## 🎓 Ventajas de Consolidar Migraciones

### ANTES
❌ 14 archivos de migración
❌ Difícil de revisar historial
❌ Migraciones duplicadas/vacías
❌ Tiempo de aplicación más lento
❌ Más probabilidad de errores

### DESPUÉS
✅ 1 archivo de migración limpio
✅ Fácil de revisar y entender
✅ Sin duplicados ni archivos vacíos
✅ Aplicación rápida en producción
✅ Menor probabilidad de errores
✅ Baseline claro para futuras migraciones

---

## 📚 Recursos Relacionados

- [Prisma Migrate: Baselining](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#baselining)
- [Prisma Migrate: Resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)

---

## 🎯 Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIMPIEZA DE MIGRACIONES                      │
└─────────────────────────────────────────────────────────────────┘

1. DESARROLLO (Antes)
   ├── 14 migraciones sucias
   └── Base de datos funcionando
         │
         ├─→ Backup de todo
         │
         ├─→ Eliminar migraciones antiguas
         │
         ├─→ Crear 1 migración baseline
         │
         └─→ Marcar como aplicada

2. DESARROLLO (Después)
   ├── 1 migración limpia
   └── Base de datos sin cambios (funciona igual)
         │
         └─→ git commit + push

3. PRODUCCIÓN
   ├── git pull
   ├── npx prisma migrate deploy  ← Aplica la baseline
   ├── npx prisma generate
   └── pm2 restart
         │
         └─→ ✅ Producción actualizada

4. FUTURO
   Nuevos cambios → prisma migrate dev --name nueva_feature
   └─→ Se agregarán como migraciones incrementales limpias
```

---

**Creado:** 2025-12-10
**Script:** [clean-migrations.sh](clean-migrations.sh)
**Relacionado:** [README_MIGRACION.md](README_MIGRACION.md), [FLUJO_COMPLETO.md](FLUJO_COMPLETO.md)
