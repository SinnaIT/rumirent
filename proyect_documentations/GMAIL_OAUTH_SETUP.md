# Configuración de Gmail con OAuth2 para RumiRent

## Resumen

Este documento explica cómo configurar Gmail con OAuth2 para enviar emails desde la aplicación RumiRent de forma segura. OAuth2 es más seguro que usar contraseñas de aplicación y es el método recomendado por Google.

---

## 🎯 ¿Por qué OAuth2?

### Ventajas:
- ✅ **Más seguro**: No necesitas compartir tu contraseña
- ✅ **Tokens renovables**: Los refresh tokens no expiran (a menos que se revoquen)
- ✅ **Recomendado por Google**: Método oficial y soportado
- ✅ **Límites más altos**: Mejor límite de envío que con contraseñas de aplicación

### Alternativas:
- **SMTP con App Password**: Más simple pero menos seguro (ver sección alternativa)
- **Resend**: Servicio comercial de terceros (requiere pago para producción)

---

## 📋 Requisitos Previos

1. Cuenta de Gmail activa
2. Acceso a [Google Cloud Console](https://console.cloud.google.com/)
3. Permisos para crear proyectos en Google Cloud (o acceso a uno existente)

---

## 🚀 Paso a Paso: Configuración de Gmail OAuth2

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com/
2. Clic en el selector de proyectos (arriba a la izquierda)
3. Clic en "**NUEVO PROYECTO**"
4. Nombre: `RumiRent Email` (o el que prefieras)
5. Clic en "**Crear**"
6. Espera a que se cree el proyecto y selecciónalo

### Paso 2: Habilitar Gmail API

1. En el menú lateral, ve a "**APIs y servicios**" → "**Biblioteca**"
2. Busca "**Gmail API**"
3. Clic en "**Gmail API**"
4. Clic en "**HABILITAR**"
5. Espera a que se habilite (puede tomar unos segundos)

### Paso 3: Configurar Pantalla de Consentimiento OAuth

1. En el menú lateral, ve a "**APIs y servicios**" → "**Pantalla de consentimiento de OAuth**"
2. Selecciona "**Externo**" (a menos que tengas Google Workspace)
3. Clic en "**CREAR**"

**Información de la aplicación:**
- **Nombre de la aplicación**: `RumiRent`
- **Correo electrónico de asistencia al usuario**: Tu email de admin
- **Logotipo de la aplicación**: (Opcional) Logo de RumiRent
- **Dominios autorizados**: (Opcional) Tu dominio
- **Información de contacto del desarrollador**: Tu email

4. Clic en "**GUARDAR Y CONTINUAR**"

**Ámbitos:**
5. Clic en "**AGREGAR O QUITAR ÁMBITOS**"
6. Busca y selecciona: `https://mail.google.com/`
7. Clic en "**ACTUALIZAR**"
8. Clic en "**GUARDAR Y CONTINUAR**"

**Usuarios de prueba (importante):**
9. Clic en "**AGREGAR USUARIOS**"
10. Agrega el email de Gmail que usarás para enviar emails
11. Clic en "**AGREGAR**"
12. Clic en "**GUARDAR Y CONTINUAR**"

**Resumen:**
13. Revisa y clic en "**VOLVER AL PANEL**"

### Paso 4: Crear Credenciales OAuth 2.0

1. En el menú lateral, ve a "**APIs y servicios**" → "**Credenciales**"
2. Clic en "**+ CREAR CREDENCIALES**" → "**ID de cliente de OAuth 2.0**"

**Tipo de aplicación:**
3. Selecciona "**Aplicación web**"

**Nombre:**
4. Nombre: `RumiRent Email Client`

**URI de redireccionamiento autorizados:**
5. Clic en "**+ Agregar URI**"
6. Agregar: `https://developers.google.com/oauthplayground`
7. Clic en "**CREAR**"

**Guardar credenciales:**
8. Copia y guarda de forma segura:
   - **ID de cliente** (ejemplo: `123456-abcdef.apps.googleusercontent.com`)
   - **Secreto del cliente** (ejemplo: `GOCSPX-xyz123`)
9. Clic en "**ACEPTAR**"

### Paso 5: Obtener Refresh Token con OAuth Playground

1. Ve a https://developers.google.com/oauthplayground
2. Clic en el ícono de **⚙️ (engranaje)** arriba a la derecha
3. Marca "**Use your own OAuth credentials**"
4. Pega tus credenciales:
   - **OAuth Client ID**: El ID que copiaste en paso 4
   - **OAuth Client secret**: El secreto que copiaste en paso 4
5. Clic en "**Close**"

**Seleccionar ámbitos:**
6. En el panel izquierdo, busca "**Gmail API v1**"
7. Expándelo y selecciona: `https://mail.google.com/`
8. Clic en "**Authorize APIs**"

**Autorizar:**
9. Selecciona tu cuenta de Gmail
10. Si ves advertencia "Google hasn't verified this app":
    - Clic en "**Advanced**"
    - Clic en "**Go to RumiRent (unsafe)**" (es seguro porque es tu propia app)
11. Clic en "**Continue**" para permitir acceso
12. Serás redirigido de vuelta al OAuth Playground

**Obtener tokens:**
13. Clic en "**Exchange authorization code for tokens**"
14. Copia y guarda el "**Refresh token**" (ejemplo: `1//xyz-abc123...`)

---

## 🔧 Configuración en RumiRent

### Opción A: Variables de Entorno (Recomendado)

Edita tu archivo `.env`:

```bash
# Email Configuration
EMAIL_PROVIDER="gmail"
EMAIL_FROM="tu-email@gmail.com"
ADMIN_EMAIL="admin@tudominio.com"

# Gmail OAuth2
GMAIL_CLIENT_ID="123456-abcdef.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-xyz123"
GMAIL_REFRESH_TOKEN="1//xyz-abc123..."
GMAIL_USER="tu-email@gmail.com"
```

**Importante:**
- `GMAIL_USER` debe ser el mismo email que autorizaste en OAuth Playground
- `EMAIL_FROM` puede ser el mismo o diferente (pero debe ser del mismo dominio en producción)

### Opción B: Variables de Entorno en Producción

Para despliegue en VPS o Docker:

```bash
# En tu servidor
export EMAIL_PROVIDER="gmail"
export EMAIL_FROM="tu-email@gmail.com"
export ADMIN_EMAIL="admin@tudominio.com"
export GMAIL_CLIENT_ID="123456-abcdef.apps.googleusercontent.com"
export GMAIL_CLIENT_SECRET="GOCSPX-xyz123"
export GMAIL_REFRESH_TOKEN="1//xyz-abc123..."
export GMAIL_USER="tu-email@gmail.com"
```

---

## 🧪 Probar la Configuración

### Prueba 1: Recuperación de Contraseña

1. Iniciar servidor: `pnpm dev`
2. Ir a http://localhost:3000/forgot-password
3. Ingresar email de un usuario existente
4. Verificar que el email llega correctamente

### Prueba 2: Revisar Logs

```bash
# Deberías ver en la consola:
[Email] Using provider: gmail
[Gmail] Email sent successfully: <message-id>
```

### Prueba 3: Probar con Código

Crear archivo `test-email.ts`:

```typescript
import { sendPasswordResetEmail } from './src/lib/email';

async function test() {
  try {
    await sendPasswordResetEmail({
      to: 'test@example.com',
      nombre: 'Usuario Test',
      resetToken: 'test-token-123',
    });
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

Ejecutar:
```bash
npx tsx test-email.ts
```

---

## 🔒 Seguridad

### Mejores Prácticas:

1. **Nunca** commits credenciales en Git
   ```bash
   # Verificar que .env está en .gitignore
   cat .gitignore | grep .env
   ```

2. **Rotar** credenciales regularmente (cada 6-12 meses)

3. **Revocar** acceso si se comprometen credenciales:
   - Ir a Google Cloud Console → Credenciales
   - Eliminar el cliente OAuth
   - Crear uno nuevo

4. **Limitar** ámbitos al mínimo necesario:
   - Solo usar `https://mail.google.com/` (envío de emails)
   - No usar ámbitos más amplios

5. **Monitorear** uso en Google Cloud Console:
   - Revisar cuotas y límites
   - Verificar actividad sospechosa

### Límites de Gmail:

- **Usuarios Gmail normales**:
  - 500 emails/día
  - 100 destinatarios/email

- **Google Workspace**:
  - 2,000 emails/día
  - 2,000 destinatarios/email

---

## 🐛 Troubleshooting

### Error: "invalid_grant" o "Token has been expired or revoked"

**Causa:** El refresh token expiró o fue revocado

**Solución:**
1. Ir a OAuth Playground
2. Repetir paso 5 para obtener nuevo refresh token
3. Actualizar `GMAIL_REFRESH_TOKEN` en `.env`

### Error: "Insufficient Permission"

**Causa:** No se seleccionó el ámbito correcto

**Solución:**
1. Verificar que se seleccionó `https://mail.google.com/`
2. Repetir paso 5 en OAuth Playground

### Error: "Access blocked: RumiRent has not completed verification"

**Causa:** La app no está verificada por Google

**Solución:**
1. Asegurarse de haber agregado tu email en "Usuarios de prueba" (Paso 3.9)
2. O publicar la app (si es para producción)

### Error: "Daily sending quota exceeded"

**Causa:** Superaste el límite de 500 emails/día

**Soluciones:**
1. Esperar 24 horas para que se resetee la cuota
2. Usar Google Workspace (límites más altos)
3. Cambiar a Resend o SendGrid

### Emails no llegan (sin error)

**Revisar:**
1. Carpeta de spam del destinatario
2. Logs de la aplicación: `[Gmail] Email sent successfully`
3. Panel de Google Cloud: APIs y servicios → Panel de control
4. Configurar SPF/DKIM para tu dominio (producción)

---

## 🔄 Alternativas

### Alternativa 1: SMTP con App Password (Más Simple)

Si OAuth2 es muy complejo para desarrollo/testing:

**Pasos:**
1. Habilitar verificación en 2 pasos en Gmail
2. Ir a https://myaccount.google.com/apppasswords
3. Crear contraseña de aplicación
4. Usar configuración SMTP:

```bash
EMAIL_PROVIDER="smtp"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="abcd efgh ijkl mnop"  # App password (16 caracteres)
```

**Nota:** Google está deshabilitando App Passwords progresivamente. OAuth2 es el futuro.

### Alternativa 2: Resend (Servicio Comercial)

**Ventajas:**
- Muy fácil de configurar
- No necesitas Google Cloud
- Mejor deliverability

**Desventajas:**
- Requiere pago para producción
- 100 emails/mes en plan gratuito

**Configuración:**
```bash
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_XXXXXXXXXXXX"
```

---

## 📊 Comparación de Proveedores

| Característica | Gmail OAuth2 | SMTP (App Pass) | Resend |
|----------------|--------------|-----------------|--------|
| Configuración | ⭐⭐⭐ Compleja | ⭐⭐ Media | ⭐ Simple |
| Seguridad | ⭐⭐⭐ Alta | ⭐⭐ Media | ⭐⭐⭐ Alta |
| Costo | ✅ Gratis | ✅ Gratis | 💰 Pago |
| Límite diario | 500 emails | 500 emails | 100 (gratis) |
| Mantenimiento | Bajo | Medio | Muy bajo |
| Recomendado para | Producción | Testing | Producción |

---

## 📚 Referencias

- **Google OAuth2**: https://developers.google.com/identity/protocols/oauth2
- **Gmail API**: https://developers.google.com/gmail/api
- **OAuth Playground**: https://developers.google.com/oauthplayground
- **Nodemailer Gmail**: https://nodemailer.com/usage/using-gmail/
- **Google APIs Node**: https://github.com/googleapis/google-api-nodejs-client

---

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Google Cloud Console
- [ ] Gmail API habilitada
- [ ] Pantalla de consentimiento configurada
- [ ] Email agregado como usuario de prueba
- [ ] Credenciales OAuth 2.0 creadas
- [ ] Client ID y Client Secret guardados
- [ ] Refresh Token obtenido desde OAuth Playground
- [ ] Variables de entorno configuradas en `.env`
- [ ] Email de prueba enviado exitosamente
- [ ] Verificado que emails llegan (no en spam)

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisar logs de la aplicación
2. Verificar que todos los pasos fueron seguidos
3. Revisar sección de Troubleshooting
4. Verificar cuotas en Google Cloud Console

**Documentación actualizada**: 2025
**Versión**: 1.0
