# 📝 Uso de Scripts con Archivo .env

## 🎯 Cambio Implementado

Los scripts `restore-to-qa.sh` y `backup-production-db.sh` ahora **leen automáticamente** las credenciales del archivo `.env`.

---

## ✨ Ventajas

✅ **No necesitas pasar credenciales manualmente**
✅ **Misma configuración que tu aplicación**
✅ **Más seguro** (no exponer passwords en comandos)
✅ **Más fácil de usar**

---

## 📁 Configuración del .env

### Archivo .env para Producción

```bash
# .env (en el servidor de producción)

# Base de datos
POSTGRES_USER=rumirent_prod
POSTGRES_PASSWORD=tu_password_seguro
POSTGRES_DB=rumirent_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# O directamente con DATABASE_URL
DATABASE_URL="postgresql://rumirent_prod:password@localhost:5432/rumirent_db"
```

### Archivo .env para QA

```bash
# .env (en el servidor de QA)

# Base de datos
POSTGRES_USER=rumirent_qa
POSTGRES_PASSWORD=qa_password
POSTGRES_DB=rumirent_qa_db
POSTGRES_CONTAINER_NAME=rumirent-qa-db  # Nombre del contenedor Docker

# O directamente
DATABASE_URL="postgresql://rumirent_qa:password@localhost:5432/rumirent_qa_db"
```

---

## 🚀 Uso de los Scripts

### 1. Backup de Producción

**Antes (tedioso):**
```bash
DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db" ./backup-production-db.sh
```

**Ahora (simple):**
```bash
# Si tienes .env en el mismo directorio
./backup-production-db.sh

# O especificar otro archivo .env
DATABASE_URL_PRODUCTION="..." ./backup-production-db.sh
```

**El script automáticamente:**
1. Lee `.env` si existe
2. Extrae `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, etc.
3. Construye `DATABASE_URL_PRODUCTION` si no está definida
4. Ejecuta el backup

---

### 2. Restaurar en QA

**Antes (tedioso):**
```bash
QA_CONTAINER=rumirent-qa-db \
QA_USER=rumirent_qa \
QA_DATABASE=rumirent_qa_db \
./restore-to-qa.sh backup.sql
```

**Ahora (simple):**
```bash
# Si tienes .env en el mismo directorio
./restore-to-qa.sh backup.sql

# O especificar otro archivo .env
./restore-to-qa.sh backup.sql --env-file .env.qa

# Con restauración limpia (drop + create)
./restore-to-qa.sh backup.sql --fresh
```

**El script automáticamente:**
1. Lee `.env` si existe
2. Extrae `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_CONTAINER_NAME`
3. Usa esos valores para la restauración

---

## 🔄 Prioridad de Configuración

Los scripts siguen esta prioridad (de mayor a menor):

```
1. Parámetros de línea de comandos (--container, --user, etc.)
   ↓
2. Variables de entorno (QA_CONTAINER, QA_USER, etc.)
   ↓
3. Archivo .env (POSTGRES_USER, POSTGRES_DB, etc.)
   ↓
4. Valores por defecto (rumirent-qa-db, rumirent_qa, etc.)
```

### Ejemplo:

```bash
# .env contiene:
POSTGRES_USER=rumirent_qa
POSTGRES_DB=rumirent_qa_db

# Pero quieres usar otro usuario temporalmente:
./restore-to-qa.sh backup.sql --user postgres

# Resultado: Usa "postgres" (parámetro CLI tiene prioridad sobre .env)
```

---

## 📋 Ejemplos de Uso Completos

### Ejemplo 1: Producción Simple (con .env)

```bash
# En el servidor de producción

# 1. Asegurarte que .env existe y tiene credenciales
cat .env
# POSTGRES_USER=rumirent_prod
# POSTGRES_PASSWORD=password_seguro
# POSTGRES_DB=rumirent_db

# 2. Hacer backup (lee automáticamente del .env)
./backup-production-db.sh

# Resultado: backups/backup-rumirent-20251210-123456.sql
```

### Ejemplo 2: QA Simple (con .env)

```bash
# En el servidor de QA

# 1. Asegurarte que .env existe
cat .env
# POSTGRES_USER=rumirent_qa
# POSTGRES_DB=rumirent_qa_db
# POSTGRES_CONTAINER_NAME=rumirent-qa-db

# 2. Restaurar backup (lee automáticamente del .env)
./restore-to-qa.sh backup-prod.sql --fresh

# El script:
# - Lee usuario, DB, y contenedor del .env
# - Hace backup de QA actual automáticamente
# - Elimina y recrea la DB (--fresh)
# - Restaura el backup de producción
# - Verifica que todo está OK
```

### Ejemplo 3: Múltiples Entornos (.env.qa, .env.staging)

```bash
# Restaurar en QA
./restore-to-qa.sh backup.sql --env-file .env.qa

# Restaurar en Staging
./restore-to-qa.sh backup.sql --env-file .env.staging

