# Guía de Migración a Producción

## Situación Actual
- Base de datos de desarrollo con múltiples migraciones incrementales
- Algunas migraciones duplicadas detectadas
- Necesidad de consolidar antes de subir a producción

## Estrategia de Migración Segura

### Pre-requisitos
1. Backup completo de la base de datos de producción
2. Acceso a variables de entorno de producción
3. Acceso SSH o panel de control del servidor

### Paso 1: Generar SQL Consolidado

```bash
# Generar script SQL desde el esquema actual
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration-production.sql
```

### Paso 2: Revisar el Script Generado

Revisar `migration-production.sql` y verificar:
- ✅ Creación de todas las tablas
- ✅ Creación de índices y constraints
- ✅ Enums definidos correctamente
- ✅ Relaciones FK correctas
- ❌ No hay DROP TABLE de datos importantes
- ❌ No hay comandos destructivos inesperados

### Paso 3: Aplicar en Producción

#### Opción A: Base de datos nueva (Recomendada)
```bash
# 1. Aplicar el script consolidado
psql $DATABASE_URL_PRODUCTION < migration-production.sql

# 2. Crear entrada en _prisma_migrations
npx prisma migrate resolve --applied "20250207000000_production_baseline"

# 3. Generar el cliente de Prisma
npx prisma generate
```

#### Opción B: Base de datos existente con datos
```bash
# 1. Backup primero
pg_dump $DATABASE_URL_PRODUCTION > backup-$(date +%Y%m%d).sql

# 2. Comparar esquema actual vs nuevo
npx prisma migrate diff \
  --from-url $DATABASE_URL_PRODUCTION \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration-incremental.sql

# 3. Revisar migration-incremental.sql cuidadosamente
# Este archivo solo contendrá los cambios necesarios

# 4. Aplicar los cambios
psql $DATABASE_URL_PRODUCTION < migration-incremental.sql

# 5. Marcar como aplicado
npx prisma migrate resolve --applied "20250207000000_production_update"
```

### Paso 4: Verificación Post-Migración

```bash
# Verificar que el esquema coincide
npx prisma migrate status

# Validar que el cliente Prisma funciona
npx prisma studio
```

## Limpieza de Migraciones Locales (Opcional)

Si quieres limpiar tus migraciones locales después de consolidar:

```bash
# 1. Hacer backup de la carpeta de migraciones
cp -r prisma/migrations prisma/migrations-backup

# 2. Borrar migraciones antiguas
rm -rf prisma/migrations/*

# 3. Crear nueva migración baseline
mkdir -p prisma/migrations/20250207000000_baseline

# 4. Copiar el script consolidado
cp migration-production.sql prisma/migrations/20250207000000_baseline/migration.sql

# 5. Resetear la base de datos local y aplicar baseline
npx prisma migrate reset

# 6. Verificar que todo funciona
npm run dev
```

## Checklist de Seguridad

Antes de aplicar en producción:
- [ ] Backup completo realizado
- [ ] Script SQL revisado manualmente
- [ ] Probado en ambiente de staging/QA
- [ ] Ventana de mantenimiento programada
- [ ] Plan de rollback preparado
- [ ] Variables de entorno verificadas
- [ ] Monitoreo activo post-migración

## Rollback en Caso de Problemas

```bash
# Restaurar desde backup
psql $DATABASE_URL_PRODUCTION < backup-YYYYMMDD.sql

# Verificar integridad
npx prisma migrate status
```

## Notas Importantes

- ⚠️ **NUNCA** usar `prisma migrate reset` en producción
- ⚠️ **SIEMPRE** hacer backup antes de migrar
- ⚠️ Las migraciones duplicadas detectadas:
  - `20251130202741_add_entregado_cancelado`
  - `20251130202752_add_entregado_cancelado`
  - Revisar cuál es la correcta antes de aplicar

## Migraciones Detectadas en Desarrollo

1. `20250924201153_init_with_optional_commission` - Inicial
2. `20251022140456_add_edificio_mejoras_completas`
3. `20251023183046_add_metas_mensuales`
4. `20251023190700_make_broker_id_optional_in_metas`
5. `20251023190919_add_user_birth_date`
6. `20251023233728_add_bedrooms_bathrooms_to_tipo_unidad`
7. `20251024111244_add_image_type_to_imagenes`
8. `20251026150104_add_address_fields_to_edificio`
9. `20251026202147_make_broker_optional_in_cliente`
10. `20251124103958_add_tipo_entidad_to_empresa`
11. `20251125202639_update_estado_lead_enum`
12. `20251130002926_add_plantillas_tipo_unidad`
13. `20251130202741_add_entregado_cancelado` ⚠️ DUPLICADA
14. `20251130202752_add_entregado_cancelado` ⚠️ DUPLICADA
