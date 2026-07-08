# Code Quality — Puntos a Mejorar

Revisión basada en el estado actual del código fuente (`src/`).

---

## 1. Seguridad

### 1.1 JWT_SECRET con fallback inseguro
**Archivo:** [src/lib/auth.ts:7](src/lib/auth.ts#L7)

```ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
```

El schema de `env.ts` valida que `JWT_SECRET` exista, pero `auth.ts` tiene un fallback de texto plano. Si por algún motivo `env.ts` no se ejecuta primero, la app corre con un secreto conocido públicamente. Eliminar el fallback y lanzar un error si la variable no existe.

---

### 1.2 Detalles de error internos expuestos al cliente
**Archivos afectados:** ~15 rutas API

Múltiples rutas devuelven `error.message` y en algún caso `error.stack` directamente en la respuesta HTTP:

```ts
// src/app/api/admin/leads/route.ts:156
return NextResponse.json({ error: 'Error...', details: error.message }, { status: 500 })

// src/app/api/admin/clientes/import/route.ts:263
const errorStack = error instanceof Error ? error.stack : undefined
```

Esto expone detalles de implementación (rutas de archivos, queries SQL, etc.) a cualquier cliente. Los errores internos deben loguearse server-side y devolver solo un mensaje genérico al cliente.

---

### 1.3 Ruta de admin sin autenticación efectiva
**Archivo:** [src/app/api/admin/leads/route.ts](src/app/api/admin/leads/route.ts)

La ruta importa `verifyAuth` pero **nunca la llama**. El middleware verifica que el rol sea ADMIN, pero si se bypasea el middleware (ej. llamada directa desde servidor) la ruta queda abierta. Usar `adminHandler` como el resto de rutas equivalentes.

---

### 1.4 Header `Authorization` como fallback en middleware
**Archivo:** [src/middleware.ts:37-41](src/middleware.ts#L37)

```ts
// For development, also check Authorization header as fallback
const headerToken = authHeader?.replace('Bearer ', '')
const finalToken = token || headerToken
```

Este código de desarrollo se quedó en producción. Permite autenticarse por header además de cookie, ampliando la superficie de ataque.

---

## 2. Consistencia de Patrones

### 2.1 Dos sistemas de autenticación en paralelo, ninguno unificado
**Archivos:** [src/lib/api-handlers.ts](src/lib/api-handlers.ts), [src/lib/auth.ts](src/lib/auth.ts)

Se definieron wrappers modernos (`adminHandler`, `brokerHandler`, `teamLeaderHandler`) en `api-handlers.ts`, pero **ninguna ruta API los usa**. Todas las rutas (~84 archivos) siguen usando los helpers del estilo antiguo (`verifyAuth`, `requireAdmin`, `requireBroker`), con `try/catch` manuales repetidos.

Consolidar: usar `adminHandler`/`brokerHandler`/`teamLeaderHandler` en todas las rutas y eliminar el patrón manual.

---

### 2.2 Dos utilidades de error handling duplicadas
**Archivos:** [src/lib/api-response.ts:31](src/lib/api-response.ts#L31), [src/lib/api-handlers.ts:15](src/lib/api-handlers.ts#L15)

`withErrorHandler` y `withErrorHandling` hacen exactamente lo mismo: capturar `DomainException`, `ZodError` y error genérico. Una debe eliminarse.

---

### 2.3 `JWT_EXPIRES_IN` definido pero no usado
**Archivo:** [src/lib/auth.ts:8](src/lib/auth.ts#L8) y [src/lib/auth.ts:29](src/lib/auth.ts#L29)

```ts
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'  // definido
// ...
.setExpirationTime('7d')  // hardcodeado, JWT_EXPIRES_IN no se usa
```

---

## 3. Arquitectura y Estructura

### 3.1 Interfaces/tipos locales en `page.tsx` y archivos `interfaces.ts` fuera de `@/types`
**Regla violada:** `CLAUDE.md` — "Never inline shared interfaces in `page.tsx` — import from `@/types`"

Archivos con tipos inline en pages o fuera de `@/types`:

| Archivo | Tipos definidos localmente |
|---------|--------------------------|
| [src/app/admin/agendas/page.tsx:21](src/app/admin/agendas/page.tsx#L21) | `CronJob`, `ScheduledChange`, `CronStatus` |
| [src/app/admin/comisiones/page.tsx:22](src/app/admin/comisiones/page.tsx#L22) | `CambioProgramado` |
| [src/app/admin/empresas/page.tsx:58](src/app/admin/empresas/page.tsx#L58) | `Empresa`, `EmpresaFormData` |
| [src/app/admin/impuestos/page.tsx:26](src/app/admin/impuestos/page.tsx#L26) | `TaxRate` |
| [src/app/admin/metas/page.tsx:29](src/app/admin/metas/page.tsx#L29) | `Meta` |
| [src/app/admin/brokers/interfaces.ts](src/app/admin/brokers/interfaces.ts) | `BrokerFormData` — debería estar en `@/types` |
| [src/app/admin/team-leaders/interfaces.ts](src/app/admin/team-leaders/interfaces.ts) | `TeamLeader`, `TeamLeaderFormData` — debería estar en `@/types` |

---

### 3.2 Pages monolíticas (mezcla de UI, estado y lógica de negocio)
Varias páginas superan las 1000 líneas mezclando fetch, estado, validación y JSX en un solo componente:

| Archivo | Líneas |
|---------|--------|
| [src/app/admin/proyectos/[id]/page.tsx](src/app/admin/proyectos/[id]/page.tsx) | 2630 |
| [src/app/admin/reportes/resumen-comisiones/page.tsx](src/app/admin/reportes/resumen-comisiones/page.tsx) | 1858 |
| [src/app/broker/generar-lead/page.tsx](src/app/broker/generar-lead/page.tsx) | 1648 |
| [src/app/admin/leads/page.tsx](src/app/admin/leads/page.tsx) | 1641 |
| [src/app/admin/comisiones/page.tsx](src/app/admin/comisiones/page.tsx) | 1092 |
| [src/app/admin/page.tsx](src/app/admin/page.tsx) | 1019 |

Extraer: custom hooks para fetch/estado, sub-componentes para secciones del UI, helpers para formateo.

---

### 3.3 Arquitectura Clean Architecture parcialmente aplicada
El directorio `src/core/` implementa DDD con entidades, repositorios y use-cases, pero solo cubre `TeamLeader`, `Empresa` y `UnitTypeTemplate`. El resto de entidades (`Lead`, `Broker`, `Cliente`, `Comision`, etc.) van directamente de las rutas API a Prisma sin capa de dominio.

Decisión pendiente: o se extiende el patrón `core/` a todas las entidades, o se elimina y se adopta un enfoque consistente de servicios simples para todo.

---

### 3.4 Ruta `/api/dashboard` de admin con 928 líneas
**Archivo:** [src/app/api/admin/dashboard/route.ts](src/app/api/admin/dashboard/route.ts)

Una sola ruta API de 928 líneas que probablemente hace múltiples queries diferentes. Dividir en sub-rutas o endpoints específicos.

---

## 4. Calidad de Código

### 4.1 Console.log excesivo — 600+ ocurrencias en 128 archivos
El código usa `console.log` como mecanismo de observabilidad. Ejemplos críticos:

- Middleware: 10+ logs por cada request (incluyendo tokens parciales)
- `auth.ts`: logs del payload JWT en cada verificación
- Rutas API: logs con emojis de estado (`🔍`, `✅`, `❌`)

En producción esto degrada performance, llena logs y puede filtrar información sensible (userId, emails). Usar un logger estructurado (ej. `pino`) con niveles, o remover los logs de debug.

---

### 4.2 Comentarios internos en español
**Regla violada:** `CLAUDE.md` — "All internal code in English. Spanish only for user-facing UI text."

Múltiples archivos tienen comentarios internos en español:

```ts
// src/middleware.ts
// Rutas que requieren autenticación pero bypass otros checks

// src/lib/auth.ts
// Verificar que el usuario aún existe en la base de datos
```

---

### 4.3 Cast inseguro en `successResponse`
**Archivo:** [src/lib/api-response.ts:9](src/lib/api-response.ts#L9)

```ts
return NextResponse.json({ success: true, ...data as object }, { status })
```

El cast `as object` borra el tipo genérico `T` y puede causar comportamiento inesperado si `data` no es un objeto plano (ej. `string`, `number`, `Array`). Cambiar la firma para que solo acepte objetos, o manejar los casos específicos.

---

### 4.4 `any` implícito en catch blocks
En múltiples rutas se accede a `error.message` y `error.stack` sin verificar el tipo:

```ts
// src/app/api/admin/leads/route.ts:153
console.error('Stack trace:', error.stack)  // error es 'unknown'
```

TypeScript en modo estricto debería marcar esto. Revisar la configuración de `tsconfig.json` y corregir los catch blocks.

---

## 5. Performance

### 5.1 Verificación de usuario en DB en cada request
**Archivo:** [src/lib/auth.ts:61](src/lib/auth.ts#L61)

`verifyToken` hace un `prisma.user.findUnique` en cada request autenticado para confirmar que el usuario existe. Con carga alta esto genera N queries innecesarias. Opciones: cache en memoria con TTL corto, o confiar en el JWT y solo invalidar via blacklist en casos específicos (logout, desactivación).

---

### 5.2 Queries sin paginación en endpoints de listado
Varias rutas de listado (`GET /api/admin/leads`, `/api/admin/clientes`, etc.) devuelven todos los registros sin paginación. Con suficientes datos esto puede colapsar la respuesta y saturar memoria.

---

## Resumen por prioridad

| Prioridad | Item |
|-----------|------|
| CRITICA | 1.1 JWT fallback inseguro |
| CRITICA | 1.2 Error internos expuestos al cliente |
| CRITICA | 1.3 Ruta admin/leads sin auth efectiva |
| ALTA | 2.1 Unificar sistema de autenticación |
| ALTA | 4.1 Eliminar console.log de producción |
| ALTA | 5.2 Paginación en endpoints de listado |
| MEDIA | 1.4 Header Authorization fallback en middleware |
| MEDIA | 2.2 Eliminar duplicado de error handling |
| MEDIA | 3.1 Mover interfaces a `@/types` |
| MEDIA | 3.2 Fragmentar pages monolíticas |
| MEDIA | 3.3 Decidir y unificar estrategia Clean Architecture |
| BAJA | 2.3 Usar `JWT_EXPIRES_IN` o eliminarlo |
| BAJA | 3.4 Dividir ruta dashboard |
| BAJA | 4.2 Comentarios internos en español |
| BAJA | 4.3 Cast inseguro en `successResponse` |
| BAJA | 4.4 `any` implícito en catch blocks |
| BAJA | 5.1 Cache de verificación de usuario |
