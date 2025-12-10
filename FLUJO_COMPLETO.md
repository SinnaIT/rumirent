# 🚀 Flujo Completo de Migración - Desarrollo → QA → Producción

## 📊 Arquitectura de Ambientes

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE MIGRACIÓN                           │
└─────────────────────────────────────────────────────────────────┘

📍 DESARROLLO (Local)              📍 QA (Docker)              📍 PRODUCCIÓN
┌─────────────────┐               ┌─────────────────┐         ┌─────────────────┐
│                 │               │                 │         │                 │
│  PostgreSQL     │  ──Backup──>  │  Docker         │ ──OK──> │  PostgreSQL     │
│  (con cambios   │               │  PostgreSQL     │         │  (Cloud/VPS)    │
│   manuales)     │               │  Container      │         │                 │
│                 │               │                 │         │                 │
└─────────────────┘               └─────────────────┘         └─────────────────┘
        │                                 │                           │
        │                                 │                           │
   schema.prisma                    Test & Verify              Apply Migration
   migrations/                      con datos reales           con confianza
```

---

## 🎯 Flujo Paso a Paso

### Fase 1: Preparación en Desarrollo ✅ (YA COMPLETADO)

```bash
# 1. Sincronizar schema.prisma con estado real de DB
npx prisma db pull

# 2. Aplicar correcciones necesarias
# - telefono @unique
# - onDelete: SetNull en plantillaOrigen

# 3. Generar SQL consolidado
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration-production-baseline.sql
```

**Resultado:** ✅ SQL limpio y consolidado generado

---

### Fase 2: Backup de Producción 🔐

```bash
# 1. Configurar URL de producción
export DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db_prod"

# 2. Ejecutar backup (intenta 4 métodos automáticamente)
chmod +x backup-production-db.sh
./backup-production-db.sh

# 3. Verificar backup
ls -lh backups/backup-rumirent-*.sql
head -n 20 backups/backup-rumirent-*.sql
```

**Resultado:** ✅ `backups/backup-rumirent-YYYYMMDD-HHMMSS.sql`

**Archivos de ayuda:**
- [backup-production-db.sh](backup-production-db.sh) - Script automático
- [BACKUP_TROUBLESHOOTING.md](BACKUP_TROUBLESHOOTING.md) - Solución de problemas

---

### Fase 3: Probar en QA (RECOMENDADO) 🧪

```bash
# 1. Configurar variables de QA
export QA_CONTAINER="rumirent-qa-db"
export QA_USER="rumirent_qa"
export QA_DATABASE="rumirent_qa_db"

# 2. Restaurar backup de producción en QA
chmod +x restore-to-qa.sh
./restore-to-qa.sh backups/backup-rumirent-*.sql --fresh

# 3. Verificar datos en QA
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db <<'SQL'
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM leads;
SQL

# 4. Actualizar variables de entorno de la app QA
# DATABASE_URL=postgresql://rumirent_qa:pass@rumirent-qa-db:5432/rumirent_qa_db

# 5. Regenerar Prisma Client
npx prisma generate

# 6. Reiniciar aplicación de QA
pm2 restart rumirent-qa  # o docker restart, según tu setup

# 7. Probar funcionalidades críticas
curl http://qa.tudominio.com/api/health
# - Login
# - Crear cliente (validar teléfono único)
# - Crear lead
# - Ver reportes
```

**Resultado:** ✅ QA funcionando con datos de producción

**Archivos de ayuda:**
- [restore-to-qa.sh](restore-to-qa.sh) - Script de restauración
- [QA_RESTORE_GUIDE.md](QA_RESTORE_GUIDE.md) - Guía completa de QA

---

### Fase 4: Migración a Producción 🚀

#### Opción A: Base de Datos Vacía (Nueva)

```bash
# 1. Aplicar SQL completo
chmod +x migrate-to-production.sh
DATABASE_URL_PRODUCTION="postgresql://..." ./migrate-to-production.sh nueva
```

#### Opción B: Base de Datos con Datos Existentes

```bash
# 1. Ya tienes el backup (Fase 2) ✅

# 2. Generar SQL incremental
DATABASE_URL_PRODUCTION="postgresql://..." ./migrate-to-production.sh existente

