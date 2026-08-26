import { Injectable, Logger } from '@nestjs/common';
import { ConsentStatus, SuppressionReason } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { normalizeEmail } from '../email-message';
import type { EmailCategory } from '../email-message';
import { NotificationEventType } from '../../notifications/notification.types';

// ============================================================================
// EMAIL DELIVERY GATE — the "may we send this?" decision at dispatch time
// ----------------------------------------------------------------------------
// Re-checks per-recipient restrictions that may have changed AFTER the email was
// enqueued. The enqueue-time check in NotificationsService catches the common
// case; this gate catches races (restriction / withdrawal / suppression
// activated between enqueue and dispatch).
//
// Checks, in order (a denial short-circuits the rest):
//   1. Suppression — a Brevo-flagged address (hard bounce / complaint / blocked
//      / invalid) must never be re-sent; it burns sender reputation.
//   2. Required categories (authentication / transactional) are always allowed
//      (skip consent + GDPR — the user needs them to access their account).
//   3. Consent — `notification` emails are ON by default (opt-out): blocked only
//      when an EMAIL_NOTIFICATIONS consent is WITHDRAWN/REVOKED. `marketing`
//      requires explicit opt-in (MARKETING consent GIVEN). Auth/transactional
//      are not consent-gated (handled by step 2).
//   4. GDPR Article 18 — a processing-restricted recipient is not emailed,
//      except legally-required notices (breach, Art. 34).
//
// `hasEmailConsent` is the consent-only subset used by NotificationsService at
// ENQUEUE time (it decides whether to write the outbox row at all). The full
// `canSend` runs at DISPATCH time.
//
// NOTE (legal): the breach/consent bypass rules are pending DPO review
// (memory: email-service-design). The breach exemption below preserves the
// EXISTING NotificationsService behavior (RESTRICTION_EXEMPT_TYPES) verbatim —
// no new GDPR conclusion is encoded. See [[email-service-design]].
// ============================================================================

/** Why an email was blocked from delivery. */
export type DeliveryDenyReason = 'processing_restricted' | 'no_consent' | 'suppressed';

export interface DeliveryDecision {
  ok: boolean;
  /** Present when `ok` is false. */
  reason?: DeliveryDenyReason;
}

/** Context the gate needs to decide. The dispatcher fills this from the outbox row + the fetched notification. */
export interface GateContext {
  userId?: string | null;
  /** Recipient address — checked against the suppression list. Normalized here. */
  toEmail?: string | null;
  category: EmailCategory;
  /** Notification `notificationType` — used for the legally-required (breach) exemption. */
  notificationType?: string | null;
}

/** Notification types that must reach the recipient even under a processing restriction. */
const LEGALLY_REQUIRED_TYPES = new Set<string>([NotificationEventType.BREACH_NOTIFICATION]);

/** Categories that are operationally required and never gated by a restriction. */
const REQUIRED_CATEGORIES = new Set<EmailCategory>(['authentication', 'transactional']);

/** Suppression reasons recorded by the Brevo webhook. */
const SUPPRESSION_REASONS = new Set<SuppressionReason>([
  SuppressionReason.HARD_BOUNCE,
  SuppressionReason.COMPLAINT,
  SuppressionReason.BLOCKED,
  SuppressionReason.INVALID,
]);

/** Consent statuses that withdraw permission to send. */
const CONSENT_WITHDRAWN_STATUSES = new Set<ConsentStatus>([
  ConsentStatus.WITHDRAWN,
  ConsentStatus.REVOKED,
]);

