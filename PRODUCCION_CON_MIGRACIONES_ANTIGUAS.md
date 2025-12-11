# 🚀 Aplicar Baseline en Producción (Que Tiene Migraciones Antiguas)

## 🎯 Situación Actual

**Producción:**
- ✅ Tiene las 13 migraciones antiguas aplicadas
- ✅ Base de datos funcionando correctamente
- ❌ NO tiene el baseline (20251210075009_baseline_production_ready)

**Tu código (desarrollo):**
- ✅ Tiene 1 migración baseline consolidada
- ❌ NO tiene las 13 migraciones antiguas

**Necesitas:** Sincronizar producción con el nuevo baseline sin perder datos.

---

## ⚠️ IMPORTANTE: Estrategia Segura

**NO vamos a:**
- ❌ Ejecutar el SQL del baseline (causaría errores, tablas ya existen)
- ❌ Eliminar y recrear la base de datos (perderías datos)
- ❌ Hacer cambios destructivos

**SÍ vamos a:**
- ✅ Limpiar la tabla `_prisma_migrations`
- ✅ Marcar el baseline como aplicado (SIN ejecutar el SQL)
- ✅ Mantener todos los datos intactos

---

## 🔍 ¿Por Qué Funciona Esta Estrategia?

El baseline que consolidaste contiene **exactamente la misma estructura** que las 13 migraciones antiguas.

```
13 migraciones antiguas  =  1 baseline consolidado
(mismo resultado final)
```

Por lo tanto:
1. La estructura de producción ya está actualizada ✅
2. Solo necesitamos actualizar el registro en `_prisma_migrations` ✅
3. No hay SQL que ejecutar ✅

---

## 🚀 Método 1: Script Automático (Recomendado)

### Paso 1: Preparación

```bash
# En el servidor de producción

# 1. Hacer backup COMPLETO
pg_dump "$DATABASE_URL" > backup-prod-$(date +%Y%m%d-%H%M%S).sql

# 2. Verificar que el backup se creó
ls -lh backup-prod-*.sql

# 3. Subir el script
# (si no está en el servidor, copiarlo)
```

### Paso 2: Ejecutar Script

```bash
chmod +x apply-baseline-production.sh
./apply-baseline-production.sh
```

**El script te pedirá:**
1. Nombre del archivo de backup (para verificar que existe)
2. Confirmación escribiendo "SI EN PRODUCCION"

**El script hará:**
1. ✅ Verificar estado actual
2. ✅ Hacer backup de `_prisma_migrations`
3. ✅ Limpiar registros antiguos
4. ✅ Marcar baseline como aplicado
5. ✅ Generar Prisma Client
6. ✅ Verificar estado final

### Paso 3: Reiniciar Aplicación

```bash
# Según tu configuración:
pm2 restart rumirent-prod
# o
docker restart rumirent-prod-app
# o
sudo systemctl restart rumirent
```

### Paso 4: Verificar

```bash
# Ver logs
pm2 logs rumirent-prod --lines 50

# Probar health check
curl https://tudominio.com/api/health

# Verificar estado de migraciones
npx prisma migrate status
```

---

## 🛠️ Método 2: Manual (Paso a Paso)

Si prefieres hacerlo manualmente:

### Paso 1: Backup Obligatorio

```bash
# Crear backup
pg_dump "$DATABASE_URL" > backup-prod-$(date +%Y%m%d-%H%M%S).sql

# Verificar tamaño (debe ser > 0)
ls -lh backup-prod-*.sql
```

### Paso 2: Verificar Estado Actual

```bash
# Ver migraciones en el código
ls -la prisma/migrations/

# Ver migraciones en producción
psql "$DATABASE_URL" -c "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at;"
```

Deberías ver las 13 migraciones antiguas en la base de datos.

### Paso 3: Limpiar Registros Antiguos

```bash
# Conectar a la base de datos y eliminar registros
psql "$DATABASE_URL" <<'SQL'
DELETE FROM "_prisma_migrations";
SQL

# Verificar que está vacía
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM _prisma_migrations;"
# Debe devolver: 0
```

### Paso 4: Marcar Baseline como Aplicada

```bash
# IMPORTANTE: NO ejecuta el SQL, solo registra que está aplicada
npx prisma migrate resolve --applied 20251210075009_baseline_production_ready
```

### Paso 5: Verificar Estado

```bash
npx prisma migrate status
```

Deberías ver:
```
Database schema is up to date!
```

### Paso 6: Generar Prisma Client

```bash
npx prisma generate
```

### Paso 7: Reiniciar y Verificar

```bash
# Reiniciar aplicación
pm2 restart rumirent-prod

# Ver logs
pm2 logs rumirent-prod --lines 50

# Probar
curl https://tudominio.com/api/health
```

---

## 📊 Diagrama de Flujo

