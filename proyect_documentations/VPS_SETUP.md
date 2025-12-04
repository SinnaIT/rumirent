# Guía de Configuración del Servidor VPS para Rumirent

Esta guía te ayudará a configurar tu servidor VPS para recibir deployments automáticos desde GitHub Actions usando Docker y GHCR (GitHub Container Registry).

> **⚠️ NOTA IMPORTANTE:** Si necesitas configurar múltiples ambientes (QA y PRODUCTION) en el mismo VPS, consulta la guía completa: **[VPS_DUAL_ENV_SETUP.md](./VPS_DUAL_ENV_SETUP.md)**

## 📚 Documentación Disponible

- **Este documento (VPS_SETUP.md)**: Configuración básica de un solo ambiente
- **[VPS_DUAL_ENV_SETUP.md](./VPS_DUAL_ENV_SETUP.md)**: Configuración avanzada con:
  - QA environment en `demo.rumirent.com` (puerto 3001)
  - PROD environment en `desk.rumirent.com` (puerto 3000)
  - Nginx como reverse proxy
  - SSL/HTTPS con Let's Encrypt
  - Bases de datos separadas
  - Scripts de deployment independientes

## 📋 Requisitos Previos

- Un servidor VPS con Ubuntu 22.04 LTS o superior
- Acceso root o sudo
- Dominio apuntando al servidor (opcional pero recomendado)
- Cuenta de GitHub con el repositorio del proyecto

## 🚀 Parte 1: Configuración Inicial del VPS

### 1.1 Conectarse al VPS

```bash
ssh root@TU_IP_VPS
# o
ssh usuario@TU_IP_VPS
```

### 1.2 Actualizar el Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Crear Usuario para Deployment (Opcional pero Recomendado)

```bash
# Crear usuario
sudo adduser deploy

# Agregar a grupo sudo
sudo usermod -aG sudo deploy

# Cambiar a usuario deploy
su - deploy
```

## 🐳 Parte 2: Instalación de Docker y Docker Compose

### 2.1 Instalar Docker

```bash
# Instalar dependencias
sudo apt install -y ca-certificates curl gnupg lsb-release

# Agregar GPG key de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Agregar repositorio de Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalación
docker --version
docker compose version
```

### 2.2 Configurar Permisos de Docker

```bash
# Agregar usuario actual al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (o cerrar sesión y volver a entrar)
newgrp docker

# Verificar que funciona sin sudo
docker ps
```

### 2.3 Habilitar Docker al Inicio

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker
```

## 📁 Parte 3: Preparar Directorio de la Aplicación

### 3.1 Crear Estructura de Directorios

```bash
# Crear directorio principal
sudo mkdir -p /opt/rumirent-app
sudo chown $USER:$USER /opt/rumirent-app
cd /opt/rumirent-app
```

### 3.2 Copiar Archivos Necesarios

Copia estos archivos desde tu repositorio local al VPS:

```bash
# Desde tu máquina local, ejecuta:
scp docker-compose.deploy.yml usuario@TU_IP_VPS:/opt/rumirent-app/
```

O crea el archivo directamente en el servidor:

```bash
nano /opt/rumirent-app/docker-compose.deploy.yml
```

Pega el contenido del archivo `docker-compose.deploy.yml`.

### 3.3 Crear Archivo de Variables de Entorno

```bash
nano /opt/rumirent-app/.env
```

Agrega las siguientes variables (ajusta los valores):

```env
# Database
POSTGRES_USER=rumirent_prod
POSTGRES_PASSWORD=TU_PASSWORD_SEGURO_AQUI
POSTGRES_DB=rumirent_db

# Database URL (formato completo)
DATABASE_URL=postgresql://rumirent_prod:TU_PASSWORD_SEGURO_AQUI@db:5432/rumirent_db

# JWT
JWT_SECRET=TU_JWT_SECRET_MUY_SEGURO_Y_LARGO_AQUI
JWT_EXPIRES_IN=7d

# Next.js
NEXTAUTH_URL=https://tu-dominio.com
# o para desarrollo: http://TU_IP_VPS:3000

# GitHub Container Registry
GITHUB_REPOSITORY=tu-usuario/rumirent-app
```

### 3.4 Proteger el Archivo .env

```bash
chmod 600 /opt/rumirent-app/.env
```

## 🔑 Parte 4: Configurar Acceso SSH para GitHub Actions

### 4.1 Generar Par de Llaves SSH

```bash
# En el VPS, genera una llave SSH
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions

