import type { EmailConfig } from '../email-config';
import type { EmailTransport } from './email.transport';
import { LogTransport } from './log.transport';
import { BrevoTransport } from './brevo.transport';

// ============================================================================
// TRANSPORT FACTORY — selects the active transport from EmailConfig
// ----------------------------------------------------------------------------
// Runs once at module init. To add a provider: implement EmailTransport, add a
// case here. No caller of MailService changes.
// ============================================================================

export function createTransport(config: EmailConfig): EmailTransport {
  switch (config.provider) {
    case 'brevo':
      return new BrevoTransport(config);
    case 'log':
      return new LogTransport();
    default:
      throw new Error(`Unknown email provider: ${(config as { provider: string }).provider}`);
  }
}