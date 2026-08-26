import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailConfig, defaultEmailConfig } from '../email-config';
import { EmailError } from '../email.errors';
import { buildEmailMessage, renderNotificationEmail } from '../email-renderer';
import { EMAIL_CONFIG_TOKEN, EMAIL_TRANSPORT_TOKEN } from '../mail.tokens';
import { EmailTransport } from '../transports/email.transport';
import { EmailDeliveryGate } from './email-delivery-gate';
import { EmailOutboxService, OutboxStatus } from './email-outbox.service';

// ============================================================================
// EMAIL DISPATCHER — drains the EmailOutbox and sends due emails
// ----------------------------------------------------------------------------
// Runs on an interval (default 7s). Each tick:
//   1. Requeues rows stuck in `sending` past the lock timeout (crashed worker).
//   2. Claims a batch of due `pending` rows (FOR UPDATE SKIP LOCKED, auth first).
//   3. For each row: gate-check the recipient → render the EmailMessage from the
//      Notification row (intent-only) → transport.send → mark sent / retry / fail.
//
// At-least-once: a duplicate may be sent if the process crashes after Brevo
// accepts but before the row is marked sent — explicitly tolerated.
//
// Two-state error taxonomy drives the outcome:
//   permanent  (4xx)            → markFailed (terminal, no retry)
//   retryable  (429/5xx/timeout) → scheduleRetry (exponential backoff, max 8)
//   unknown                       → scheduleRetry (bounded by maxAttempts)
//
// Re-entrancy guard: if a tick fires while the previous pump is still running
// (a slow batch), the new tick is skipped rather than running two pumps
// concurrently (which would double-claim — though SKIP LOCKED would still keep
// them disjoint, the load is unnecessary).
//
// The pump is disabled when `outboxDispatcherEnabled` is false on the injected
// config (env `EMAIL_OUTBOX_DISPATCHER_ENABLED=false`), and the @Interval only
// fires when ScheduleModule.forRoot() is active (the full app). Unit tests call
// `pump()` directly with mocked dependencies.
// ============================================================================

/** How often the pump runs. Off the :00/:30 marks to avoid fleet-wide spikes. */
const PUMP_INTERVAL_MS = 7_000;
/** Stale-sending threshold: a row locked longer than this is assumed crashed. */
const STALE_LOCK_MS = 10 * 60_000;
/** Max rows claimed + processed per tick. */
const BATCH_SIZE = 25;

