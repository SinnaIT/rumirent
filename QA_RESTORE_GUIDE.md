# 🔄 Guía de Restauración a QA

## Uso Rápido

### Opción 1: Usar el Script Automatizado (Recomendado)

```bash
# 1. Dar permisos
chmod +x restore-to-qa.sh

# 2. Restaurar (el script hace backup de QA automáticamente)
./restore-to-qa.sh backup-rumirent-20251209.sql

# 3. Restauración limpia (elimina y recrea la DB)
./restore-to-qa.sh backup-rumirent-20251209.sql --fresh
```

### Opción 2: Comandos Manuales

```bash
# Paso 1: Identificar contenedor
docker ps | grep postgres

# Paso 2: Restaurar
docker exec -i rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db < backup-rumirent-20251209.sql

# Paso 3: Verificar
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "\dt"
```

---

## 📋 Configuración del Script

### Variables de Entorno (Opcionales)

```bash
# Ajustar según tu configuración
export QA_CONTAINER="rumirent-qa-db"        # Nombre del contenedor
export QA_USER="rumirent_qa"                # Usuario de PostgreSQL
export QA_DATABASE="rumirent_qa_db"         # Nombre de la base de datos

# Luego ejecutar
./restore-to-qa.sh backup.sql
```

### Parámetros de Línea de Comandos

```bash
# Especificar contenedor
./restore-to-qa.sh backup.sql --container mi-contenedor-db

# Especificar usuario
./restore-to-qa.sh backup.sql --user postgres

# Especificar base de datos
./restore-to-qa.sh backup.sql --database otra_db

# Restauración limpia (DROP + CREATE DATABASE)
./restore-to-qa.sh backup.sql --fresh

# Combinación
./restore-to-qa.sh backup.sql --container postgres-qa --user postgres --fresh
```

---

## 🔍 Encontrar Información de tu Contenedor Docker

### 1. Nombre del Contenedor

```bash
# Listar contenedores activos
docker ps

# Buscar contenedor de PostgreSQL
docker ps | grep postgres

# Ver todos los detalles
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
```

### 2. Usuario de PostgreSQL

Depende de cómo configuraste el contenedor. Opciones comunes:

```bash
# Opción 1: Ver variables de entorno del contenedor
docker inspect rumirent-qa-db | grep -i postgres_user

# Opción 2: Revisar docker-compose.yml
cat docker-compose.yml | grep -A 5 postgres

# Opción 3: Intentar con usuario por defecto
# Usuario común: postgres, rumirent_qa, admin
```

### 3. Nombre de la Base de Datos

```bash
# Listar bases de datos en el contenedor
docker exec -it rumirent-qa-db psql -U postgres -c "\l"

# O con el usuario que tengas
docker exec -it rumirent-qa-db psql -U rumirent_qa -c "\l"
```

---

## 🚨 Solución de Problemas

### Error: "Contenedor no está corriendo"

```bash
# Ver contenedores detenidos
docker ps -a | grep postgres

# Iniciar contenedor
docker start rumirent-qa-db

# Ver logs si no inicia
docker logs rumirent-qa-db
```

### Error: "FATAL: password authentication failed"

```bash
# Opción 1: Usar el usuario correcto (ver docker-compose.yml)

# Opción 2: Si no sabes la contraseña, recrear contenedor con nueva contraseña
docker run --name rumirent-qa-db \
  -e POSTGRES_PASSWORD=nueva_password \
  -e POSTGRES_USER=rumirent_qa \
  -e POSTGRES_DB=rumirent_qa_db \
  -p 5433:5432 \
  -d postgres:14
```

### Error: "database does not exist"

```bash
# Crear la base de datos primero
docker exec -i rumirent-qa-db psql -U postgres <<EOF
CREATE DATABASE rumirent_qa_db;
EOF

# Luego restaurar
./restore-to-qa.sh backup.sql
```

### Error: Conflictos durante la restauración

```bash
# Usar restauración limpia (elimina todo primero)
./restore-to-qa.sh backup.sql --fresh

# O manualmente:
docker exec -i rumirent-qa-db psql -U postgres <<EOF
DROP DATABASE IF EXISTS rumirent_qa_db;
CREATE DATABASE rumirent_qa_db;
EOF

docker exec -i rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db < backup.sql
```