# Agregar la llave pública a authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Mostrar la llave PRIVADA (la usarás en GitHub Secrets)
cat ~/.ssh/github_actions
```

**⚠️ IMPORTANTE**: Copia la llave privada completa (incluyendo `-----BEGIN` y `-----END`). La necesitarás para GitHub Secrets.

### 4.2 Configurar SSH (Opcional pero Recomendado)

```bash
sudo nano /etc/ssh/sshd_config
```

Asegúrate de tener estas configuraciones:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Reinicia SSH:

```bash
sudo systemctl restart sshd
```

## 🔐 Parte 5: Configurar GitHub Secrets

Ve a tu repositorio en GitHub: `Settings > Secrets and variables > Actions > New repository secret`

Agrega los siguientes secretos:

| Secret Name | Valor | Descripción |
|-------------|-------|-------------|
| `VPS_HOST` | `123.456.789.123` | IP de tu VPS |
| `VPS_USERNAME` | `deploy` o `tu_usuario` | Usuario SSH del VPS |
| `VPS_SSH_KEY` | La llave privada completa | Contenido de `~/.ssh/github_actions` |
| `VPS_SSH_PORT` | `22` (o tu puerto custom) | Puerto SSH |
| `VPS_URL` | `https://tu-dominio.com` | URL de tu aplicación |

**Nota sobre GITHUB_TOKEN**: No necesitas agregarlo manualmente, GitHub lo provee automáticamente.

## 🎯 Parte 6: Login a GitHub Container Registry

### 6.1 Crear Personal Access Token en GitHub

1. Ve a GitHub: `Settings > Developer settings > Personal access tokens > Tokens (classic)`
2. Clic en "Generate new token (classic)"
3. Dale un nombre: "VPS Docker Pull"
4. Selecciona scopes:
   - `read:packages`
   - `write:packages` (si quieres hacer push también)
5. Genera y copia el token

### 6.2 Login en el VPS

```bash
# En el VPS, haz login a GHCR
echo "TU_GITHUB_TOKEN" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin

# Verificar que funcionó
docker pull ghcr.io/tu-usuario/rumirent-app:latest
```

## 🚀 Parte 7: Primer Deployment Manual

### 7.1 Verificar Configuración

```bash
cd /opt/rumirent-app

# Verificar que existe .env
ls -la .env

# Verificar que existe docker-compose.deploy.yml
ls -la docker-compose.deploy.yml
```

### 7.2 Pull de la Imagen

```bash
# Asegúrate de estar logueado a GHCR
docker pull ghcr.io/tu-usuario/rumirent-app:latest
```

### 7.3 Levantar Servicios

```bash
# Levantar servicios
docker compose -f docker-compose.deploy.yml up -d

# Ver logs
docker compose -f docker-compose.deploy.yml logs -f
```

### 7.4 Ejecutar Migraciones de Base de Datos

```bash
# Espera a que los contenedores estén listos (30-60 segundos)
sleep 30

# Ejecutar migraciones
docker compose -f docker-compose.deploy.yml exec app sh -c "pnpm db:migrate:prod"

# O si falla, intenta con bash:
docker compose -f docker-compose.deploy.yml exec app bash -c "pnpm db:migrate:prod"
```

### 7.5 Verificar que Todo Funciona

```bash
# Ver estado de contenedores
docker compose -f docker-compose.deploy.yml ps

# Verificar logs de la app
docker compose -f docker-compose.deploy.yml logs app

# Verificar logs de la DB
docker compose -f docker-compose.deploy.yml logs db

# Probar la aplicación
curl http://localhost:3000/api/test
```

## 🌐 Parte 8: Configurar Nginx (Opcional pero Recomendado)

### 8.1 Instalar Nginx

```bash
sudo apt install -y nginx
```

### 8.2 Crear Configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/rumirent
```

Agrega esta configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Logs
    access_log /var/log/nginx/rumirent-access.log;
    error_log /var/log/nginx/rumirent-error.log;

    # Proxy a la aplicación Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Client max body size
    client_max_body_size 10M;
}
```

### 8.3 Activar Configuración

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/rumirent /etc/nginx/sites-enabled/

# Remover default si existe
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8.4 Configurar SSL con Certbot (HTTPS)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

## 🔥 Parte 9: Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp
# O si usas puerto custom: sudo ufw allow TU_PUERTO/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ver reglas
sudo ufw status verbose
```

## 📊 Parte 10: Scripts Útiles

### 10.1 Script de Deployment Manual

Crea un script para deployments manuales:

```bash
nano /opt/rumirent-app/deploy.sh
```

Contenido:

```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

cd /opt/rumirent-app

echo "📥 Pulling latest image..."
docker compose -f docker-compose.deploy.yml pull

echo "🛑 Stopping old containers..."
docker compose -f docker-compose.deploy.yml down

echo "🚀 Starting new containers..."
docker compose -f docker-compose.deploy.yml up -d

echo "⏳ Waiting for containers to be ready..."
sleep 30

