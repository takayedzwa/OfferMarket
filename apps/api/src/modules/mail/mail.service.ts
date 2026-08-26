import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { EmailCategory, EmailMessage, EmailType } from './email-message';
import { defaultEmailConfig, EmailConfig } from './email-config';
import { EmailError } from './email.errors';
import { buildEmailMessage, renderPasswordResetEmail, renderVerificationEmail } from './email-renderer';
import { EMAIL_CONFIG_TOKEN, EMAIL_TRANSPORT_TOKEN } from './mail.tokens';
import { EmailTransport } from './transports/email.transport';
import { LogTransport, SentMail } from './transports/log.transport';

// Re-export so existing imports of SentMail from './mail.service' keep working.
export { SentMail } from './transports/log.transport';

// ============================================================================
// MAIL SERVICE
// ----------------------------------------------------------------------------
// Inline delivery point for AUTH emails only (verification codes + password
// resets). These stay inline because their raw tokens cannot be reconstructed
// at retry time and §20 of the design review forbids storing sensitive content
// at rest in the outbox. The public API (sendVerificationCode / sendPasswordReset)
// is best-effort and synchronous: it never throws, so an email failure can never
// break a primary operation (registration, password reset).
//
// Notification emails do NOT go through here — NotificationsService writes a
// Notification + EmailOutbox row atomically, and the EmailDispatcher renders +
// sends them out-of-band (crash-safe, retryable). See dispatcher/.
//
// Delivery is delegated to an injected EmailTransport chosen by config (Brevo in
// production, LogTransport in dev/test). This is the provider swap point —
// replacing/adding a provider no longer touches any caller.
//
// When constructed without DI (unit tests), it defaults to LogTransport +
// defaultEmailConfig, preserving the in-memory `outbox` retrieval channel.
// ============================================================================

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: EmailTransport;
  private readonly config: EmailConfig;

  constructor(
    @Optional() @Inject(EMAIL_TRANSPORT_TOKEN) transport?: EmailTransport,
    @Optional() @Inject(EMAIL_CONFIG_TOKEN) config?: EmailConfig,
  ) {
    this.config = config ?? defaultEmailConfig();
    this.transport = transport ?? new LogTransport();
  }

  /**
   * In-memory record of outbound mail in non-production environments, so tests
   * and local dev can retrieve a just-sent verification code / reset token.
   * Delegates to the active LogTransport; empty for any other transport.
   */
  get outbox(): SentMail[] {
    return this.transport instanceof LogTransport ? this.transport.outbox : [];
  }

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
    const emailType: EmailType = type === 'EMAIL' ? 'email_verification' : 'phone_verification';
    const { subject, text } = renderVerificationEmail(code, type, locale);
    this.deliver({ to, subject, text, emailType, category: 'authentication', locale });
  }

  /** Send a password-reset link, localized to the recipient's preferred locale. */
  sendPasswordReset(to: string, resetUrl: string, locale?: string | null): void {
    const { subject, text } = renderPasswordResetEmail(resetUrl, locale);
    this.deliver({ to, subject, text, emailType: 'password_reset', category: 'authentication', locale });
  }

  /** Build the provider-neutral EmailMessage and hand it to the transport. */
  private deliver(args: {
    to: string;
    subject: string;
    text: string;
    emailType: EmailType;
    category: EmailCategory;
    locale?: string | null;
  }): void {
    try {
      if (!args.to) {
        this.logger.warn(`Cannot send mail with empty recipient: "${args.subject}"`);
        return;
      }
      const msg: EmailMessage = buildEmailMessage(args, this.config);
      // Best-effort, fire-and-forget: never let email break the caller.
      Promise.resolve(this.transport.send(msg)).catch((err) =>
        this.logger.error(`Failed to send mail "${args.subject}": ${this.describeError(err)}`),
      );
    } catch (err) {
      this.logger.error(`Failed to send mail "${args.subject}": ${this.describeError(err)}`);
    }
  }

  private describeError(err: unknown): string {
    if (err instanceof EmailError) {
      return `[${err.kind}] ${err.safeMessage ?? err.message}`;
    }
    return err instanceof Error ? err.message : String(err);
  }
}