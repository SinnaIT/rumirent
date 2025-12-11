# Guía de Migración - Agregar Columnas Faltantes

## 📋 Contexto

Esta migración soluciona el problema de **8 columnas que existen en el código pero no en la base de datos de producción**. Estas columnas fueron agregadas al `schema.prisma` pero nunca se migraron a producción.

### Columnas que se Agregarán

#### 1. Tabla `tipos_unidad_edificio` (3 columnas)
- `activo` - Boolean, default: `true` - Flag de activación
- `descripcion` - Text, nullable - Descripción del tipo de unidad
- `plantillaOrigenId` - Text, nullable - Referencia a plantilla origen

#### 2. Tabla `empresas` (1 columna)
- `tipoEntidad` - Enum `TipoEntidad`, default: `COMPANY` - Clasificación de la empresa

#### 3. Tabla `users` (4 columnas)
- `lastPasswordChange` - DateTime, nullable - Última vez que cambió contraseña
- `mustChangePassword` - Boolean, default: `false` - Obligar cambio de contraseña
- `resetToken` - Text, nullable - Token para reset de contraseña
- `resetTokenExpiry` - DateTime, nullable - Expiración del token

---

## 🚀 Proceso de Aplicación

### Paso 1: Subir el Código Actualizado

**En tu máquina local (Windows):**

```bash
# 1. Hacer commit de la nueva migración
git add prisma/migrations/20251211000000_add_missing_columns/
git add apply-migration-to-qa.sh
git add apply-migration-to-production.sh
git commit -m "feat: add migration for missing columns in production"

# 2. Push al repositorio
git push origin main
```

---

### Paso 2: Aplicar en QA (Testing)

**En el servidor QA:**

```bash
# 1. Actualizar el código
git pull origin main

# 2. Reconstruir contenedores (si es necesario)
docker-compose build

# 3. Reiniciar contenedores
docker-compose up -d

# 4. Dar permisos al script
chmod +x apply-migration-to-qa.sh

# 5. Ejecutar migración en QA
./apply-migration-to-qa.sh

# Cuando pregunte, escribe: SI
# Al final, cuando pregunte si reiniciar, escribe: y
```

**Verificación en QA:**

1. ✅ Espera que la app reinicie (5-10 segundos)
2. ✅ Verifica que las páginas ya NO dan estos errores:
   - ❌ `column tipos_unidad_edificio.descripcion does not exist`
   - ❌ `column empresas.tipoEntidad does not exist`
3. ✅ Prueba la funcionalidad de:
   - Crear/editar tipos de unidad
   - Crear/editar empresas
   - Login de usuarios

**Si algo falla en QA:**

```bash
# Restaurar backup
./restore-to-qa.sh backup-qa-before-migration-YYYYMMDD-HHMMSS.sql --fresh

# Revisar logs
docker logs rumirent-qa-app
```

---

### Paso 3: Aplicar en Producción

⚠️ **SOLO después de verificar que funciona en QA**

**En el servidor de Producción:**

```bash
# 1. Actualizar el código
git pull origin main

# 2. Reconstruir contenedores (si es necesario)
docker-compose build

# 3. Reiniciar contenedores
docker-compose up -d

# 4. Dar permisos al script
chmod +x apply-migration-to-production.sh

# 5. Ejecutar migración en PRODUCCIÓN
./apply-migration-to-production.sh

# Confirmaciones que pedirá:
# - ¿Has probado en QA? → Escribe: SI
# - Confirmación final → Escribe: SI EN PRODUCCION
# - ¿Reiniciar app? → Escribe: y
```

**El script hará automáticamente:**

1. ✅ Verificar que los contenedores están corriendo
2. ✅ Crear backup OBLIGATORIO de producción
3. ✅ Limpiar migraciones antiguas (baseline problemático)
4. ✅ Aplicar la migración con `npx prisma migrate deploy`
5. ✅ Generar Prisma Client
6. ✅ Verificar que las columnas se agregaron correctamente
7. ✅ Mostrar estado de migraciones

**Monitoreo Post-Migración:**

```bash
# 1. Monitorear logs
docker logs -f rumirent-prod-app

# 2. Verificar que no hay errores de "column does not exist"

# 3. Probar funcionalidad crítica:
#    - Login de usuarios
#    - Gestión de empresas
#    - Gestión de tipos de unidad
#    - Creación de leads
```

