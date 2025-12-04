# Configuración de Recuperación de Contraseña

## Resumen de la Funcionalidad

Se ha implementado un sistema completo de recuperación de contraseña con las siguientes características:

### ✅ Características Implementadas

1. **Página de Solicitud** (`/forgot-password`)
   - Formulario simple para ingresar email
   - Diseño consistente con el login existente
   - Mensaje de confirmación sin revelar si el email existe (seguridad)

2. **Página de Restablecimiento** (`/reset-password?token=XXX`)
   - Formulario para ingresar nueva contraseña
   - Validación en tiempo real de requisitos de contraseña
   - Indicadores visuales de fortaleza
   - Verificación de token y expiración

3. **API Endpoints**
   - `POST /api/auth/forgot-password` - Solicitar recuperación
   - `POST /api/auth/reset-password` - Actualizar contraseña

4. **Email Transaccional**
   - Template HTML profesional y responsive
   - Link con token seguro
   - Aviso de expiración (1 hora)
   - Diseño acorde a la identidad de RumiRent

5. **Seguridad**
   - ✅ Token criptográficamente seguro (32 bytes aleatorios)
   - ✅ Token hasheado en base de datos (bcrypt)
   - ✅ Expiración automática de 1 hora
   - ✅ Token de un solo uso (se elimina después de usar)
   - ✅ No enumeración de usuarios (misma respuesta para todos)
   - ✅ Validación de contraseña fuerte (8+ caracteres, mayúsculas, minúsculas, números)

---

## 📋 Pasos de Configuración

### 1. Aplicar Migración de Base de Datos

El schema de Prisma ya fue actualizado con dos nuevos campos en el modelo `User`:
- `resetToken: String?` - Token hasheado para validación
- `resetTokenExpiry: DateTime?` - Fecha de expiración

**Aplicar la migración:**

```bash
# Asegúrate de que la base de datos esté corriendo
npx prisma migrate dev

# O regenerar el cliente de Prisma si ya aplicaste la migración
npx prisma generate
```

### 2. Configurar Resend (Servicio de Email)

#### Opción A: Usar Resend (Recomendado)

1. **Crear cuenta en Resend**: https://resend.com/signup
2. **Verificar dominio** (o usar el dominio de prueba para desarrollo)
3. **Obtener API Key**: https://resend.com/api-keys
4. **Agregar al archivo `.env`**:

```bash
# Email Configuration
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXX"
EMAIL_FROM="noreply@rumirent.com"  # Debe ser un email verificado en Resend
```

#### Opción B: Usar Gmail para Desarrollo

Si prefieres usar Gmail para pruebas:

1. Habilita la verificación en dos pasos en tu cuenta de Gmail
2. Genera una contraseña de aplicación: https://myaccount.google.com/apppasswords
3. Modifica `src/lib/email.ts` para usar nodemailer en lugar de Resend:

```bash
pnpm add nodemailer @types/nodemailer
```

```typescript
// src/lib/email.ts (alternativa con nodemailer)
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail({
  to,
  nombre,
  resetToken,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Recuperación de Contraseña - RumiRent',
    html: getPasswordResetEmailTemplate(nombre, resetUrl, '1 hora'),
  });
}
```

Variables de entorno necesarias:
```bash
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-app-password-generado"
EMAIL_FROM="noreply@rumirent.com"
```

### 3. Verificar Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```bash
# Existentes
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"
NEXTAUTH_URL="http://localhost:3000"  # Cambiar en producción

# Nuevas (para email)
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXX"
EMAIL_FROM="noreply@rumirent.com"
```

### 4. Probar la Funcionalidad

1. **Iniciar servidor de desarrollo:**
   ```bash
   pnpm dev
   ```

2. **Flujo de prueba:**
   - Ir a http://localhost:3000/login
   - Hacer clic en "¿Olvidaste tu contraseña?"
   - Ingresar un email de usuario existente
   - Revisar el inbox (o logs si usas modo desarrollo de Resend)
   - Hacer clic en el link del email
   - Ingresar nueva contraseña
   - Iniciar sesión con la nueva contraseña

---

## 📁 Archivos Creados/Modificados

### Archivos Nuevos:
```
src/
├── lib/
│   └── email.ts                            # Servicio de envío de emails
├── app/
│   ├── forgot-password/
│   │   └── page.tsx                        # Página solicitud de recuperación
│   ├── reset-password/
│   │   └── page.tsx                        # Página restablecer contraseña
│   └── api/
│       └── auth/
│           ├── forgot-password/
│           │   └── route.ts                # API endpoint solicitud
│           └── reset-password/
│               └── route.ts                # API endpoint actualización
```

### Archivos Modificados:
```
prisma/
└── schema.prisma                           # Agregados campos resetToken y resetTokenExpiry

