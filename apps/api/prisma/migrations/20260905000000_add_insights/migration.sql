-- Offermarket Insights — labor-market intelligence product.
--
--   InsightArticle        — the CMS record (status lifecycle DRAFT → SCHEDULED →
--                           PUBLISHED ⇄ UNPUBLISHED → ARCHIVED; clean slug URLs)
--   InsightSource         — source registry (CBS / UWV / RVO / Eurostat / EC /
--                           industry reports; summarized + linked, never republished)
--   InsightArticleSource  — article ↔ source m-n join (primary flag + ordering)
--   InsightFollow         — user follows profession / region / skill; publish fan-out
--   InsightAnalyticsEvent — append-only analytics log (pseudonymous sessionKey);
--                           durable aggregates live as counters on InsightArticle
--   MarketSnapshot        — cached per (profession, region, date) aggregates; MVP
--                           computes on read, the nightly snapshot engine writes here later
--
-- GDPR: analytics events are keyed by a pseudonymous sessionKey (never IP or
-- device id); userId is optional and nullable. No personal data lands in any
-- Insights aggregate — everything user-facing is computed from offers.
--
-- `IF NOT EXISTS` / DO-block guards keep this idempotent, matching the
-- project's manual-SQL migration convention.

DO $$ BEGIN
  CREATE TYPE "InsightCategory" AS ENUM ('SALARY', 'DEMAND', 'EMPLOYER', 'INDUSTRY', 'CAREER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "InsightStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "InsightDataClass" AS ENUM ('OFFERMARKT', 'OFFICIAL', 'THIRD_PARTY', 'EDITORIAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "InsightSourceType" AS ENUM ('CBS', 'UWV', 'RVO', 'DUTCH_GOVERNMENT', 'EUROSTAT', 'EUROPEAN_COMMISSION', 'INDUSTRY_REPORT', 'ACADEMIC', 'INTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "InsightEventType" AS ENUM ('ARTICLE_VIEW', 'UNIQUE_READER', 'CATEGORY_VIEW', 'SHARE', 'REGISTER_CLICK', 'WORKER_REGISTER', 'EMPLOYER_REGISTER', 'RETURNING_READER', 'SEARCH_IMPRESSION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "InsightArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "InsightCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "profession" TEXT,
    "regionId" TEXT,
    "skills" TEXT[],
    "charts" JSONB[],
    "statistics" JSONB[],
    "keyStats" JSONB,
    "methodology" TEXT,
    "dataPeriodStart" TIMESTAMP(3),
    "dataPeriodEnd" TIMESTAMP(3),
    "dataClass" "InsightDataClass" NOT NULL DEFAULT 'EDITORIAL',
    "sampleSize" INTEGER,
    "sampleDescription" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "socialTitle" TEXT,
    "status" "InsightStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueReaderCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "registerClickCount" INTEGER NOT NULL DEFAULT 0,
    "registrationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InsightArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InsightSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3),
    "dataDate" TIMESTAMP(3),
    "sourceType" "InsightSourceType" NOT NULL,
    "citation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InsightArticleSource" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InsightArticleSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InsightFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profession" TEXT,
    "regionId" TEXT,
    "skillSlug" TEXT,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightFollow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InsightAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "userId" TEXT,
    "articleId" TEXT,
    "eventType" "InsightEventType" NOT NULL,
    "path" TEXT,
    "referrer" TEXT,
    "locale" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MarketSnapshot" (
    "id" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "regionId" TEXT,
    "snapshotDate" DATE NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InsightArticle_slug_key" ON "InsightArticle"("slug");
CREATE INDEX IF NOT EXISTS "InsightArticle_status_publishAt_idx" ON "InsightArticle"("status", "publishAt");
CREATE INDEX IF NOT EXISTS "InsightArticle_category_status_idx" ON "InsightArticle"("category", "status");
CREATE INDEX IF NOT EXISTS "InsightArticle_profession_status_idx" ON "InsightArticle"("profession", "status");
CREATE INDEX IF NOT EXISTS "InsightArticle_regionId_idx" ON "InsightArticle"("regionId");
CREATE INDEX IF NOT EXISTS "InsightArticle_publishedAt_idx" ON "InsightArticle"("publishedAt");

DO $$ BEGIN
  ALTER TABLE "InsightArticle" ADD CONSTRAINT "InsightArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InsightArticle" ADD CONSTRAINT "InsightArticle_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "InsightSource_name_url_key" ON "InsightSource"("name", "url");
CREATE INDEX IF NOT EXISTS "InsightSource_sourceType_idx" ON "InsightSource"("sourceType");

DO $$ BEGIN
  ALTER TABLE "InsightArticleSource" ADD CONSTRAINT "InsightArticleSource_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "InsightArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InsightArticleSource" ADD CONSTRAINT "InsightArticleSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "InsightSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "InsightArticleSource_articleId_sourceId_key" ON "InsightArticleSource"("articleId", "sourceId");
CREATE INDEX IF NOT EXISTS "InsightArticleSource_sourceId_idx" ON "InsightArticleSource"("sourceId");

DO $$ BEGIN
  ALTER TABLE "InsightFollow" ADD CONSTRAINT "InsightFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "InsightFollow" ADD CONSTRAINT "InsightFollow_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "InsightFollow_profession_idx" ON "InsightFollow"("profession");
CREATE INDEX IF NOT EXISTS "InsightFollow_regionId_idx" ON "InsightFollow"("regionId");
CREATE INDEX IF NOT EXISTS "InsightFollow_skillSlug_idx" ON "InsightFollow"("skillSlug");
CREATE INDEX IF NOT EXISTS "InsightFollow_userId_idx" ON "InsightFollow"("userId");

DO $$ BEGIN
  ALTER TABLE "InsightAnalyticsEvent" ADD CONSTRAINT "InsightAnalyticsEvent_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "InsightArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "InsightAnalyticsEvent_eventType_createdAt_idx" ON "InsightAnalyticsEvent"("eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "InsightAnalyticsEvent_articleId_idx" ON "InsightAnalyticsEvent"("articleId");
CREATE INDEX IF NOT EXISTS "InsightAnalyticsEvent_sessionKey_idx" ON "InsightAnalyticsEvent"("sessionKey");
CREATE INDEX IF NOT EXISTS "InsightAnalyticsEvent_userId_idx" ON "InsightAnalyticsEvent"("userId");

DO $$ BEGIN
  ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "MarketSnapshot_profession_regionId_snapshotDate_key" ON "MarketSnapshot"("profession", "regionId", "snapshotDate");
CREATE INDEX IF NOT EXISTS "MarketSnapshot_profession_snapshotDate_idx" ON "MarketSnapshot"("profession", "snapshotDate");