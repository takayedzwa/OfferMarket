import type { EmailMessage, EmailSendResult } from '../email-message';

// ============================================================================
// EMAIL TRANSPORT — the provider swap-point
// ----------------------------------------------------------------------------
// A transport only delivers a finished EmailMessage. The active transport is
// chosen at module init from EmailConfig (see transport.factory.ts). Adding a
// new provider = implement this interface + add a factory case; no caller
// changes (MailService delegates through this interface).
// ============================================================================

export interface EmailTransport {
  readonly name: string;
  send(msg: EmailMessage): Promise<EmailSendResult>;
}