```
PRODUCCIÓN (Antes):
┌─────────────────────────────────────────────┐
│ Base de Datos                               │
│ ├── Estructura: ✅ Actualizada (13 migr.)  │
│ └── _prisma_migrations:                     │
│     ├── 20250924201153_init...             │
│     ├── 20251022140456_add...              │
│     └── ... (13 registros)                  │
└─────────────────────────────────────────────┘

           ⬇️  APLICAR SOLUCIÓN  ⬇️

PRODUCCIÓN (Después):
┌─────────────────────────────────────────────┐
│ Base de Datos                               │
│ ├── Estructura: ✅ Igual (sin cambios)     │
│ └── _prisma_migrations:                     │
│     └── 20251210075009_baseline...         │
│         (1 registro)                        │
└─────────────────────────────────────────────┘

✅ Sincronizado con el código
✅ Datos preservados
✅ App puede deployar cambios futuros
```

---

## ✅ Checklist Pre-Aplicación

Antes de ejecutar en producción:

- [ ] Backup completo de la base de datos creado
- [ ] Backup verificado (tamaño > 0, puede abrirse)
- [ ] Ventana de mantenimiento programada (opcional pero recomendado)
- [ ] Equipo notificado del cambio
- [ ] Acceso a servidor de producción verificado
- [ ] Plan de rollback documentado
- [ ] Código con baseline pusheado a repositorio
- [ ] En servidor: `git pull` ejecutado

---

## 🚨 Plan de Rollback

Si algo sale mal:

```bash
# 1. Detener aplicación
pm2 stop rumirent-prod

# 2. Restaurar backup
psql "$DATABASE_URL" < backup-prod-YYYYMMDD-HHMMSS.sql

# 3. Volver al código anterior
git checkout HEAD~1
npm install
npx prisma generate

# 4. Reiniciar
pm2 start rumirent-prod

# 5. Verificar
curl https://tudominio.com/api/health
```

---

## 🔍 Verificaciones Post-Aplicación

```bash
# 1. Estado de Prisma
npx prisma migrate status
# Debe decir: "Database schema is up to date!"

# 2. Migraciones en la DB
psql "$DATABASE_URL" -c "SELECT * FROM _prisma_migrations;"
# Debe mostrar solo: 20251210075009_baseline_production_ready

# 3. Conteo de tablas
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM leads;"
# Debe devolver los mismos números que antes

# 4. Health check
curl https://tudominio.com/api/health
# Debe responder 200 OK

# 5. Logs
pm2 logs rumirent-prod --lines 50
# No debe mostrar errores de Prisma
```

---

## 🎯 Comparación: QA vs Producción

| Aspecto | QA | Producción |
|---------|-------|-----------|
| **Situación inicial** | Backup de prod restaurado | 13 migraciones antiguas |
| **Estructura DB** | Actualizada (del backup) | Actualizada (migrada) |
| **Datos** | De producción (copia) | Reales (críticos) |
| **Riesgo** | Bajo (recreable) | Alto (requiere backup) |
| **Proceso** | `fix-qa-migrations-baseline.sh` | `apply-baseline-production.sh` |
| **Confirmación** | "SI" | "SI EN PRODUCCION" |
| **Backup** | Opcional | **OBLIGATORIO** |

---

## 💡 Preguntas Frecuentes

### ¿Se perderán datos?

**NO.** Solo se actualiza la tabla `_prisma_migrations`, que es un registro de control de Prisma. Los datos de negocio (users, leads, edificios, etc.) NO se tocan.

### ¿Por qué no ejecutar el SQL del baseline?

Porque causaría errores:
```sql
CREATE TABLE users ...;
-- Error: relation "users" already exists
```

La estructura ya existe gracias a las 13 migraciones antiguas.

### ¿Puedo hacer esto sin downtime?

SÍ. El proceso solo actualiza un registro de control. La aplicación puede seguir corriendo.

Pero se recomienda una ventana de mantenimiento por precaución.

### ¿Qué pasa con futuras migraciones?

Funcionarán normalmente. Cuando crees nuevas migraciones (después del baseline), Prisma las detectará y aplicará correctamente.

```bash
# En el futuro, cuando hagas cambios:
npx prisma migrate dev --name nueva_feature

# En producción:
npx prisma migrate deploy
# ✅ Detectará la nueva migración y la aplicará
```

---

## 📞 Soporte

Si encuentras problemas:

1. **NO entrar en pánico** - Tienes backup
2. **Capturar error completo**:
   ```bash
   npx prisma migrate status > error.txt 2>&1
   ```
3. **Ver logs de la app**:
   ```bash
   pm2 logs rumirent-prod --lines 100 > logs.txt
   ```
4. **Hacer rollback si es necesario** (ver sección arriba)

---

**Creado:** 2025-12-10
**Script:** [apply-baseline-production.sh](apply-baseline-production.sh)
**Para QA:** Ver [QA_FIX_MIGRACIONES.md](QA_FIX_MIGRACIONES.md)
**Guía general:** Ver [PASOS_PRODUCCION.md](PASOS_PRODUCCION.md)
