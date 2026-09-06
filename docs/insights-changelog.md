# Offermarket Insights — Implementation Changelog

**Branch:** `Implement-KVK-company-verification` (uncommitted at time of writing)
**Date:** 2026-09-05 → 2026-09-06
**Companion doc:** `docs/insights-architecture.md` (the approved spec and deliverables design)

This document records everything that was actually built for the Offermarket
Insights module: files created and modified, the data model, endpoints, page
inventory, design decisions enforced in code, and verification results.

---

## 1. Summary

Insights is the labor-market intelligence product for the reverse talent
marketplace (first market: electricians in NL). It ships as a new integrated
module — the existing marketplace was not redesigned, and exactly **one** tab
("Insights") was added to the main navigation.

Core invariants, enforced in code rather than by convention:

- **No invented market data.** Every statistic is either computed from the
  marketplace (labeled `OFFERMARKT`) or comes from a registered source
  (`OFFICIAL` / `THIRD_PARTY`) or is pure analysis (`EDITORIAL`). The API
  returns a `GatedValue` envelope — `{ available: false, reason:
  'INSUFFICIENT_DATA', sampleSize }` — whenever the verified sample is below
  the configured minimum, and the UI renders an honest "Insufficient data"
  state instead of a number.
- **Transparency on every data-driven page.** Sample size, data period,
  geographic scope (with a region fallback ladder city→province→country and a
  visible scope note), profession and methodology render in a TransparencyBox
  on every article and personalized panel.
- **Third-party sources are cited, never republished.** The source registry
  stores metadata + URL only; readers link out to CBS / UWV / RVO /
  Rijksoverheid / Eurostat / European Commission originals.
- **Privacy-safe analytics.** Events carry a random per-browser session key
  (never an IP or device fingerprint); the ingest endpoint is public,
  throttled, and aggregate counters live on the article row.

---

## 2. Database

### 2.1 Schema additions (`apps/api/prisma/schema.prisma`)

| Addition | Detail |
|---|---|
| `InsightCategory` | `SALARY`, `DEMAND`, `EMPLOYER`, `INDUSTRY`, `CAREER` |
| `InsightStatus` | `DRAFT` → `SCHEDULED` → `PUBLISHED` ⇄ `UNPUBLISHED` → `ARCHIVED` |
| `InsightDataClass` | `OFFERMARKT`, `OFFICIAL`, `THIRD_PARTY`, `EDITORIAL` |
| `InsightSourceType` | `CBS`, `UWV`, `RVO`, `DUTCH_GOVERNMENT`, `EUROSTAT`, `EUROPEAN_COMMISSION`, `INDUSTRY_REPORT`, `ACADEMIC`, `INTERNAL` |
| `InsightEventType` | `ARTICLE_VIEW`, `UNIQUE_READER`, `CATEGORY_VIEW`, `SHARE`, `REGISTER_CLICK`, `WORKER_REGISTER`, `EMPLOYER_REGISTER`, `RETURNING_READER`, `SEARCH_IMPRESSION` |
| `InsightArticle` | slug (unique), title, summary, category, content, profession?, regionId?, skills[], charts (Json[]), statistics (Json[]), keyStats, methodology, dataPeriodStart/End, dataClass, sampleSize?, sampleDescription?, authorId?/authorName?, SEO fields (seoTitle, metaDescription, socialTitle), status, publishAt/publishedAt, lastUpdatedAt, aggregate counters (view/uniqueReader/share/registerClick/registration), soft delete |
| `InsightSource` | name, url (unique together), publisher, sourceType, publicationDate?, dataDate?, citation?, notes? |
| `InsightArticleSource` | join with `isPrimary`, `order` |
| `InsightFollow` | userId + any of profession / regionId / skillSlug, notifyEmail |
| `InsightAnalyticsEvent` | append-only: sessionKey, userId?, articleId?, eventType, path?, referrer?, locale? |
| `MarketSnapshot` | per (profession, regionId, snapshotDate) — reserved for point-in-time trend storage |
| `User` | + relations `insightArticles` (author), `insightFollows` |
| `Region` | + relations `insightArticles`, `insightFollows`, `marketSnapshots` |

### 2.2 Migration

`apps/api/prisma/migrations/20260905000000_add_insights/migration.sql`
(hand-written SQL per project convention; all enum creation is idempotent
DO-blocks guarded on `duplicate_object`; applied with `npx prisma migrate
deploy`). Note: `prisma migrate dev` requires a TTY and was not usable here.

### 2.3 Seed (`apps/api/src/prisma/seed.ts`)