src/
├── app/
│   └── login/
│       └── page.tsx                        # Activado link "Olvidaste contraseña"
└── middleware.ts                           # Agregadas rutas públicas

.env.example                                # Agregada configuración de Resend
```

---

## 🔒 Consideraciones de Seguridad

### Token de Recuperación
- Generado con `crypto.randomBytes(32)` (256 bits de entropía)
- Hasheado con bcrypt antes de guardarse en BD
- Expira automáticamente en 1 hora
- Se elimina después de un uso exitoso
- Se elimina si expira

### Validación de Contraseña
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 letra minúscula
- Al menos 1 número

### Prevención de Enumeración de Usuarios
- Siempre retorna el mismo mensaje exitoso, independientemente de si el email existe
- No revela información sobre usuarios existentes

### Protección de Rutas
- Las rutas de recuperación son públicas (no requieren autenticación)
- Configuradas en el middleware para acceso sin login

---

## 🚀 Despliegue a Producción

### 1. Variables de Entorno en Producción

```bash
# Producción
NEXTAUTH_URL="https://rumirent.com"
RESEND_API_KEY="re_prod_XXXXXXXXXXXXXXXXXXXXXXXX"
EMAIL_FROM="noreply@rumirent.com"
```

### 2. Verificar Dominio en Resend

Antes de producción, **debes verificar tu dominio** en Resend:
1. Ir a https://resend.com/domains
2. Agregar tu dominio (ej: `rumirent.com`)
3. Configurar los registros DNS requeridos (SPF, DKIM)
4. Esperar verificación

### 3. Testing en Producción

Realiza pruebas completas del flujo:
- Solicitud de recuperación
- Recepción de email
- Validación de token
- Actualización de contraseña
- Login con nueva contraseña

---

## 🐛 Troubleshooting

### El email no llega

**Posibles causas:**

1. **API Key incorrecta o expirada**
   - Verificar que `RESEND_API_KEY` sea correcta
   - Revisar en https://resend.com/api-keys

2. **Email remitente no verificado**
   - Verificar dominio en Resend
   - O usar el dominio de prueba para desarrollo

3. **Rate limits alcanzados**
   - Resend tiene límites en plan gratuito
   - Revisar dashboard: https://resend.com/overview

4. **Email en carpeta spam**
   - Revisar carpeta de spam
   - Mejorar SPF/DKIM/DMARC records

**Debugging:**

```bash
# Ver logs del servidor
# Los errores de email se loguean en consola
```

### Token inválido o expirado

**Causas comunes:**

1. **Token ya usado** - Los tokens son de un solo uso
2. **Expiró el tiempo** - Tokens expiran en 1 hora
3. **Token manipulado** - Cualquier modificación invalida el token

**Solución:** Solicitar un nuevo link de recuperación

### Error de base de datos

```bash
# Regenerar cliente de Prisma
npx prisma generate

# Aplicar migraciones pendientes
npx prisma migrate deploy
```

---

## 📊 Monitoreo

### Métricas Recomendadas

Monitorea estas métricas en producción:

1. **Solicitudes de recuperación por día**
2. **Tasa de éxito de restablecimiento**
3. **Tokens expirados vs usados**
4. **Emails fallidos**

### Logs Importantes

Los endpoints loguean automáticamente:
- Errores de envío de email
- Intentos con tokens inválidos
- Tokens expirados

---

## 🎨 Personalización

### Modificar Template de Email

Edita `src/lib/email.ts` → función `getPasswordResetEmailTemplate()`:

- Cambiar colores del gradiente
- Agregar logo personalizado
- Modificar textos
- Ajustar estilos

### Cambiar Tiempo de Expiración

Edita `src/app/api/auth/forgot-password/route.ts`:

```typescript
// Cambiar de 1 hora a 30 minutos
const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
```

No olvides actualizar el texto en el template de email también.

---

## ✅ Checklist de Implementación

- [x] Schema de Prisma actualizado
- [x] Migración creada
- [ ] Migración aplicada a base de datos
- [x] Paquete Resend instalado
- [ ] API Key de Resend configurada en `.env`
- [ ] Email FROM configurado en `.env`
- [x] Endpoints de API creados
- [x] Páginas UI creadas
- [x] Middleware actualizado
- [x] Link en login activado
- [ ] Pruebas de flujo completo
- [ ] Dominio verificado en Resend (para producción)

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs de la consola del servidor
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que la base de datos tenga los nuevos campos

**Documentación de Resend:** https://resend.com/docs
