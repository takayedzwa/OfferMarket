import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type EmailOutbox } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { normalizeEmail } from '../email-message';
import type { EmailCategory, EmailType } from '../email-message';

// ============================================================================
// EMAIL OUTBOX SERVICE — durable email intent + claim/state machine
// ----------------------------------------------------------------------------
// Owns all writes to the EmailOutbox table except the atomic enqueue, which is
// performed by NotificationsService inside its own $transaction (so the
// Notification row and the EmailOutbox row are written together or not at all).
// `enqueue` accepts an optional transaction client so callers can opt into that
// atomicity; when called without one it uses the shared PrismaService.
//
// The dispatcher drains the outbox with `claimNextBatch` (a single atomic
// UPDATE … FOR UPDATE SKIP LOCKED … RETURNING) so multiple workers can claim
// disjoint batches without contending. Recovery from a crashed worker is handled
// by `requeueStaleSending`, which resets rows stuck in `sending` past a lock
// timeout back to `pending` (at-least-once — a duplicate may be sent).
//
// `attempts` counts FAILED attempts only (incremented in `scheduleRetry`), so
// `maxAttempts` is the number of tolerated failures before a row is marked
// `failed`. A row is never claimed once `attempts >= maxAttempts`.
// ============================================================================

/** Outbox row status lifecycle: pending -> sending -> sent | failed | suppressed. */
export const OutboxStatus = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
  SUPPRESSED: 'suppressed',
} as const;
export type OutboxStatusValue = (typeof OutboxStatus)[keyof typeof OutboxStatus];

/** Default cap on failed attempts before a row is marked `failed`. */
export const DEFAULT_MAX_ATTEMPTS = 8;

/** Backoff base: 30s * 2^(attempts-1), capped at 1 hour. */
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_CAP_MS = 60 * 60_000;

/** Cap + sanitize stored error strings so recipient data / secrets never land at rest. */
const MAX_ERROR_LENGTH = 500;
function sanitizeLastError(msg: unknown): string {
  const raw = msg instanceof Error ? msg.message : String(msg ?? '');
  // Strip control chars/newlines and truncate. Defense in depth — transports
  // already produce a `safeMessage`, but this guards against network error text.
  return raw.replace(/[\r\n\t]/g, ' ').slice(0, MAX_ERROR_LENGTH);
}

/** Compute the next attempt time for a retry: 30s * 2^(attempt-1), capped at 1h. */
export function backoffNextAttempt(failedAttempts: number): Date {
  const exp = Math.min(Math.pow(2, failedAttempts - 1) * BACKOFF_BASE_MS, BACKOFF_CAP_MS);
  return new Date(Date.now() + exp);
}

/** Input for enqueuing an email intent. */
export interface EnqueueEmailInput {
  /** Recipient address (normalized here). */
  toEmail: string;
  /** Owning notification (nullable for out-of-band emails). */
  notificationId?: string | null;
  /** Owning user (nullable for anonymized/out-of-band recipients). */
  userId?: string | null;
  emailType: EmailType;
  category: EmailCategory;
  locale?: string | null;
  maxAttempts?: number;
}

@Injectable()
export class EmailOutboxService {
  private readonly logger = new Logger(EmailOutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a pending EmailOutbox row. Pass a `tx` to write atomically with the
   * caller's own transaction (NotificationsService does this with its
   * Notification insert). Without `tx`, uses the shared client.
   */
  async enqueue(
    input: EnqueueEmailInput,
    tx?: Prisma.TransactionClient,
  ): Promise<EmailOutbox> {
    const db = tx ?? this.prisma;
    return db.emailOutbox.create({
      data: {
        toEmail: normalizeEmail(input.toEmail),
        notificationId: input.notificationId ?? null,
        userId: input.userId ?? null,
        emailType: input.emailType,
        category: input.category,
        locale: input.locale ?? 'en',
        status: OutboxStatus.PENDING,
        maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      },
    });
  }