@Injectable()
export class EmailDispatcher {
  private readonly logger = new Logger(EmailDispatcher.name);
  private readonly transport: EmailTransport;
  private readonly config: EmailConfig;
  private readonly enabled: boolean;
  private pumping = false; // re-entrancy guard

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: EmailOutboxService,
    private readonly gate: EmailDeliveryGate,
    @Optional() @Inject(EMAIL_TRANSPORT_TOKEN) transport?: EmailTransport,
    @Optional() @Inject(EMAIL_CONFIG_TOKEN) config?: EmailConfig,
  ) {
    this.transport = transport ?? (undefined as unknown as EmailTransport);
    this.config = config ?? defaultEmailConfig();
    this.enabled = this.config.outboxDispatcherEnabled && !!transport;
  }

  /** Interval-driven entry point. Skips when disabled or already pumping. */
  @Interval(PUMP_INTERVAL_MS)
  async tick(): Promise<void> {
    if (!this.enabled || this.pumping) return;
    this.pumping = true;
    try {
      await this.pump();
    } catch (err) {
      // Never let the pump crash kill the interval — log and try again next tick.
      this.logger.error(`Email outbox pump failed: ${(err as Error).message}`, (err as Error).stack);
    } finally {
      this.pumping = false;
    }
  }

  /** One drain cycle. Public so tests can drive it directly without the timer. */
  async pump(): Promise<void> {
    // 1. Recover rows stranded in `sending` by a crashed worker.
    await this.outbox.requeueStaleSending(STALE_LOCK_MS);

    // 2. Claim a batch (auth emails first) and process each row independently —
    //    one row's failure must not abort the rest of the batch.
    const rows = await this.outbox.claimNextBatch(BATCH_SIZE);
    if (rows.length === 0) return;

    for (const row of rows) {
      try {
        await this.processRow(row);
      } catch (err) {
        // Defensive: processRow already handles transport errors. Anything that
        // escapes is unexpected (e.g. a Prisma fault) — treat as retryable so the
        // row isn't permanently lost, then continue with the next row.
        this.logger.error(
          `Unexpected error processing outbox row ${row.id}: ${(err as Error).message}`,
        );
        await this.outbox.scheduleRetry(row.id, err).catch(() => undefined);
      }
    }
  }

  /** Render + send a single claimed row and record the outcome. */
  private async processRow(row: { id: string; notificationId: string | null; userId: string | null; toEmail: string; emailType: string; category: string; locale: string }): Promise<void> {
    // Notification emails re-render from the Notification row. A row without a
    // notificationId can't be reconstructed (auth emails are never enqueued here
    // precisely because they can't be — §20), so mark it failed and move on.
    if (!row.notificationId) {
      await this.outbox.markFailed(row.id, 'no notification intent to render');
      return;
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id: row.notificationId },
      select: { notificationType: true, title: true, body: true, actionUrl: true },
    });
    if (!notification) {
      // Notification was deleted (e.g. retention purge / user erasure cascade).
      await this.outbox.markFailed(row.id, 'source notification no longer exists');
      return;
    }

    // Gate: re-check restrictions that may have activated since enqueue.
    const decision = await this.gate.canSend({
      userId: row.userId,
      toEmail: row.toEmail,
      category: row.category as never,
      notificationType: notification.notificationType,
    });
    if (!decision.ok) {
      // A processing-restricted recipient must not be emailed; a suppressed
      // address must not be re-sent (reputation). Mark terminal so we don't keep
      // re-processing their data (which is itself processing). Suppression uses
      // the distinct `suppressed` status; policy blocks use `failed`.
      this.logger.debug(`Outbox row ${row.id} blocked by delivery gate: ${decision.reason}`);
      if (decision.reason === 'suppressed') {
        await this.outbox.markSuppressed(row.id, `address suppressed`);
      } else {
        await this.outbox.markFailed(row.id, `delivery blocked: ${decision.reason}`);
      }
      return;
    }

    // Render at send time (intent-only storage). The stored `row.locale` is the
    // recipient's preferredLocale at enqueue time; we use it rather than
    // re-fetching the user.
    const rendered = renderNotificationEmail(
      notification.title,
      notification.body,
      notification.actionUrl ?? '',
      row.locale,
    );
    const msg = buildEmailMessage(
      {
        to: row.toEmail,
        subject: rendered.subject,
        text: rendered.text,
        emailType: row.emailType as never,
        category: row.category as never,
        locale: row.locale,
        tags: [row.emailType],
      },
      this.config,
    );

    try {
      const result = await this.transport.send(msg);
      await this.outbox.markSent(row.id, result.providerMessageId);
    } catch (err) {
      if (err instanceof EmailError && err.kind === 'permanent') {
        // Terminal delivery failure — record once, with the sanitized reason +
        // recipient context for monitoring. No retry (4xx = bad recipient/request).
        this.logger.warn(
          `Email to ${row.toEmail} permanently failed (${err.httpStatus ?? err.providerCode ?? err.kind}): ` +
            `${err.safeMessage ?? err.message} [outbox=${row.id}]`,
        );
        await this.outbox.markFailed(row.id, err);
      } else {
        // retryable (incl. unknown) — bounded by maxAttempts inside scheduleRetry.
        await this.outbox.scheduleRetry(row.id, err);
      }
    }
  }

  /** Test/ops helper: how many rows are currently in a given status. */
  async countByStatus(status: (typeof OutboxStatus)[keyof typeof OutboxStatus]): Promise<number> {
    return this.outbox.countByStatus(status);
  }
}