---

## 📊 Verificaciones Post-Restauración

### 1. Verificar Tablas

```bash
# Listar tablas
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "\dt"

# Ver estructura de una tabla
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "\d+ users"
```

### 2. Verificar Datos

```bash
# Contar registros
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db <<'SQL'
SELECT
  'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'edificios', COUNT(*) FROM edificios
UNION ALL
SELECT 'leads', COUNT(*) FROM leads;
SQL

# Ver algunos registros
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT id, email, role FROM users LIMIT 5;"
```

### 3. Verificar Enums

```bash
# Verificar que el enum EstadoLead tiene ENTREGADO y CANCELADO
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db <<'SQL'
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EstadoLead')
ORDER BY enumlabel;
SQL
```

### 4. Verificar Constraints

```bash
# Verificar constraint unique en telefono
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db <<'SQL'
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'clientes'::regclass
  AND conname LIKE '%telefono%';
SQL
```

---

## 🔧 Conectar la Aplicación a QA

### 1. Actualizar .env de QA

```bash
# En el servidor/contenedor de la aplicación QA
DATABASE_URL="postgresql://rumirent_qa:password@rumirent-qa-db:5432/rumirent_qa_db"
```

### 2. Regenerar Cliente Prisma

```bash
# En el servidor de la aplicación
npx prisma generate

# Verificar que el schema coincide
npx prisma migrate status
```

### 3. Reiniciar la Aplicación

```bash
# Si usas PM2
pm2 restart rumirent-qa

# Si usas Docker
docker restart rumirent-qa-app

# Si usas systemd
sudo systemctl restart rumirent-qa
```

---

## ✅ Checklist de Restauración

- [ ] Backup de producción descargado
- [ ] Contenedor de QA identificado y corriendo
- [ ] Backup de QA actual creado (por seguridad)
- [ ] Restauración ejecutada sin errores
- [ ] Tablas verificadas (conteo correcto)
- [ ] Datos verificados (sample queries exitosas)
- [ ] Variables de entorno actualizadas
- [ ] Cliente Prisma regenerado
- [ ] Aplicación reiniciada
- [ ] Pruebas básicas ejecutadas (login, CRUD)

---

## 🎯 Flujo Completo Recomendado

```bash
# 1. Obtener backup de producción
./backup-production-db.sh

# 2. Verificar que el backup es válido
head -n 20 backups/backup-rumirent-*.sql
wc -l backups/backup-rumirent-*.sql

# 3. Restaurar en QA (con backup de seguridad automático)
./restore-to-qa.sh backups/backup-rumirent-*.sql --fresh

# 4. Verificar restauración
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "SELECT COUNT(*) FROM users;"

# 5. Regenerar Prisma Client en app de QA
npx prisma generate

# 6. Reiniciar app de QA
pm2 restart rumirent-qa

# 7. Probar funcionalidades críticas
curl http://qa.tudominio.com/api/health
```

---

## 📞 Ayuda Adicional

### Ver logs del contenedor de DB

```bash
docker logs rumirent-qa-db --tail 50 -f
```

### Acceder al shell del contenedor

```bash
docker exec -it rumirent-qa-db bash
```

### Acceder a psql interactivo

```bash
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db
```

### Eliminar y recrear contenedor (último recurso)

```bash
# Hacer backup primero!
docker exec -t rumirent-qa-db pg_dump -U rumirent_qa rumirent_qa_db > backup-before-recreate.sql

# Detener y eliminar contenedor
docker stop rumirent-qa-db
docker rm rumirent-qa-db

# Crear nuevo contenedor
docker run --name rumirent-qa-db \
  -e POSTGRES_PASSWORD=tu_password \
  -e POSTGRES_USER=rumirent_qa \
  -e POSTGRES_DB=rumirent_qa_db \
  -p 5433:5432 \
  -v rumirent_qa_data:/var/lib/postgresql/data \
  -d postgres:14

# Restaurar datos
docker exec -i rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db < backup-before-recreate.sql
```

---

**Documentación generada:** 2025-12-09
**Complementa:** [BACKUP_TROUBLESHOOTING.md](BACKUP_TROUBLESHOOTING.md), [README_MIGRACION.md](README_MIGRACION.md)
