import { EmailProvider, PasswordResetEmailParams, ContactAdminEmailParams } from './types';
import { getEmailConfig } from './config';
import { GmailProvider } from './providers/gmail';
import { SMTPProvider } from './providers/smtp';
import { ResendProvider } from './providers/resend';
import { getPasswordResetEmailTemplate, getContactAdminEmailTemplate } from './templates';

// Factory function to get the appropriate email provider
function getEmailProvider(): EmailProvider {
  const config = getEmailConfig();

  console.log(`[Email] Using provider: ${config.provider}`);

  switch (config.provider) {
    case 'gmail':
      return new GmailProvider(config);
    case 'smtp':
      return new SMTPProvider(config);
    case 'resend':
      return new ResendProvider(config);
    default:
      console.warn(`[Email] Unknown provider: ${config.provider}, falling back to SMTP`);
      return new SMTPProvider(config);
  }
}

/**
 * Send password reset email
 * @param params Password reset email parameters
 */
export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
  const { to, nombre, resetToken } = params;

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
  const expirationTime = '1 hora';

  const html = getPasswordResetEmailTemplate(nombre, resetUrl, expirationTime);

  const provider = getEmailProvider();

  const result = await provider.sendEmail({
    to,
    subject: 'Recuperación de Contraseña - RumiRent',
    html,
    text: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nHaz clic en el siguiente enlace para crear una nueva contraseña:\n${resetUrl}\n\nEste enlace expirará en ${expirationTime}.\n\nSi no solicitaste este cambio, puedes ignorar este correo.\n\n© ${new Date().getFullYear()} RumiRent`,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to send password reset email');
  }

  return result;
}

/**
 * Send contact admin email
 * @param params Contact admin email parameters
 */
export async function sendContactAdminEmail(params: ContactAdminEmailParams) {
  const { fromEmail, fromName, message } = params;

  // Get admin email from environment variables
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL environment variable is not configured');
  }

  const html = getContactAdminEmailTemplate(fromName, fromEmail, message);

  const provider = getEmailProvider();

  const result = await provider.sendEmail({
    to: adminEmail,
    subject: `Nueva solicitud de acceso - ${fromName}`,
    html,
    text: `Nueva solicitud de acceso a RumiRent\n\nNombre: ${fromName}\nEmail: ${fromEmail}\n\nMensaje:\n${message}\n\nResponde directamente a: ${fromEmail}`,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to send contact admin email');
  }

  return result;
}

// Export types for convenience
export type { PasswordResetEmailParams, ContactAdminEmailParams };
export { getEmailConfig } from './config';