# El script:
# - Genera SQL solo con los cambios necesarios
# - Te lo muestra para revisión
# - Pide confirmación antes de aplicar
# - Crea backup automático antes de aplicar
```

**Resultado:** ✅ Producción migrada exitosamente

**Archivos de ayuda:**
- [migrate-to-production.sh](migrate-to-production.sh) - Script de migración
- [PRODUCTION_MIGRATION_GUIDE.md](PRODUCTION_MIGRATION_GUIDE.md) - Guía detallada

---

### Fase 5: Verificación Post-Migración ✅

```bash
# 1. Verificar estado de migraciones
npx prisma migrate status

# 2. Verificar tablas
psql $DATABASE_URL_PRODUCTION -c "\dt"

# 3. Verificar datos
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM edificios;
SELECT COUNT(*) FROM leads;
SQL

# 4. Verificar nuevo enum EstadoLead
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')
ORDER BY enumlabel;
SQL

# 5. Verificar constraint telefono unique
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT conname FROM pg_constraint
WHERE conrelid = 'clientes'::regclass
  AND conname LIKE '%telefono%';
SQL

# 6. Regenerar Prisma Client en servidor
npx prisma generate

# 7. Reiniciar aplicación
pm2 restart rumirent-prod

# 8. Verificar health check
curl https://tudominio.com/api/health

# 9. Probar funcionalidades críticas
# - Login de usuarios
# - Crear cliente (debe validar teléfono único)
# - Crear lead
# - Ver reportes
```

---

## 📦 Archivos del Paquete de Migración

| # | Archivo | Tamaño | Propósito |
|---|---------|--------|-----------|
| 1 | **README_MIGRACION.md** | 8.4 KB | 🚀 Punto de entrada - Inicio rápido |
| 2 | **RESUMEN_MIGRACION.md** | 5.5 KB | 📋 Resumen ejecutivo |
| 3 | **PRODUCTION_MIGRATION_GUIDE.md** | 7.9 KB | 📚 Guía detallada producción |
| 4 | **BACKUP_TROUBLESHOOTING.md** | 6.4 KB | 🔧 Solución problemas backup |
| 5 | **QA_RESTORE_GUIDE.md** | 7.7 KB | 🧪 Guía restauración QA |
| 6 | **migrate-to-production.sh** | 5.9 KB | 🤖 Script migración producción |
| 7 | **backup-production-db.sh** | 5.4 KB | 💾 Script backup (4 métodos) |
| 8 | **restore-to-qa.sh** | 5.9 KB | 🔄 Script restauración QA |
| 9 | **migration-production-baseline.sql** | 14 KB | 📄 SQL consolidado (371 líneas) |

**Total:** 67.1 KB de documentación + scripts

---

## 🎯 Orden de Ejecución Recomendado

### Flujo Conservador (Más Seguro)

```
1. Leer README_MIGRACION.md                          (3 min)
2. Leer RESUMEN_MIGRACION.md                         (5 min)
3. Hacer backup de producción                        (2 min)
4. Restaurar en QA y probar                          (15 min)
5. Si QA funciona OK → Migrar a producción           (5 min)
6. Verificar producción                              (10 min)
                                            ─────────────────
                                            TOTAL: ~40 min
```

### Flujo Rápido (Si tienes confianza)

```
1. Leer README_MIGRACION.md                          (3 min)
2. Hacer backup de producción                        (2 min)
3. Migrar a producción                               (5 min)
4. Verificar producción                              (10 min)
                                            ─────────────────
                                            TOTAL: ~20 min
```

---

## ⚠️ Validaciones Críticas Antes de Migrar

### 1. Teléfonos Duplicados en Clientes

```sql
-- Ejecutar ANTES de migrar
SELECT telefono, COUNT(*)
FROM clientes
WHERE telefono IS NOT NULL
GROUP BY telefono
HAVING COUNT(*) > 1;
```

**Si hay duplicados:** Debes limpiarlos manualmente antes de migrar (el constraint @unique lo bloqueará).

### 2. Verificar que Prisma esté actualizado

```bash
npm list prisma @prisma/client
# Deben estar en la misma versión
```

### 3. Backup Verificado

```bash
# El backup debe tener contenido
ls -lh backups/backup-*.sql
# Debe ser > 100 KB (depende de tus datos)

