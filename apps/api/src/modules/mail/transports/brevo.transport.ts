import { BrevoClient, BrevoError, BrevoTimeoutError } from '@getbrevo/brevo';
import type { Brevo } from '@getbrevo/brevo';
import type { EmailConfig } from '../email-config';
import type { EmailMessage, EmailSendResult } from '../email-message';
import { EmailError } from '../email.errors';
import type { EmailTransport } from './email.transport';

// ============================================================================
// BREVO TRANSPORT — sends via Brevo's Transactional Email API
// ----------------------------------------------------------------------------
// Uses the official @getbrevo/brevo SDK. Maps provider failures to the
// two-state EmailError taxonomy:
//   retryable  — 429, 5xx, timeout, network errors
//   permanent — 4xx (invalid recipient, bad auth, bad request)
// The dispatcher (Phase 2) consumes `kind` to decide retry vs give-up.
//
// Retry ownership: the SDK's own maxRetries is set from config (default 0) so
// all retry/backoff is owned by the dispatcher (Phase 2). In Phase 1 inline
// best-effort sending, a transient failure simply logs (MailService swallows
// transport errors) — consistent with the best-effort contract.
// ============================================================================

export class BrevoTransport implements EmailTransport {
  readonly name = 'brevo';
  private readonly client: BrevoClient;

  constructor(config: EmailConfig, client?: BrevoClient) {
    if (!config.brevo) {
      throw new Error('BrevoTransport requires a Brevo config (apiKey + apiBase).');
    }
    // `client` is optional so tests can inject a fake client without mocking
    // the SDK module. In production the factory omits it and we construct one.
    this.client =
      client ??
      new BrevoClient({
        apiKey: config.brevo.apiKey,
        environment: config.brevo.apiBase,
        maxRetries: config.brevo.maxRetries,
      });
  }

  async send(msg: EmailMessage): Promise<EmailSendResult> {
    try {
      const request: Brevo.SendTransacEmailRequest = {
        sender: { email: msg.from, name: msg.fromName },
        to: [{ email: msg.to, name: msg.toName }],
        replyTo: msg.replyTo ? { email: msg.replyTo } : undefined,
        subject: msg.subject,
        htmlContent: msg.html,
        textContent: msg.text,
        tags: msg.tags,
      };
      const res = await this.client.transactionalEmails.sendTransacEmail(request);
      const providerMessageId = res.messageId ?? res.messageIds?.[0] ?? '';
      return { providerMessageId, status: 'sent' };
    } catch (err) {
      throw this.toEmailError(err);
    }
  }

  private toEmailError(err: unknown): EmailError {
    if (err instanceof BrevoTimeoutError) {
      return new EmailError('retryable', 'timeout', undefined, 'Brevo request timed out');
    }
    if (err instanceof BrevoError) {
      const status = err.statusCode;
      const safe = `Brevo ${status ?? 'unknown'}`;
      if (status === 429 || (typeof status === 'number' && status >= 500)) {
        return new EmailError('retryable', 'brevo', status, safe);
      }
      if (typeof status === 'number' && status >= 400 && status < 500) {
        return new EmailError('permanent', 'brevo', status, safe);
      }
      // BrevoError with no/unknown status — treat as retryable (bounded by
      // dispatcher maxAttempts in Phase 2; here it just logs).
      return new EmailError('retryable', 'brevo', status, safe);
    }
    // Network / unknown error — treat as retryable. Sanitize the message so
    // recipient data or provider secrets never land in logs/lastError.
    const raw = err instanceof Error ? err.message : String(err);
    return new EmailError('retryable', 'network', undefined, raw.slice(0, 200));
  }
}