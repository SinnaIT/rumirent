# 🚀 Quick Start - Deployment

Guía rápida para hacer deployment de Rumirent App a tu VPS.

## ⚡ Setup Rápido (15 minutos)

### 1. Configurar GitHub Secrets

Ve a tu repo: `Settings > Secrets and variables > Actions > New repository secret`

```
VPS_HOST         = 123.456.789.123
VPS_USERNAME     = deploy
VPS_SSH_KEY      = (pega tu llave privada SSH completa)
VPS_SSH_PORT     = 22
VPS_URL          = https://tudominio.com
```

### 2. Preparar VPS

```bash
# Conectarse al VPS
ssh root@TU_IP_VPS

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Crear directorio
sudo mkdir -p /opt/rumirent-app
sudo chown $USER:$USER /opt/rumirent-app
cd /opt/rumirent-app

# Generar llave SSH para GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# IMPORTANTE: Copiar la llave PRIVADA y agregarla a GitHub Secrets
cat ~/.ssh/github_actions
```

### 3. Copiar Archivos al VPS

**Opción A: Desde tu máquina local**

```bash
scp docker-compose.deploy.yml usuario@TU_IP_VPS:/opt/rumirent-app/
scp -r scripts usuario@TU_IP_VPS:/opt/rumirent-app/
```

**Opción B: Crear directamente en VPS**

```bash
# En el VPS
cd /opt/rumirent-app
nano docker-compose.deploy.yml
# Pegar contenido del archivo

# Opcional: scripts
mkdir scripts
nano scripts/deploy-vps.sh
# etc...
chmod +x scripts/*.sh
```

### 4. Crear Archivo .env

```bash
# En el VPS
nano /opt/rumirent-app/.env
```

Pegar este contenido (ajusta los valores):

```env
# Database
POSTGRES_USER=rumirent_prod
POSTGRES_PASSWORD=TU_PASSWORD_MUY_SEGURO_AQUI
POSTGRES_DB=rumirent_db
DATABASE_URL=postgresql://rumirent_prod:TU_PASSWORD_MUY_SEGURO_AQUI@db:5432/rumirent_db

# JWT
JWT_SECRET=TU_JWT_SECRET_MUY_LARGO_Y_ALEATORIO_AQUI
JWT_EXPIRES_IN=7d

# Next.js
NEXTAUTH_URL=https://tudominio.com
NEXT_TELEMETRY_DISABLED=1

# GitHub
GITHUB_REPOSITORY=tu-usuario/rumirent-app

# Environment
NODE_ENV=production
```

Proteger el archivo:

```bash
chmod 600 /opt/rumirent-app/.env
```

### 5. Login a GitHub Container Registry

```bash
# En el VPS

# 1. Generar Personal Access Token en GitHub:
#    Settings > Developer settings > Personal access tokens (classic)
#    Permisos: read:packages, write:packages

# 2. Login a GHCR
echo "TU_GITHUB_TOKEN" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin
```

### 6. Primer Deployment Manual

```bash
cd /opt/rumirent-app

# Pull de la imagen
docker pull ghcr.io/tu-usuario/rumirent-app:latest

# Levantar servicios
docker compose -f docker-compose.deploy.yml up -d

# Esperar 30 segundos
sleep 30

# Ejecutar migraciones
docker compose -f docker-compose.deploy.yml exec app sh -c "pnpm db:migrate:prod"

# Verificar
docker compose -f docker-compose.deploy.yml ps
curl http://localhost:3000/api/test
```

### 7. Configurar Firewall (Opcional pero Recomendado)

```bash
sudo ufw enable
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw status
```

## ✅ Verificación

```bash
# Estado de contenedores
docker compose -f docker-compose.deploy.yml ps

# Ver logs
docker compose -f docker-compose.deploy.yml logs -f app

# Health check
curl http://localhost:3000/api/test
```

## 🎯 Deploy Automático

Ahora simplemente haz push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

GitHub Actions automáticamente:
1. ✅ Ejecutará los tests
2. 🐳 Construirá la imagen Docker
3. 📦 La subirá a GHCR
4. 🚀 Hará deployment al VPS

## 📚 Documentación Completa

- [VPS_SETUP.md](./VPS_SETUP.md) - Setup detallado del servidor
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de deployment
- [TESTING.md](./TESTING.md) - Guía de testing

## 🆘 Problemas Comunes

### No puede conectar al VPS

```bash
# Verificar que la llave SSH está correcta en GitHub Secrets
# Verificar en VPS:
cat ~/.ssh/authorized_keys
```

### Imagen no encontrada

```bash
# Verificar login a GHCR
docker login ghcr.io

# Verificar que la imagen existe
docker pull ghcr.io/tu-usuario/rumirent-app:latest
```

### Migraciones fallan

```bash
# Ejecutar manualmente
docker compose -f docker-compose.deploy.yml exec app sh
pnpm db:generate
pnpm db:migrate:prod
```

## 📊 Comandos Útiles

```bash
# Ver logs
./scripts/logs.sh app

# Ver estado
./scripts/status.sh

# Deploy manual
./scripts/deploy-vps.sh

# Backup DB
./scripts/backup-db.sh

# Reiniciar
docker compose -f docker-compose.deploy.yml restart
```

---

**¡Listo!** Tu aplicación debería estar corriendo en tu VPS 🎉
