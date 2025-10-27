# Guía de Deployment - Rumirent App

Esta guía resume todo el proceso de deployment automático con Docker, GitHub Actions y GHCR.

## 📋 Tabla de Contenidos

1. [Arquitectura de Deployment](#arquitectura-de-deployment)
2. [Flujo de CI/CD](#flujo-de-cicd)
3. [Configuración Inicial](#configuración-inicial)
4. [Comandos Útiles](#comandos-útiles)
5. [Troubleshooting](#troubleshooting)

## 🏗️ Arquitectura de Deployment

```
┌─────────────────┐
│   GitHub Repo   │
│   (push/PR)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  - Run Tests    │
│  - Build Docker │
│  - Push to GHCR │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│      GHCR       │─────▶│  VPS Server  │
│ (Image Registry)│      │   - Docker   │
└─────────────────┘      │   - Postgres │
                         └──────────────┘
```

## 🔄 Flujo de CI/CD

### Proceso Automático

1. **Developer hace push a `main`**
   ```bash
   git push origin main
   ```

2. **GitHub Actions se activa automáticamente**:
   - ✅ **Job 1: Tests** (~2-3 min)
     - Instala dependencias
     - Levanta PostgreSQL de test
     - Ejecuta migraciones
     - Corre 70 tests unitarios e integración

   - 🐳 **Job 2: Build & Push** (~5-7 min)
     - Construye imagen Docker optimizada
     - Pushea a GitHub Container Registry (GHCR)
     - Cachea layers para builds más rápidos

   - 🚀 **Job 3: Deploy** (~2-3 min)
     - Se conecta al VPS via SSH
     - Pull de la nueva imagen
     - Reinicia contenedores
     - Ejecuta migraciones de producción
     - Verifica health check

3. **Aplicación actualizada** en ~10-15 minutos total

### Proceso Manual (si es necesario)

En el VPS:

```bash
cd /opt/rumirent-app
./scripts/deploy-vps.sh
```

## ⚙️ Configuración Inicial

### 1. Requisitos Previos

- ✅ Servidor VPS con Ubuntu 22.04+
- ✅ Docker y Docker Compose instalados
- ✅ Dominio apuntando al servidor (opcional)
- ✅ Cuenta GitHub con permisos de admin en el repo

### 2. Setup del VPS

Sigue la guía detallada: [VPS_SETUP.md](./VPS_SETUP.md)

**Resumen rápido**:

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Crear directorio
sudo mkdir -p /opt/rumirent-app
cd /opt/rumirent-app

# 3. Copiar archivos
# - docker-compose.deploy.yml
# - .env (con variables de entorno)
# - scripts/ (opcional)

# 4. Login a GHCR
echo "TU_GITHUB_TOKEN" | docker login ghcr.io -u TU_USUARIO --password-stdin

# 5. Primer deployment
docker compose -f docker-compose.deploy.yml up -d
```

### 3. Configurar GitHub Secrets

En tu repositorio: `Settings > Secrets and variables > Actions`

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `VPS_HOST` | IP del servidor | `123.456.789.123` |
| `VPS_USERNAME` | Usuario SSH | `deploy` |
| `VPS_SSH_KEY` | Llave privada SSH | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `VPS_SSH_PORT` | Puerto SSH | `22` |
| `VPS_URL` | URL de la app | `https://tudominio.com` |

### 4. Variables de Entorno en VPS

Archivo `/opt/rumirent-app/.env`:

```env
# Database
POSTGRES_USER=rumirent_prod
POSTGRES_PASSWORD=tu_password_super_seguro
POSTGRES_DB=rumirent_db
DATABASE_URL=postgresql://rumirent_prod:tu_password@db:5432/rumirent_db

# JWT
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro
JWT_EXPIRES_IN=7d

# Next.js
NEXTAUTH_URL=https://tudominio.com

# GitHub (para docker-compose)
GITHUB_REPOSITORY=tu-usuario/rumirent-app
```

## 🛠️ Comandos Útiles

### En tu Máquina Local

```bash
# Build y test local
pnpm install
pnpm test:run
pnpm build

# Build Docker local
docker build -t rumirent-app .

# Run local con Docker
docker compose -f docker-compose.prod.yml up
```

### En el VPS

#### Scripts Automatizados

```bash
cd /opt/rumirent-app

# 🚀 Deploy manual
./scripts/deploy-vps.sh

# 📊 Ver estado
./scripts/status.sh

# 📋 Ver logs
./scripts/logs.sh          # Todos los servicios
./scripts/logs.sh app      # Solo app
./scripts/logs.sh db       # Solo database

# 💾 Backup de base de datos
./scripts/backup-db.sh

# 🔄 Restaurar backup
./scripts/restore-db.sh /path/to/backup.sql.gz
```

#### Comandos Docker Compose

```bash
cd /opt/rumirent-app

# Ver estado
docker compose -f docker-compose.deploy.yml ps

# Ver logs
docker compose -f docker-compose.deploy.yml logs -f
docker compose -f docker-compose.deploy.yml logs -f app
docker compose -f docker-compose.deploy.yml logs -f db

# Reiniciar servicios
docker compose -f docker-compose.deploy.yml restart
docker compose -f docker-compose.deploy.yml restart app

# Detener todo
docker compose -f docker-compose.deploy.yml down

# Iniciar todo
docker compose -f docker-compose.deploy.yml up -d

# Ver recursos
docker stats

# Limpiar imágenes antiguas
docker image prune -a
```

#### Comandos Prisma

```bash
# Ejecutar migraciones (método actualizado - Octubre 2025)
docker compose -f docker-compose.deploy.yml exec -T app npx prisma migrate deploy

# Verificar estado de migraciones
docker compose -f docker-compose.deploy.yml exec app npx prisma migrate status

# Generar Prisma Client
docker compose -f docker-compose.deploy.yml exec app npx prisma generate

# Ver migraciones disponibles
docker compose -f docker-compose.deploy.yml exec app ls -la prisma/migrations/

# Abrir shell en contenedor
docker compose -f docker-compose.deploy.yml exec app sh

# Ver estado de base de datos
docker compose -f docker-compose.deploy.yml exec db psql -U rumirent_prod -d rumirent_db
```

## 🔍 Monitoring

### Health Checks

La aplicación incluye health checks automáticos:

```bash
# Desde el VPS
curl http://localhost:3000/api/test

# Desde exterior (si tienes dominio)
curl https://tudominio.com/api/test
```

### Logs en Tiempo Real

```bash
# Ver logs de aplicación
docker compose -f docker-compose.deploy.yml logs -f app

# Ver errores solamente
docker compose -f docker-compose.deploy.yml logs -f app | grep -i error

# Ver últimas 100 líneas
docker compose -f docker-compose.deploy.yml logs --tail=100 app
```

### Métricas de Recursos

```bash
# Ver uso de CPU y memoria
docker stats

# Ver uso de disco
df -h

# Ver tamaño de base de datos
docker compose -f docker-compose.deploy.yml exec db \
  psql -U rumirent_prod -d rumirent_db -c \
  "SELECT pg_size_pretty(pg_database_size('rumirent_db'));"
```

## 🆘 Troubleshooting

### Problema: GitHub Actions falla en el build

**Síntomas**: Error al construir imagen Docker

**Soluciones**:
```bash
# 1. Verificar que Dockerfile es válido
docker build -t test-build .

# 2. Verificar que next.config.ts tiene output: 'standalone'
cat next.config.ts | grep standalone

# 3. Check GitHub Actions logs en el tab "Actions"
```

### Problema: Deployment falla en VPS

**Síntomas**: No puede conectar via SSH

**Soluciones**:
```bash
# 1. Verificar que la llave SSH es correcta
# En VPS:
cat ~/.ssh/authorized_keys

# 2. Verificar logs de SSH
sudo tail -f /var/log/auth.log

# 3. Verificar que el puerto SSH está abierto
sudo ufw status
```

### Problema: Contenedores no inician

**Síntomas**: `docker compose ps` muestra contenedores detenidos

**Soluciones**:
```bash
# 1. Ver logs de error
docker compose -f docker-compose.deploy.yml logs

# 2. Verificar variables de entorno
cat .env

# 3. Intentar iniciar manualmente con logs visibles
docker compose -f docker-compose.deploy.yml up

# 4. Verificar que la imagen existe
docker images | grep rumirent
```

### Problema: Base de datos no conecta

**Síntomas**: Error "could not connect to server"

**Soluciones**:
```bash
# 1. Verificar que DB está corriendo
docker compose -f docker-compose.deploy.yml ps db

# 2. Ver logs de DB
docker compose -f docker-compose.deploy.yml logs db

# 3. Verificar DATABASE_URL en .env
cat .env | grep DATABASE_URL

# 4. Conectar manualmente a DB
docker compose -f docker-compose.deploy.yml exec db \
  psql -U rumirent_prod -d rumirent_db

# 5. Reiniciar servicios en orden
docker compose -f docker-compose.deploy.yml restart db
sleep 10
docker compose -f docker-compose.deploy.yml restart app
```

### Problema: Migraciones fallan o no se aplican

**Síntomas**:
- Error "Migration file not found"
- Las migraciones no se aplican después del build
- Base de datos desactualizada después del deployment

**Causa Principal**:
La carpeta `prisma/migrations/` no estaba siendo copiada correctamente a la imagen Docker final.

**✅ Solución Aplicada (Octubre 2025)**:
El `Dockerfile` fue actualizado para copiar explícitamente toda la carpeta prisma:
```dockerfile
# En el stage final (runner)
COPY --chown=nextjs:nodejs prisma ./prisma
```

Además, el script `scripts/deploy-vps.sh` fue mejorado para usar `npx` directamente:
```bash
docker compose -f docker-compose.deploy.yml exec -T app npx prisma migrate deploy
```

**Verificación**:
```bash
# 1. Verificar que las migraciones están en la imagen
docker compose -f docker-compose.deploy.yml exec app ls -la prisma/migrations/

# 2. Verificar estado de migraciones
docker compose -f docker-compose.deploy.yml exec app npx prisma migrate status

# 3. Ver logs detallados
docker compose -f docker-compose.deploy.yml logs app | grep -i prisma
```

**Si todavía fallan las migraciones**:
```bash
# 1. Entrar al contenedor y ejecutar manualmente
docker compose -f docker-compose.deploy.yml exec app sh
npx prisma migrate status
npx prisma migrate deploy

# 2. Verificar schema
cat prisma/schema.prisma

# 3. Si es necesario regenerar Prisma Client
npx prisma generate

# 4. Reset de base de datos (⚠️ CUIDADO: borra datos)
docker compose -f docker-compose.deploy.yml exec db \
  psql -U rumirent_prod -d postgres -c "DROP DATABASE rumirent_db;"
docker compose -f docker-compose.deploy.yml exec db \
  psql -U rumirent_prod -d postgres -c "CREATE DATABASE rumirent_db;"
docker compose -f docker-compose.deploy.yml exec app npx prisma migrate deploy
```

### Problema: Aplicación lenta

**Síntomas**: Respuestas lentas, timeouts

**Soluciones**:
```bash
# 1. Verificar recursos
docker stats

# 2. Verificar logs por errores
docker compose -f docker-compose.deploy.yml logs app | grep -i error

# 3. Ver queries lentas en DB
docker compose -f docker-compose.deploy.yml exec db \
  psql -U rumirent_prod -d rumirent_db -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';"

# 4. Reiniciar aplicación
docker compose -f docker-compose.deploy.yml restart app
```

## 📊 Backups

### Backup Automático

Configurar cron job en VPS:

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /opt/rumirent-app/scripts/backup-db.sh >> /opt/rumirent-app/backups/backup.log 2>&1
```

### Backup Manual

```bash
cd /opt/rumirent-app
./scripts/backup-db.sh
```

### Restaurar Backup

```bash
cd /opt/rumirent-app
./scripts/restore-db.sh /path/to/backup_20250102_140000.sql.gz
```

## 🔐 Seguridad

### Checklist de Seguridad

- [ ] Variables de entorno en `.env` (no en código)
- [ ] `.env` con permisos `600` (solo owner puede leer)
- [ ] Passwords fuertes (>16 caracteres, aleatorios)
- [ ] JWT_SECRET seguro y único
- [ ] SSH con llaves (no passwords)
- [ ] Firewall configurado (solo puertos necesarios)
- [ ] SSL/HTTPS configurado
- [ ] Backups automáticos configurados
- [ ] Docker images actualizadas regularmente

### Actualizar Secretos

Si necesitas cambiar algún secreto:

```bash
# 1. Actualizar .env en VPS
nano /opt/rumirent-app/.env

# 2. Reiniciar servicios
docker compose -f docker-compose.deploy.yml restart

# 3. Si cambias GitHub Secrets:
#    - Ve a Settings > Secrets > Actions
#    - Edita el secret correspondiente
#    - Re-ejecuta el último workflow
```

## 📚 Recursos Adicionales

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🎯 Checklist de Deployment

### Pre-Deployment

- [ ] Tests pasando localmente (`pnpm test:run`)
- [ ] Build exitoso localmente (`pnpm build`)
- [ ] Migraciones creadas si hay cambios en DB
- [ ] Variables de entorno actualizadas si es necesario
- [ ] Documentación actualizada

### Durante Deployment

- [ ] GitHub Actions workflow completa exitosamente
- [ ] Tests CI/CD pasan
- [ ] Imagen Docker se construye correctamente
- [ ] Push a GHCR exitoso
- [ ] SSH a VPS conecta
- [ ] Pull de imagen exitoso
- [ ] Contenedores inician correctamente

### Post-Deployment

- [ ] Health check pasa
- [ ] Migraciones se ejecutaron
- [ ] Logs no muestran errores
- [ ] Aplicación responde correctamente
- [ ] Funcionalidades principales funcionan
- [ ] Performance es aceptable

---

**¿Necesitas ayuda?** Revisa los logs o contacta al equipo de desarrollo.

**Última actualización**: 2025-10-02
