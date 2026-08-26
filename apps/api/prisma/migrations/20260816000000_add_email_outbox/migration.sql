-- Email outbox: durable email intent (Postgres outbox pattern).
-- `NotificationsService.createAndDeliver` writes a Notification + an EmailOutbox
-- row atomically; the EmailDispatcher drains the outbox (FOR UPDATE SKIP LOCKED)
-- and re-renders the EmailMessage at send time (intent-only storage).
--
-- Status lifecycle: pending -> sending -> sent | failed | suppressed.
-- Auth emails are NOT enqueued here (raw tokens can't be reconstructed at retry;
-- reviewer §20 forbids storing sensitive content at rest) — they stay inline.
--
-- `IF NOT EXISTS` keeps this idempotent against databases that already carry
-- the table (e.g. a partially-applied run), matching the project's manual-SQL
-- migration convention (see 20260812000000_restore_public_id_sequences).

CREATE TABLE IF NOT EXISTS "EmailOutbox" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "userId" TEXT,
    "toEmail" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 8,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- Foreign keys. The notification relation uses ON DELETE SET NULL so a
-- retention purge of old notifications keeps the historical send record; the
-- user relation likewise SET NULL to preserve the audit trail after erasure.
-- Postgres has no `ADD CONSTRAINT IF NOT EXISTS`, so guard with a DO block to
-- keep the migration idempotent (matches the project's manual-SQL convention).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailOutbox_notificationId_fkey') THEN
    ALTER TABLE "EmailOutbox"
      ADD CONSTRAINT "EmailOutbox_notificationId_fkey"
      FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailOutbox_userId_fkey') THEN
    ALTER TABLE "EmailOutbox"
      ADD CONSTRAINT "EmailOutbox_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Dispatcher lookup: the main claim query filters on status + nextAttemptAt
-- and orders auth emails ahead of notification emails.
CREATE INDEX IF NOT EXISTS "EmailOutbox_status_nextAttemptAt_idx"
  ON "EmailOutbox"("status", "nextAttemptAt");

-- Stale-sending reaper scans for rows stuck in `sending` past the lock timeout.
CREATE INDEX IF NOT EXISTS "EmailOutbox_status_lockedAt_idx"
  ON "EmailOutbox"("status", "lockedAt");

CREATE INDEX IF NOT EXISTS "EmailOutbox_notificationId_idx"
  ON "EmailOutbox"("notificationId");

CREATE INDEX IF NOT EXISTS "EmailOutbox_userId_idx"
  ON "EmailOutbox"("userId");

CREATE INDEX IF NOT EXISTS "EmailOutbox_toEmail_idx"
  ON "EmailOutbox"("toEmail");