- 7 official `InsightSource` rows: CBS Salarisindex, CBS Vacaturestatistiek,
  UWV, RVO, Rijksoverheid, Eurostat, European Commission.
- 3 published `EDITORIAL` example articles (`why-offermarket-insights-exists`,
  `how-offermarket-salary-data-is-built`,
  `reading-offermarket-insights-data-classes`) — authored as
  "Offermarket Editorial" with **explicitly no invented market numbers**.

---

## 3. Backend (`apps/api`)

### 3.1 New module: `apps/api/src/modules/insights/`

| File | Purpose |
|---|---|
| `insights-settings.ts` | Config constants: `SAMPLE_SIZES` (SALARY_RANGE 30, SALARY_TREND 60, DEMAND_LEVEL 5, MOST_VALUABLE_SKILLS 10, EMPLOYER_COHORT 8, TIME_TO_HIRE 20, MIN_ARTICLE_SAMPLE 30), `MARKET_WINDOWS` (90d current + 90d previous), `DEMAND_BUCKETS` (VERY_HIGH ≥100, HIGH ≥50, MODERATE ≥20, LOW ≥5), `MAX_PUBLISH_FANOUT` 500, percentile/median helpers |
| `dto/insight-article.dto.ts` | class-validator DTOs: article upsert/create/update, schedule, analytics event, follow, source; exports `INSIGHT_SLUG_REGEX` (kebab-case clean-URL contract) |
| `insights-stats.service.ts` | Personalized intelligence: `getWorkerMarketOverview` (profile → demand classification, P25–P75 annualized salary, median-window trend, most-valuable-skills premiums, employer/offer counts, recent changes — all sample-gated, with region fallback ladder + `scopeNote`), `getMarketPreview`, `getEmployerMarketView` (hiring difficulty, salary competitiveness, demand by region, candidate availability, competitor offer P25/P50/P75, time-to-hire, cohort acceptance rate — strictly cohort aggregates, never individual data) |
| `insights.service.ts` | Public reads (list/detail/categories/preview, scheduled-publish sweep), admin CRUD + lifecycle (create → DRAFT, schedule, publish → validates + fan-out, unpublish, archive, soft delete), source registry CRUD, follows, analytics ingest with unique-reader resolution and article counter maintenance, publish-time validator (`validateForPublish`: non-EDITORIAL requires sampleSize ≥ 30 and a data period not ending in the future), AdminAction audit rows |
| `insights.controller.ts` | `@Controller('insights')` — public reads; `GET market/overview` guarded `@Roles('WORKER')`, `GET market/employer` guarded `@Roles('EMPLOYER')`; public throttled analytics POST; JWT-guarded follows |
| `insights-admin.controller.ts` | `@Controller('admin/insights')` — AdminGuard only (self-authenticating, never paired with JwtAuthGuard), throttled; article lifecycle + source CRUD + audit |
| `insights.module.ts` | Registers the two services, exports both |
| `__tests__/insights.service.spec.ts` | 9 tests: slug uniqueness, publish gating (sample too small / missing data period), editorial publish OK, NotFound, follow validation, analytics unknown-article rejection, unique-reader counting |
| `__tests__/insights-stats.service.spec.ts` | 6 tests: empty overview → INSUFFICIENT_DATA, salary at threshold with city scope, province fallback + scopeNote, monthly salary annualization (€4,000/mo → €48,000/yr), employer cohort gating, empty employer view |

### 3.2 Modified backend files

| File | Change |
|---|---|
| `src/app.module.ts` | Registered `InsightsModule` |
| `src/i18n/error-codes.ts` | + 9 codes: `INSIGHT_NOT_FOUND`, `INSIGHT_SLUG_TAKEN`, `INSIGHT_INVALID_TRANSITION`, `INSIGHT_SAMPLE_TOO_SMALL`, `INSIGHT_DATA_PERIOD_REQUIRED`, `INSIGHT_SOURCE_NOT_FOUND`, `INSIGHT_FOLLOW_EMPTY`, `INSIGHT_FOLLOW_NOT_FOUND`, `INSIGHT_REGION_NOT_FOUND` |
| `src/modules/notifications/notification.types.ts` | + `INSIGHT_PUBLISHED = 'insight.published'` + `InsightPublishedPayload` |
| `src/modules/notifications/notifications.service.ts` | + `handleInsightPublished` listener → createAndDeliver (email + push, actionUrl `/insights/{slug}`) |

### 3.3 API surface (all under global prefix `api/v1`)

**Public**

```
GET  /insights/articles              ?page&limit&category&profession&regionId → { items, total, page, limit }
GET  /insights/articles/:slug        full detail (admin-only fields stripped)
GET  /insights/categories            per-category published counts
GET  /insights/market/preview        ?profession — anonymous market snapshot
POST /insights/analytics/event       throttled 120/min, pseudonymous sessionKey
```

