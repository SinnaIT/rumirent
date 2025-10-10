# 🔀 Nginx: Docker vs Instalación Directa

Guía de comparación para ayudarte a decidir cómo implementar Nginx en tu VPS.

## 📊 Comparación Rápida

| Característica | Nginx en Docker | Nginx Instalado |
|----------------|-----------------|-----------------|
| **Instalación** | `docker compose up` | `apt install nginx` |
| **Actualización** | `docker pull` | `apt upgrade` |
| **Configuración** | `docker/nginx/nginx.conf` | `/etc/nginx/nginx.conf` |
| **Logs** | `docker logs` | `/var/log/nginx/` |
| **SSL/Certbot** | Contenedor certbot | Instalación host |
| **Aislamiento** | ✅ Totalmente aislado | ⚠️ Comparte con el host |
| **Portabilidad** | ✅ Fácil migrar | ⚠️ Reconfigurar en nuevo servidor |
| **Recursos** | ~50-100 MB extra | ~20 MB |
| **Complejidad** | Media (Docker profiles) | Baja (directo) |
| **Rollback** | ✅ Fácil (imagen anterior) | ⚠️ Manual |

---

## 🐳 Opción 1: Nginx en Docker (Recomendado)

### ✅ Ventajas

**1. Todo containerizado**
```bash
# Un solo comando para levantar todo
docker compose --profile nginx -f docker-compose.deploy.yml up -d
```

**2. Actualizaciones simples**
```bash
# Actualizar a última versión de Nginx
docker pull nginx:alpine
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx
```

**3. Configuración portable**
- El mismo `nginx.conf` funciona en cualquier servidor
- No depende del sistema operativo del host
- Fácil probar localmente antes de deploy

**4. Aislamiento completo**
- Nginx corre en su propio contenedor
- No interfiere con otros servicios del host
- Fácil de destruir y recrear sin afectar nada más

**5. Rollback fácil**
```bash
# Si algo sale mal, volver a imagen anterior
docker tag nginx:alpine nginx:backup
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx
```

**6. Certbot integrado**
```bash
# SSL automático con contenedor dedicado
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certonly
```

### ⚠️ Desventajas

**1. Complejidad inicial**
- Necesitas entender Docker profiles
- Configurar volumes correctamente
- Entender networking de Docker

**2. Recursos extra**
- ~50-100 MB de RAM adicional para contenedor Nginx
- ~20-30 MB para contenedor Certbot
- Espacio en disco para imágenes Docker

**3. Debugging más complejo**
```bash
# Necesitas entrar al contenedor para ver configuración
docker compose exec nginx cat /etc/nginx/nginx.conf
docker compose exec nginx nginx -t
```

**4. Logs distribuidos**
```bash
# Logs están dentro del contenedor
docker compose logs nginx
# En lugar de /var/log/nginx/
```

### 📝 Cuándo usar Nginx en Docker

✅ **Recomendado si:**
- Ya usas Docker para tu aplicación
- Quieres una infraestructura completamente containerizada
- Planeas escalar horizontalmente en el futuro
- Necesitas facilidad de migración entre servidores
- Prefieres "infraestructura como código"
- Tienes experiencia con Docker

### 🚀 Setup rápido

Ver guía completa: [NGINX_DOCKER_SETUP.md](./NGINX_DOCKER_SETUP.md)

```bash
# 1. Habilitar Nginx en docker-compose
docker compose --profile nginx -f docker-compose.deploy.yml up -d

# 2. Obtener certificado SSL
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certonly \
  --webroot -d tudominio.com

# 3. Actualizar nginx.conf con SSL (descomentar bloque HTTPS)

# 4. Reiniciar
docker compose --profile nginx -f docker-compose.deploy.yml restart nginx

# ¡Listo!
```

---

## 💻 Opción 2: Nginx Instalado Directamente

### ✅ Ventajas

**1. Instalación simple**
```bash
sudo apt update
sudo apt install nginx
sudo systemctl enable nginx
```

**2. Menor uso de recursos**
- ~20 MB de RAM
- Sin overhead de Docker
- Acceso directo al sistema

**3. Debugging familiar**
```bash
# Logs tradicionales
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Configuración estándar
sudo nano /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx
```

**4. Integración con systemd**
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
journalctl -u nginx -f
```

**5. Certificados con Certbot tradicional**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
# Renovación automática configurada por apt
```

### ⚠️ Desventajas

**1. Acoplado al sistema operativo**
- Diferentes paths en Ubuntu vs CentOS vs Alpine
- Versión de Nginx depende del repositorio del OS
- Difícil tener la misma versión en dev vs prod

**2. Actualizaciones del host**
```bash
# Nginx se actualiza con el sistema
sudo apt upgrade
# Puede romper configuración existente
```

**3. Configuración no portable**
- Si cambias de servidor, debes reconfigurar todo
- Testing local requiere instalar Nginx en tu máquina
- Diferentes desarrolladores pueden tener setups distintos

**4. Sin aislamiento**
- Comparte recursos con el host
- Puede interferir con otros servicios
- Más difícil de "limpiar" completamente

**5. Rollback manual**
```bash
# Si algo falla, debes revertir configuración manualmente
sudo cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
sudo systemctl restart nginx
```

### 📝 Cuándo usar Nginx instalado

✅ **Recomendado si:**
- No usas Docker en absoluto
- Servidor tiene recursos muy limitados
- Prefieres herramientas tradicionales de Linux
- Tu equipo tiene más experiencia con Nginx nativo
- Solo tienes una aplicación en el servidor
- No planeas migrar a otro servidor

### 🚀 Setup rápido

