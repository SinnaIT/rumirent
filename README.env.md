# Configuración de Variables de Entorno

Este proyecto soporta múltiples perfiles de ejecución (desarrollo, producción) con diferentes configuraciones de variables de entorno.

## Archivos de Entorno

### `.env.example`
Plantilla con todas las variables necesarias. **Siempre actualizar cuando agregues nuevas variables**.

### `.env.development`
Variables para el entorno de desarrollo. Este archivo está versionado y contiene valores seguros para desarrollo.

### `.env.production`
Variables para el entorno de producción. Este archivo está versionado pero **DEBE ser modificado con valores reales antes del despliegue**.

### `.env.local` (No versionado)
Variables locales que sobrescriben cualquier otro archivo de entorno. Ideal para configuraciones personales de desarrolladores.

## Variables Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | Clave secreta para JWT (mín. 32 caracteres) | `tu-jwt-secret-super-seguro-aqui` |
| `JWT_EXPIRES_IN` | Tiempo de expiración del JWT | `7d` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `NEXTAUTH_URL` | URL base de la aplicación | `http://localhost:3000` |
| `DEBUG` | Habilitar logs de debug | `true` / `false` |

## Scripts Disponibles

### Desarrollo
```bash
npm run dev              # Desarrollo normal
npm run dev:prod         # Desarrollo con variables de producción
```

### Build
```bash
npm run build            # Build normal
npm run build:dev        # Build con variables de desarrollo
npm run build:prod       # Build con variables de producción
```

### Producción
```bash
npm run start            # Servidor de producción
npm run start:dev        # Servidor con variables de desarrollo
npm run start:prod       # Servidor con variables de producción
```

### Base de Datos
```bash
npm run db:generate      # Generar cliente Prisma
npm run db:migrate       # Ejecutar migraciones (dev)
npm run db:migrate:prod  # Ejecutar migraciones (prod)
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Ejecutar seeds
```

### Utilidades
```bash
npm run env:validate     # Validar variables de entorno
```

## Configuración por Entorno

### Desarrollo Local
1. Copia `.env.example` como `.env.local`
2. Modifica los valores según tu configuración local
3. Ejecuta `npm run env:validate` para verificar

### Producción
1. Modifica `.env.production` con valores reales
2. Nunca commites credenciales reales
3. Usa variables de entorno del servidor/Docker en producción

## Seguridad

- ❌ **NUNCA** commites archivos `.env.local` o con credenciales reales
- ✅ **SIEMPRE** usa secretos seguros en producción (32+ caracteres)
- ✅ **SIEMPRE** valida variables con `npm run env:validate`
- ✅ Usa variables de entorno del sistema en producción

## Jerarquía de Variables

Next.js carga variables en este orden (último tiene precedencia):
1. `.env`
2. `.env.local`
3. `.env.development` / `.env.production`
4. `.env.development.local` / `.env.production.local`
5. Variables del sistema

## Validación

Las variables se validan automáticamente con Zod en `src/lib/env.ts`. Si hay errores, la aplicación no arrancará y mostrará mensajes descriptivos.