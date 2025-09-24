# 🐳 Docker Configuration - Rumirent App

Configuración completa de Docker para ejecutar la aplicación de gestión de brokers y comisiones en diferentes entornos.

## 📋 Prerequisitos

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 Opciones de Ejecución

### 1. 🔧 Desarrollo Completo (App + DB)

Ejecuta toda la aplicación con hot reload para desarrollo:

```bash
# Iniciar servicios
npm run docker:dev

# Iniciar con rebuild de imágenes
npm run docker:dev:build

# Ver logs en tiempo real
npm run docker:dev:logs

# Detener servicios
npm run docker:dev:down

# Limpiar todo (incluyendo volúmenes)
npm run docker:dev:clean
```

**Servicios incluidos:**
- ✅ PostgreSQL en puerto `5432`
- ✅ Next.js App en puerto `3000`
- ✅ Hot reload habilitado
- ✅ Variables de desarrollo

### 2. 🗄️ Solo Base de Datos

Útil cuando quieres desarrollar localmente pero usar DB en Docker:

```bash
# Solo PostgreSQL
npm run docker:db

# Detener DB
npm run docker:db:down

# Con Adminer (interfaz web para DB)
npm run docker:adminer
```

**Acceso:**
- PostgreSQL: `localhost:5432`
- Adminer: `http://localhost:8080`

### 3. 🏭 Producción

Para despliegue en producción:

```bash
# Configurar variables de entorno primero
cp .env.production .env

# Ejecutar en producción
npm run docker:prod

# Con rebuild
npm run docker:prod:build

# Detener
npm run docker:prod:down
```

### 4. 🛠️ Herramientas de Desarrollo

```bash
# Prisma Studio
npm run docker:prisma

# Todas las herramientas
npm run docker:tools
```

## 🔧 Configuración de Entornos

### Desarrollo
```yaml
# Variables automáticas en docker-compose.yml
DATABASE_URL: postgresql://rumirent_user:rumirent_password@db:5432/contractor_db_dev
JWT_SECRET: dev-jwt-secret-change-in-production-32chars
NEXTAUTH_URL: http://localhost:3000
```

### Producción
```bash
# Configurar en .env antes de ejecutar
DATABASE_URL=postgresql://user:password@db:5432/contractor_db_prod
JWT_SECRET=tu-secreto-super-seguro-de-32-caracteres-minimo
NEXTAUTH_URL=https://tu-dominio.com
POSTGRES_PASSWORD=tu-password-de-produccion
```

## 📁 Estructura de Archivos Docker

```
├── docker-compose.yml          # Desarrollo
├── docker-compose.prod.yml     # Producción
├── docker-compose.db.yml       # Solo database
├── Dockerfile                  # Imagen de producción
├── Dockerfile.dev             # Imagen de desarrollo
├── .dockerignore              # Archivos excluidos
└── docker/
    ├── postgres/
    │   └── init/
    │       └── 01-init.sql     # Script de inicialización
    └── nginx/
        └── nginx.conf          # Configuración Nginx
```

## 🌐 Acceso a Servicios

### Desarrollo
| Servicio | URL | Credenciales |
|----------|-----|--------------|
| App | http://localhost:3000 | - |
| PostgreSQL | localhost:5432 | `rumirent_user` / `rumirent_password` |
| Prisma Studio | http://localhost:5555 | - |

### Herramientas
| Servicio | URL | Descripción |
|----------|-----|-------------|
| Adminer | http://localhost:8080 | Administrador de DB |
| Prisma Studio | http://localhost:5555 | ORM GUI |

## 📊 Monitoreo y Logs

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f app
docker-compose logs -f db

# Estado de servicios
docker-compose ps

# Usar dentro del contenedor
docker-compose exec app bash
docker-compose exec db psql -U rumirent_user -d contractor_db_dev
```

## 🔄 Comandos de Base de Datos

```bash
# Dentro del contenedor de la app
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:generate
docker-compose exec app npm run db:seed

# Backup de DB
docker-compose exec db pg_dump -U rumirent_user contractor_db_dev > backup.sql

# Restaurar DB
docker-compose exec -T db psql -U rumirent_user contractor_db_dev < backup.sql
```

## 🔄 Workflows Recomendados

### Desarrollo Local
1. `npm run docker:db` - Solo base de datos
2. Desarrollar localmente con `npm run dev`
3. La app se conecta a PostgreSQL en Docker

### Desarrollo con Docker
1. `npm run docker:dev` - Todo en Docker
2. Código sincronizado con volúmenes
3. Hot reload automático

### Testing de Producción
1. `npm run docker:prod:build` - Build y ejecutar como producción
2. Probar en `http://localhost:3000`

## 🚨 Troubleshooting

### Puerto ocupado
```bash
# Verificar qué usa el puerto
lsof -i :3000
lsof -i :5432

# Cambiar puertos en docker-compose.yml si es necesario
```

### Problemas de permisos
```bash
# Reset de volúmenes
npm run docker:dev:clean
docker volume prune
```

### DB no conecta
```bash
# Verificar salud de DB
docker-compose exec db pg_isready -U rumirent_user

# Logs de PostgreSQL
docker-compose logs db
```

### Rebuild completo
```bash
# Limpiar todo
npm run docker:dev:clean
docker system prune -a

# Rebuild desde cero
npm run docker:dev:build
```

## 🔒 Consideraciones de Seguridad

### Desarrollo
- ✅ Credenciales de desarrollo no sensibles
- ✅ Puerto 5432 expuesto solo localmente
- ✅ JWT secret de desarrollo

### Producción
- ⚠️ Cambiar todas las credenciales por defecto
- ⚠️ Usar secrets de Docker o variables de entorno del sistema
- ⚠️ Configurar HTTPS con certificados SSL
- ⚠️ Habilitar firewall y restricciones de red

## 🚀 Despliegue

Para producción, considera usar:
- **Docker Swarm** para orquestación
- **Nginx** como reverse proxy (incluido en prod)
- **Let's Encrypt** para certificados SSL
- **Backups automáticos** de PostgreSQL
- **Monitoreo** con Prometheus/Grafana