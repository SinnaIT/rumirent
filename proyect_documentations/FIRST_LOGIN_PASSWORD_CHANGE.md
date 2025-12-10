# Cambio de Contraseña Obligatorio en Primer Login

## Resumen de la Funcionalidad

Se ha implementado un sistema de cambio de contraseña obligatorio para usuarios recién creados. Cuando un administrador crea un nuevo usuario (broker o admin), ese usuario deberá cambiar su contraseña en el primer inicio de sesión antes de poder acceder al sistema.

---

## 🎯 Características Implementadas

### 1. **Base de Datos**
- ✅ Campo `mustChangePassword: Boolean` - Indica si el usuario debe cambiar contraseña
- ✅ Campo `lastPasswordChange: DateTime` - Timestamp del último cambio de contraseña
- ✅ Valores por defecto configurados

### 2. **Flujo de Creación de Usuarios**
- ✅ Al crear un broker → `mustChangePassword: true`
- ✅ Al crear un admin → `mustChangePassword: true`
- ✅ Cuando admin cambia password de usuario → `mustChangePassword: true` (forzar cambio)

### 3. **Flujo de Login**
- ✅ API retorna `mustChangePassword` en la respuesta
- ✅ Frontend detecta el flag
- ✅ Redirección automática a `/change-password` si es `true`
- ✅ Usuarios no pueden acceder al dashboard hasta cambiar contraseña

### 4. **Página de Cambio de Contraseña**
- ✅ Diseño consistente con las demás páginas de auth
- ✅ Modo "primer login" (no pide contraseña actual)
- ✅ Modo "cambio normal" (pide contraseña actual)
- ✅ Validación en tiempo real de requisitos
- ✅ Indicadores visuales de fortaleza
- ✅ Mensaje especial para primer login
- ✅ Redirección automática al dashboard después del cambio

### 5. **API Endpoint**
- ✅ `POST /api/auth/change-password`
- ✅ Requiere autenticación (JWT)
- ✅ Valida contraseña actual (excepto primer login)
- ✅ Valida contraseña nueva (8+ caracteres, mayúsculas, minúsculas, números)
- ✅ Actualiza contraseña con bcrypt
- ✅ Setea `mustChangePassword: false`
- ✅ Actualiza `lastPasswordChange`

### 6. **Middleware**
- ✅ Permite acceso a `/change-password` para usuarios autenticados
- ✅ Permite acceso a `/api/auth/change-password`
- ✅ No bloquea usuarios con `mustChangePassword: true` en esta ruta

### 7. **Seguridad**
- ✅ Contraseña actual requerida (excepto primer login)
- ✅ Validación de contraseña fuerte
- ✅ Password hasheado con bcrypt (12 rounds)
- ✅ Timestamp de cambios
- ✅ No permite bypass del cambio de contraseña

---

## 📋 Flujo del Usuario

### Caso 1: Usuario Nuevo (Primer Login)

1. **Admin crea usuario**
   - Admin ingresa email, nombre, RUT, y contraseña temporal
   - Sistema crea usuario con `mustChangePassword: true`

2. **Usuario hace primer login**
   - Ingresa email y contraseña temporal
   - Sistema autentica y retorna `mustChangePassword: true`
   - Frontend detecta el flag

3. **Redirección automática**
   - Usuario es redirigido a `/change-password`
   - Página muestra mensaje: "Este es tu primer inicio de sesión..."
   - No se pide contraseña actual (porque es primer login)

4. **Usuario cambia contraseña**
   - Ingresa nueva contraseña (cumpliendo requisitos)
   - Confirma nueva contraseña
   - Sistema actualiza: `mustChangePassword: false`, `lastPasswordChange: now()`

5. **Acceso al dashboard**
   - Usuario es redirigido automáticamente a su dashboard
   - Logins futuros van directo al dashboard

### Caso 2: Admin Resetea Contraseña de Usuario

1. **Admin cambia contraseña de usuario existente**
   - Admin va a edición de broker/usuario
   - Ingresa nueva contraseña temporal
   - Sistema actualiza con `mustChangePassword: true`