```bash
# 1. Instalar Nginx
sudo apt update
sudo apt install nginx

# 2. Configurar reverse proxy
sudo nano /etc/nginx/sites-available/default
# Configurar proxy_pass a http://localhost:3000

# 3. Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# 4. Obtener certificado
sudo certbot --nginx -d tudominio.com

# 5. Reiniciar
sudo systemctl restart nginx

# ¡Listo!
```

---

## 🎯 Casos de Uso Específicos

### Caso 1: Startup pequeña, primer deployment

**Recomendación**: **Nginx Instalado**

**Razón**:
- Deployment más simple
- Menos conceptos que aprender
- Certbot con `--nginx` configura todo automáticamente

```bash
# 3 comandos y ya tienes HTTPS
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d tuapp.com
# ¡Listo!
```

---

### Caso 2: Equipo de desarrollo, múltiples ambientes

**Recomendación**: **Nginx en Docker**

**Razón**:
- Mismo setup en dev, staging y prod
- Fácil para nuevos desarrolladores (solo `docker compose up`)
- Infraestructura como código (todo en Git)

```yaml
# docker-compose.yml funciona igual en todos lados
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf
```

---

### Caso 3: Servidor con múltiples aplicaciones

**Recomendación**: **Nginx Instalado**

**Razón**:
- Un solo Nginx puede servir múltiples apps
- Configuración centralizada
- No duplicar overhead de contenedores

```nginx
# /etc/nginx/sites-available/
# - app1.conf -> proxy a localhost:3000
# - app2.conf -> proxy a localhost:4000
# - app3.conf -> proxy a localhost:5000
```

---

### Caso 4: Infraestructura containerizada completa

**Recomendación**: **Nginx en Docker**

**Razón**:
- Consistencia total (todo en Docker)
- Orquestación con Docker Compose
- Fácil migrar a Kubernetes después

```yaml
services:
  app1:
    image: app1:latest
  app2:
    image: app2:latest
  nginx:
    image: nginx:alpine
    # Proxy a ambas apps
```

---

### Caso 5: VPS compartido con otros servicios (web server, mail, etc.)

**Recomendación**: **Nginx Instalado**

**Razón**:
- No mezclar contenedores con servicios nativos
- Nginx ya puede estar instalado para otros servicios
- Evitar conflictos de puertos

---

### Caso 6: Plan de escalar horizontalmente en el futuro

**Recomendación**: **Nginx en Docker**

**Razón**:
- Fácil replicar en múltiples servidores
- Compatible con load balancers
- Path natural hacia Kubernetes/Swarm

---

## 🔄 Migración entre opciones

### De Instalado → Docker

```bash
# 1. Exportar configuración actual
sudo cp /etc/nginx/nginx.conf ./docker/nginx/nginx.conf

# 2. Detener Nginx nativo
sudo systemctl stop nginx
sudo systemctl disable nginx

# 3. Liberar puertos
sudo ufw delete allow 'Nginx Full'

# 4. Iniciar en Docker
docker compose --profile nginx -f docker-compose.deploy.yml up -d

# 5. Copiar certificados Let's Encrypt (si los tienes)
sudo cp -r /etc/letsencrypt ./docker/nginx/ssl/
```

### De Docker → Instalado

```bash
# 1. Exportar configuración de Docker
docker compose exec nginx cat /etc/nginx/nginx.conf > /tmp/nginx.conf

# 2. Detener contenedor Nginx
docker compose stop nginx

# 3. Instalar Nginx
sudo apt install nginx

# 4. Copiar configuración
sudo cp /tmp/nginx.conf /etc/nginx/nginx.conf

# 5. Adaptar paths (cambiar 'app:3000' a 'localhost:3000')
sudo nano /etc/nginx/nginx.conf

# 6. Iniciar
sudo systemctl start nginx
```

---

## 💡 Recomendación Final

### Para este proyecto (Rumirent)

**Recomendación**: **Nginx en Docker** ⭐

**Razones**:
1. ✅ Ya usas Docker para app y database
2. ✅ Tienes GitHub Actions CI/CD configurado
3. ✅ Infraestructura completamente como código
4. ✅ Fácil rollback si hay problemas
5. ✅ Setup idéntico en cualquier servidor

**Trade-off aceptable**:
- ~80 MB extra de RAM (insignificante en VPS moderno)
- Complejidad inicial (pero bien documentado)

### Quick Decision Tree

```
¿Ya usas Docker para tu app?
├─ SÍ → Nginx en Docker ✅
└─ NO → ¿Planeas usar Docker en el futuro?
    ├─ SÍ → Nginx en Docker ✅
    └─ NO → ¿Tienes múltiples apps en el servidor?
        ├─ SÍ → Nginx Instalado ✅
        └─ NO → ¿Recursos muy limitados (<1GB RAM)?
            ├─ SÍ → Nginx Instalado ✅
            └─ NO → Nginx en Docker ✅
```

---

## 📚 Recursos

### Nginx en Docker
- [Guía completa NGINX_DOCKER_SETUP.md](./NGINX_DOCKER_SETUP.md)
- [Docker Nginx Official Image](https://hub.docker.com/_/nginx)
- [Certbot Docker](https://hub.docker.com/r/certbot/certbot)

### Nginx Instalado
- [Nginx Official Docs](https://nginx.org/en/docs/)
- [Digital Ocean Nginx Guide](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-22-04)
- [Certbot Instructions](https://certbot.eff.org/instructions)

---

**¿Todavía indeciso?** Empieza con **Nginx en Docker** ya que es más fácil migrar de Docker → Instalado que al revés.

**¿Necesitas ayuda?** Revisa [NGINX_DOCKER_SETUP.md](./NGINX_DOCKER_SETUP.md) para setup detallado.
