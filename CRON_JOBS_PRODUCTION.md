# Configuración de Cron Jobs en Producción

Este documento describe cómo funcionan los procesos programados (cron jobs) en la aplicación y cómo verificar que estén funcionando correctamente en producción.

## Procesos Programados Activos

La aplicación ejecuta **2 procesos automáticos cada hora**:

### 1. Recálculo de Comisiones
**Archivo**: `src/lib/cron/jobs/recalculate-commissions.ts`
**Frecuencia**: Cada hora (minuto 0)
**Propósito**: Recalcula las comisiones de todos los leads válidos del **mes actual y mes anterior**

**Qué hace**:
- Busca todos los leads con `fechaPagoReserva` en los últimos 2 meses
- Excluye solo leads con estado `RECHAZADO` o `CANCELADO` (todos los demás son válidos)
- **Agrupa leads por BROKER + MES + COMISIÓN BASE**
- Aplica reglas de comisión según la cantidad de leads por grupo
- Si no hay regla aplicable, usa la comisión base del lead
- Actualiza automáticamente los montos si hubo cambios

**Lógica de agrupación**:
Cada broker tiene su propio conteo de leads por mes y por comisión.

**Ejemplo real**:
```
Mes: Septiembre 2025

Broker A:
  - Comisión Estándar: 5 leads → Regla 4-10 leads = 8%
  - Comisión Premium: 2 leads → Sin regla = Porcentaje base (3%)

Broker B:
  - Comisión Estándar: 1 lead → Sin regla = Porcentaje base (3%)

Mes: Octubre 2025

Broker A:
  - Comisión Estándar: 8 leads → Regla 4-10 leads = 8%
  (Se evalúa independiente de Septiembre)
```

**Lógica de cálculo**:
1. Agrupa leads por `[brokerId][mes-año][comisionId]`
2. Cuenta cuántos leads tiene cada grupo
3. Busca la regla que aplica según esa cantidad
4. Aplica el porcentaje correspondiente a **todos** los leads del grupo
5. Si no hay regla, aplica el porcentaje base de `lead.comisionId`

**Por qué es importante**:
- **Incentiva el rendimiento individual**: Cada broker acumula sus propias comisiones
- **Evaluación mensual**: Las reglas se aplican por mes calendario
- **Flexibilidad**: Diferentes comisiones base se evalúan por separado
- **Mantiene sincronizados los últimos 2 meses**: Asegura que cambios de configuración se reflejen

### 2. Ejecución de Cambios Programados
**Archivo**: `src/lib/cron/jobs/execute-commission-changes.ts`
**Frecuencia**: Cada hora (minuto 0)
**Propósito**: Ejecuta los cambios de comisión que han llegado a su fecha programada

**Qué hace**:
- Busca todos los `CambioComisionProgramado` con:
  - `ejecutado = false`
  - `fechaCambio <= now`
- Aplica los cambios:
  - Actualiza la comisión del edificio (si aplica)
  - Actualiza la comisión del tipo de unidad (si aplica)
- Marca el cambio como ejecutado

**Por qué es importante**:
Permite programar cambios de comisión con anticipación. Por ejemplo:
- "A partir del 1 de febrero, el edificio X tendrá 5% de comisión"
- El sistema ejecutará el cambio automáticamente a la hora programada

## Configuración Técnica

### Inicialización Automática

Los cron jobs se inicializan **automáticamente** al arrancar la aplicación mediante el archivo de instrumentación de Next.js:

