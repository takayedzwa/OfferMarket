import {
  Controller,
  Post,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import * as crypto from 'node:crypto';
import { SuppressionReason } from '@prisma/client';
import { EMAIL_CONFIG_TOKEN } from '../mail.tokens';
import type { EmailConfig } from '../email-config';
import { EmailDeliveryGate } from '../dispatcher/email-delivery-gate';

// ============================================================================
// BREVO EVENT WEBHOOK — records delivery failures as EmailSuppression rows
// ----------------------------------------------------------------------------
// Brevo delivers transactional email events (bounces, complaints, blocks,
// invalid addresses) to a webhook we register in the Brevo dashboard. There is
// NO request signature on Brevo webhooks — no HMAC/JWT to verify — so the
// endpoint is authenticated by an unguessable shared secret embedded in the URL
// path (POST /api/v1/webhooks/brevo/:secret) and compared timing-safe. An
// optional IP allowlist can be layered on the edge later; it is not required for
// correctness.
//
// Only the four terminal-failure events become suppressions (the gate blocks
// further sends to a suppressed address so we don't burn sender reputation):
//   hard_bounce    → HARD_BOUNCE
//   spam           → COMPLAINT          (Brevo "spam" = a recipient complaint)
//   blocked        → BLOCKED
//   invalid_email  → INVALID
// Soft bounces, deliveries, opens, clicks, and `unsubscribed` are intentionally
// ignored here — `unsubscribed` is a consent concern, not a suppression, and is
// handled by the consent flows, not by this endpoint.
//
// Idempotency: EmailSuppression has @@unique([email, reason]); the gate's
// `suppress` upserts on that key, so Brevo redelivering the same event (which it
// does on any non-2xx, and occasionally at-least-once anyway) collapses to one
// row. We always return 204, including for events we ignore — acknowledging
// everything stops Brevo from retrying.
//
// Auth model: this is a public endpoint (no JWT). The ProcessingRestrictionGuard
// allows requests with no user context through (it only restricts authenticated
// writers), so the skip-processing-restriction decorator is NOT applied here.
// @SkipThrottle() mirrors the health check: Brevo can burst-deliver events and
// we must not drop them to a 429 — the path secret is the abuse guard.
// ============================================================================

/** Brevo event name → suppression reason. Absent for events we do not suppress. */
const EVENT_TO_REASON: Record<string, SuppressionReason> = {
  hard_bounce: SuppressionReason.HARD_BOUNCE,
  spam: SuppressionReason.COMPLAINT,
  blocked: SuppressionReason.BLOCKED,
  invalid_email: SuppressionReason.INVALID,
};

/** Shape of the fields we read from a Brevo transactional event payload. */
interface BrevoEvent {
  event?: unknown;
  email?: unknown;
  /** Brevo uses `messageId`; accept snake/kebab variants defensively. */
  messageId?: unknown;
  message_id?: unknown;
  /** Numeric Brevo event/message id. */
  id?: unknown;
  event_id?: unknown;
}

@Controller('webhooks/brevo')
@SkipThrottle()
export class BrevoWebhookController {
  private readonly logger = new Logger(BrevoWebhookController.name);
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly gate: EmailDeliveryGate,
    @Inject(EMAIL_CONFIG_TOKEN) config: EmailConfig,
  ) {
    this.webhookSecret = config.brevoWebhookSecret;
    if (!this.webhookSecret) {
      this.logger.warn(
        'BREVO_WEBHOOK_SECRET is not set — the Brevo webhook will reject all calls. ' +
          'Set it to a long random URL-safe value and configure the same secret in the Brevo webhook URL.',
      );
    }
  }

  @Post(':secret')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(@Param('secret') secret: string, @Req() req: any): Promise<void> {
    // 1. Verify the shared secret. Brevo webhooks are unsigned, so this path
    //    token IS the authentication. Constant-time compare (matching the
    //    auth.service.ts verification-code idiom) — guard lengths first because
    //    timingSafeEqual throws on mismatched buffer lengths.
    if (!this.webhookSecret || typeof secret !== 'string') {
      throw new UnauthorizedException();
    }
    const a = Buffer.from(secret);
    const b = Buffer.from(this.webhookSecret);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }

    // 2. Normalize to an event list. Brevo normally POSTs a single event object,
    //    but tolerate a batched array defensively.
    const body = req?.body;
    const events: BrevoEvent[] = Array.isArray(body) ? body : body ? [body] : [];

    // 3. Map + record suppressions. Unknown / ignored events are acknowledged
    //    (the 204) without side effects so Brevo stops retrying them.
    for (const ev of events) {
      const eventName = typeof ev?.event === 'string' ? (ev.event as string) : null;
      const reason = eventName ? EVENT_TO_REASON[eventName] : undefined;
      if (!reason) continue;

      const email = typeof ev.email === 'string' ? (ev.email as string) : null;
      if (!email) continue;

      const providerMessageId = pickString(ev.messageId ?? ev.message_id);
      const brevoEventId = pickString(ev.event_id) ?? (ev.id != null ? String(ev.id) : null);

      try {
        await this.gate.suppress(email, reason, brevoEventId, providerMessageId);
      } catch (err) {
        // Never throw to Brevo from a single bad event — a 5xx would make it
        // retry the whole batch. Log and acknowledge; the unique constraint makes
        // a later redelivery harmless.
        this.logger.error(
          `Failed to record Brevo suppression for ${email} (${eventName}): ${(err as Error).message}`,
        );
      }
    }
  }
}

/** Coerce a webhook field to a trimmed string, or null. */
function pickString(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}