2. **Usuario hace login**
   - Similar al flujo de primer login
   - Debe cambiar contraseña antes de acceder

### Caso 3: Usuario Cambia Su Propia Contraseña (Voluntario)

1. **Usuario accede a cambio de contraseña**
   - Desde el dashboard (futuro: agregar link en perfil)
   - O navegando manualmente a `/change-password`

2. **Formulario solicita contraseña actual**
   - Como no es primer login, se pide contraseña actual
   - Usuario ingresa contraseña actual
   - Usuario ingresa nueva contraseña y confirma

3. **Actualización exitosa**
   - Sistema valida contraseña actual
   - Actualiza contraseña nueva
   - `lastPasswordChange` actualizado

---

## 🗂️ Estructura de Archivos

### Archivos Nuevos:
```
src/
├── app/
│   ├── change-password/
│   │   └── page.tsx                      # Página de cambio de contraseña
│   └── api/
│       └── auth/
│           └── change-password/
│               └── route.ts              # API endpoint
└── docs/
    └── FIRST_LOGIN_PASSWORD_CHANGE.md   # Esta documentación
```

### Archivos Modificados:
```
prisma/
└── schema.prisma                         # Campos mustChangePassword y lastPasswordChange

src/
├── app/
│   ├── login/
│   │   └── page.tsx                      # Redirección en primer login
│   └── api/
│       ├── auth/
│       │   └── login/
│       │       └── route.ts              # Retorna mustChangePassword
│       └── admin/
│           ├── brokers/
│           │   ├── route.ts              # Setea mustChangePassword al crear
│           │   └── [id]/
│           │       └── route.ts          # Setea mustChangePassword al editar
│           └── usuarios/
│               ├── route.ts              # Setea mustChangePassword al crear
│               └── [id]/
│                   └── route.ts          # Setea mustChangePassword al editar
└── middleware.ts                         # Permite acceso a /change-password
```

---

## 🔐 Validaciones de Seguridad

### Requisitos de Contraseña:
```
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula (A-Z)
- Al menos 1 letra minúscula (a-z)
- Al menos 1 número (0-9)
```

### Validaciones de Backend:
```typescript
// En /api/auth/change-password/route.ts
const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Confirmación de contraseña requerida'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
```

### Casos Especiales:
1. **Primer login**: No requiere contraseña actual
2. **Usuario con `mustChangePassword: false`**: Requiere contraseña actual
3. **Admin resetea password**: Usuario automáticamente tiene `mustChangePassword: true`

---

## 🚀 Implementación Técnica

### 1. Modelo de Datos (Prisma)

```prisma
model User {
  id                 String        @id @default(cuid())
  email              String        @unique
  password           String
  nombre             String
  rut                String        @unique
  telefono           String?
  birthDate          DateTime?
  role               Role          @default(BROKER)
  activo             Boolean       @default(true)
  resetToken         String?
  resetTokenExpiry   DateTime?
  mustChangePassword Boolean       @default(false)  // ← NUEVO
  lastPasswordChange DateTime?                      // ← NUEVO
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  // ... relaciones
}
```

### 2. Creación de Usuario (Admin)

```typescript
// En POST /api/admin/brokers o /api/admin/usuarios
const newUser = await prisma.user.create({
  data: {
    email,
    nombre,
    rut,
    password: hashedPassword,
    role: 'BROKER', // o 'ADMIN'
    activo: true,
    mustChangePassword: true,     // ← Forzar cambio
    lastPasswordChange: null      // ← Sin cambios previos
  }
})
```

### 3. Login con Validación

```typescript
// En POST /api/auth/login
const response = NextResponse.json({
  user: {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role,
    mustChangePassword: user.mustChangePassword  // ← Incluir flag
  },
  token: token
})
```

### 4. Frontend - Redirección

```typescript
// En /app/login/page.tsx
if (data.user.mustChangePassword) {
  console.log('Usuario debe cambiar contraseña, redirigiendo...')
  router.push('/change-password')
  return
}
```

### 5. Cambio de Contraseña

