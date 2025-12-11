# 🐳 Uso de Scripts para Entornos Docker

## 🎯 Diferencia Clave

Los scripts originales asumían que el código estaba en una **carpeta del host** (`/opt/rumirent-app-qa/`).

Los nuevos scripts están diseñados para cuando el código está **dentro de contenedores Docker**.

---

## 📦 Scripts para Docker

| Script | Para | Ejecutar desde |
|--------|------|----------------|
| **fix-qa-migrations-docker.sh** | QA | Host (fuera del contenedor) |
| **apply-baseline-production-docker.sh** | Producción | Host (fuera del contenedor) |

---

## 🚀 Uso en QA

### Opción 1: Con nombres de contenedores por defecto

```bash
# Ejecutar desde el HOST (servidor QA)
./fix-qa-migrations-docker.sh
```

**Usa estos defaults:**
- DB Container: `rumirent-qa-db`
- APP Container: `rumirent-qa-app`
- DB User: `rumirent_qa`
- Database: `rumirent_qa_db`

### Opción 2: Con nombres de contenedores personalizados

```bash
./fix-qa-migrations-docker.sh <db-container> <app-container> <db-user> <db-name>

# Ejemplo:
./fix-qa-migrations-docker.sh postgres-qa rumirent-app-qa rumirent_qa rumirent_qa_db
```

### Paso a Paso Completo

```bash
# 1. Listar contenedores para verificar nombres
docker ps

# 2. Subir el script al servidor (si no está)
scp fix-qa-migrations-docker.sh usuario@servidor-qa:~/

# 3. En el servidor QA
chmod +x fix-qa-migrations-docker.sh

# 4. Ejecutar
./fix-qa-migrations-docker.sh

# El script:
# - Te pedirá confirmación (escribe 'SI')
# - Limpiará _prisma_migrations
# - Marcará baseline como aplicada DENTRO del contenedor
# - Te preguntará si quieres reiniciar el contenedor
```

---

## 🏭 Uso en Producción

### IMPORTANTE: Hacer Backup Primero

```bash
# 1. Crear backup de la base de datos
docker exec rumirent-prod-db pg_dump -U rumirent_prod rumirent_db > backup-prod-$(date +%Y%m%d-%H%M%S).sql

# 2. Verificar que el backup se creó
ls -lh backup-prod-*.sql
```

### Ejecutar Script

```bash
# 1. Dar permisos
chmod +x apply-baseline-production-docker.sh

# 2. Ejecutar
./apply-baseline-production-docker.sh

# El script te pedirá:
# - Nombre del archivo de backup (para verificar que existe)
# - Confirmación escribiendo 'SI EN PRODUCCION'
# - Si quieres reiniciar el contenedor automáticamente
```

### Con nombres personalizados

```bash
./apply-baseline-production-docker.sh <db-container> <app-container> <db-user> <db-name>

# Ejemplo:
./apply-baseline-production-docker.sh postgres-prod rumirent-app rumirent_prod rumirent_db
```

---

## 🔍 Cómo Funcionan los Scripts

Los scripts ejecutan comandos **DENTRO** de los contenedores usando `docker exec`:

```bash
# Ejemplo: Listar migraciones dentro del contenedor
docker exec rumirent-qa-app sh -c "ls -1 /app/prisma/migrations/"

# Ejemplo: Marcar migración como aplicada dentro del contenedor
docker exec rumirent-qa-app sh -c "cd /app && npx prisma migrate resolve --applied baseline..."

# Ejemplo: Limpiar tabla de migraciones en la DB
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "DELETE FROM _prisma_migrations;"
```

---

## 📋 Verificar Nombres de Contenedores

Antes de ejecutar los scripts, verifica los nombres reales de tus contenedores:

```bash
# Ver todos los contenedores corriendo
docker ps

# Formato más legible
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Buscar contenedores de PostgreSQL
docker ps | grep postgres

# Buscar contenedores de la app
docker ps | grep rumirent
```

**Ejemplo de salida:**
```
NAMES               IMAGE                    STATUS
rumirent-qa-db      postgres:16-alpine       Up 2 hours
rumirent-qa-app     rumirent:qa             Up 2 hours
```

Usa esos nombres exactos en el script.

---

## 🛠️ Comandos Manuales (Sin Script)

Si prefieres hacerlo manualmente:

### Para QA:

```bash
# 1. Limpiar migraciones
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "DELETE FROM _prisma_migrations;"

# 2. Marcar baseline como aplicada (dentro del contenedor)
docker exec rumirent-qa-app sh -c "cd /app && npx prisma migrate resolve --applied 20251210075009_baseline_production_ready"

# 3. Generar Prisma Client (dentro del contenedor)
docker exec rumirent-qa-app sh -c "cd /app && npx prisma generate"

# 4. Verificar estado (dentro del contenedor)
docker exec rumirent-qa-app sh -c "cd /app && npx prisma migrate status"

# 5. Reiniciar aplicación
docker restart rumirent-qa-app

# 6. Ver logs
docker logs -f rumirent-qa-app
```

