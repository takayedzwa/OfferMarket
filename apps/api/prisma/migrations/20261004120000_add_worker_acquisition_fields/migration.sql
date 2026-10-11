-- Acquisition boundary (service-to-service, e.g. offermarket-ai-acquisition):
--   Worker.acquisition_idempotency_key — supplied by the acquisition service on
--     create; UNIQUE, so a redelivered create call collapses into one worker
--     instead of a duplicate account (P2002 is mapped to a replay response).
--   Worker.acquisition_source / _campaign_id / _ad_id / _ad_set_id —
--     provenance for workers acquired through paid channels. Nullable because
--     self-service signups have none.
--   Worker.acquisition_platform / _campaign_name / _ad_set_name / _ad_name —
--     attribution dimensions (prompt 9). Ids come from the webhook; names are
--     filled by the acquisition service when it fetches them from the ad
--     platform's API. A generic platform string keeps future channels
--     (GOOGLE, TIKTOK, ORGANIC) schema-free.

ALTER TABLE "Worker" ADD COLUMN "acquisition_idempotency_key" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_source" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_platform" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_campaign_name" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_ad_set_name" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_ad_name" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_campaign_id" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_ad_id" TEXT;
ALTER TABLE "Worker" ADD COLUMN "acquisition_ad_set_id" TEXT;

CREATE UNIQUE INDEX "Worker_acquisition_idempotency_key_key" ON "Worker"("acquisition_idempotency_key");
CREATE INDEX "Worker_acquisition_campaign_id_idx" ON "Worker"("acquisition_campaign_id");
CREATE INDEX "Worker_acquisition_platform_idx" ON "Worker"("acquisition_platform");