```typescript
// En POST /api/auth/change-password
// Si es primer login, no validar contraseña actual
if (!user.mustChangePassword) {
  if (!currentPassword) {
    return NextResponse.json(
      { error: 'Contraseña actual requerida' },
      { status: 400 }
    );
  }
  // Validar contraseña actual
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password
  );
}

// Actualizar usuario
await prisma.user.update({
  where: { id: user.id },
  data: {
    password: hashedPassword,
    mustChangePassword: false,         // ← Resetear flag
    lastPasswordChange: new Date(),    // ← Timestamp
    updatedAt: new Date(),
  },
})
```

### 6. Middleware - Permitir Acceso

```typescript
// En src/middleware.ts
const authOnlyRoutes = [
  '/change-password',
  '/api/auth/change-password',
  '/api/auth/me'
]

// Permitir acceso si está autenticado
if (isAuthOnlyRoute) {
  console.log(`[MIDDLEWARE] Permitiendo acceso a ruta auth-only: ${pathname}`)
  return NextResponse.next()
}
```

---

## 🧪 Testing

### Pruebas Recomendadas:

#### 1. Crear Usuario y Primer Login
```bash
# Como admin:
1. Ir a /admin/brokers
2. Crear nuevo broker con email test@example.com y password temporal "Test1234"
3. Logout

# Como usuario nuevo:
4. Login con test@example.com / Test1234
5. Verificar redirección a /change-password
6. Cambiar contraseña a "NewPass123"
7. Verificar redirección a dashboard
8. Logout y login con nueva contraseña
9. Verificar que va directo al dashboard
```

#### 2. Admin Resetea Contraseña
```bash
# Como admin:
1. Editar un broker existente
2. Cambiar su contraseña a "Reset1234"
3. Guardar

# Como broker:
4. Login con nueva contraseña
5. Verificar que pide cambio de contraseña
6. Cambiar a nueva contraseña personal
```

#### 3. Usuario Cambia Su Propia Contraseña
```bash
# Como usuario autenticado:
1. Navegar a /change-password
2. Ingresar contraseña actual
3. Ingresar nueva contraseña
4. Verificar que pide contraseña actual (no es primer login)
5. Actualizar exitosamente
```

#### 4. Validaciones de Seguridad
```bash
# Probar contraseñas débiles:
1. "test" → Error: mínimo 8 caracteres
2. "testtest" → Error: falta mayúscula y número
3. "TestTest" → Error: falta número
4. "TestTest1" → ✓ Válida

# Probar contraseñas que no coinciden:
1. Password: "Test1234"
2. Confirm: "Test5678"
3. Error: "Las contraseñas no coinciden"

# Probar bypass:
1. Intentar acceder a /admin sin cambiar contraseña
2. Middleware debe redirigir de vuelta a /change-password
```

---

## 📊 Base de Datos - Migración

### Aplicar Migración:

```bash
# Método 1: Con base de datos corriendo
npx prisma migrate dev --name add_password_change_fields

# Método 2: Solo regenerar cliente
npx prisma generate
```

### SQL Generado (aproximado):

```sql
ALTER TABLE "users"
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lastPasswordChange" TIMESTAMP;
```

### Actualizar Usuarios Existentes (Opcional):

Si quieres forzar cambio de contraseña a todos los usuarios existentes:

```sql
UPDATE "users"
SET "mustChangePassword" = true,
    "lastPasswordChange" = NULL
WHERE "mustChangePassword" = false;
```

---

## 🎨 UI/UX

### Página de Cambio de Contraseña

**Elementos visuales:**
- Logo de RumiRent
- Título dinámico ("Cambio de Contraseña Obligatorio" vs "Cambiar Contraseña")
- Descripción contextual
- Alerta amarilla para primer login
- Campos de contraseña con toggle de visibilidad
- Indicadores visuales de requisitos (checkmarks verdes)
- Botón de acción prominente
- Mensajes de error claros
- Mensaje de éxito con redirección automática

**Responsive:**
- Adaptado para móviles
- Breakpoints consistentes con otras páginas
- Tamaños de fuente escalables

**Tema:**
- Soporte para dark mode
- Gradientes azules/morados consistentes
- Transiciones suaves

---

## 🔄 Posibles Mejoras Futuras

