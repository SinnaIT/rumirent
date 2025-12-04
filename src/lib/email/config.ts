import { EmailProviderType } from './types';

export interface EmailConfig {
  provider: EmailProviderType;
  from: string;

  // Gmail OAuth2 configuration
  gmail?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    user: string;
  };

  // Generic SMTP configuration (fallback)
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  // Resend configuration (if switching back)
  resend?: {
    apiKey: string;
  };
}

export function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'gmail') as EmailProviderType;

  const config: EmailConfig = {
    provider,
    from: process.env.EMAIL_FROM || 'noreply@rumirent.com',
  };

  // Configure based on provider
  switch (provider) {
    case 'gmail':
      config.gmail = {
        clientId: process.env.GMAIL_CLIENT_ID || '',
        clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
        refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
        user: process.env.GMAIL_USER || process.env.EMAIL_FROM || '',
      };

      // Validate Gmail config
      if (!config.gmail.clientId || !config.gmail.clientSecret || !config.gmail.refreshToken) {
        console.warn('[EMAIL] Gmail OAuth2 credentials not configured. Email sending may fail.');
      }
      break;

    case 'smtp':
      config.smtp = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      };

      // Validate SMTP config
      if (!config.smtp.auth.user || !config.smtp.auth.pass) {
        console.warn('[EMAIL] SMTP credentials not configured. Email sending may fail.');
      }
      break;

    case 'resend':
      config.resend = {
        apiKey: process.env.RESEND_API_KEY || '',
      };

      // Validate Resend config
      if (!config.resend.apiKey) {
        console.warn('[EMAIL] Resend API key not configured. Email sending may fail.');
      }
      break;
  }

  return config;
}