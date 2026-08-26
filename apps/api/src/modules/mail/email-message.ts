// ============================================================================
// EMAIL MESSAGE — provider-neutral envelope
// ----------------------------------------------------------------------------
// The finished, i18n-rendered email handed to an EmailTransport. Transports
// only deliver this; they never render content or know about notifications.
//
// Deliberately holds NO provider-specific fields (no Brevo templateId) — the
// provider adapter owns any provider-templating decisions, keeping the domain
// model clean. Adding a provider later implements EmailTransport + a factory
// case; no caller changes. See memory: email-service-design.
// ============================================================================

export type EmailCategory =
  // Verification codes, password reset — required, no opt-out.
  | 'authentication'
  // Security/account-critical — required, no opt-out.
  | 'transactional'
  // Offer/message/support notifications — user-toggleable (opt-out by default).
  | 'notification'
  // Newsletters/promotions — explicit opt-in (out of scope for now).
  | 'marketing';

export type EmailType =
  | 'email_verification'
  | 'phone_verification'
  | 'password_reset'
  | 'notification';

export interface EmailMessage {
  /** Recipient address, normalized (trim + lower-case) by the caller. */
  to: string;
  toName?: string;
  /** Sender address, resolved from EmailConfig. */
  from: string;
  fromName?: string;
  replyTo?: string;
  /** i18n-rendered at send time. */
  subject: string;
  /** HTML body, rendered at send time. */
  html: string;
  /** Plain-text body, rendered at send time. Required for deliverability. */
  text: string;
  category: EmailCategory;
  emailType: EmailType;
  /** Resolved locale, used for analytics tagging only (never re-rendered). */
  locale: string;
  /** Categorization tags forwarded to the provider (e.g. ['password_reset']). */
  tags?: string[];
  /** Opaque metadata forwarded to the provider for webhook correlation. */
  metadata?: Record<string, string>;
}

export interface EmailSendResult {
  /** Provider-assigned message id, used to correlate webhook events. */
  providerMessageId: string;
  status: 'sent' | 'queued';
}

/** Normalize an email address to a canonical form for storage/lookup. */
export function normalizeEmail(email: string): string {
  return (email ?? '').trim().toLowerCase();
}