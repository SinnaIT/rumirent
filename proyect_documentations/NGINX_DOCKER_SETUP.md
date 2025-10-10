# 🔒 Guía de Nginx con Docker y SSL

Esta guía te ayudará a configurar Nginx como reverse proxy usando Docker, incluyendo certificados SSL automáticos con Let's Encrypt.

## 📋 Índice

1. [¿Por qué usar Nginx en Docker?](#por-qué-usar-nginx-en-docker)
2. [Configuración Básica (HTTP)](#configuración-básica-http)
3. [Configuración con SSL (HTTPS)](#configuración-con-ssl-https)
4. [Renovación Automática de Certificados](#renovación-automática-de-certificados)
5. [Comandos Útiles](#comandos-útiles)
6. [Troubleshooting](#troubleshooting)

---

## 🤔 ¿Por qué usar Nginx en Docker?

### Ventajas

✅ **Todo containerizado**: No necesitas instalar Nginx en el servidor
✅ **Fácil actualización**: `docker pull nginx:alpine` y listo
✅ **Configuración portable**: La misma config funciona en cualquier servidor
✅ **Aislamiento**: Nginx corre en su propio contenedor
✅ **Rollback fácil**: Si algo falla, vuelves a la imagen anterior

### Desventajas

⚠️ **Complejidad inicial**: Requiere entender Docker profiles y volumes
⚠️ **Networking**: Necesitas configurar correctamente las redes Docker

---

## 🚀 Configuración Básica (HTTP)

### Paso 1: Crear estructura de directorios

```bash
cd /opt/rumirent-app

# Crear directorio para configuración de Nginx
mkdir -p docker/nginx

# Crear directorio para certificados SSL (para después)
mkdir -p docker/nginx/ssl
```

### Paso 2: Copiar configuración de Nginx

El archivo `docker/nginx/nginx.conf` ya está incluido en el repositorio. Si necesitas copiarlo manualmente:

```bash
# Desde tu máquina local
scp docker/nginx/nginx.conf usuario@TU_VPS:/opt/rumirent-app/docker/nginx/
```

### Paso 3: Habilitar Nginx en Docker Compose

El servicio Nginx usa **profiles** de Docker Compose, por lo que debes activarlo explícitamente:

```bash
cd /opt/rumirent-app

# Iniciar TODOS los servicios incluyendo Nginx
docker compose --profile nginx -f docker-compose.deploy.yml up -d

# O solo iniciar el servicio de Nginx
docker compose --profile nginx -f docker-compose.deploy.yml up -d nginx
```

### Paso 4: Verificar que funciona

```bash
# Verificar que los contenedores están corriendo
docker compose -f docker-compose.deploy.yml ps

# Debería mostrar:
# - rumirent-db (running)
# - rumirent-app (running)
# - rumirent-nginx (running)

# Probar el health check de Nginx
curl http://localhost/nginx-health
# Debería responder: healthy

# Probar que llega a la aplicación
curl http://localhost/api/test
# Debería responder con datos de la API
```

### Paso 5: Abrir puertos en firewall

```bash
# Permitir tráfico HTTP
sudo ufw allow 80/tcp

# Permitir tráfico HTTPS (para cuando configures SSL)
sudo ufw allow 443/tcp

# Verificar reglas
sudo ufw status
```

### Paso 6: Probar desde exterior

```bash
# Desde tu máquina local
curl http://TU_IP_VPS/nginx-health
curl http://TU_IP_VPS/api/test
```

---

## 🔐 Configuración con SSL (HTTPS)

### Requisitos Previos

- ✅ Dominio apuntando a tu VPS (Ejemplo: `app.tudominio.com`)
- ✅ Puerto 80 abierto en firewall
- ✅ Nginx corriendo en modo HTTP

### Paso 1: Obtener certificado SSL con Certbot

```bash
cd /opt/rumirent-app

# Detener Nginx temporalmente
docker compose -f docker-compose.deploy.yml stop nginx

# Obtener certificado (reemplaza con tu dominio y email)
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email tu-email@ejemplo.com \
  --agree-tos \
  --no-eff-email \
  -d tudominio.com \
  -d www.tudominio.com
```

**Nota**: Si tienes problemas con webroot, puedes usar el modo standalone:

```bash
# Modo standalone (requiere que el puerto 80 esté libre)
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email tu-email@ejemplo.com \
  --agree-tos \
  --no-eff-email \
  -d tudominio.com \
  -d www.tudominio.com
```

### Paso 2: Verificar certificados

```bash
# Listar certificados obtenidos
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certificates

# Debería mostrar algo como:
# Certificate Name: tudominio.com
# Domains: tudominio.com www.tudominio.com
# Expiry Date: 2025-04-08
```

### Paso 3: Actualizar configuración de Nginx

Edita `docker/nginx/nginx.conf`:

```bash
nano docker/nginx/nginx.conf
```

**Descomenta el bloque HTTPS** (líneas 148-235):

```nginx
# HTTP Server - Redirigir a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tudominio.com www.tudominio.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirigir todo a HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # ... resto de la configuración (proxy_pass, etc.)
}
```

**Importante**: Reemplaza `tudominio.com` con tu dominio real en:
- `server_name`
- `ssl_certificate` paths

### Paso 4: Reiniciar Nginx

```bash
# Reiniciar Nginx con la nueva configuración
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx

# Verificar logs
docker compose -f docker-compose.deploy.yml logs nginx
```

### Paso 5: Probar HTTPS

```bash
# Desde tu máquina local
curl https://tudominio.com/nginx-health
curl https://tudominio.com/api/test

# Verificar redirección HTTP → HTTPS
curl -I http://tudominio.com
# Debería responder: 301 Moved Permanently
# Location: https://tudominio.com/
```

### Paso 6: Actualizar variables de entorno

```bash
# Editar .env en el VPS
nano /opt/rumirent-app/.env

# Actualizar NEXTAUTH_URL con HTTPS
NEXTAUTH_URL=https://tudominio.com
```

```bash
# Reiniciar la aplicación para aplicar cambios
docker compose -f docker-compose.deploy.yml restart app
```

---

## 🔄 Renovación Automática de Certificados

Los certificados de Let's Encrypt expiran cada **90 días**. El contenedor de Certbot se encarga de renovarlos automáticamente.

### Verificar estado del contenedor Certbot

```bash
# Ver si el contenedor de renovación está corriendo
docker compose -f docker-compose.deploy.yml ps certbot

# Ver logs de Certbot
docker compose -f docker-compose.deploy.yml logs certbot
```

### Renovación manual (si es necesario)

```bash
# Forzar renovación de certificados
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot renew

# Reiniciar Nginx después de renovar
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx
```

### Configurar cron job de respaldo

Aunque el contenedor Certbot se encarga de renovar, puedes crear un cron job de respaldo:

```bash
# Editar crontab
crontab -e

# Agregar línea para renovar cada semana
0 3 * * 0 cd /opt/rumirent-app && docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot renew && docker compose --profile nginx -f docker-compose.deploy.yml restart nginx
```

---

## 🛠️ Comandos Útiles

### Manejo de servicios Nginx

```bash
cd /opt/rumirent-app

# Iniciar Nginx (con profile)
docker compose --profile nginx -f docker-compose.deploy.yml up -d nginx

# Detener Nginx
docker compose -f docker-compose.deploy.yml stop nginx

# Reiniciar Nginx
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx

# Ver logs de Nginx
docker compose -f docker-compose.deploy.yml logs -f nginx

# Ver logs de Certbot
docker compose -f docker-compose.deploy.yml logs -f certbot

# Probar configuración de Nginx (sin reiniciar)
docker compose -f docker-compose.deploy.yml exec nginx nginx -t

# Recargar configuración (sin downtime)
docker compose -f docker-compose.deploy.yml exec nginx nginx -s reload
```

### Gestión de certificados

```bash
# Listar todos los certificados
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certificates

# Renovar certificados manualmente
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot renew

# Renovar certificado específico
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot renew --cert-name tudominio.com

# Eliminar certificado
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot delete --cert-name tudominio.com
```

### Iniciar TODO el stack con Nginx

```bash
# Detener todo (incluyendo servicios con profile)
docker compose --profile nginx -f docker-compose.deploy.yml down

# Iniciar todo (app + db + nginx + certbot)
docker compose --profile nginx -f docker-compose.deploy.yml up -d

# Ver estado de todos los servicios
docker compose --profile nginx -f docker-compose.deploy.yml ps
```

---

## 🆘 Troubleshooting

### Problema 1: Nginx no inicia

**Síntomas**: `docker compose ps` muestra nginx como stopped o restarting

**Diagnóstico**:
```bash
# Ver logs de error
docker compose -f docker-compose.deploy.yml logs nginx

# Verificar sintaxis de nginx.conf
docker compose -f docker-compose.deploy.yml run --rm nginx nginx -t
```

**Soluciones**:
- Verificar que `docker/nginx/nginx.conf` existe y tiene permisos correctos
- Verificar que no hay errores de sintaxis en nginx.conf
- Asegurar que los puertos 80 y 443 no están ocupados en el host

### Problema 2: Error 502 Bad Gateway

**Síntomas**: Nginx responde pero da error 502

**Diagnóstico**:
```bash
# Verificar que la app está corriendo
docker compose -f docker-compose.deploy.yml ps app

# Probar conexión directa a la app
curl http://localhost:3000/api/test

# Ver logs de Nginx
docker compose -f docker-compose.deploy.yml logs nginx
```

**Soluciones**:
- Asegurar que el contenedor `app` está corriendo y saludable
- Verificar que `upstream nextjs_backend` en nginx.conf apunta a `app:3000`
- Asegurar que ambos contenedores están en la misma red Docker

### Problema 3: Certbot falla al obtener certificado

**Síntomas**: Error al ejecutar `certbot certonly`

**Diagnóstico**:
```bash
# Ver logs detallados de Certbot
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certonly --dry-run -v
```

**Soluciones comunes**:

1. **Puerto 80 no accesible**:
   ```bash
   # Verificar que puerto 80 está abierto
   sudo ufw status
   sudo ufw allow 80/tcp
   ```

2. **DNS no apunta al servidor**:
   ```bash
   # Verificar que el dominio apunta a tu IP
   nslookup tudominio.com
   dig tudominio.com
   ```

3. **Nginx bloqueando webroot**:
   ```bash
   # Detener Nginx temporalmente
   docker compose -f docker-compose.deploy.yml stop nginx

   # Usar modo standalone
   docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certonly --standalone -d tudominio.com
   ```

### Problema 4: Certificados expirados

**Síntomas**: Navegador muestra error de certificado

**Solución**:
```bash
# Renovar certificados
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot renew --force-renewal

# Reiniciar Nginx
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx
```

### Problema 5: Conflicto de puertos

**Síntomas**: `Error: port is already allocated`

**Diagnóstico**:
```bash
# Ver qué está usando el puerto 80
sudo lsof -i :80

# O con netstat
sudo netstat -tulpn | grep :80
```

**Soluciones**:
- Si hay otro Nginx instalado en el host: `sudo systemctl stop nginx`
- Si hay Apache: `sudo systemctl stop apache2`
- Cambiar puertos en docker-compose.deploy.yml (ejemplo: `8080:80`)

### Problema 6: Rate limiting bloqueando tráfico legítimo

**Síntomas**: Usuarios reportan errores 429 (Too Many Requests)

**Solución**: Ajustar límites en `nginx.conf`:

```nginx
# Aumentar límites si es necesario
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=50r/s;     # Era 10r/s
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s; # Era 30r/s
```

Luego reiniciar Nginx:
```bash
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx
```

---

## 📊 Monitoreo de Nginx

### Ver métricas en tiempo real

```bash
# Ver conexiones activas
docker compose -f docker-compose.deploy.yml exec nginx sh -c "ps aux | grep nginx"

# Ver logs de acceso en tiempo real
docker compose -f docker-compose.deploy.yml logs -f nginx | grep "GET\|POST"

# Ver solo errores
docker compose -f docker-compose.deploy.yml logs -f nginx | grep -i error
```

### Analizar logs de acceso

```bash
# Entrar al contenedor de Nginx
docker compose -f docker-compose.deploy.yml exec nginx sh

# Dentro del contenedor:
# Ver IPs más activas
cat /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -10

# Ver endpoints más solicitados
cat /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10

# Ver códigos de respuesta
cat /var/log/nginx/access.log | awk '{print $9}' | sort | uniq -c
```

---

## 🎯 Checklist de Setup

### Setup HTTP (Básico)
- [ ] Directorio `docker/nginx` creado
- [ ] Archivo `nginx.conf` copiado
- [ ] Nginx iniciado con `--profile nginx`
- [ ] Puerto 80 abierto en firewall
- [ ] Health check funciona: `curl http://localhost/nginx-health`
- [ ] API accesible: `curl http://localhost/api/test`
- [ ] Accesible desde exterior: `curl http://TU_IP/api/test`

### Setup HTTPS (Producción)
- [ ] Dominio apuntando a VPS
- [ ] DNS propagado (verificar con `nslookup`)
- [ ] Puerto 443 abierto en firewall
- [ ] Certificados obtenidos con Certbot
- [ ] Configuración HTTPS descomentada en `nginx.conf`
- [ ] `server_name` actualizado con tu dominio
- [ ] Nginx reiniciado con nueva config
- [ ] HTTPS funciona: `curl https://tudominio.com/api/test`
- [ ] Redirección HTTP→HTTPS funciona
- [ ] `NEXTAUTH_URL` actualizada en `.env`
- [ ] Contenedor Certbot corriendo para renovación automática

---

## 🚀 Próximos Pasos Recomendados

1. **Configurar CDN** (Cloudflare, CloudFront):
   - Cache adicional para assets estáticos
   - Protección DDoS
   - SSL gratis

2. **Implementar WAF** (Web Application Firewall):
   - ModSecurity con Nginx
   - Reglas OWASP

3. **Logging centralizado**:
   - Enviar logs de Nginx a servicio externo
   - ELK Stack, Datadog, etc.

4. **Monitoring avanzado**:
   - Prometheus + Grafana
   - Métricas de Nginx
   - Alertas automáticas

---

## 📚 Recursos

- [Nginx Official Docs](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Docker Compose Profiles](https://docs.docker.com/compose/profiles/)
- [Certbot Docker](https://hub.docker.com/r/certbot/certbot)
- [SSL Server Test](https://www.ssllabs.com/ssltest/) - Verificar configuración SSL

---

**¿Necesitas ayuda?** Revisa la sección de [Troubleshooting](#troubleshooting) o los logs de Nginx.

**Última actualización**: 2025-10-08