# Debe contener SQL válido
head -n 20 backups/backup-*.sql | grep "CREATE TABLE"
```

---

## 🔄 Plan de Rollback

Si algo sale mal en producción:

```bash
# 1. Restaurar desde backup
psql $DATABASE_URL_PRODUCTION < backups/backup-rumirent-YYYYMMDD-HHMMSS.sql

# 2. Verificar restauración
psql $DATABASE_URL_PRODUCTION -c "SELECT COUNT(*) FROM users;"

# 3. Reiniciar aplicación
pm2 restart rumirent-prod

# 4. Verificar que funciona
curl https://tudominio.com/api/health
```

**Tiempo de rollback:** ~5 minutos

---

## 📊 Checklist Completo

### Pre-Migración
- [ ] Leído README_MIGRACION.md
- [ ] Backup de producción creado y verificado
- [ ] Validado que no hay teléfonos duplicados
- [ ] Probado en QA exitosamente
- [ ] Ventana de mantenimiento programada (si es necesario)
- [ ] Equipo notificado

### Durante Migración
- [ ] Backup adicional automático creado por script
- [ ] SQL revisado manualmente (si es migración incremental)
- [ ] Migración ejecutada sin errores
- [ ] Logs monitoreados

### Post-Migración
- [ ] Estado de migraciones verificado
- [ ] Conteo de tablas correcto
- [ ] Prisma Client regenerado
- [ ] Aplicación reiniciada
- [ ] Health check exitoso
- [ ] Login funciona
- [ ] CRUD de clientes funciona (teléfono único)
- [ ] CRUD de leads funciona
- [ ] Reportes funcionan
- [ ] Logs monitoreados por 1 hora

---

## 🎓 Lecciones Aprendidas

### Qué Salió Mal (Original)
- ❌ Cambios manuales directos en la base de datos
- ❌ Migraciones duplicadas sin contenido
- ❌ Desincronización entre schema y DB real

### Qué Hicimos Bien (Solución)
- ✅ Usar `prisma db pull` para sincronizar estado real
- ✅ Generar SQL consolidado con `prisma migrate diff`
- ✅ Crear scripts automatizados con múltiples métodos
- ✅ Documentar TODO el proceso
- ✅ Incluir flujo completo con QA

### Para el Futuro
- ✅ NUNCA hacer cambios manuales en DB sin migración
- ✅ Siempre usar `prisma migrate dev` para cambios de schema
- ✅ Probar en QA antes de producción
- ✅ Mantener backups automáticos configurados
- ✅ Documentar cambios importantes

---

## 📞 Recursos de Ayuda

### Documentación Principal
1. [README_MIGRACION.md](README_MIGRACION.md) - Inicio rápido
2. [RESUMEN_MIGRACION.md](RESUMEN_MIGRACION.md) - Resumen ejecutivo
3. [PRODUCTION_MIGRATION_GUIDE.md](PRODUCTION_MIGRATION_GUIDE.md) - Guía detallada

### Troubleshooting
1. [BACKUP_TROUBLESHOOTING.md](BACKUP_TROUBLESHOOTING.md) - Problemas con backups
2. [QA_RESTORE_GUIDE.md](QA_RESTORE_GUIDE.md) - Problemas con QA

### Scripts Automatizados
```bash
./backup-production-db.sh          # Backup con 4 métodos
./restore-to-qa.sh                 # Restaurar en QA
./migrate-to-production.sh         # Migrar a producción
```

### Comandos Útiles
```bash
# Prisma
npx prisma migrate status
npx prisma migrate diff --help
npx prisma db pull
npx prisma generate

# PostgreSQL
psql $DATABASE_URL -c "\dt"
pg_dump $DATABASE_URL > backup.sql
psql $DATABASE_URL < backup.sql

# Docker
docker ps
docker exec -it container psql -U user -d db
docker logs container --tail 50 -f
```

---

**Fecha de creación:** 2025-12-10
**Versión:** 1.0
**Estado:** Listo para producción ✅
