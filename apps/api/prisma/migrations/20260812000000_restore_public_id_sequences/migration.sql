-- Restore the PostgreSQL sequences used by the application to generate
-- human-friendly, race-safe public IDs (Worker -> "W-000001", Offer -> "O-000001").
--
-- These sequences existed in the pre-baseline migration history but were
-- silently dropped when the migration baseline was reset to a single
-- `20260810000000_init` generated from schema.prisma (Prisma does not model
-- raw sequences, so `migrate dev`/`migrate deploy` does not emit them).
-- `WorkersService.generateWorkerPublicId` and `OffersService.generateOfferPublicId`
-- call `nextval()` on them, so without these rows profile/offer creation 500s
-- with `relation "..._public_id_seq" does not exist` (42P01).
--
-- `IF NOT EXISTS` keeps this idempotent on databases that still carry the
-- sequences from the old history.

CREATE SEQUENCE IF NOT EXISTS "worker_public_id_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "offer_public_id_seq" START 1;