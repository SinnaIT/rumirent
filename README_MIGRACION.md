# 🚀 Migración a Producción - Inicio Rápido

## 📋 ¿Por dónde empiezo?

Tienes **4 archivos** para gestionar la migración a producción:

```
📄 README_MIGRACION.md              ← ESTÁS AQUÍ (inicio rápido)
📄 RESUMEN_MIGRACION.md             ← Resumen ejecutivo (5 min lectura)
📄 PRODUCTION_MIGRATION_GUIDE.md   ← Guía detallada completa (15 min lectura)
📄 migrate-to-production.sh         ← Script automatizado
📄 migration-production-baseline.sql ← SQL completo (371 líneas)
```

---

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Leer el Resumen (OBLIGATORIO)

```bash
# Abre y lee este archivo primero (5 minutos)
cat RESUMEN_MIGRACION.md
```

Este archivo te da el contexto completo del problema y la solución.

### 2️⃣ Verificar Estado de Producción

```bash
# Linux/Mac
export DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db_prod"
bash migrate-to-production.sh verificar

# Windows (Git Bash)
export DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db_prod"
bash migrate-to-production.sh verificar

# Windows (PowerShell) - si Git Bash no funciona
$env:DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db_prod"
npx prisma migrate diff `
  --from-url "$env:DATABASE_URL_PRODUCTION" `
  --to-schema-datamodel prisma/schema.prisma `
  --script
```

### 3️⃣ Aplicar Migración

**Opción A: Base de datos NUEVA (sin datos)**
```bash
bash migrate-to-production.sh nueva
```

**Opción B: Base de datos EXISTENTE (con datos)**
```bash
bash migrate-to-production.sh existente
```

---

## 📚 Guía de Lectura Recomendada

### Para Desarrolladores que Quieren Entender Todo

1. **`RESUMEN_MIGRACION.md`** (5 min)
   - Contexto del problema
   - Qué se generó
   - Cómo aplicarlo en 3 pasos

2. **`PRODUCTION_MIGRATION_GUIDE.md`** (15 min)
   - Guía paso a paso COMPLETA
   - 3 escenarios diferentes
   - Checklist de seguridad
   - Plan de rollback
   - Verificaciones post-migración

3. **`BACKUP_TROUBLESHOOTING.md`** (10 min)
   - Solucionar problemas con backups
   - Métodos alternativos de backup
   - Guía de instalación de PostgreSQL client

4. **`QA_RESTORE_GUIDE.md`** (10 min)
   - Restaurar backup en contenedor Docker de QA
   - Verificaciones post-restauración
   - Conectar aplicación a QA

5. **`migration-production-baseline.sql`** (revisión opcional)
   - SQL generado automáticamente
   - 371 líneas
   - Crea toda la estructura desde cero

### Para DevOps/SysAdmin que Solo Quiere Ejecutar

1. **Leer:** `RESUMEN_MIGRACION.md` → Sección "Checklist Obligatorio"
2. **Ejecutar:** `bash migrate-to-production.sh verificar`
3. **Decidir:** ¿DB nueva o existente?
4. **Aplicar:** `bash migrate-to-production.sh [nueva|existente]`

---

## ⚠️ Advertencias Importantes

### ANTES de ejecutar CUALQUIER comando:

- ✅ **Haz backup de producción** (el script lo hace automáticamente, pero verifica)
- ✅ Lee el `RESUMEN_MIGRACION.md` completo
- ✅ Verifica que `DATABASE_URL_PRODUCTION` esté correcta
- ✅ Si tienes datos en producción, lee la sección "Validaciones de Datos"
- ✅ Prueba primero en staging/QA si es posible

### Validación crítica si tienes DATOS en producción:

```sql
-- ¿Hay teléfonos duplicados en clientes?
-- (Ahora telefono es @unique, esto causará error)
SELECT telefono, COUNT(*)
FROM clientes
WHERE telefono IS NOT NULL
GROUP BY telefono
HAVING COUNT(*) > 1;
```

Si esta query devuelve resultados, DEBES limpiar los duplicados antes de migrar.

---

## 🎯 Flujo de Decisión

```
┌─────────────────────────────────┐
│ ¿Tienes datos en producción?   │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │         │
   NO        SÍ
    │         │
    │    ┌────┴──────────────────────────────┐
    │    │ ¿Los datos son importantes?       │
    │    └────┬──────────────────────────────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │   NO        SÍ
    │    │         │
    │    │    ┌────┴───────────────────────────────┐
    │    │    │ 1. BACKUP completo                 │
    │    │    │ 2. Validar datos (teléfonos únicos)│
    │    │    │ 3. Usar: existente                 │
    │    │    │ 4. Leer guía completa              │
    │    │    └────────────────────────────────────┘
    │    │
    └────┴────┐
         │
    ┌────┴───────────────┐
    │ Usar: nueva        │
    │ (Más simple)       │
    └────────────────────┘
