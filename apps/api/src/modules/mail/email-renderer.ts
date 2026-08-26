// ============================================================================
// EMAIL RENDERER — i18n body rendering + provider-neutral message building
// ----------------------------------------------------------------------------
// Pure functions shared by MailService (inline auth emails) and EmailDispatcher
// (outbox re-render at send time). Splitting this out lets the dispatcher render
// an EmailMessage from an EmailOutbox intent row without going through MailService,
// and keeps MailService focused on the inline fire-and-forget auth path.
//
// All rendering is locale-aware via the custom email i18n loader
// (apps/api/src/i18n/email.ts — `translateEmail`), NOT nestjs-i18n.
// ============================================================================

import { resolveEmailLocale, translateEmail } from '../../i18n/email';
import { EmailCategory, EmailMessage, EmailType, normalizeEmail } from './email-message';

/** A rendered, localized subject + plain-text body, ready to be wrapped. */
export interface RenderedEmail {
  subject: string;
  text: string;
}

/** Render a verification code email (EMAIL or PHONE channel), localized. */
export function renderVerificationEmail(
  code: string,
  type: 'EMAIL' | 'PHONE',
  locale?: string | null,
): RenderedEmail {
  const subjectKey = type === 'EMAIL' ? 'verification.email_subject' : 'verification.phone_subject';
  return {
    subject: translateEmail(subjectKey, locale),
    text: translateEmail('verification.body', locale, { code }),
  };
}

/** Render a password-reset email with the reset URL, localized. */
export function renderPasswordResetEmail(resetUrl: string, locale?: string | null): RenderedEmail {
  return {
    subject: translateEmail('password_reset.subject', locale),
    text: translateEmail('password_reset.body', locale, { resetUrl }),
  };
}

/**
 * Render a generic notification email (title + body + optional deep link). The
 * framing (greeting, open-label, signature) is localized; the notification
 * `title`/`body` are the English fallback stored on the Notification row.
 * Fully localized notification bodies (from notificationType + actionData) are
 * deferred to Phase 4 — see memory: email-service-design.
 */
export function renderNotificationEmail(
  title: string,
  body: string,
  actionUrl: string,
  locale?: string | null,
): RenderedEmail {
  const openLabel = translateEmail('notification.open_label', locale);
  const text = actionUrl
    ? translateEmail('notification.body_framing', locale, { title, body, actionUrl, openLabel })
    : translateEmail('notification.body_framing_no_link', locale, { title, body });
  return { subject: title, text };
}

/** Sender config subset needed to build an EmailMessage. */
export interface EmailSenderConfig {
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

/** Build the provider-neutral EmailMessage envelope from rendered content. */
export function buildEmailMessage(
  args: {
    to: string;
    toName?: string;
    subject: string;
    text: string;
    emailType: EmailType;
    category: EmailCategory;
    locale?: string | null;
    tags?: string[];
    metadata?: Record<string, string>;
  },
  config: EmailSenderConfig,
): EmailMessage {
  return {
    to: normalizeEmail(args.to),
    toName: args.toName,
    from: config.fromEmail,
    fromName: config.fromName,
    replyTo: config.replyTo,
    subject: args.subject,
    html: textToHtml(args.text),
    text: args.text,
    category: args.category,
    emailType: args.emailType,
    locale: resolveEmailLocale(args.locale),
    tags: args.tags ?? [args.emailType],
    metadata: args.metadata,
  };
}

/** Minimal, escaped HTML wrapper around a plain-text body. */
export function textToHtml(text: string): string {
  return `<html><body><pre style="white-space:pre-wrap;font-family:sans-serif">${escapeHtml(text)}</pre></body></html>`;
}

/** Escape the HTML-unsafe characters in a plain-text string. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}