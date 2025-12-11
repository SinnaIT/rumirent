# 🔧 Fix: Migraciones Antiguas en QA con Baseline Nueva

## ❌ Problema

Al ejecutar `npx prisma migrate deploy` en QA, obtienes un error como:

```
The following migration(s) are applied to the database but missing from the local migrations directory:
- 20250924201153_init_with_optional_commission
- 20251022140456_add_edificio_mejoras_completas
- 20251023183046_add_metas_mensuales
...
```

**Causa:** La base de datos tiene registros de las migraciones antiguas (13 migraciones), pero tu código ahora solo tiene la migración baseline consolidada (1 migración).

---

## 🚀 Solución Rápida (4 comandos)

En el servidor de QA:

```bash
# 1. Limpiar registros de migraciones antiguas
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "DELETE FROM _prisma_migrations;"

# 2. Marcar baseline como aplicada (SIN ejecutarla)
npx prisma migrate resolve --applied 20251210075009_baseline_production_ready

# 3. Verificar estado
npx prisma migrate status

# 4. Reiniciar aplicación
docker restart rumirent-qa-app
```

---

## 🤖 Solución Automática (Mejor)

Usa el script que automatiza todo:

```bash
# 1. Subir el script al servidor
scp fix-qa-migrations-baseline.sh usuario@servidor:/opt/rumirent-app-qa/

# 2. En el servidor
cd /opt/rumirent-app-qa
chmod +x fix-qa-migrations-baseline.sh
./fix-qa-migrations-baseline.sh
```

**El script hace:**
1. ✅ Muestra estado actual de migraciones
2. ✅ Hace backup de `_prisma_migrations`
3. ✅ Limpia registros antiguos
4. ✅ Marca baseline como aplicada
5. ✅ Genera Prisma Client
6. ✅ Verifica estado final

---

## 📋 Explicación Detallada

### ¿Por qué pasa esto?

Cuando restauraste el backup de producción en QA:

1. **Los datos** se copiaron ✅
2. **La estructura de tablas** se copió ✅
3. **La tabla `_prisma_migrations`** también se copió ❌

Esa tabla tiene registros de las 13 migraciones antiguas de producción, pero tu código ahora solo tiene 1 migración baseline.

### ¿Por qué no ejecutar el SQL directamente?

La estructura de la base de datos **ya está actualizada** (vino del backup de producción). Si ejecutaras el SQL de la migración baseline:

- Intentaría crear tablas que ya existen → Error
- Intentaría crear enums que ya existen → Error
- Sería innecesario y peligroso

### ¿Qué hace `prisma migrate resolve --applied`?

Este comando le dice a Prisma:

> "Esta migración ya está aplicada en la base de datos, solo registra eso en `_prisma_migrations`"

**NO ejecuta el SQL**, solo actualiza el registro.

---

## 🔍 Verificar Estado Actual

Antes de aplicar la solución, puedes verificar:

```bash
# Ver migraciones en el código
ls -la prisma/migrations/

# Ver migraciones en la base de datos
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at;"
```

**Lo que verás:**

```
En el código:
  - 20251210075009_baseline_production_ready

En la base de datos (_prisma_migrations):
  - 20250924201153_init_with_optional_commission
  - 20251022140456_add_edificio_mejoras_completas
  - 20251023183046_add_metas_mensuales
  ... (13 migraciones antiguas)
```

**Problema:** No coinciden ❌

---

## ✅ Después de Aplicar la Solución

```bash
# Ver estado de Prisma
npx prisma migrate status
```

**Deberías ver:**
```
Database schema is up to date!
```

```bash
# Ver migraciones en la DB
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT migration_name FROM _prisma_migrations;"
```

**Deberías ver:**
```
 migration_name
 ------------------------------------------
 20251210075009_baseline_production_ready
(1 row)
```

✅ Ahora coinciden

---

## 🚨 Troubleshooting

### Error: "Migration has already been applied"

```
Migration `20251210075009_baseline_production_ready` has already been applied
```

**Solución:** Ya está aplicada, solo verifica el estado:

```bash
npx prisma migrate status
# Si dice "up to date", ya estás listo
```

### Error: "Migration file not found"

```
Cannot find migration file at prisma/migrations/.../migration.sql
```

**Solución:** Verifica que hiciste `git pull`:

```bash
git pull origin main
ls -la prisma/migrations/20251210075009_baseline_production_ready/
```

### Error: "Cannot connect to database"

**Solución:** Verifica que el contenedor está corriendo:

```bash
docker ps | grep rumirent-qa-db
docker start rumirent-qa-db
```

---

## 📊 Comparación: Antes vs Después

### Antes (Desincronizado)

```
Código:                              Base de Datos:
├── 20251210075009_baseline...       ├── 20250924201153_init...
                                     ├── 20251022140456_add...
                                     ├── 20251023183046_add...
                                     ├── ... (13 migraciones)

❌ No coinciden
❌ prisma migrate deploy falla
```

### Después (Sincronizado)

```
Código:                              Base de Datos:
├── 20251210075009_baseline...       ├── 20251210075009_baseline...

✅ Coinciden
✅ prisma migrate deploy funciona
✅ App puede iniciar
```

---

## 🎯 Flujo Completo Recomendado

Si estás configurando QA desde cero con un backup de producción:

```bash
# 1. Restaurar backup de producción en QA
./restore-to-qa.sh backup-prod.sql --fresh

# 2. Asegurarte que el código está actualizado
git pull origin main

# 3. Limpiar migraciones antiguas y aplicar baseline
./fix-qa-migrations-baseline.sh

# 4. Verificar
npx prisma migrate status

# 5. Reiniciar app
docker restart rumirent-qa-app

# 6. Probar
curl http://localhost:3000/api/health
```

---

## 📝 Comandos de Referencia

```bash
# Limpiar migraciones
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "DELETE FROM _prisma_migrations;"

# Marcar baseline como aplicada
npx prisma migrate resolve --applied 20251210075009_baseline_production_ready

# Ver estado
npx prisma migrate status

# Ver migraciones en DB
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT * FROM _prisma_migrations;"

# Generar cliente
npx prisma generate

# Reiniciar app
docker restart rumirent-qa-app

# Ver logs
docker logs -f rumirent-qa-app
```

---

## ⚠️ IMPORTANTE: NO en Producción

**NUNCA** ejecutes `DELETE FROM _prisma_migrations` en producción sin un backup verificado.

Esta solución es **solo para QA/Staging** donde puedes recrear los datos fácilmente.

Para producción, sigue la guía en [PASOS_PRODUCCION.md](PASOS_PRODUCCION.md).

---

**Creado:** 2025-12-10
**Scripts relacionados:**
- [fix-qa-migrations-baseline.sh](fix-qa-migrations-baseline.sh)
- [fix-qa-database.sh](fix-qa-database.sh)
- [restore-to-qa.sh](restore-to-qa.sh)

**Guías relacionadas:**
- [QA_RESTORE_GUIDE.md](QA_RESTORE_GUIDE.md)
- [SOLUCION_DATABASE_NOT_EXIST.md](SOLUCION_DATABASE_NOT_EXIST.md)