```

---

## 🧪 Probar en QA/Staging Primero (Recomendado)

Antes de aplicar en producción, prueba la migración en QA:

```bash
# 1. Hacer backup de producción
chmod +x backup-production-db.sh
DATABASE_URL_PRODUCTION="postgresql://..." ./backup-production-db.sh

# 2. Restaurar en contenedor Docker de QA
chmod +x restore-to-qa.sh
./restore-to-qa.sh backups/backup-rumirent-*.sql --fresh

# 3. Verificar que funciona
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT COUNT(*) FROM users;"

# 4. Probar la aplicación en QA
npm run dev  # o el comando que uses en QA
```

Ver guía completa: **[QA_RESTORE_GUIDE.md](QA_RESTORE_GUIDE.md)**

---

## 🔧 Troubleshooting Rápido

### Error: "pg_dump: command not found" o problemas con backups

Ver guía completa: **[BACKUP_TROUBLESHOOTING.md](BACKUP_TROUBLESHOOTING.md)**

```bash
# Usar el nuevo script de backup mejorado
chmod +x backup-production-db.sh
DATABASE_URL_PRODUCTION="postgresql://..." ./backup-production-db.sh
```

Este script intenta 4 métodos diferentes automáticamente.

### Error: "Variable DATABASE_URL_PRODUCTION no está definida"

```bash
# Asegúrate de exportar la variable
export DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db"

# Verificar que se exportó
echo $DATABASE_URL_PRODUCTION
```

### Error: "bash: migrate-to-production.sh: Permission denied"

```bash
# Dar permisos de ejecución
chmod +x migrate-to-production.sh
```

### Error: "relation 'clientes' already exists"

Estás usando el script "nueva" pero ya tienes una base de datos con datos.
**Solución:** Usa `bash migrate-to-production.sh existente` en su lugar.

### Error: "duplicate key value violates unique constraint 'clientes_telefono_key'"

Tienes teléfonos duplicados en la tabla clientes.
**Solución:** Limpia los duplicados antes de migrar (ver validaciones en RESUMEN_MIGRACION.md)

---

## 📞 ¿Necesitas Ayuda?

### Logs a revisar:

```bash
# Logs de PostgreSQL (en el servidor de DB)
tail -f /var/log/postgresql/postgresql-*.log

# Verificar estado de Prisma
npx prisma migrate status

# Validar schema
npx prisma validate
```

### Comandos de diagnóstico:

```bash
# Ver tablas existentes
psql $DATABASE_URL_PRODUCTION -c "\dt"

# Ver tamaño de DB
psql $DATABASE_URL_PRODUCTION -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Ver conexiones activas
psql $DATABASE_URL_PRODUCTION -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();"
```

---

## ✅ Checklist Final

Antes de dar por terminada la migración:

- [ ] Migración ejecutada sin errores
- [ ] `npx prisma migrate status` muestra todo OK
- [ ] Aplicación desplegada con nuevo schema
- [ ] `npx prisma generate` ejecutado en servidor
- [ ] Login de usuarios funciona
- [ ] Creación de clientes funciona
- [ ] Registro de leads funciona
- [ ] Reportes y analytics funcionan
- [ ] Logs monitoreados durante 1 hora
- [ ] Backup de producción verificado y guardado

---

## 🎉 ¿Migración Exitosa?

Si todo salió bien:

1. ✅ Guarda el backup en un lugar seguro
2. ✅ Documenta la fecha de migración
3. ✅ Notifica al equipo
4. ✅ Mantén estos archivos para referencia futura

**Estos archivos de migración pueden servir como template para futuras migraciones.**

---

**Generado:** 2025-12-07
**Versión:** Baseline desde desarrollo con correcciones
**Estado:** Listo para producción ✅