**Archivo**: `src/instrumentation.ts`
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeCronJobs } = await import('./lib/cron')
    initializeCronJobs()
  }
}
```

**Configuración en Next.js**:
En Next.js 15.x, el hook de instrumentación está habilitado por defecto. No se requiere configuración adicional en `next.config.ts`.

> **Nota**: En versiones anteriores de Next.js (< 15), era necesario habilitar `experimental.instrumentationHook` en la configuración.

### Zona Horaria

**Todos los cron jobs usan la zona horaria de Chile**: `America/Santiago`

Esto significa que:
- "Cada hora a las 00" se ejecutará a las 00:00, 01:00, 02:00... hora de Chile
- Los cambios programados se comparan con la hora de Chile

### Expresión Cron

Ambos procesos usan la expresión: `0 * * * *`

Formato: `minuto hora día mes día_semana`
- `0`: Minuto 0
- `*`: Cualquier hora
- `*`: Cualquier día
- `*`: Cualquier mes
- `*`: Cualquier día de la semana

**Resultado**: Se ejecuta al inicio de cada hora (ej: 10:00, 11:00, 12:00...)

## Verificación en Producción

### 1. Health Check Endpoint (Público)

**URL**: `GET /api/cron/health`
**Autenticación**: No requiere (público)
**Propósito**: Verificar que el sistema de cron esté funcionando correctamente

**Ejemplo de uso**:
```bash
curl https://tu-dominio.com/api/cron/health
```

**Respuesta cuando está saludable** (HTTP 200):
```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T10:00:00.000Z",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection successful"
    },
    "cronJobs": {
      "status": "ok",
      "message": "All scheduled changes executed on time"
    }
  },
  "metrics": {
    "overdueChanges": 0,
    "recentExecutions24h": 5,
    "nextScheduledChange": {
      "id": "abc123",
      "scheduledFor": "2025-12-20T15:00:00.000Z",
      "inMinutes": 6240
    }
  },
  "warnings": [],
  "cronSchedule": {
    "recalculateCommissions": "0 * * * * (Every hour)",
    "executeScheduledChanges": "0 * * * * (Every hour)",
    "timezone": "America/Santiago"
  }
}
```

**Respuesta cuando hay problemas** (HTTP 503):
```json
{
  "status": "degraded",
  "checks": {
    "cronJobs": {
      "status": "warning",
      "message": "3 overdue changes detected"
    }
  },
  "metrics": {
    "overdueChanges": 3
  },
  "warnings": [
    "3 cambios programados no se ejecutaron a tiempo"
  ]
}
```

### 2. Status Endpoint (Admin)

**URL**: `GET /api/admin/cron/status`
**Autenticación**: Requiere token JWT con rol `ADMIN`
**Propósito**: Ver detalles completos de los cron jobs y cambios programados

**Respuesta**:
```json
{
  "success": true,
  "status": {
    "cronJobsEnabled": true,
    "schedule": "Every hour at minute 0",
    "timezone": "America/Santiago",
    "lastCheck": "2025-12-16T10:00:00.000Z",
    "jobs": [
      {
        "name": "Recálculo de Comisiones",
        "description": "Recalcula las comisiones de todos los leads activos",
        "schedule": "0 * * * *",
        "nextRun": "2025-12-16T11:00:00.000Z",
        "enabled": true
      },
      {
        "name": "Ejecución de Cambios Programados",
        "description": "Ejecuta los cambios de comisión que han llegado a su fecha",
        "schedule": "0 * * * *",
        "nextRun": "2025-12-16T11:00:00.000Z",
        "enabled": true
      }
    ],
    "scheduledChanges": {
      "pending": 5,
      "overdue": 0,
      "executed": 120,
      "upcoming": [...],
      "overdueList": [],
      "recentlyExecuted": [...]
    },
    "stats": {
      "totalActiveLeads": 450,
      "pendingChanges": 5,
      "executedToday": 3
    }
  }
}
```

### 3. Ejecución Manual (Admin)

**URL**: `POST /api/admin/cron/execute`
**Autenticación**: Requiere token JWT con rol `ADMIN`
**Propósito**: Ejecutar manualmente los cron jobs sin esperar la hora programada

Este endpoint permite:
- Probar los cron jobs inmediatamente
- Forzar una ejecución si se detecta un problema
- Ejecutar después de hacer cambios en configuraciones

## Monitoreo Recomendado

### 1. Configurar Alertas de Health Check

Usar un servicio de monitoreo (como UptimeRobot, Pingdom, StatusCake) para:

- **URL a monitorear**: `https://tu-dominio.com/api/cron/health`
- **Frecuencia**: Cada 5-10 minutos
- **Alerta si**:
  - HTTP status != 200
  - `status` != "healthy"
  - `overdueChanges` > 0

### 2. Logs del Servidor

Los cron jobs escriben logs detallados. Buscar en los logs de producción:

**Al iniciar la aplicación**:
```
🚀 Initializing server instrumentation...
⏰ Initializing cron jobs...
✅ Cron jobs initialized successfully
📅 Jobs scheduled:
   - Commission recalculation: Every hour at minute 0
   - Scheduled commission changes: Every hour at minute 0
   - Timezone: America/Santiago (Chile)
```

**Cada hora cuando se ejecutan los jobs**:
```
⏰ [CRON] Starting hourly commission recalculation job...
💰 Starting commission recalculation for delivered leads...
📊 Found 450 delivered leads to recalculate
  ✓ Updated lead abc123: 1500000 → 1600000 (4%)
✅ Commission recalculation completed:
   - Total leads processed: 450
   - Updated: 25
   - Errors: 0
   - Unchanged: 425
✅ [CRON] Commission recalculation completed successfully

⏰ [CRON] Starting scheduled commission changes execution...
📅 Starting execution of scheduled commission changes...
📊 Found 2 pending commission changes to execute
  Processing change #xyz789 scheduled for 2025-12-16T10:00:00.000Z
    ✓ Updated building Torre Central commission to Premium (5%)
✅ Scheduled commission changes execution completed:
   - Total changes processed: 2
   - Executed: 2
   - Errors: 0
✅ [CRON] Scheduled commission changes executed successfully
```

### 3. Dashboard de Administración

Crear una página en el panel de admin para visualizar:
- Estado actual de los cron jobs
- Próximos cambios programados
- Cambios ejecutados recientemente
- Gráfica de comisiones recalculadas

**Sugerencia de ruta**: `/admin/sistema/cron-jobs`

## Problemas Comunes y Soluciones

### Problema: Los cron jobs no se ejecutan

