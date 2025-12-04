import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { EmailProvider, SendEmailParams, EmailResult } from '../types';
import { EmailConfig } from '../config';

export class GmailProvider implements EmailProvider {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      if (!this.config.gmail) {
        throw new Error('Gmail configuration is missing');
      }

      const { clientId, clientSecret, refreshToken, user } = this.config.gmail;

      // Create OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://developers.google.com/oauthplayground' // Redirect URL
      );

      // Set credentials
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      // Get access token
      const accessToken = await oauth2Client.getAccessToken();

      if (!accessToken.token) {
        throw new Error('Failed to get Gmail access token');
      }

      // Create transporter with OAuth2
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: user,
          clientId: clientId,
          clientSecret: clientSecret,
          refreshToken: refreshToken,
          accessToken: accessToken.token,
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

      console.log('[Gmail] Email sent successfully:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('[Gmail] Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}