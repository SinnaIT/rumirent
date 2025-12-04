// Email provider interface for flexibility
export interface EmailProvider {
  sendEmail(params: SendEmailParams): Promise<EmailResult>;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PasswordResetEmailParams {
  to: string;
  nombre: string;
  resetToken: string;
}

export interface ContactAdminEmailParams {
  fromEmail: string;
  fromName: string;
  message: string;
}

export type EmailProviderType = 'gmail' | 'smtp' | 'resend';