  /**
   * Atomically claim up to `limit` due, pending rows and mark them `sending`.
   * Authentication-category emails are claimed first (verification codes / password
   * resets are time-critical). Uses FOR UPDATE SKIP LOCKED so concurrent workers
   * never claim the same row. Rows that have exhausted `maxAttempts` are skipped.
   */
  async claimNextBatch(limit: number): Promise<EmailOutbox[]> {
    // Single-statement UPDATE…RETURNING with a SKIP LOCKED subselect. The row
    // lock is held for the statement duration, which is sufficient for the
    // status flip; no enclosing transaction is needed.
    const rows = await this.prisma.$queryRaw<EmailOutbox[]>`
      UPDATE "EmailOutbox"
      SET "status" = ${OutboxStatus.SENDING},
          "lockedAt" = NOW(),
          "lastAttemptAt" = NOW()
      WHERE "id" IN (
        SELECT "id" FROM "EmailOutbox"
        WHERE "status" = ${OutboxStatus.PENDING}
          AND "nextAttemptAt" <= NOW()
          AND "attempts" < "maxAttempts"
        ORDER BY
          CASE "category" WHEN 'authentication' THEN 0 ELSE 1 END,
          "nextAttemptAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *`;
    return rows;
  }

  /** Provider accepted the email — record success and release the lock. */
  async markSent(id: string, providerMessageId: string): Promise<void> {
    await this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status: OutboxStatus.SENT,
        sentAt: new Date(),
        providerMessageId: providerMessageId || null,
        lastAttemptAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
    });
  }

  /** Permanent failure (4xx / invalid recipient) — terminal, no retry. */
  async markFailed(id: string, error: unknown): Promise<void> {
    await this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status: OutboxStatus.FAILED,
        lastError: sanitizeLastError(error),
        lastAttemptAt: new Date(),
        lockedAt: null,
      },
    });
  }

  /**
   * Retryable failure (429 / 5xx / timeout / network). Increments `attempts` and
   * schedules the next attempt with exponential backoff. When `attempts` reaches
   * `maxAttempts`, the row is marked `failed` instead of requeued.
   */
  async scheduleRetry(id: string, error: unknown): Promise<void> {
    const current = await this.prisma.emailOutbox.findUnique({
      where: { id },
      select: { attempts: true, maxAttempts: true },
    });
    if (!current) return;

    const nextAttempts = current.attempts + 1;
    if (nextAttempts >= current.maxAttempts) {
      await this.prisma.emailOutbox.update({
        where: { id },
        data: {
          status: OutboxStatus.FAILED,
          attempts: nextAttempts,
          lastError: sanitizeLastError(error),
          lastAttemptAt: new Date(),
          lockedAt: null,
        },
      });
      this.logger.warn(
        `Email outbox row ${id} marked FAILED after ${nextAttempts} attempts: ${sanitizeLastError(error)}`,
      );
      return;
    }

    await this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status: OutboxStatus.PENDING,
        attempts: nextAttempts,
        nextAttemptAt: backoffNextAttempt(nextAttempts),
        lastError: sanitizeLastError(error),
        lastAttemptAt: new Date(),
        lockedAt: null,
      },
    });
  }

  /**
   * Recipient is suppressed (hard bounce / complaint) — terminal, no retry.
   * Phase 3 wires this from the Brevo webhook; exposed now so the dispatcher
   * can short-circuit a known-suppressed address.
   */
  async markSuppressed(id: string, reason?: string): Promise<void> {
    await this.prisma.emailOutbox.update({
      where: { id },
      data: {
        status: OutboxStatus.SUPPRESSED,
        lastError: reason ? sanitizeLastError(reason) : null,
        lastAttemptAt: new Date(),
        lockedAt: null,
      },
    });
  }

  /**
   * Recover rows stuck in `sending` past the lock timeout (a worker crashed
   * mid-send). Resets them to `pending` with `nextAttemptAt = NOW()` so the next
   * dispatcher tick reclaims them. At-least-once: a duplicate may be sent if the
   * original worker actually delivered but crashed before marking sent.
   */
  async requeueStaleSending(staleAfterMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - staleAfterMs);
    const result = await this.prisma.emailOutbox.updateMany({
      where: {
        status: OutboxStatus.SENDING,
        lockedAt: { lt: cutoff },
      },
      data: {
        status: OutboxStatus.PENDING,
        nextAttemptAt: new Date(),
        lockedAt: null,
      },
    });
    if (result.count > 0) {
      this.logger.warn(`Requeued ${result.count} stale-sending email outbox rows`);
    }
    return result.count;
  }

  /** Count rows by status — for monitoring / tests. */
  async countByStatus(status: OutboxStatusValue): Promise<number> {
    return this.prisma.emailOutbox.count({ where: { status } });
  }
}