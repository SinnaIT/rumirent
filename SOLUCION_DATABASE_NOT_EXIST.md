# 🔧 Solución: "database does not exist" en QA

## ❌ Error Detectado

```
FATAL: database "rumirent_qa_db" does not exist
```

Este error ocurre cuando el contenedor Docker de PostgreSQL se inicia pero la base de datos no ha sido creada.

---

## 🚀 Solución Rápida (Automática)

### Opción 1: Usar el Script (Recomendado)

```bash
# 1. Subir el script al servidor
scp fix-qa-database.sh usuario@servidor:/opt/rumirent-app-qa/

# 2. En el servidor, ejecutar
cd /opt/rumirent-app-qa
chmod +x fix-qa-database.sh
./fix-qa-database.sh
```

**El script automáticamente:**
- ✅ Verifica que el contenedor está corriendo
- ✅ Crea la base de datos si no existe
- ✅ Aplica las migraciones
- ✅ Genera el Prisma Client
- ✅ Verifica que todo está OK

---

## 🛠️ Solución Manual (Paso a Paso)

Si prefieres hacerlo manualmente:

### Paso 1: Verificar que el contenedor está corriendo

```bash
docker ps | grep rumirent-qa-db
```

### Paso 2: Crear la base de datos

```bash
# Conectarse al contenedor y crear la DB
docker exec -it rumirent-qa-db psql -U rumirent_qa -d postgres -c "CREATE DATABASE rumirent_qa_db;"

# O con usuario postgres si el anterior falla
docker exec -it rumirent-qa-db psql -U postgres -d postgres -c "CREATE DATABASE rumirent_qa_db;"
```

### Paso 3: Verificar que la DB se creó

```bash
docker exec -it rumirent-qa-db psql -U rumirent_qa -d postgres -c "\l"
```

Deberías ver `rumirent_qa_db` en la lista.

### Paso 4: Aplicar migraciones

```bash
# En el directorio de la aplicación
cd /opt/rumirent-app-qa

# Aplicar migraciones
npx prisma migrate deploy
```

### Paso 5: Generar Prisma Client

```bash
npx prisma generate
```

### Paso 6: Reiniciar la aplicación

```bash
# Opción A: Con docker-compose
docker-compose restart rumirent-qa-app

# Opción B: Con docker
docker restart rumirent-qa-app
```

### Paso 7: Verificar logs

```bash
docker logs rumirent-qa-app --tail 50
```

No deberías ver más el error "database does not exist".

---

## 🔍 Diagnóstico Adicional

Si el problema persiste, ejecuta estos comandos para diagnosticar:

```bash
# 1. Ver logs del contenedor de DB
docker logs rumirent-qa-db --tail 50

# 2. Ver logs de la app
docker logs rumirent-qa-app --tail 50

# 3. Verificar variables de entorno
docker exec rumirent-qa-app env | grep DATABASE

# 4. Verificar que la DB existe
docker exec rumirent-qa-db psql -U rumirent_qa -d postgres -c "\l"

# 5. Verificar conexión desde la app
docker exec rumirent-qa-app npx prisma db execute --stdin <<< "SELECT 1;"
```

---

## 🎯 Causa Raíz del Problema

Este error ocurre por una de estas razones:

### 1. **Contenedor recreado sin volumen persistente**

Si el contenedor de PostgreSQL se elimina y recrea sin un volumen Docker persistente, los datos se pierden.

**Solución:** Configurar volúmenes en `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ← Importante

volumes:
  postgres_data:  # ← Volumen persistente
```

### 2. **Backup restaurado incorrectamente**

Si restauraste un backup pero luego el contenedor se reinició, la DB puede no haberse persistido.

**Solución:** Siempre usar volúmenes persistentes y verificar después de restaurar.

### 3. **Primera vez que se levanta el entorno**

Es normal en la primera ejecución que la DB no exista.

**Solución:** Ejecutar el script `fix-qa-database.sh` la primera vez.

---

## 📋 Prevención Futura

Para evitar este problema en el futuro:

### 1. Asegurarse que docker-compose.yml tiene volúmenes

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
    driver: local
```

### 2. Usar script de inicialización

Crear un script `init-db.sh` que se ejecute automáticamente:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
```

### 3. Ejecutar migraciones al inicio de la app

Agregar en el `Dockerfile` o script de inicio:

```dockerfile
# Dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

O en un script separado:

```bash
#!/bin/bash
# start.sh

echo "Aplicando migraciones..."
npx prisma migrate deploy

echo "Generando Prisma Client..."
npx prisma generate

echo "Iniciando aplicación..."
npm start
```

---

## 🚨 Troubleshooting Adicional

### Error: "role does not exist"

```bash
# Crear el usuario si no existe
docker exec -it rumirent-qa-db psql -U postgres -d postgres <<SQL
CREATE USER rumirent_qa WITH PASSWORD 'tu_password';
ALTER USER rumirent_qa CREATEDB;
SQL
```

### Error: "permission denied to create database"

```bash
# Dar permisos al usuario
docker exec -it rumirent-qa-db psql -U postgres -d postgres <<SQL
ALTER USER rumirent_qa CREATEDB;
SQL
```

### Error: "Prisma migrate deploy failed"

```bash
# Limpiar tabla de migraciones y reintentar
docker exec -it rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "DELETE FROM _prisma_migrations;"

# Marcar baseline como aplicada
npx prisma migrate resolve --applied 20251210075009_baseline_production_ready

# Verificar
npx prisma migrate status
```

---

## ✅ Verificación Final

Después de aplicar la solución, verifica que todo funciona:

```bash
# 1. DB existe
docker exec rumirent-qa-db psql -U rumirent_qa -d postgres -c "\l" | grep rumirent_qa_db

# 2. Tablas creadas
docker exec rumirent-qa-db psql -U rumirent_qa -d rumirent_qa_db -c "\dt"

# 3. Migraciones aplicadas
npx prisma migrate status

# 4. App corriendo sin errores
docker logs rumirent-qa-app --tail 20

# 5. Health check
curl http://localhost:3000/api/health
```

---

## 📞 Comandos de Referencia Rápida

```bash
# Crear DB
docker exec -it rumirent-qa-db psql -U rumirent_qa -d postgres -c "CREATE DATABASE rumirent_qa_db;"

# Aplicar migraciones
npx prisma migrate deploy

# Generar cliente
npx prisma generate

# Reiniciar app
docker restart rumirent-qa-app

# Ver logs
docker logs -f rumirent-qa-app
```

---

**Creado:** 2025-12-10
**Script relacionado:** [fix-qa-database.sh](fix-qa-database.sh)
**Para más ayuda:** Ver [QA_RESTORE_GUIDE.md](QA_RESTORE_GUIDE.md)
