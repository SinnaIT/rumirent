# Guía de Migración a Producción - Rumirent App

## Situación Actual

- **Desarrollo**: Base de datos con cambios manuales aplicados + migraciones desincronizadas
- **Schema.prisma**: Refleja el estado correcto y deseado de la base de datos
- **SQL Generado**: `migration-production-baseline.sql` - SQL completo consolidado

## Archivos Importantes

1. **`migration-production-baseline.sql`**: SQL completo para crear la base de datos desde cero
2. **`prisma/schema.prisma`**: Esquema fuente de verdad
3. **`prisma/migrations-backup/`**: Respaldo de migraciones antiguas (por si acaso)

---

## Estrategia de Migración según Escenario

### Escenario 1: Base de Datos de Producción NUEVA (vacía)

**✅ MÁS SIMPLE - RECOMENDADO si no hay datos en producción**

```bash
# 1. Aplicar el SQL completo
psql $DATABASE_URL_PRODUCTION < migration-production-baseline.sql

# 2. Crear entrada ficticia en _prisma_migrations para evitar warnings
psql $DATABASE_URL_PRODUCTION <<'SQL'
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  id VARCHAR(36) PRIMARY KEY,
  checksum VARCHAR(64) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE,
  migration_name VARCHAR(255) NOT NULL,
  logs TEXT,
  rolled_back_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" (id, checksum, migration_name, logs, applied_steps_count, started_at, finished_at)
VALUES (
  gen_random_uuid()::text,
  'baseline',
  'baseline_from_development',
  'Applied complete baseline schema',
  1,
  now(),
  now()
);
SQL

# 3. Generar el cliente Prisma
npx prisma generate

# 4. Verificar que todo está bien
npx prisma migrate status
```

---

### Escenario 2: Base de Datos de Producción EXISTENTE con datos

**⚠️ CUIDADO - Requiere comparación incremental**

#### Paso 1: Backup Obligatorio

```bash
# Crear backup con timestamp
BACKUP_FILE="backup-rumirent-$(date +%Y%m%d-%H%M%S).sql"
pg_dump $DATABASE_URL_PRODUCTION > $BACKUP_FILE
echo "Backup creado: $BACKUP_FILE"

# Verificar que el backup se creó correctamente
ls -lh $BACKUP_FILE
```

#### Paso 2: Generar SQL Incremental

```bash
# Comparar producción actual vs schema deseado
npx prisma migrate diff \
  --from-url "$DATABASE_URL_PRODUCTION" \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration-production-incremental.sql

# IMPORTANTE: Revisar manualmente este archivo antes de aplicar
cat migration-production-incremental.sql
```

#### Paso 3: Revisar el SQL Incremental

**Revisar cuidadosamente:**
- ✅ ¿Solo agrega columnas/tablas nuevas?
- ✅ ¿Los ALTER TABLE son seguros?
- ❌ ¿Hay DROP TABLE de tablas con datos?
- ❌ ¿Hay ALTER COLUMN que cambie tipos incompatibles?
- ❌ ¿Hay DROP CONSTRAINT que pueda causar problemas?

#### Paso 4: Aplicar en Producción

```bash
# 1. Verificar una última vez el backup
ls -lh $BACKUP_FILE

# 2. Aplicar los cambios
psql $DATABASE_URL_PRODUCTION < migration-production-incremental.sql

# 3. Verificar que no hay errores
if [ $? -eq 0 ]; then
  echo "✅ Migración aplicada exitosamente"
else
  echo "❌ Error en la migración - revisar logs"
  exit 1
fi

# 4. Generar cliente Prisma
npx prisma generate

# 5. Verificar estado
npx prisma migrate status
```

#### Paso 5: Plan de Rollback (si algo sale mal)

```bash
# Restaurar desde backup
psql $DATABASE_URL_PRODUCTION < $BACKUP_FILE

# Verificar que la restauración funcionó
psql $DATABASE_URL_PRODUCTION -c "SELECT COUNT(*) FROM users;"
```

---

### Escenario 3: Producción con Estructura Antigua (Migración desde versión previa)

Si tu producción tiene una estructura MUY diferente:

#### Opción A: Migración con Downtime

