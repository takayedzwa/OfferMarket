-- Adds a nullable `tokenHash` column to VerificationCode. The 6-digit OTP code
-- continues to live in `codeHash`; the magic-link token (a 32-byte url-safe
-- random value) is hashed (SHA-256) into `tokenHash`. Both share one row, so
-- using either the code or the link first invalidates the other (single-use
-- via row delete). NULL for PHONE verifications (no link — code only).
-- Idempotent (IF NOT EXISTS) to match the project's manual-SQL convention.

ALTER TABLE "VerificationCode" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;

CREATE INDEX IF NOT EXISTS "VerificationCode_tokenHash_idx"
  ON "VerificationCode" ("tokenHash");