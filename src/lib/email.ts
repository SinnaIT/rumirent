// Re-export from the new modular email system
export {
  sendPasswordResetEmail,
  sendContactAdminEmail,
  getEmailConfig,
  type PasswordResetEmailParams,
  type ContactAdminEmailParams,
} from './email/index';
