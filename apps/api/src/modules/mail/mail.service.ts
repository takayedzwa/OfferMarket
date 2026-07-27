import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// MAIL SERVICE
// ----------------------------------------------------------------------------
// Single delivery point for outbound email. This is a deliberately minimal,
// dependency-free implementation:
//   - In non-production (dev/test): the message is logged and captured in an
//     in-memory `outbox`, so tests and local development can retrieve the
//     verification code / reset token without it being leaked in the HTTP
//     response.
//   - In production: logs a warning that no provider is wired up (no silent
//     success). This is the swap point — replace `deliver()` with AWS SES,
//     SendGrid, or an SMTP transport via @nestjs/mailer without changing any
//     caller.
//
// All methods are best-effort: they never throw, so an email failure can never
// break a primary operation (registration, password reset, notification).
// ============================================================================

export interface SentMail {
  to: string;
  subject: string;
  text: string;
  sentAt: Date;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  /**
   * In-memory record of outbound mail in non-production environments, so tests
   * and local dev can retrieve a just-sent verification code / reset token.
   * Cleared only on process restart. Empty in production.
   */
  readonly outbox: SentMail[] = [];

  /** Send a verification code (email channel). */
  sendVerificationCode(to: string, code: string, type: 'EMAIL' | 'PHONE'): void {
    const subject =
      type === 'EMAIL'
        ? 'Your OfferMarket verification code'
        : 'Your OfferMarket phone verification code';
    const text = `Your OfferMarket verification code is: ${code}\n\nIt expires in 15 minutes. If you did not request this, you can safely ignore this email.`;
    this.send({ to, subject, text });
  }

  /** Send a password-reset link. */
  sendPasswordReset(to: string, resetUrl: string): void {
    const subject = 'Reset your OfferMarket password';
    const text =
      `We received a request to reset your OfferMarket password.\n\n` +
      `Reset your password by visiting:\n${resetUrl}\n\n` +
      `This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.`;
    this.send({ to, subject, text });
  }

  /** Send a generic notification email (title + body + optional deep link). */
  sendNotification(to: string, title: string, body: string, actionUrl: string): void {
    const subject = title;
    const text =
      `${title}\n\n${body}` +
      (actionUrl ? `\n\nOpen: ${actionUrl}` : '') +
      `\n\n— OfferMarket`;
    this.send({ to, subject, text });
  }

  /** Single delivery point. Swap this out for a real provider in production. */
  private send(message: { to: string; subject: string; text: string }): void {
    try {
      if (!message.to) {
        this.logger.warn(`Cannot send mail with empty recipient: "${message.subject}"`);
        return;
      }
      if (this.isProduction) {
        // SWAP POINT: wire in AWS SES / SendGrid / SMTP here. Until then, log
        // loudly so production is never silently "sending" nothing.
        this.logger.warn(
          `No email provider configured in production — dropping "${message.subject}" to ${message.to}`,
        );
        return;
      }
      // Dev/test: log + capture for retrieval (codes/tokens must not leak via
      // the HTTP response, so this is the retrieval channel instead).
      this.logger.log(`[DEV MAIL] to: ${message.to} | subject: ${message.subject}\n${message.text}`);
      this.outbox.push({ ...message, sentAt: new Date() });
    } catch (error) {
      // Best-effort: never let mail break the caller.
      this.logger.error(`Failed to send mail "${message.subject}": ${error?.message ?? error}`);
    }
  }
}