import { Logger } from '@nestjs/common';

// ============================================================================
// EMAIL CONFIG — typed + validated
// ----------------------------------------------------------------------------
// Loaded once at module init (see MailModule). Fail-loud in production when
// `brevo` is selected but required values are missing (matches the JWT_SECRET
// guard idiom in auth.module.ts). In dev/test, misconfiguration falls back to
// the `log` transport with a warning, preserving the historical "no provider
// wired" behavior so existing deployments keep working unchanged.
// ============================================================================

export type EmailProvider = 'brevo' | 'log';

export interface EmailConfig {
  provider: EmailProvider;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  brevo: { apiKey: string; apiBase: string; maxRetries: number } | null;
  /** Whether the EmailDispatcher outbox pump runs. Default true; set false to disable. */
  outboxDispatcherEnabled: boolean;
  /**
   * Shared secret used to authenticate the Brevo event webhook
   * (POST /api/v1/webhooks/brevo/:secret). Brevo webhooks carry NO signature, so
   * the secret is embedded in the unguessable URL path and verified timing-safe.
   * Undefined when not configured (the webhook then rejects all calls).
   */
  brevoWebhookSecret?: string;
}

const DEFAULT_FROM_EMAIL = 'noreply@offermarket.eu';
const DEFAULT_FROM_NAME = 'OfferMarket';
const BREVO_DEFAULT_API_BASE = 'https://api.brevo.com/v3';

function isProduction(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Load and validate email config from the environment. Throws in production
 * when `brevo` is selected without an API key; falls back to `log` otherwise.
 */
export function loadEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  const logger = new Logger('EmailConfig');
  const rawProvider = (env.EMAIL_PROVIDER ?? 'log').toLowerCase();
  const fromEmail = (env.EMAIL_FROM_EMAIL ?? env.SES_FROM_EMAIL ?? DEFAULT_FROM_EMAIL).trim();
  const fromName = (env.EMAIL_FROM_NAME ?? DEFAULT_FROM_NAME).trim();
  const replyTo = (env.EMAIL_REPLY_TO ?? '').trim() || undefined;
  const outboxDispatcherEnabled = (env.EMAIL_OUTBOX_DISPATCHER_ENABLED ?? 'true').trim() !== 'false';
  const brevoWebhookSecret = (env.BREVO_WEBHOOK_SECRET ?? '').trim() || undefined;

  if (rawProvider !== 'brevo' && rawProvider !== 'log') {
    throw new Error(
      `Invalid EMAIL_PROVIDER "${env.EMAIL_PROVIDER}" — expected "brevo" or "log".`,
    );
  }

  if (rawProvider === 'log') {
    if (isProduction(env)) {
      logger.warn(
        'EMAIL_PROVIDER is not set to "brevo" in production — emails will be dropped (log transport).',
      );
    }
    return { provider: 'log', fromEmail, fromName, replyTo, brevo: null, outboxDispatcherEnabled, brevoWebhookSecret };
  }

  // provider === 'brevo'
  const apiKey = (env.BREVO_API_KEY ?? '').trim();
  if (!apiKey) {
    if (isProduction(env)) {
      throw new Error(
        'EMAIL_PROVIDER=brevo but BREVO_API_KEY is missing in production — refusing to boot.',
      );
    }
    logger.warn(
      'EMAIL_PROVIDER=brevo but BREVO_API_KEY is missing — falling back to log transport.',
    );
    return { provider: 'log', fromEmail, fromName, replyTo, brevo: null, outboxDispatcherEnabled, brevoWebhookSecret };
  }

  const parsedRetries = parseInt(env.BREVO_MAX_RETRIES ?? '0', 10);
  const maxRetries = Number.isNaN(parsedRetries) ? 0 : Math.max(0, parsedRetries);

  return {
    provider: 'brevo',
    fromEmail,
    fromName,
    replyTo,
    brevo: {
      apiKey,
      apiBase: (env.BREVO_API_BASE ?? BREVO_DEFAULT_API_BASE).trim(),
      maxRetries,
    },
    outboxDispatcherEnabled,
    brevoWebhookSecret,
  };
}

/** Safe default config used when MailService is constructed without DI (tests). */
export function defaultEmailConfig(): EmailConfig {
  return {
    provider: 'log',
    fromEmail: DEFAULT_FROM_EMAIL,
    fromName: DEFAULT_FROM_NAME,
    replyTo: undefined,
    brevo: null,
    outboxDispatcherEnabled: false,
    brevoWebhookSecret: undefined,
  };
}