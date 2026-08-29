-- Referral program: per-user invite codes, attributed registrations and the
-- reward ledger behind them.
--
--   User.referralCode    — each user's personal invite code (?ref=CODE on register)
--   Referral             — one attribution per invitee (unique referredUserId)
--   ReferralReward       — one row per threshold milestone the referrer reaches
--
-- Lifecycle: registration attributes a referral (PENDING); the invitee's email
-- verification qualifies it (QUALIFIED — the implemented qualification rule;
-- see ReferralsService). Every time the qualified count crosses a threshold
-- multiple, a ReferralReward is created PENDING. Fulfillment is provider-
-- agnostic (`rewardProvider` + `providerReference`); 'manual' fulfillment by an
-- admin is the initial provider. See modules/referrals for the RewardProvider
-- interface a real gift-card vendor plugs into later.
--
-- Concurrency: the reward engine row-locks the referrer inside one transaction
-- and derives sequenceNumber from the count of existing rewards; the secondary
-- @@unique([ownerId, sequenceNumber]) is the DB-level backstop — a losing
-- concurrent insert fails with a unique-violation and is discarded, never
-- double-issued.
--
-- GDPR: both user FKs are SET NULL (like EmailOutbox.user) so history rows
-- survive erasure without ever blocking it.
--
-- `IF NOT EXISTS` / DO-block guards keep this idempotent against databases
-- that already carry the change (e.g. a partially-applied run), matching the
-- project's manual-SQL migration convention (see 20260816000000_add_email_outbox).

CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'INVALIDATED');
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'PROCESSING', 'FULFILLED', 'FAILED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT,
    "referredUserId" TEXT,
    "referralCode" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "attributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualifiedAt" TIMESTAMP(3),
    "invalidatedAt" TIMESTAMP(3),
    "invalidatedReason" TEXT,
    "attributedIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReferralReward" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "sequenceNumber" INTEGER NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'gift_card',
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "thresholdSnapshot" INTEGER NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "rewardProvider" TEXT NOT NULL DEFAULT 'manual',
    "providerReference" TEXT,
    "providerMetadata" JSONB,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Referral_referrerId_fkey') THEN
    ALTER TABLE "Referral"
      ADD CONSTRAINT "Referral_referrerId_fkey"
      FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Referral_referredUserId_fkey') THEN
    ALTER TABLE "Referral"
      ADD CONSTRAINT "Referral_referredUserId_fkey"
      FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralReward_ownerId_fkey') THEN
    ALTER TABLE "ReferralReward"
      ADD CONSTRAINT "ReferralReward_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- The invitee side also needs a plain index beyond the unique constraint
-- (uniqueness covers lookups; this keeps referred-user joins + admin filters fast).
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_attributedAt_idx" ON "Referral"("referrerId", "attributedAt");

-- Idempotency backstop for reward issuance (see header).
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralReward_ownerId_sequenceNumber_key"
  ON "ReferralReward"("ownerId", "sequenceNumber");
CREATE INDEX IF NOT EXISTS "ReferralReward_ownerId_status_idx" ON "ReferralReward"("ownerId", "status");
CREATE INDEX IF NOT EXISTS "ReferralReward_status_createdAt_idx" ON "ReferralReward"("status", "createdAt");

-- Monetary sanity guards on the reward ledger (matches the AdminSettings
-- minor-units convention, e.g. introduction_fee_cents).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralReward_amountMinor_positive') THEN
    ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_amountMinor_positive" CHECK ("amountMinor" > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralReward_currency_iso') THEN
    ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_currency_iso" CHECK ("currency" ~ '^[A-Z]{3}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralReward_sequenceNumber_positive') THEN
    ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_sequenceNumber_positive" CHECK ("sequenceNumber" > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReferralReward_thresholdSnapshot_positive') THEN
    ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_thresholdSnapshot_positive" CHECK ("thresholdSnapshot" > 0);
  END IF;
END $$;

-- Each user's personal referral code. Assigned lazily (first visit to the
-- referral dashboard), unique per user, indexed via the unique constraint.
-- Plain ADD COLUMN without IF NOT EXISTS is safe here: the column cannot
-- pre-exist in a database that has not run this migration (same convention as
-- 20260826000000_add_verification_token).
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");