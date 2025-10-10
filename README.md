# 🏢 Rumirent - Sistema de Gestión de Brokers y Comisiones

Sistema de gestión para brokers inmobiliarios construido con Next.js 15, TypeScript y arquitectura hexagonal.

## 🚀 Quick Start

### Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
pnpm db:migrate

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Testing

```bash
# Ejecutar todos los tests (70 tests)
pnpm test:run

# Tests en modo watch
pnpm test

# Tests con UI
pnpm test:ui

# Tests con coverage
pnpm test:coverage

# Solo unit tests
pnpm test:unit

# Solo integration tests
pnpm test:integration
```

Ver guía completa de testing: [TESTING.md](./TESTING.md)

## 📚 Documentación

### Guías de Deployment

- **[QUICKSTART_DEPLOY.md](./QUICKSTART_DEPLOY.md)** - Setup rápido en 15 minutos
- **[VPS_SETUP.md](./VPS_SETUP.md)** - Configuración detallada del VPS desde cero
- **[NGINX_DOCKER_SETUP.md](./NGINX_DOCKER_SETUP.md)** - Nginx con Docker + SSL automático ⭐
- **[NGINX_COMPARISON.md](./NGINX_COMPARISON.md)** - Docker vs Instalación directa
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Arquitectura y flujo de CI/CD completo
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Resumen ejecutivo del sistema

### Arquitectura y Testing

- **[CLAUDE.md](./CLAUDE.md)** - Arquitectura hexagonal y guía del proyecto
- **[TESTING.md](./TESTING.md)** - Estrategia de testing y mejores prácticas

## 🏗️ Stack Tecnológico

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT con bcryptjs
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Testing**: Vitest + Testing Library
- **Deployment**: Docker + GitHub Actions + GHCR

## 🎯 Arquitectura

El proyecto sigue **arquitectura hexagonal** con separación clara de responsabilidades:

```
src/
├── app/           # Next.js App Router (UI)
├── core/          # Lógica de Negocio
│   ├── domain/    # Entidades y reglas de negocio
│   ├── application/  # Casos de uso
│   └── infrastructure/  # Adaptadores (Prisma, etc.)
├── components/    # Componentes UI
└── lib/           # Utilidades
```

Ver detalles completos en [CLAUDE.md](./CLAUDE.md)

## 🐳 Deployment

### Opción 1: Deployment Automático (CI/CD)

Cada push a `main` dispara automáticamente:
1. ✅ Tests (70 tests unitarios e integración)
2. 🐳 Build de imagen Docker
3. 📦 Push a GitHub Container Registry
4. 🚀 Deploy a VPS

```bash
git push origin main
# ¡Y listo! En ~15 minutos tu app está actualizada
```

### Opción 2: Deployment Manual

```bash
# En el VPS
cd /opt/rumirent-app
./scripts/deploy-vps.sh
```

### Configurar Nginx con Docker (Recomendado)

Para producción con SSL/HTTPS automático:

```bash
# Habilitar Nginx + Certbot
docker compose --profile nginx -f docker-compose.deploy.yml up -d

# Obtener certificado SSL
docker compose --profile nginx -f docker-compose.deploy.yml run --rm certbot certonly \
  --webroot -d tudominio.com
```

Ver guía completa: [NGINX_DOCKER_SETUP.md](./NGINX_DOCKER_SETUP.md)

## 📊 Características

### Para Administradores
- ✅ Gestión de edificios y unidades
- ✅ Configuración de comisiones dinámicas
- ✅ Gestión de brokers y clientes
- ✅ Dashboard con analytics
- ✅ Reportes de ventas

### Para Brokers
- ✅ Ver unidades disponibles
- ✅ Registrar clientes y ventas
- ✅ Calcular comisiones en tiempo real
- ✅ Historial de ventas personal

### Sistema
- ✅ Autenticación JWT con roles
- ✅ Validación de RUT chileno
- ✅ Comisiones por tipo de unidad
- ✅ Estados de venta con workflow
- ✅ 70 tests automatizados

## 🛠️ Comandos Útiles

### Desarrollo

```bash
pnpm dev          # Servidor desarrollo (Turbopack)
pnpm build        # Build producción
pnpm start        # Servidor producción
pnpm lint         # Linter
```

### Base de Datos

```bash
pnpm db:generate      # Generar Prisma Client
pnpm db:migrate       # Ejecutar migraciones (dev)
pnpm db:migrate:prod  # Ejecutar migraciones (prod)
pnpm db:studio        # Abrir Prisma Studio
```

### Docker

```bash
# Build local
docker build -t rumirent-app .

# Run con docker-compose
docker compose -f docker-compose.prod.yml up

# Con Nginx habilitado
docker compose --profile nginx -f docker-compose.deploy.yml up -d
```

## 🔐 Variables de Entorno

Ver `.env.example` para todas las variables requeridas.

Variables esenciales:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="tu-secret-muy-seguro"
NEXTAUTH_URL="https://tudominio.com"
```

## 📦 Scripts de Deployment

Ubicados en `scripts/`:

- `deploy-vps.sh` - Deploy manual al VPS
- `backup-db.sh` - Backup automático de PostgreSQL
- `restore-db.sh` - Restaurar desde backup
- `logs.sh` - Ver logs de servicios
- `status.sh` - Dashboard del sistema

## 🆘 Troubleshooting

### Tests fallan localmente
```bash
# Verificar variables de entorno
cat .env

# Re-generar Prisma Client
pnpm db:generate

# Limpiar node_modules
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Build de Docker falla
```bash
# Verificar que next.config.ts tiene output standalone
grep standalone next.config.ts

# Build con logs detallados
docker build --progress=plain -t rumirent-app .
```

### Deployment falla
Ver secciones de troubleshooting en:
- [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)
- [NGINX_DOCKER_SETUP.md](./NGINX_DOCKER_SETUP.md#troubleshooting)

## 📖 Aprende Más

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Studio](https://www.prisma.io/studio)

### Docker
- [Docker Documentation](https://docs.docker.com)
- [Docker Compose](https://docs.docker.com/compose)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Ejecuta los tests (`pnpm test:run`)
4. Commit tus cambios (`git commit -m 'feat: Add amazing feature'`)
5. Push a la branch (`git push origin feature/AmazingFeature`)
6. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

---

**¿Nuevo en el proyecto?** Empieza leyendo [CLAUDE.md](./CLAUDE.md) para entender la arquitectura.

**¿Listo para deployar?** Sigue [QUICKSTART_DEPLOY.md](./QUICKSTART_DEPLOY.md).

**¿Problemas?** Revisa la documentación de troubleshooting o abre un issue.
