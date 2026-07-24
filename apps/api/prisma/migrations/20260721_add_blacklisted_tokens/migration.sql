-- CreateTable
CREATE TABLE IF NOT EXISTS "BlacklistedToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BlacklistedToken_jti_key" UNIQUE ("jti"),
    CONSTRAINT "BlacklistedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BlacklistedToken_jti_idx" ON "BlacklistedToken"("jti");
CREATE INDEX IF NOT EXISTS "BlacklistedToken_expiresAt_idx" ON "BlacklistedToken"("expiresAt");

-- Create sequences for atomic public ID generation (W-M1 race condition fix)
CREATE SEQUENCE IF NOT EXISTS worker_public_id_seq START WITH 1781640491773;
CREATE SEQUENCE IF NOT EXISTS offer_public_id_seq START WITH 15;