### Para Producción:

Igual que QA pero con los nombres de contenedores de producción y **siempre con backup primero**.

---

## 🔧 Troubleshooting

### Error: "No such file or directory: /app/prisma/migrations"

**Causa:** La ruta dentro del contenedor es diferente.

**Solución:** Verificar la ruta real:

```bash
# Ver dónde está el código en el contenedor
docker exec rumirent-qa-app sh -c "pwd"

# Listar archivos
docker exec rumirent-qa-app sh -c "ls -la"

# Buscar prisma
docker exec rumirent-qa-app sh -c "find / -name 'prisma' -type d 2>/dev/null"
```

Si está en otra ubicación (ej: `/usr/src/app/prisma`), ajusta el script o usa comandos manuales con la ruta correcta.

### Error: "Container not found"

**Causa:** El nombre del contenedor no coincide.

**Solución:**

```bash
# Ver nombres exactos
docker ps --format "{{.Names}}"

# Ejecutar con el nombre correcto
./fix-qa-migrations-docker.sh nombre-real-db nombre-real-app
```

### Error: "FATAL: role does not exist"

**Causa:** El usuario de PostgreSQL no coincide.

**Solución:**

```bash
# Ver usuarios de PostgreSQL
docker exec rumirent-qa-db psql -U postgres -d postgres -c "\du"

# Ejecutar con el usuario correcto
./fix-qa-migrations-docker.sh rumirent-qa-db rumirent-qa-app usuario-correcto
```

### Error: "npx: command not found"

**Causa:** Node.js no está instalado en el contenedor o npx no está en el PATH.

**Solución:**

```bash
# Verificar que Node.js está instalado
docker exec rumirent-qa-app sh -c "node --version"

# Probar con ruta absoluta a npx
docker exec rumirent-qa-app sh -c "which npx"

# O usar node_modules directamente
docker exec rumirent-qa-app sh -c "cd /app && ./node_modules/.bin/prisma migrate resolve --applied baseline..."
```

---

## 📊 Comparación: Scripts Normales vs Docker

| Aspecto | Scripts Normales | Scripts Docker |
|---------|------------------|----------------|
| **Código ubicado en** | Carpeta del host (`/opt/...`) | Contenedor Docker |
| **Ejecutar comandos** | Directamente en el host | Con `docker exec` |
| **Prisma CLI** | En el host | Dentro del contenedor |
| **Backup de DB** | Desde el host | Con `docker exec` |
| **Complejidad** | Menor | Mayor (necesita Docker) |

---

## ✅ Checklist Pre-Ejecución

### Para QA:

- [ ] Verificar que los contenedores están corriendo (`docker ps`)
- [ ] Confirmar nombres de contenedores
- [ ] Tener permisos para ejecutar `docker exec`
- [ ] Script tiene permisos de ejecución (`chmod +x`)

### Para Producción:

- [ ] **BACKUP COMPLETO creado y verificado**
- [ ] Verificar que los contenedores están corriendo
- [ ] Confirmar nombres de contenedores
- [ ] Ventana de mantenimiento programada (opcional)
- [ ] Plan de rollback documentado
- [ ] Script tiene permisos de ejecución

---

## 🎯 Flujo Completo Recomendado

### 1. Probar en QA

```bash
# En servidor QA
docker ps  # Verificar contenedores
./fix-qa-migrations-docker.sh  # Ejecutar script
docker logs -f rumirent-qa-app  # Verificar logs
curl http://localhost:3000/api/health  # Probar app
```

### 2. Si QA funciona, aplicar en Producción

```bash
# En servidor producción
docker exec rumirent-prod-db pg_dump -U rumirent_prod rumirent_db > backup-prod.sql
ls -lh backup-prod.sql  # Verificar backup
./apply-baseline-production-docker.sh  # Ejecutar script
docker logs -f rumirent-prod-app  # Monitorear
curl https://tudominio.com/api/health  # Verificar
```

---

**Creado:** 2025-12-10
**Scripts para Docker:**
- [fix-qa-migrations-docker.sh](fix-qa-migrations-docker.sh)
- [apply-baseline-production-docker.sh](apply-baseline-production-docker.sh)

**Scripts originales (para código en carpetas):**
- [fix-qa-migrations-baseline.sh](fix-qa-migrations-baseline.sh)
- [apply-baseline-production.sh](apply-baseline-production.sh)
