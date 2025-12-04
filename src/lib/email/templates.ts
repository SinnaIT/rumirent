// Email templates for RumiRent

export function getPasswordResetEmailTemplate(
  nombre: string,
  resetUrl: string,
  expirationTime: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de Contraseña</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">RumiRent</h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Sistema de Gestión de Brokers</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 24px; font-weight: 600;">Recuperación de Contraseña</h2>

                  <p style="margin: 0 0 16px 0; color: #3f3f46; font-size: 16px; line-height: 24px;">
                    Hola <strong>${nombre}</strong>,
                  </p>

                  <p style="margin: 0 0 24px 0; color: #3f3f46; font-size: 16px; line-height: 24px;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú quien lo solicitó, haz clic en el botón de abajo para crear una nueva contraseña:
                  </p>

                  <!-- Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}"
                           style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                          Restablecer Contraseña
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 16px 0; color: #71717a; font-size: 14px; line-height: 20px;">
                    O copia y pega este enlace en tu navegador:
                  </p>

                  <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f4f4f5; border-radius: 4px; word-break: break-all;">
                    <a href="${resetUrl}" style="color: #667eea; text-decoration: none; font-size: 14px;">
                      ${resetUrl}
                    </a>
                  </p>

                  <!-- Warning Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                    <tr>
                      <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 20px;">
                          ⚠️ <strong>Importante:</strong> Este enlace expirará en <strong>${expirationTime}</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px; line-height: 20px;">
                    Si tienes problemas con el botón, copia y pega el enlace directamente en tu navegador.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 40px; background-color: #fafafa; border-radius: 0 0 8px 8px; border-top: 1px solid #e4e4e7;">
                  <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; line-height: 18px; text-align: center;">
                    Este correo fue enviado automáticamente por RumiRent
                  </p>
                  <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 16px; text-align: center;">
                    © ${new Date().getFullYear()} RumiRent. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getContactAdminEmailTemplate(
  userName: string,
  userEmail: string,
  message: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo mensaje de contacto - RumiRent</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">RumiRent</h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Nuevo mensaje de contacto</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #18181b; font-size: 24px; font-weight: 600;">Solicitud de Acceso</h2>

                  <p style="margin: 0 0 24px 0; color: #3f3f46; font-size: 16px; line-height: 24px;">
                    Has recibido un nuevo mensaje de contacto desde la página de login de RumiRent.
                  </p>

                  <!-- User Info Box -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                    <tr>
                      <td style="padding: 20px; background-color: #f4f4f5; border-radius: 6px;">
                        <p style="margin: 0 0 12px 0; color: #71717a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Información del usuario
                        </p>
                        <p style="margin: 0 0 8px 0; color: #18181b; font-size: 16px;">
                          <strong>Nombre:</strong> ${userName}
                        </p>
                        <p style="margin: 0; color: #18181b; font-size: 16px;">
                          <strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #667eea; text-decoration: none;">${userEmail}</a>
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Message Box -->
                  <div style="margin: 24px 0;">
                    <p style="margin: 0 0 12px 0; color: #71717a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Mensaje
                    </p>
                    <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px;">
                      <p style="margin: 0; color: #3f3f46; font-size: 15px; line-height: 24px; white-space: pre-wrap;">
${message}
                      </p>
                    </div>
                  </div>

                  <!-- Action Button -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="mailto:${userEmail}"
                           style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
                          Responder al usuario
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px; line-height: 20px; text-align: center;">
                    Puedes responder directamente haciendo clic en el botón o escribiendo a ${userEmail}
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 40px; background-color: #fafafa; border-radius: 0 0 8px 8px; border-top: 1px solid #e4e4e7;">
                  <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px; line-height: 18px; text-align: center;">
                    Este correo fue enviado automáticamente por RumiRent
                  </p>
                  <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 16px; text-align: center;">
                    © ${new Date().getFullYear()} RumiRent. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
