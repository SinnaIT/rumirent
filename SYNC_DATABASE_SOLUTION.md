# Solución de Sincronización Schema/Database - Desarrollo y Producción

## Problema Identificado

El schema de Prisma (`schema.prisma`) contiene modelos y campos que no existen en la base de datos actual, causando errores en Prisma Studio:

- ❌ Tabla `edificio_tipo_unidad` no existe en la base de datos (pero SÍ existe en schema)
- ❌ Columna `cambios_comision_programados.edificioTipoUnidadId` no existe en la base de datos (pero SÍ existe en schema)
- ❌ Columna `tipos_unidad_edificio.descripcion` no existe en la base de datos (pero SÍ existe en schema)

**Causa**: El schema tiene cambios que nunca fueron migrados a la base de datos.

---

## Solución Unificada: 3 Pasos

### ✅ PASO 1: Backup de Base de Datos (CRÍTICO)

**Para Desarrollo:**
```bash
# Si usas PostgreSQL local
pg_dump -U postgres -d contractor_db_dev > backup_dev_$(date +%Y%m%d_%H%M%S).sql

# Si usas Docker
docker exec -t rumirent-db pg_dump -U your_user contractor_db_dev > backup_dev_$(date +%Y%m%d_%H%M%S).sql
```

**Para Producción:**
```bash
# Backup completo con compresión
pg_dump -U postgres -d contractor_db_prod -Fc > backup_prod_$(date +%Y%m%d_%H%M%S).dump

# O SQL plano
pg_dump -U postgres -d contractor_db_prod > backup_prod_$(date +%Y%m%d_%H%M%S).sql
```

---

### ✅ PASO 2A: Solución para DESARROLLO

**Opción A (Recomendada): Reset y Recrear**

Si puedes perder los datos de desarrollo (o ya hiciste backup):

```bash
# 1. Reset completo de la base de datos
npx prisma migrate reset

# Este comando:
# - Elimina toda la base de datos
# - Recrea la estructura desde cero según el schema
# - Aplica todas las migraciones en orden
# - Ejecuta el seed (si existe)
```

**Opción B: Push Directo (Sin perder datos)**

Si NO puedes perder datos de desarrollo:

```bash
# 1. Push del schema actual a la base de datos
npx prisma db push

# Este comando:
# - Sincroniza la base de datos con el schema
# - NO crea archivos de migración
# - NO tiene historial de cambios
# - Útil solo para desarrollo
```

**Después de cualquiera de las dos opciones:**

```bash
# 2. Generar el Prisma Client actualizado
npx prisma generate

# 3. Verificar en Prisma Studio
npx prisma studio
```

---

### ✅ PASO 2B: Solución para PRODUCCIÓN

**NUNCA uses `db push` o `migrate reset` en producción**

```bash
# 1. En tu entorno de DESARROLLO, crea una migración limpia
#    (solo si usaste Opción B arriba, de lo contrario ya tienes las migraciones)
npx prisma migrate dev --name production_sync

# 2. Commit la migración a Git
git add prisma/migrations
git commit -m "chore: add production sync migration"
git push

# 3. En el servidor de PRODUCCIÓN:

# a) Hacer backup (CRÍTICO)
pg_dump -U postgres -d contractor_db_prod -Fc > backup_before_sync.dump

# b) Revisar qué migraciones se aplicarán
npx prisma migrate status

# c) Aplicar migraciones pendientes
npx prisma migrate deploy

# d) Generar Prisma Client
npx prisma generate

# e) Reiniciar la aplicación
pm2 restart all  # o docker-compose restart, según tu setup
```

---

### ✅ PASO 3: Verificación

**En Desarrollo:**

```bash
# 1. Abrir Prisma Studio
npx prisma studio

# 2. Verificar que NO hay errores

# 3. Verificar que las siguientes tablas/columnas existen:
# ✓ Tabla: edificio_tipo_unidad
# ✓ Columna: cambios_comision_programados.edificioTipoUnidadId
# ✓ Columna: tipos_unidad_edificio.descripcion
```

**En Producción:**

```bash
# 1. Verificar estado de migraciones
npx prisma migrate status
# Debe mostrar: "Database schema is up to date!"

# 2. Verificar que la app funciona
# - Probar endpoints críticos
# - Revisar logs de errores
# - Verificar que los reportes funcionan
```

---

## Resumen de Diferencias: Desarrollo vs Producción

| Aspecto | Desarrollo | Producción |
|---------|-----------|------------|
| **Comando principal** | `migrate reset` o `db push` | `migrate deploy` |
| **Pérdida de datos** | Aceptable con backup | NUNCA |
| **Historial de migraciones** | Opcional | OBLIGATORIO |
| **Backup antes de migrar** | Recomendado | CRÍTICO |
| **Rollback** | Fácil (restore backup) | Planificado |

---

## Rollback en Caso de Problemas

**Desarrollo:**

```bash
# Restaurar desde backup
psql -U postgres -d contractor_db_dev < backup_dev_20251125.sql
```

**Producción:**

```bash
# 1. Detener la aplicación
pm2 stop all

# 2. Restaurar base de datos
pg_restore -U postgres -d contractor_db_prod backup_before_sync.dump

# 3. Revertir el código
git revert <commit-hash>
git push

# 4. Reiniciar aplicación
pm2 start all
```

---

## Próximos Pasos Después de Sincronizar

1. ✅ Probar los cambios de EstadoLead (9 nuevos estados)
2. ✅ Probar el sistema RumiRace
3. ✅ Probar el cálculo de comisiones automático
4. ✅ Probar que los reportes excluyen RECHAZADO
5. ✅ Probar los filtros de fechaPagoReserva en reportes

---

## Comandos Rápidos de Referencia

```bash
# DESARROLLO - Primera vez o reset
npx prisma migrate reset
npx prisma generate
npx prisma studio

# DESARROLLO - Solo sincronizar (sin perder datos)
npx prisma db push
npx prisma generate

# PRODUCCIÓN - Aplicar migraciones
npx prisma migrate deploy
npx prisma generate

# Ver estado de migraciones
npx prisma migrate status

# Ver diferencias entre schema y database
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

---

## Contacto y Soporte

Si encuentras problemas durante el proceso:

1. **NO continúes** sin entender el error
2. **Revisa los backups** que creaste
3. **Consulta los logs** de PostgreSQL
4. **Documenta el error** exacto que ves

---

**Última actualización**: 2025-11-25
