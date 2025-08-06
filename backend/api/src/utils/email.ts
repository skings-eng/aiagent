import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
  passwordReset: (resetUrl: string, username: string) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${username},</p>
        <p>You have requested to reset your password. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>Best regards,<br>AI Agent Team</p>
      </div>
    `,
  }),
  
  emailVerification: (verificationUrl: string, username: string) => ({
    subject: 'Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${username},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create this account, please ignore this email.</p>
        <p>Best regards,<br>AI Agent Team</p>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<void> => {
  try {
    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || 'noreply@aiagent.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    if (process.env.NODE_ENV === 'development') {
      logger.info('Email would be sent in production:', mailOptions);
      return;
    }

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const template = emailTemplates.passwordReset(resetUrl, username);
  
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
};

// Send email verification email
export const sendEmailVerification = async (
  email: string,
  username: string,
  verificationToken: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  const template = emailTemplates.emailVerification(verificationUrl, username);
  
  await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
};