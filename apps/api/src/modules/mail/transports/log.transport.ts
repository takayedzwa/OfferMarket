import { Injectable, Logger } from '@nestjs/common';
import type { EmailMessage, EmailSendResult } from '../email-message';
import type { EmailTransport } from './email.transport';

export interface SentMail {
  to: string;
  subject: string;
  text: string;
  sentAt: Date;
}

// ============================================================================
// LOG TRANSPORT — dev/test delivery + "no provider configured" fallback
// ----------------------------------------------------------------------------
// - Non-production: logs the message and captures it in an in-memory `outbox`
//   so tests and local dev can retrieve a just-sent verification code / reset
//   token without it leaking via the HTTP response.
// - Production (reached only when EMAIL_PROVIDER is unset/`log`): logs a loud
//   warning that no provider is configured and drops the message — no silent
//   success. This preserves the historical pre-Brevo production behavior.
//
// The outbox push is synchronous (no await before it) so unit tests that read
// `outbox` immediately after a sync MailService call stay deterministic.
// ============================================================================

@Injectable()
export class LogTransport implements EmailTransport {
  readonly name = 'log';
  private readonly logger = new Logger('LogTransport');
  private readonly isProduction = process.env.NODE_ENV === 'production';

  /** In-memory record of outbound mail in non-production. Empty in production. */
  readonly outbox: SentMail[] = [];

  send(msg: EmailMessage): Promise<EmailSendResult> {
    if (this.isProduction) {
      this.logger.warn(
        `No email provider configured in production — dropping "${msg.subject}" to ${msg.to}`,
      );
      return Promise.resolve({ providerMessageId: '', status: 'sent' });
    }
    this.logger.log(`[DEV MAIL] to: ${msg.to} | subject: ${msg.subject}\n${msg.text}`);
    this.outbox.push({ to: msg.to, subject: msg.subject, text: msg.text, sentAt: new Date() });
    return Promise.resolve({ providerMessageId: 'log', status: 'sent' });
  }
}