**Authenticated**

```
GET    /insights/market/overview     WORKER — personalized "Your Market"
GET    /insights/market/employer     EMPLOYER — employer intelligence view
GET    /insights/follows             list own follows
POST   /insights/follows             follow profession / regionId / skillSlug (≥1 required)
DELETE /insights/follows/:id         unfollow (ownership-checked)
```

**Admin (AdminGuard)**

```
GET/POST        /admin/insights/articles
GET/PATCH/DEL   /admin/insights/articles/:id
POST            /admin/insights/articles/:id/schedule|publish|unpublish|archive
GET/POST        /admin/insights/sources
PATCH/DELETE    /admin/insights/sources/:id
```

Publish behavior: `publish` first runs `validateForPublish` (sample-size and
data-period rules per §1), then sets status, `publishedAt`, and fans out
`INSIGHT_PUBLISHED` notifications to matching followers (cap 500). The same
validator gates the scheduled-publisher sweep, so a scheduled article can
never auto-publish in an invalid state.

---

## 4. Frontend (`apps/web`)

### 4.1 Routes

| Route | Type | Content |
|---|---|---|
| `/insights` | SSG shell + client | Hero, 4-class data legend, personalized panel (worker "Your Market" / employer intelligence — role-aware from AuthContext), anonymous registration CTA (tracked), category chips, latest-insights grid |
| `/insights/[slug]` | Server component + client view | `generateMetadata` (seoTitle/metaDescription fallbacks, canonical, OpenGraph/Twitter), NewsArticle JSON-LD, generated OG image; reader: markdown body, SVG charts, key stats, TransparencyBox, numbered sources with outbound links, share rail, follow prompt, related insights, tracked registration CTA |
| `/insights/[slug]/opengraph-image.tsx` | Dynamic | 1200×630 social preview rendered from article fields via `next/og` |
| `/insights/category/[category]` | Client | Salary / Demand / Employer / Industry / Career (+ `all` archive); clean URLs, `CATEGORY_VIEW` tracking |
| `/insights/your-market` | Client | Deep personalized view: full worker/employer panel + `FollowManager` subscription management |
| `/admin/insights` | Client (ADMIN-gated) | Article list with status filter and lifecycle actions; publish is confirm-guarded (fans out notifications); backend validation errors surface inline |
| `/admin/insights/new` + `/admin/insights/[id]/edit` | Client | Shared `InsightArticleForm` |
| `/admin/insights/sources` | Client | Source registry CRUD (name, URL, publisher, type, publication/data dates, citation, notes) |
| `src/app/sitemap.ts` | Route handler | Static routes + all 5 category pages + up to 100 published article slugs; fails soft if API unreachable |
| `src/app/robots.ts` | Route handler | Allows public pages; disallows /admin, /dashboard, /offers, /profile, /conversations, /support, /privacy/dashboard |

### 4.2 Components (`src/components/insights/`)

| Component | Role |
|---|---|
| `DataClassBadge` | Colored badge per data class — every number is visually tagged with its origin |
| `InsufficientData` | The honest gated empty state (shows sample count when known) |
| `TransparencyBox` | Sample size, data period, scope, profession, methodology + class badge; composed from structured fields, never hand-typed prose |
| `MarkdownContent` | Safe markdown-subset renderer (headings, bold/italic/code, lists) → React elements, no `dangerouslySetInnerHTML` |
| `InsightChart` | Dependency-free SVG bar chart from chart JSON (no charting library added) |
| `InsightCard` / `LatestInsightsGrid` | Cards carrying category, data class, sample size, views; honest empty state |
| `CategoryChips` | Five category browse chips + data-class legend sentence |
| `PersonalMarketOverview` | Worker "Your Market": demand level, P25–P75 salary, trend, skill premiums, employer/offer counts, recent changes — all `GatedValue`-aware |
| `EmployerIntelligencePanel` | Employer cohort intelligence: difficulty, competitiveness, competitor ranges, availability, time-to-hire, acceptance rate, demand by region |
| `FollowPrompt` / `FollowManager` | Follow profession/region from an article (sign-in gated); list/unfollow on Your Market |
| `useInsightsTracking` | ARTICLE_VIEW + UNIQUE_READER on mount, CATEGORY_VIEW on category pages, `trackInsightEvent` for SHARE / REGISTER_CLICK; sessionKey via `getInsightsSessionKey()` |
| `admin/InsightArticleForm` | Full CMS editor: content fields, data-integrity block (dataClass, sample size/description, data period, methodology), source checkboxes, JSON editors for charts/statistics/keyStats, SEO block, auto-slug generation |

