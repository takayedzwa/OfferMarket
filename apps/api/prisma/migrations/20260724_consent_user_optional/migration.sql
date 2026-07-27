-- Allow anonymous (cookie) consent records that are not linked to a User.
-- Previously the anonymous consent endpoint stored userId = 'anonymous', which
-- violated the Consent.userId foreign key to User.id (Prisma P2003) and caused
-- HTTP 500 on POST /privacy/consents/anonymous. Make the column nullable so
-- anonymous consents can be stored with a NULL user reference.
ALTER TABLE "Consent" ALTER COLUMN "userId" DROP NOT NULL;