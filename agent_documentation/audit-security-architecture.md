# Auditoría de Seguridad OWASP + Refactoring Clean Code / SOLID

> Fecha: 2026-04-14 | Autor: Senior Software Architect Review

---

## Resumen ejecutivo

Se auditaron 2 endpoints por panel (Admin, Broker, Team Leader), el sistema de autenticación y el middleware. Se encontraron **3 vulnerabilidades críticas** de seguridad y una **dualidad arquitectónica** donde el panel Team Leader ya sigue Clean Architecture correctamente pero Admin y Broker no.

---

## PARTE 1: Auditoría OWASP Top 10

### A01 — Broken Access Control 🔴 CRÍTICO

| Hallazgo | Archivo | Severidad |
|----------|---------|-----------|
| `GET /api/admin/clientes` no tiene autenticación — cualquier usuario (incluso anónimo) puede listar todos los clientes | `src/app/api/admin/clientes/route.ts:5-64` | 🔴 Crítico |
| `GET /api/admin/comisiones` no tiene autenticación — datos de comisiones expuestos públicamente | `src/app/api/admin/comisiones/route.ts:5-36` | 🔴 Crítico |
| El middleware **excluye todas las rutas `/api`** del matcher (`/((?!api|...))`) — la protección depende de que cada handler llame `verifyAuth()` manualmente; si se olvida, la ruta queda abierta | `src/middleware.ts:133` | 🔴 Crítico |
| POST sí autentica pero GET no en los mismos archivos — inconsistencia sistemática | Varios archivos admin | 🟠 Alto |

**Root cause**: El matcher del middleware tiene una exclusión que deja todas las APIs sin protección por defecto en vez de protegerlas por defecto.

### A02 — Cryptographic Failures 🟠

| Hallazgo | Archivo |
|----------|---------|
| `JWT_SECRET` tiene fallback hardcodeado `'your-secret-key'` — si la env var no está definida, la app usa un secreto trivial y predecible | `src/lib/auth.ts:7` |
| `JWT_EXPIRES_IN` env var se lee pero no se usa — el token siempre expira en `'7d'` hardcodeado | `src/lib/auth.ts:8,29` |
| El login devuelve el JWT tanto en cookie HttpOnly como en el body JSON (`token: token`) — duplica la superficie de ataque innecesariamente | `src/app/api/auth/login/route.ts:57` |
| No hay refresh token — si el JWT se compromete, el atacante tiene acceso completo por 7 días sin forma de invalidarlo | `src/lib/auth.ts` |

### A03 — Injection 🟡

| Hallazgo | Archivo |
|----------|---------|
| Sin validación de schema con Zod en endpoints Admin/Broker — el body se desestructura directamente sin sanitizar ni validar tipos | `admin/clientes/route.ts:83`, `broker/leads/route.ts:12-29` |
| Solo el panel Team Leader usa DTOs con Zod (`TeamDashboardQuerySchema`) | `team-leader/dashboard/route.ts:14` |
| `fechaNacimiento` pasa directo a `new Date()` sin validar formato — puede generar fechas inválidas silenciosamente | `admin/clientes/route.ts:137` |
| Strings no sanitizados van directo a Prisma (Prisma protege de SQL injection pero no de datos malformados) | Varios |

### A04 — Insecure Design 🟡

| Hallazgo |
|----------|
| No hay rate limiting en el endpoint de login — vulnerable a brute force sin restricción |
| No hay CSRF protection explícita (mitigado parcialmente por `sameSite: 'lax'` en cookies) |
| Sin paginación en GET de clientes/leads — carga **todos** los registros, posible DoS/timeout con datasets grandes |
| La regla de negocio "30 días entre leads" se valida solo en broker, no hay test de que un admin no bypasee esa regla via su panel |

### A05 — Security Misconfiguration 🟠

