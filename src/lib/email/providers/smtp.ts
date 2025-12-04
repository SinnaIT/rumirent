import nodemailer from 'nodemailer';
import { EmailProvider, SendEmailParams, EmailResult } from '../types';
import { EmailConfig } from '../config';

export class SMTPProvider implements EmailProvider {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      if (!this.config.smtp) {
        throw new Error('SMTP configuration is missing');
      }

      // Create transporter with SMTP
      const transporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.auth.user,
          pass: this.config.smtp.auth.pass,
        },
      });

      // Send email
      const info = await transporter.sendMail({
        from: params.from || this.config.from,
        to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      console.log('[SMTP] Email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('[SMTP] Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