### 4.3 Modified frontend files

| File | Change |
|---|---|
| `src/components/Navbar.tsx` | + `Newspaper` icon import; + single public "Insights" tab (all users, placed after Home). No other tab added, changed, or removed |
| `src/lib/api.ts` | + types (`GatedValue<T>`, `WorkerMarketOverview`, `EmployerMarketView`, `InsightArticleCard`, `InsightSourceRef`, `InsightArticleDetail`, `InsightFollow`); + `insightsApi` (10 methods), `insightAdminApi` (13 methods); + `getInsightsSessionKey()` (random 32-hex key in localStorage, try/catch fallback) |
| `src/app/[locale]/admin/page.tsx` | + Insights CMS quick-action card (`Newspaper` icon → `/admin/insights`) |
| `src/app/[locale]/admin/page.test.tsx`, `src/components/Navbar.test.tsx` | + `Newspaper` to the lucide-react test mocks (required by the icon-mock convention) |

### 4.4 i18n

- New namespaces (EN + NL, parity-checked): `insights.json` (hero, data
  classes, your market incl. employer section, latest, categories, article
  transparency/sources/share, insufficient-data, follow, CTA) and
  `admin-insights.json` (CMS list, form, lifecycle actions, statuses, source
  registry).
- Updated: `nav.json` (+ "Insights"), `errors.json` (+ `insight.*` codes),
  `admin.json` (+ insights quick-action), both locale barrels (`index.ts`).
- `npm run check:i18n` passes (3,247 keys, EN ↔ NL parity).

---

## 5. Design decisions worth knowing

1. **Sample-size gating is config, not convention.** All thresholds live in
   `insights-settings.ts`; change them there and both the API gates and the
   publish validator follow.
2. **`GatedValue` envelope.** The API never returns an unsupported number;
   the UI contract is `available ? value : InsufficientData`.
3. **Region fallback ladder.** City → province → country with a visible
   `scopeNote` ("Local sample too small — showing regional data"), so numbers
   are never presented more precisely than they are.
4. **Salary computation.** Monthly salaries are annualized (×12); hourly is
   excluded; range = P25–P75 of `salaryMax` over the 90-day window; trend
   compares medians of the current vs previous 90-day window (gated at 60).
5. **Publish integrity.** One validator (`validateForPublish`) guards both
   manual publish and the scheduled sweep — invalid scheduled articles are
   logged, never auto-published.
6. **Analytics privacy.** Random session key per browser; no IP, no device
   fingerprint; unique-reader = first event per (sessionKey, article, type).
7. **Manual SQL migrations.** The migration is hand-written and idempotent,
   matching project convention (`prisma migrate deploy` to apply).
8. **Environment fix during verification.** The
   `@next/swc-darwin-arm64` package was missing its native binary (broken
   install), which made every web jest run fail with "Failed to load
   bindings". Restored from the npm tarball; recorded in agent memory.

---

## 6. Verification results

| Check | Result |
|---|---|
| `npx prisma migrate deploy` | All migrations applied |
| `prisma db seed` | 7 sources + 3 editorial articles seeded |
| API `tsc --noEmit` | Clean |
| API tests (`npx jest`) | **608/608 passed** (40 suites; 15 insights-specific) |
| Web `tsc --noEmit` | Clean |
| Web tests (`npx jest`) | **187/187 passed** (13 suites; 22 new Insights tests) |
| `npm run check:i18n` | Pass (3,247 keys parity) |
| `next build` (clean `.next`) | Succeeds; all Insights routes registered (SSG homepage/your-market/admin, dynamic article/category/OG-image, sitemap.xml, robots.txt) |
| Live smoke test | Articles list + detail ✓ · categories ✓ · analytics event accepted + counted ✓ · unauthenticated `/market/overview` → 401 ✓ · empty market preview returns honest `{ offers: 0, salaryAvailable: false }` ✓ |

---

## 7. Not in scope / deferred (matches the MVP plan in the architecture doc)

- Market snapshot cron (compute + store `MarketSnapshot` rows) — schema ready,
  writer not yet scheduled.
- Search-impression tracking events (endpoint accepts `SEARCH_IMPRESSION`,
  nothing emits it yet).
- Per-article uploaded social images (generated OG image covers the MVP).
- Pagination UI on category/archive pages (API supports it; page fetches 24).
- Admin dashboard article-count stat card (quick-action link ships instead).

---

*Everything is currently uncommitted on
`Implement-KVK-company-verification`; `kvk response.json` is an unrelated
pre-existing untracked file.*