| Hallazgo | Archivo |
|----------|---------|
| `ignoreBuildErrors: true` en TypeScript — puede pasar código con errores de tipos a producción | `next.config.ts:8` |
| `ignoreDuringBuilds: true` en ESLint — silencia warnings de seguridad o código problemático | `next.config.ts:12` |
| No hay security headers configurados: sin `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` | `next.config.ts` |
| Console.logs con datos sensibles en producción: tokens parciales, payloads JWT, emails | `middleware.ts:34,52`, `auth.ts:38,43` |

### A07 — Identification & Authentication Failures 🟠

| Hallazgo |
|----------|
| Sin bloqueo de cuenta ni throttling tras intentos fallidos de login |
| `verifyToken()` verifica que el usuario existe en DB pero **no verifica que el rol del JWT coincida con el rol actual en DB** — si un admin es degradado a broker, su JWT sigue siendo válido como admin hasta que expire |
| Sin validación de complejidad de contraseña en el endpoint de registro |

### A09 — Security Logging & Monitoring Failures 🟡

| Hallazgo |
|----------|
| Logs con emojis y `console.log` no estructurados — imposibles de parsear por herramientas de monitoreo (Datadog, CloudWatch, etc.) |
| No hay audit log de acciones críticas: crear cliente, modificar comisiones, cambiar estado de lead |
| Response 500 expone `details: errorMessage` con el mensaje de error interno al cliente | `admin/clientes/route.ts:60` |

---

## PARTE 2: Análisis Clean Code / SOLID

### Dualidad arquitectónica actual

| Patrón | Usado en | Estado |
|--------|----------|--------|
| **Antiguo**: Prisma directo en route handler, auth manual, try/catch inline, formatting inline | Admin, Broker | ❌ Violaciones SRP, DRY, DIP |
| **Nuevo**: Use Cases + DTOs Zod + `withErrorHandler` + `successResponse`/`errorResponse` | Team Leader | ✅ Clean Architecture correcta |

### Violaciones SOLID detectadas

**S — Single Responsibility Principle**
- Los route handlers de Admin/Broker hacen: autenticación + validación de input + lógica de negocio + queries Prisma + formatting de respuesta + manejo de errores. Todo en una función.
- Ejemplo: `broker/leads/route.ts` tiene 278 líneas con todo mezclado.

**O — Open/Closed Principle**
- Agregar un nuevo panel requiere copiar todo el patrón manual en vez de extender abstracciones existentes.

**D — Dependency Inversion Principle**
- Los handlers dependen directamente de `prisma` (implementación concreta) en vez de abstracciones (ports/interfaces).
- Solo `EmpresaRepository` y `UserRepository` tienen interfaces definidas en `src/core/application/ports/`.

