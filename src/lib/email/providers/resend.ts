import { EmailProvider, SendEmailParams, EmailResult } from '../types';
import { EmailConfig } from '../config';

export class ResendProvider implements EmailProvider {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      if (!this.config.resend) {
        throw new Error('Resend configuration is missing');
      }

      // Dynamically import Resend only if this provider is used
      const { Resend } = await import('resend');
      const resend = new Resend(this.config.resend.apiKey);

      // Send email
      const { data, error } = await resend.emails.send({
        from: params.from || this.config.from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        console.error('[Resend] Failed to send email:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('[Resend] Email sent successfully:', data?.id);

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('[Resend] Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