**Diagnóstico**:
1. Verificar que `instrumentation.ts` existe en `src/`
2. Revisar logs al iniciar el servidor (debe aparecer "✅ Cron jobs initialized successfully")
3. Verificar versión de Next.js (debe ser 15.x o superior)

**Solución**:
```bash
# Rebuild la aplicación
pnpm build

# Verificar la configuración
cat next.config.ts | grep instrumentationHook

# Reiniciar el servidor
pnpm start
```

### Problema: Cambios programados no se ejecutan a tiempo

**Diagnóstico**:
1. Llamar a `/api/cron/health` y verificar `overdueChanges`
2. Revisar la zona horaria del servidor vs. la zona horaria de los cron jobs
3. Verificar que no hay errores en los logs

**Solución temporal**:
```bash
# Ejecutar manualmente vía API
curl -X POST https://tu-dominio.com/api/admin/cron/execute \
  -H "Authorization: Bearer TU_TOKEN_ADMIN"
```

**Solución permanente**:
- Verificar que el servidor está configurado con zona horaria correcta
- Revisar logs para identificar errores en la ejecución

### Problema: "Too many connections" en la base de datos

**Causa**: Los cron jobs están creando demasiadas conexiones a Prisma

**Solución**:
Revisar `src/lib/db.ts` y asegurar que Prisma Client esté usando un singleton:

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## Consideraciones de Escalabilidad

### Múltiples Instancias (Cluster/Docker Swarm)

**⚠️ ADVERTENCIA**: Si ejecutas múltiples instancias de la aplicación:

**Problema**: Cada instancia ejecutará sus propios cron jobs, causando:
- Cambios programados ejecutados múltiples veces
- Carga innecesaria en la base de datos
- Posibles inconsistencias

**Solución**: Usar una de estas estrategias:

#### Opción 1: Variable de Entorno (Recomendada para Docker)

```typescript
// En src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.ENABLE_CRON_JOBS === 'true') {
    const { initializeCronJobs } = await import('./lib/cron')
    initializeCronJobs()
  }
}
```

**Configuración en Docker Compose**:
```yaml
services:
  app-1:
    environment:
      ENABLE_CRON_JOBS: "false"  # Sin cron jobs

  app-2:
    environment:
      ENABLE_CRON_JOBS: "false"  # Sin cron jobs

  cron-worker:
    environment:
      ENABLE_CRON_JOBS: "true"   # Solo esta instancia ejecuta cron jobs
```

#### Opción 2: Lock Distribuido con Redis

Implementar un sistema de locks distribuidos para que solo una instancia ejecute cada job.

#### Opción 3: Servicio Externo de Cron

Usar un servicio externo que llame al endpoint manual:
- AWS EventBridge
- Google Cloud Scheduler
- Cron-job.org (para desarrollo)

**Ejemplo con cron-job.org**:
- URL: `POST https://tu-dominio.com/api/admin/cron/execute`
- Frecuencia: `0 * * * *` (cada hora)
- Headers: `Authorization: Bearer TOKEN_ADMIN_ESPECIAL`

## Mantenimiento

### Limpieza de Cambios Antiguos

Los cambios programados ejecutados se mantienen indefinidamente. Para limpiar:

```sql
-- Ver cambios ejecutados hace más de 6 meses
SELECT COUNT(*)
FROM "CambioComisionProgramado"
WHERE ejecutado = true
  AND "updatedAt" < NOW() - INTERVAL '6 months';

-- Eliminar cambios ejecutados hace más de 6 meses (CUIDADO)
DELETE FROM "CambioComisionProgramado"
WHERE ejecutado = true
  AND "updatedAt" < NOW() - INTERVAL '6 months';
```

### Auditoría

Considerar agregar una tabla de auditoría para registrar:
- Cada ejecución de cron job (timestamp, leads procesados, cambios ejecutados)
- Errores ocurridos
- Tiempo de ejecución

## Checklist de Despliegue a Producción

- [ ] Verificar que `instrumentation.ts` existe en `src/`
- [ ] Verificar versión de Next.js 15.x o superior
- [ ] Configurar variable `ENABLE_CRON_JOBS` si se usan múltiples instancias
- [ ] Configurar monitoreo del endpoint `/api/cron/health`
- [ ] Configurar alertas para `overdueChanges > 0`
- [ ] Verificar zona horaria del servidor (`America/Santiago`)
- [ ] Revisar logs de inicio para confirmar inicialización
- [ ] Esperar 1 hora y verificar que los jobs se ejecutaron
- [ ] Documentar el proceso de ejecución manual para el equipo

## Contacto y Soporte

Si los cron jobs no funcionan correctamente en producción:

1. Revisar logs del servidor
2. Llamar a `/api/cron/health` para diagnosticar
3. Ejecutar manualmente vía `/api/admin/cron/execute`
4. Revisar este documento para problemas comunes
5. Contactar al equipo de desarrollo con:
   - Logs del error
   - Respuesta de `/api/cron/health`
   - Configuración del servidor (zona horaria, versión de Node.js, etc.)