**DRY (Don't Repeat Yourself)**
- El patrón auth + try/catch + formatting se repite en cada endpoint de Admin y Broker.
- Existen `adminHandler`, `brokerHandler` en `src/lib/api-handlers.ts` que resuelven esto — pero los endpoints Admin/Broker no los usan.

### Lo que funciona bien (Team Leader)

```typescript
// team-leader/dashboard/route.ts — patrón CORRECTO
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireTeamLeader(request)
    if (user instanceof Response) return user

    const query = TeamDashboardQuerySchema.parse({ ... }) // Validación Zod
    const useCase = new GetTeamDashboardUseCase(prisma)   // Use Case
    const result = await useCase.execute(user.id, mes, anio)
    return successResponse(result)                        // Response estándar
  })
}
```

---

## PARTE 3: Estructura objetivo

La meta es extender el patrón Team Leader a Admin y Broker, sin tocar lo que ya funciona.

```
src/
├── app/
│   └── api/
│       ├── admin/          # Route handlers thin (~10-15 líneas c/u)
│       ├── broker/         # Route handlers thin (~10-15 líneas c/u)
│       └── team-leader/    # Ya correcto, no tocar
├── core/
│   ├── application/
│   │   ├── dto/
│   │   │   ├── admin.dto.ts          # NUEVO: Zod schemas para admin
│   │   │   ├── broker.dto.ts         # NUEVO: Zod schemas para broker
│   │   │   └── team-leader.dto.ts    # Ya existe
│   │   ├── ports/
│   │   │   ├── ClienteRepository.ts  # NUEVO
│   │   │   ├── LeadRepository.ts     # NUEVO
│   │   │   ├── ComisionRepository.ts # NUEVO
│   │   │   ├── UserRepository.ts     # Ya existe
│   │   │   └── EmpresaRepository.ts  # Ya existe
│   │   └── use-cases/
│   │       ├── admin/                # NUEVO
│   │       │   ├── ListClientesUseCase.ts
│   │       │   ├── CreateClienteUseCase.ts
│   │       │   ├── ListComisionesUseCase.ts
│   │       │   └── CreateComisionUseCase.ts
│   │       ├── broker/               # NUEVO
│   │       │   ├── GetBrokerLeadsUseCase.ts
│   │       │   ├── CreateLeadUseCase.ts
│   │       │   └── GetBrokerVentasUseCase.ts
│   │       └── team-leader/          # Ya existe
│   ├── domain/
│   │   ├── entities/                 # Ya existe (Empresa, UnitTypeTemplate)
│   │   └── exceptions/               # Ya existe
│   └── infrastructure/
│       └── adapters/
│           ├── PrismaClienteRepository.ts   # NUEVO
│           ├── PrismaLeadRepository.ts      # NUEVO
│           ├── PrismaComisionRepository.ts  # NUEVO
│           ├── PrismaUserRepository.ts      # Ya existe
│           └── PrismaEmpresaRepository.ts   # Ya existe
└── lib/
    ├── api-handlers.ts   # Ya existe — adminHandler, brokerHandler, teamLeaderHandler
    └── api-response.ts   # Ya existe — successResponse, errorResponse, withErrorHandler
```

**Route handler objetivo (Admin)**:
```typescript
// src/app/api/admin/clientes/route.ts
export const GET = adminHandler(async (req, ctx, user) => {
  const useCase = new ListClientesUseCase(prisma)
  return successResponse(await useCase.execute())
})

export const POST = adminHandler(async (req, ctx, user) => {
  const body = CreateClienteSchema.parse(await req.json())
  const useCase = new CreateClienteUseCase(prisma)
  return successResponse(await useCase.execute(body), 201)
})
```

---

## PARTE 4: Checklist de progreso

### FASE 1 — Seguridad crítica (inmediata)

- [ ] **SEC-01** Cambiar middleware matcher para incluir rutas `/api`: remover `api` de la exclusión en `src/middleware.ts:133`
- [ ] **SEC-02** Eliminar JWT secret hardcodeado — lanzar error si `JWT_SECRET` no está definida (`src/lib/auth.ts:7`)
- [ ] **SEC-03** Agregar autenticación a `GET /api/admin/clientes` con `adminHandler` (`src/app/api/admin/clientes/route.ts`)
- [ ] **SEC-04** Agregar autenticación a `GET /api/admin/comisiones` con `adminHandler` (`src/app/api/admin/comisiones/route.ts`)
- [ ] **SEC-05** Audit de todos los GETs de admin sin autenticación (revisar cada archivo en `src/app/api/admin/`)
- [ ] **SEC-06** Eliminar `token` del body del response de login (`src/app/api/auth/login/route.ts:57`)
- [ ] **SEC-07** Dejar de exponer `details: errorMessage` en responses 500 — usar `errorResponse()` estándar
- [ ] **SEC-08** Remover console.logs con tokens/payloads sensibles de `auth.ts` y `middleware.ts`
- [ ] **SEC-09** Agregar security headers en `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`
- [ ] **SEC-10** Usar `JWT_EXPIRES_IN` env var en `generateToken()` en vez de hardcode `'7d'`

### FASE 2 — Validación de input con Zod

- [ ] **VAL-01** Crear `src/core/application/dto/admin.dto.ts` con schemas: `CreateClienteSchema`, `UpdateClienteSchema`, `CreateComisionSchema`
- [ ] **VAL-02** Crear `src/core/application/dto/broker.dto.ts` con schemas: `CreateLeadSchema`, `CreateVentaSchema`
- [ ] **VAL-03** Aplicar `CreateClienteSchema.parse()` en `POST /api/admin/clientes`
- [ ] **VAL-04** Aplicar `CreateComisionSchema.parse()` en `POST /api/admin/comisiones`
- [ ] **VAL-05** Aplicar `CreateLeadSchema.parse()` en `POST /api/broker/leads`
- [ ] **VAL-06** Aplicar validación Zod en todos los demás POST/PUT/PATCH de admin y broker

### FASE 3 — Migración a Clean Architecture

#### 3A — Use Cases Admin
- [ ] **CA-01** Crear `ListClientesUseCase.ts` — extraer lógica de `GET /api/admin/clientes`
- [ ] **CA-02** Crear `CreateClienteUseCase.ts` — extraer lógica de `POST /api/admin/clientes`
- [ ] **CA-03** Crear `ListComisionesUseCase.ts` — extraer lógica de `GET /api/admin/comisiones`
- [ ] **CA-04** Crear `CreateComisionUseCase.ts` — extraer lógica de `POST /api/admin/comisiones`
- [ ] **CA-05** Migrar los demás endpoints admin a use cases

#### 3B — Use Cases Broker
- [ ] **CB-01** Crear `GetBrokerLeadsUseCase.ts` — extraer lógica de `GET /api/broker/leads`
- [ ] **CB-02** Crear `CreateLeadUseCase.ts` — extraer lógica de `POST /api/broker/leads`
- [ ] **CB-03** Crear `GetBrokerVentasUseCase.ts` — extraer lógica de `GET /api/broker/ventas`
- [ ] **CB-04** Migrar los demás endpoints broker a use cases

#### 3C — Adoptar wrappers existentes en todos los endpoints
- [ ] **CH-01** Migrar TODOS los endpoints admin a usar `adminHandler` de `src/lib/api-handlers.ts`
- [ ] **CH-02** Migrar TODOS los endpoints broker a usar `brokerHandler` de `src/lib/api-handlers.ts`

### FASE 4 — Robustez

- [ ] **ROB-01** Agregar paginación a `GET /api/admin/clientes` (query params `page`, `limit`)
- [ ] **ROB-02** Agregar paginación a `GET /api/broker/leads`
- [ ] **ROB-03** Agregar paginación a demás endpoints que listen colecciones
- [ ] **ROB-04** Implementar rate limiting en `POST /api/auth/login` (max 5 intentos / 15min por IP)
- [ ] **ROB-05** Verificar en `verifyToken()` que el rol del JWT coincide con el rol actual en DB

### FASE 5 — Limpieza final

- [ ] **CLEAN-01** Remover `ignoreBuildErrors: true` de `next.config.ts` y corregir errores TS
- [ ] **CLEAN-02** Remover `ignoreDuringBuilds: true` de `next.config.ts` y corregir warnings ESLint
- [ ] **CLEAN-03** Reemplazar console.logs de emoji/debug con logging estructurado o removerlos en producción

---

## Recursos existentes a reutilizar (NO recrear)

| Recurso | Archivo | Para qué |
|---------|---------|----------|
| `adminHandler` | `src/lib/api-handlers.ts` | Wrap auth + error handling automático para admin |
| `brokerHandler` | `src/lib/api-handlers.ts` | Wrap auth + error handling automático para broker |
| `teamLeaderHandler` | `src/lib/api-handlers.ts` | Ya se usa en team-leader |
| `successResponse` | `src/lib/api-response.ts` | Response estándar `{ success: true, ... }` |
| `errorResponse` | `src/lib/api-response.ts` | Error estándar `{ success: false, error: ... }` |
| `withErrorHandler` | `src/lib/api-response.ts` | Catch automático de DomainException + ZodError |
| `DomainException` | `src/core/domain/exceptions/` | Errores de dominio tipados |
| `ValidationException` | `src/core/domain/exceptions/` | Errores de validación |
| `team-leader.dto.ts` | `src/core/application/dto/` | Patrón a replicar para admin/broker |