---

## 🔄 Rollback (Si Algo Sale Mal)

### En QA:

```bash
./restore-to-qa.sh backup-qa-before-migration-YYYYMMDD-HHMMSS.sql --fresh
docker restart rumirent-qa-app
```

### En Producción:

```bash
# 1. Detener la aplicación
docker stop rumirent-prod-app

# 2. Restaurar backup
docker exec -i rumirent-prod-db psql -U rumirent_prod -d rumirent_prod_db < backup-production-before-migration-YYYYMMDD-HHMMSS.sql

# 3. Reiniciar aplicación
docker start rumirent-prod-app

# 4. Verificar
docker logs -f rumirent-prod-app
```

---

## ✅ Checklist de Validación

### Antes de Aplicar en QA:
- [ ] Código actualizado en servidor QA (`git pull`)
- [ ] Contenedores corriendo (`docker ps`)
- [ ] Migración existe en contenedor
- [ ] Backup automático se creará

### Después de Aplicar en QA:
- [ ] Migración aplicada sin errores
- [ ] Páginas de empresas funcionan
- [ ] Páginas de tipos de unidad funcionan
- [ ] Login funciona correctamente
- [ ] No hay errores de "column does not exist" en logs

### Antes de Aplicar en Producción:
- [ ] ✅ Probado y validado en QA
- [ ] Código actualizado en servidor producción (`git pull`)
- [ ] Contenedores corriendo (`docker ps`)
- [ ] Planificado en horario de bajo tráfico (recomendado)
- [ ] Equipo notificado de la migración

### Después de Aplicar en Producción:
- [ ] Backup guardado en lugar seguro
- [ ] Migración aplicada sin errores
- [ ] Aplicación reiniciada correctamente
- [ ] No hay errores en logs
- [ ] Funcionalidad crítica verificada
- [ ] Usuarios pueden usar la aplicación normalmente

---

## 📊 Archivos Involucrados

### Nuevos Archivos Creados:
```
prisma/migrations/20251211000000_add_missing_columns/
├── migration.sql                  # SQL de la migración

apply-migration-to-qa.sh          # Script para QA
apply-migration-to-production.sh  # Script para producción
MIGRATION_GUIDE.md                # Esta guía
```

### Archivos Eliminados:
```
prisma/migrations/20251210075009_baseline_production_ready/
└── migration.sql                  # Baseline antiguo que causaba conflictos
```

---

## 🆘 Solución de Problemas

### Error: "Container not running"
```bash
# Verificar contenedores
docker ps

# Iniciar contenedores si están detenidos
docker-compose up -d
```

### Error: "Migration file not found"
```bash
# Asegúrate de haber actualizado el código
git pull origin main

# Verifica que la migración existe
ls -la prisma/migrations/20251211000000_add_missing_columns/
```

### Error: "Failed to create backup"
```bash
# Verificar espacio en disco
df -h

# Verificar que pg_dump funciona
docker exec rumirent-qa-db pg_dump --version
```

### Error: "Column already exists"
Este error es **normal** si ejecutas la migración más de una vez. La migración usa `IF NOT EXISTS` y `DO $$ BEGIN ... END $$` para ser idempotente (segura de ejecutar múltiples veces).

---

## 📞 Contacto

Si encuentras problemas durante la migración:

1. **Revisar logs**: `docker logs -f rumirent-[qa|prod]-app`
2. **Revisar archivos de log generados**: `migration-[qa|production]-YYYYMMDD-HHMMSS.log`
3. **Backups disponibles**: Todos los backups se guardan en el directorio actual

---

## 🎯 Resultado Esperado

Después de aplicar esta migración:

✅ **QA y Producción tendrán:**
- 8 nuevas columnas agregadas
- Estructura de DB sincronizada con `schema.prisma`
- No más errores de "column does not exist"
- Funcionalidad completa de tipos de unidad, empresas y usuarios

✅ **Historial de migraciones limpio:**
- Migración incremental documentada
- Fácil de auditar y revertir si es necesario
- Sin baseline confuso

---

**Última actualización**: 2025-12-11
**Versión de la migración**: `20251211000000_add_missing_columns`