### Funcionalidades Adicionales:

1. **Expiración de Contraseñas**
   - Forzar cambio cada X meses
   - Usar campo `lastPasswordChange` para calcular
   - Notificar antes de expiración

2. **Historial de Contraseñas**
   - Prevenir reutilización de últimas N contraseñas
   - Crear tabla `PasswordHistory`

3. **Link en Dashboard**
   - Agregar "Cambiar Contraseña" en menú de perfil
   - Acceso voluntario para cambio de contraseña

4. **Políticas de Contraseña Configurables**
   - Admin puede configurar requisitos
   - Longitud mínima, caracteres especiales, etc.

5. **Notificación por Email**
   - Enviar email cuando contraseña es cambiada
   - Alertar al usuario de cambios

6. **Bloqueo por Intentos Fallidos**
   - Bloquear cuenta después de N intentos
   - Implementar rate limiting

7. **2FA (Two-Factor Authentication)**
   - Agregar capa adicional de seguridad
   - SMS, TOTP, o email

---

## 🐛 Troubleshooting

### Problema: Usuario no es redirigido a /change-password

**Posibles causas:**
1. Frontend no está leyendo `mustChangePassword` correctamente
2. API no está retornando el campo

**Solución:**
```bash
# Verificar respuesta de login en browser console
# Debe incluir: { user: { ..., mustChangePassword: true } }

# Verificar en base de datos
SELECT email, "mustChangePassword" FROM users WHERE email = 'test@example.com';
```

### Problema: Error "Contraseña actual requerida" en primer login

**Posible causa:**
El flag `mustChangePassword` no está en `true` en la base de datos

**Solución:**
```sql
UPDATE users
SET "mustChangePassword" = true
WHERE email = 'usuario@example.com';
```

### Problema: Middleware redirige de /change-password a /login

**Posible causa:**
Token de autenticación no está presente o es inválido

**Solución:**
```bash
# Verificar cookie en browser DevTools → Application → Cookies
# Debe existir: auth-token

# Si no existe, hacer login nuevamente
```

### Problema: Contraseña no cumple requisitos pero el error no aparece

**Posible causa:**
Validación de frontend no está sincronizada con backend

**Solución:**
```typescript
// Verificar que los regex coincidan en:
// - /app/change-password/page.tsx (frontend)
// - /api/auth/change-password/route.ts (backend)
```

---

## ✅ Checklist de Implementación

- [x] Schema de Prisma actualizado
- [x] Migración creada
- [ ] Migración aplicada a base de datos (por el usuario)
- [x] API endpoint `/api/auth/change-password` creado
- [x] Endpoints de creación de usuarios actualizados
- [x] Endpoints de edición de usuarios actualizados
- [x] Login API retorna `mustChangePassword`
- [x] Página `/change-password` creada
- [x] Login page redirige a `/change-password`
- [x] Middleware actualizado
- [ ] Pruebas de flujo completo
- [ ] Link en dashboard para cambio voluntario (futuro)

---

## 📞 Notas Adicionales

### Consideraciones de Producción:

1. **Migración de Usuarios Existentes**:
   - Los usuarios existentes tendrán `mustChangePassword: false`
   - No se verán afectados por este cambio
   - Opcional: forzar cambio a todos con SQL

2. **Comunicación con Usuarios**:
   - Admin debe informar a nuevos usuarios sobre la política
   - Contraseña temporal debe ser comunicada de forma segura
   - Considerar enviar email con link directo

3. **Logging y Auditoría**:
   - Se registra `lastPasswordChange` para auditoría
   - Considerar agregar logs de cambios de contraseña
   - Útil para compliance y seguridad

4. **Compatibilidad**:
   - Compatible con sistema de recuperación de contraseña existente
   - No interfiere con el flujo de reset por email
   - Ambos sistemas pueden coexistir

---

## 📚 Referencias

- **Prisma**: https://www.prisma.io/docs/
- **Next.js Middleware**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **bcrypt**: https://www.npmjs.com/package/bcryptjs
- **Zod Validation**: https://zod.dev/

---

**Documentación actualizada**: 2025
**Versión**: 1.0
