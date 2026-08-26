-- Email suppression list: recipient addresses Brevo flagged (hard bounce,
-- complaint/spam, blocked, invalid). Written by the Brevo webhook; the
-- EmailDeliveryGate short-circuits outbox rows whose toEmail is suppressed.
-- Idempotent upsert on (email, reason) so Brevo retries don't duplicate rows.
--
-- Idempotent (IF NOT EXISTS / DO block) to match the project's manual-SQL
-- migration convention (see 20260812000000_restore_public_id_sequences).

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SuppressionReason') THEN
    CREATE TYPE "SuppressionReason" AS ENUM ('HARD_BOUNCE', 'COMPLAINT', 'BLOCKED', 'INVALID');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "EmailSuppression" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "SuppressionReason" NOT NULL,
    "brevoEventId" TEXT,
    "providerMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

-- One row per (email, reason): an address can be suppressed for multiple reasons,
-- but the same (email, reason) pair must not duplicate (webhook retry idempotency).
CREATE UNIQUE INDEX IF NOT EXISTS "EmailSuppression_email_reason_key"
  ON "EmailSuppression"("email", "reason");

CREATE INDEX IF NOT EXISTS "EmailSuppression_email_idx"
  ON "EmailSuppression"("email");

CREATE INDEX IF NOT EXISTS "EmailSuppression_brevoEventId_idx"
  ON "EmailSuppression"("brevoEventId");