@Injectable()
export class EmailDeliveryGate {
  private readonly logger = new Logger(EmailDeliveryGate.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Decide whether the email may be sent to its recipient right now (full
   * check: suppression + consent + GDPR). Runs at dispatch time.
   */
  async canSend(ctx: GateContext): Promise<DeliveryDecision> {
    // 1. Suppression — any suppression row for this address blocks the send.
    if (ctx.toEmail) {
      const suppressed = await this.prisma.emailSuppression.findFirst({
        where: { email: normalizeEmail(ctx.toEmail) },
        select: { reason: true },
      });
      if (suppressed) {
        return { ok: false, reason: 'suppressed' };
      }
    }

    // 2. Required categories skip consent + GDPR.
    if (REQUIRED_CATEGORIES.has(ctx.category)) {
      return { ok: true };
    }

    // 3. Consent.
    const consent = await this.consentDecision(ctx.userId, ctx.category);
    if (!consent.ok) {
      return consent;
    }

    // 4. GDPR Article 18 processing restriction (re-checked at dispatch time).
    if (ctx.userId) {
      const flags = await this.prisma.userGdprFlags.findUnique({
        where: { userId: ctx.userId },
        select: { processingRestricted: true },
      });
      if (flags?.processingRestricted) {
        // Legally-required notices (breach, Art. 34) override the restriction.
        if (ctx.notificationType && LEGALLY_REQUIRED_TYPES.has(ctx.notificationType)) {
          return { ok: true };
        }
        return { ok: false, reason: 'processing_restricted' };
      }
    }

    return { ok: true };
  }

  /**
   * Consent-only decision used at ENQUEUE time (NotificationsService): should an
   * outbox row be written for this (user, category)? Returns true when sending
   * is permitted by consent. Suppression + GDPR are NOT checked here — they are
   * dispatch-time concerns (and GDPR is already checked at enqueue in
   * NotificationsService). Auth/transactional always return true.
   */
  async hasEmailConsent(userId: string | null | undefined, category: EmailCategory): Promise<boolean> {
    if (REQUIRED_CATEGORIES.has(category)) return true;
    const decision = await this.consentDecision(userId, category);
    return decision.ok;
  }

  /** Compute the consent dimension of the decision for a (user, category). */
  private async consentDecision(
    userId: string | null | undefined,
    category: EmailCategory,
  ): Promise<DeliveryDecision> {
    if (!userId) {
      // No user to check consent against. For opt-out categories the default is
      // "allowed" (no explicit withdrawal on record).
      return { ok: true };
    }

    if (category === 'marketing') {
      // Marketing requires explicit opt-in (ConsentType.MARKETING, GIVEN).
      const consent = await this.latestConsent(userId, 'MARKETING');
      return consent?.status === ConsentStatus.GIVEN
        ? { ok: true }
        : { ok: false, reason: 'no_consent' };
    }

    // notification category — opt-out default (ON unless explicitly withdrawn).
    const consent = await this.latestConsent(userId, 'EMAIL_NOTIFICATIONS');
    if (consent && CONSENT_WITHDRAWN_STATUSES.has(consent.status)) {
      return { ok: false, reason: 'no_consent' };
    }
    return { ok: true };
  }

  /** Fetch the most recent consent row of a given type for a user (or null). */
  private async latestConsent(userId: string, type: 'EMAIL_NOTIFICATIONS' | 'MARKETING') {
    return this.prisma.consent.findFirst({
      where: { userId, consentType: type },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });
  }

  /** Record a suppression for an address (idempotent upsert by email+reason). */
  async suppress(
    email: string,
    reason: SuppressionReason,
    brevoEventId?: string | null,
    providerMessageId?: string | null,
  ): Promise<void> {
    await this.prisma.emailSuppression.upsert({
      where: { email_reason: { email: normalizeEmail(email), reason } },
      update: { brevoEventId, providerMessageId },
      create: { email: normalizeEmail(email), reason, brevoEventId, providerMessageId },
    });
    this.logger.warn(`Suppressed ${email} (${reason})`);
  }

  /** True if an address is currently suppressed (any reason). */
  async isSuppressed(email: string): Promise<boolean> {
    const row = await this.prisma.emailSuppression.findFirst({
      where: { email: normalizeEmail(email) },
      select: { reason: true },
    });
    return !!row && SUPPRESSION_REASONS.has(row.reason);
  }
}