echo "🗄️ Running database migrations..."
docker compose -f docker-compose.deploy.yml exec -T app sh -c "pnpm db:migrate:prod"

echo "🧹 Cleaning up old images..."
docker image prune -af --filter "until=72h"

echo "✅ Deployment completed!"
docker compose -f docker-compose.deploy.yml ps
```

Hacer ejecutable:

```bash
chmod +x /opt/rumirent-app/deploy.sh
```

### 10.2 Script de Logs

```bash
nano /opt/rumirent-app/logs.sh
```

Contenido:

```bash
#!/bin/bash
cd /opt/rumirent-app
docker compose -f docker-compose.deploy.yml logs -f --tail=100 $1
```

Hacer ejecutable:

```bash
chmod +x /opt/rumirent-app/logs.sh
```

Uso:

```bash
# Ver logs de todos los servicios
./logs.sh

# Ver logs solo de app
./logs.sh app

# Ver logs solo de db
./logs.sh db
```

### 10.3 Script de Backup de Base de Datos

```bash
nano /opt/rumirent-app/backup-db.sh
```

Contenido:

```bash
#!/bin/bash

BACKUP_DIR="/opt/rumirent-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rumirent_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

echo "🗄️ Creating database backup..."

docker compose -f /opt/rumirent-app/docker-compose.deploy.yml exec -T db \
  pg_dump -U rumirent_prod rumirent_db > $BACKUP_FILE

gzip $BACKUP_FILE

echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

Hacer ejecutable:

```bash
chmod +x /opt/rumirent-app/backup-db.sh
```

Automatizar backups diarios:

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /opt/rumirent-app/backup-db.sh >> /opt/rumirent-app/backups/backup.log 2>&1
```

## ✅ Parte 11: Verificación Final

### 11.1 Checklist de Configuración

- [ ] Docker instalado y funcionando
- [ ] Docker Compose instalado
- [ ] Usuario agregado al grupo docker
- [ ] Directorio `/opt/rumirent-app` creado
- [ ] Archivo `.env` configurado con valores correctos
- [ ] Archivo `docker-compose.deploy.yml` copiado
- [ ] Llave SSH generada
- [ ] GitHub Secrets configurados
- [ ] Login a GHCR funcionando
- [ ] Primer deployment manual exitoso
- [ ] Migraciones ejecutadas
- [ ] Aplicación accesible en puerto 3000
- [ ] Nginx configurado (opcional)
- [ ] SSL configurado (opcional)
- [ ] Firewall configurado

### 11.2 Comandos de Verificación

```bash
# Verificar Docker
docker --version
docker ps

# Verificar contenedores
cd /opt/rumirent-app
docker compose -f docker-compose.deploy.yml ps

# Verificar logs
docker compose -f docker-compose.deploy.yml logs --tail=50

# Verificar app
curl http://localhost:3000/api/test

# Verificar desde exterior (si tienes Nginx)
curl http://tu-dominio.com/api/test
```

## 🔄 Parte 12: Proceso de Deployment Automático

Una vez configurado todo, el flujo de deployment será:

1. **Haces push a la rama `main`**:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin main
   ```

2. **GitHub Actions automáticamente**:
   - ✅ Ejecuta todos los tests
   - 🐳 Construye imagen Docker
   - 📦 Publica en GHCR
   - 🚀 Se conecta al VPS
   - 📥 Pull de la nueva imagen
   - 🔄 Reinicia contenedores
   - 🗄️ Ejecuta migraciones
   - ✅ Verifica que todo funcione

3. **Tu aplicación está actualizada** en ~5-10 minutos!

## 🆘 Troubleshooting

### Problema: Contenedores no inician

```bash
# Ver logs detallados
docker compose -f docker-compose.deploy.yml logs

# Verificar .env
cat .env

# Verificar permisos
ls -la /opt/rumirent-app
```

### Problema: No puede conectar a base de datos

```bash
# Verificar que DB esté corriendo
docker compose -f docker-compose.deploy.yml ps db

# Ver logs de DB
docker compose -f docker-compose.deploy.yml logs db

# Verificar DATABASE_URL en .env
```

### Problema: Migraciones fallan

```bash
# Entrar al contenedor manualmente
docker compose -f docker-compose.deploy.yml exec app sh

# Verificar Prisma
pnpm db:generate
pnpm db:migrate:prod
```

### Problema: GitHub Actions no puede conectar

```bash
# Verificar SSH en VPS
sudo tail -f /var/log/auth.log

# Verificar que la llave SSH esté en authorized_keys
cat ~/.ssh/authorized_keys
```

## 📚 Recursos Adicionales

- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Nginx](https://nginx.org/en/docs/)
- [Certbot](https://certbot.eff.org/)

---

**¡Listo!** Tu VPS está configurado para recibir deployments automáticos 🎉