# Cada archivo .env tiene sus propias credenciales
```

### Ejemplo 4: Override Manual (sin .env)

```bash
# Todavía puedes usar variables de entorno directamente
QA_CONTAINER=postgres-qa \
QA_USER=postgres \
QA_DATABASE=qa_db \
./restore-to-qa.sh backup.sql
```

---

## 🔐 Seguridad

### ✅ Buenas Prácticas

1. **Nunca commitear .env al repositorio**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.production
   .env.*.local
   ```

2. **Usar permisos restrictivos**
   ```bash
   chmod 600 .env  # Solo el propietario puede leer/escribir
   ```

3. **Usar .env.example como plantilla**
   ```bash
   cp .env.example .env
   # Editar .env con credenciales reales
   ```

4. **No mostrar passwords en logs**
   - Los scripts no muestran el contenido del .env
   - Solo confirman que se cargó

---

## 🧪 Verificar Configuración

### Ver qué valores se están usando:

```bash
# Opción 1: Dry run (agregar al script si lo necesitas)
# Los scripts muestran la configuración al inicio

# Opción 2: Ver variables de entorno cargadas
set | grep -E "POSTGRES_|QA_"

# Opción 3: Verificar .env sin ejecutar
cat .env | grep -v "^#" | grep -v "^$"
```

---

## 📖 Documentación de Opciones

### restore-to-qa.sh

```bash
./restore-to-qa.sh --help

Uso: ./restore-to-qa.sh <archivo-backup.sql> [opciones]

Opciones:
  -c, --container NAME    Nombre del contenedor Docker
  -u, --user USER         Usuario de PostgreSQL
  -d, --database DB       Nombre de la base de datos
  -e, --env-file FILE     Archivo .env a usar (default: .env)
  -f, --fresh             Eliminar y recrear la base de datos (limpia)
  -h, --help              Mostrar esta ayuda

Variables del .env usadas:
  POSTGRES_USER           → Usuario de PostgreSQL
  POSTGRES_DB             → Nombre de la base de datos
  POSTGRES_CONTAINER_NAME → Nombre del contenedor (opcional)
```

### backup-production-db.sh

```bash
./backup-production-db.sh

# Lee automáticamente de .env:
# - POSTGRES_USER
# - POSTGRES_PASSWORD
# - POSTGRES_HOST
# - POSTGRES_PORT
# - POSTGRES_DB

# O usa DATABASE_URL_PRODUCTION si está definida
```

---

## 🚨 Troubleshooting

### Error: "Archivo .env no encontrado"

**Causa:** El archivo `.env` no existe en el directorio actual.

**Solución:**
```bash
# Crear desde plantilla
cp .env.example .env

# Editar con tus credenciales
nano .env
```

### Error: "Variable DATABASE_URL_PRODUCTION no está definida"

**Causa:** El `.env` no tiene las variables necesarias.

**Solución:**
```bash
# Agregar al .env:
POSTGRES_USER=rumirent_prod
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=rumirent_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# O directamente:
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

### Error: "Contenedor no está corriendo"

**Causa:** `POSTGRES_CONTAINER_NAME` en `.env` no coincide con el nombre real.

**Solución:**
```bash
# Ver contenedores activos
docker ps | grep postgres

# Actualizar .env con el nombre correcto
POSTGRES_CONTAINER_NAME=nombre-real-del-contenedor
```

---

## 📊 Comparación Antes/Después

### Backup de Producción

| Antes | Después |
|-------|---------|
| `DATABASE_URL_PRODUCTION="postgresql://user:pass@host:5432/db" ./backup-production-db.sh` | `./backup-production-db.sh` |
| 102 caracteres | 25 caracteres |
| Password visible | Password en .env (seguro) |

### Restaurar en QA

| Antes | Después |
|-------|---------|
| `QA_CONTAINER=db QA_USER=user QA_DATABASE=db ./restore-to-qa.sh backup.sql` | `./restore-to-qa.sh backup.sql` |
| 75 caracteres | 31 caracteres |
| 3 variables manuales | 0 variables (lee del .env) |

---

## ✅ Checklist de Configuración

- [ ] Archivo `.env` existe en el directorio del proyecto
- [ ] `.env` contiene `POSTGRES_USER`
- [ ] `.env` contiene `POSTGRES_PASSWORD` (para backup)
- [ ] `.env` contiene `POSTGRES_DB`
- [ ] `.env` contiene `POSTGRES_HOST` (si no es localhost)
- [ ] `.env` contiene `POSTGRES_PORT` (si no es 5432)
- [ ] `.env` contiene `POSTGRES_CONTAINER_NAME` (para QA con Docker)
- [ ] Permisos del `.env` son restrictivos (`chmod 600`)
- [ ] `.env` está en `.gitignore`

---

**Fecha:** 2025-12-10
**Scripts actualizados:**
- [backup-production-db.sh](backup-production-db.sh)
- [restore-to-qa.sh](restore-to-qa.sh)

**Documentación relacionada:**
- [QA_RESTORE_GUIDE.md](QA_RESTORE_GUIDE.md)
- [BACKUP_TROUBLESHOOTING.md](BACKUP_TROUBLESHOOTING.md)