```bash
# 1. Backup completo
pg_dump $DATABASE_URL_PRODUCTION > backup-complete.sql

# 2. Exportar solo DATOS (sin estructura)
pg_dump --data-only \
  --table=users \
  --table=edificios \
  --table=unidades \
  --table=clientes \
  --table=leads \
  $DATABASE_URL_PRODUCTION > backup-data-only.sql

# 3. Eliminar base de datos y recrear
psql $DATABASE_URL_PRODUCTION -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 4. Aplicar nueva estructura
psql $DATABASE_URL_PRODUCTION < migration-production-baseline.sql

# 5. Restaurar datos (ajustar según sea necesario)
# ADVERTENCIA: Puede requerir transformaciones de datos
psql $DATABASE_URL_PRODUCTION < backup-data-only.sql
```

#### Opción B: Migración Blue-Green (sin downtime)

1. Crear nueva base de datos
2. Aplicar schema nuevo
3. Migrar datos con script ETL
4. Probar exhaustivamente
5. Cambiar conexión de app a nueva DB
6. Mantener antigua DB por 1 semana

---

## Checklist Pre-Migración

Antes de migrar a producción, asegúrate de:

- [ ] **Backup completo creado y verificado**
- [ ] **Variables de entorno de producción correctas**
- [ ] **Revisado `migration-production-incremental.sql` manualmente**
- [ ] **Probado en ambiente de staging/QA primero**
- [ ] **Ventana de mantenimiento programada** (si es necesario)
- [ ] **Plan de rollback documentado y probado**
- [ ] **Monitoreo activo durante y post-migración**
- [ ] **Equipo notificado del cambio**

---

## Verificaciones Post-Migración

```bash
# 1. Verificar estado de migraciones
npx prisma migrate status

# 2. Verificar que todas las tablas existen
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
SQL

# 3. Verificar enums
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT typname
FROM pg_type
WHERE typtype = 'e';
SQL

# 4. Verificar foreign keys
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f'
ORDER BY table_name;
SQL

# 5. Verificar índices únicos
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
SQL

# 6. Contar registros en tablas principales
psql $DATABASE_URL_PRODUCTION <<'SQL'
SELECT
  'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'edificios', COUNT(*) FROM edificios
UNION ALL
SELECT 'unidades', COUNT(*) FROM unidades
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'leads', COUNT(*) FROM leads;
SQL
```

---

## Cambios Importantes en el Schema

### Cambios Aplicados desde el Estado Anterior:

1. **`Cliente.telefono`**: Ahora es `@unique` (no puede haber duplicados)
2. **`TipoUnidadEdificio.plantillaOrigen`**: Tiene `onDelete: SetNull` (permite eliminar plantillas)
3. **Enum `EstadoLead`**: Incluye `ENTREGADO` y `CANCELADO`
4. **Tabla `PlantillaTipoUnidad`**: Nueva tabla para plantillas de tipos de unidad

### Validaciones de Datos Antes de Migrar

```sql
-- Verificar si hay teléfonos duplicados en clientes (puede causar error con @unique)
SELECT telefono, COUNT(*)
FROM clientes
WHERE telefono IS NOT NULL
GROUP BY telefono
HAVING COUNT(*) > 1;

-- Si hay duplicados, decidir qué hacer antes de migrar
```

---

## Contacto y Soporte

Si encuentras problemas durante la migración:

1. **NO ENTRAR EN PÁNICO** - Tienes backup
2. Revisar logs de error: `tail -f /var/log/postgresql/postgresql.log`
3. Restaurar desde backup si es necesario
4. Documentar el error para análisis

---

## Notas Finales

- **Este proceso fue generado desde el estado REAL de desarrollo** (incluyendo cambios manuales)
- El archivo `migration-production-baseline.sql` es tu **fuente de verdad**
- Las migraciones antiguas en `prisma/migrations-backup/` son solo referencia histórica
- **SIEMPRE haz backup antes de cualquier cambio en producción**

## Comandos Rápidos de Referencia

```bash
# Ver URL de conexión actual
echo $DATABASE_URL

# Conectar a producción
psql $DATABASE_URL_PRODUCTION

# Ver tamaño de la base de datos
psql $DATABASE_URL_PRODUCTION -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Listar todas las bases de datos
psql $DATABASE_URL_PRODUCTION -c "\l"

# Ver versión de PostgreSQL
psql $DATABASE_URL_PRODUCTION -c "SELECT version();"
```
