import { Injectable, Logger } from '@nestjs/common';
import { translateEmail } from '../../i18n/email';

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

  /**
   * Send a verification code (email channel). Renders in the recipient's
   * `locale` (User.preferredLocale) when provided; defaults to English so
   * callers without a locale keep the historical wording.
   */
  sendVerificationCode(
    to: string,
    code: string,
    type: 'EMAIL' | 'PHONE',
    locale?: string | null,
  ): void {
    const subjectKey = type === 'EMAIL' ? 'verification.email_subject' : 'verification.phone_subject';
    const subject = translateEmail(subjectKey, locale);
    const text = translateEmail('verification.body', locale, { code });
    this.send({ to, subject, text });
  }

  /** Send a password-reset link, localized to the recipient's preferred locale. */
  sendPasswordReset(to: string, resetUrl: string, locale?: string | null): void {
    const subject = translateEmail('password_reset.subject', locale);
    const text = translateEmail('password_reset.body', locale, { resetUrl });
    this.send({ to, subject, text });
  }

  /**
   * Send a generic notification email (title + body + optional deep link). The
   * framing (greeting link label + signature) is localized; the notification
   * `title`/`body` are the English fallback stored on the Notification row.
   * Fully localized notification emails (rendered from notificationType +
   * actionData server-side) are deferred as an incremental step.
   */
  sendNotification(
    to: string,
    title: string,
    body: string,
    actionUrl: string,
    locale?: string | null,
  ): void {
    const subject = title;
    const openLabel = translateEmail('notification.open_label', locale);
    const text = actionUrl
      ? translateEmail('notification.body_framing', locale, { title, body, actionUrl, openLabel })
      : translateEmail('notification.body_framing_no_link', locale, { title, body });
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