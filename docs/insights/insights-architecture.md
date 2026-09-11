# Offermarket Insights — Product Architecture

**Status:** MVP implementation plan (approved) · **Date:** 2026-09-05
**Scope:** a new, integrated product module — the existing marketplace (offers, profiles, verification) is NOT redesigned.

---

## 0. Product thesis

Offermarket Insights is a **labor-market intelligence product**, not a blog. It answers, with evidence:

- What is my skill worth?
- What are employers actually offering?
- Where is demand highest, and how is it changing?
- Which employers are competitive?
- What regulation / labor-market developments affect me?

The durable moat is **Offermarket proprietary marketplace data** (verified, structured offers), combined
with official public data (CBS, UWV, RVO, Dutch government, Eurostat, European Commission) and
editorial analysis — with **four explicitly labeled data classes** that are never mixed or misattributed:

| Class | Label | Examples |
|---|---|---|
| 1 | `OFFERMARKT` — "Offermarket Marketplace Data" | salary ranges computed from submitted offers, demand counts, time-to-hire |
| 2 | `OFFICIAL` — "Official Public Data" | CBS wages, UWV vacancy stats, CAO scales |
| 3 | `THIRD_PARTY` — "Industry Data" | vendor reports (always attributed, always linked, never republished) |
| 4 | `EDITORIAL` — "Editorial Analysis" | opinion/analysis columns with no data claims |

**Integrity rules (hard constraints):**

1. Never generate a statistic when the sample size is below the published minimum (§12).
   If the minimum isn't met, the UI shows an explicit **"insufficient data" state**, never a number.
2. Estimates are always labeled `ESTIMATE`; verified marketplace aggregates are labeled
   `MARKETPLACE VERIFIED`. The two wordings never share a component without a legend.
3. No individual worker or employer is identifiable in any Insight. All employer-facing data is
   aggregated across at least `MIN_EMPLOYER_COHORT` employers.
4. Third-party content is summarized + linked to the original source; copyrighted material is
   never republished or scraped.
5. Every data-driven claim carries a transparency box (§6).

---

## 1. UX architecture

### 1.1 Information architecture

```
/insights                          Insights homepage (personalized dashboard + latest)
/insights/category/[category]      Category hubs (salary, demand, employers, industry, career)
/insights/[slug]                   Article page (clean URL, e.g. /insights/electrician-salary-rotterdam)
/insights/your-market              Full "Your Market" page (deep personalization)
/admin/insights                    Admin CMS: article list + lifecycle
/admin/insights/new                Create
/admin/insights/[id]/edit          Edit + schedule/publish/unpublish/archive (preview deferred)
/admin/insights/sources            Source registry CRUD
/profile/insights (section)        Follows: professions, regions, skills → notification prefs
```

Navigation is unchanged except for **one added primary tab: `Insights`**
(`Home · Offers · Discover · Insights · Profile`). No other tabs are added, changed, or removed.

### 1.2 Design language

Financial-Times × Bloomberg-terminal × modern SaaS. Deliberately **not** a job board:

- Data-first: numbers, deltas (▲/▼), sparklines and charts above imagery.
- A calm "paper" background, near-black ink, a single accent color; category color chips.
- Dense but readable: tabular numerals, clear typographic hierarchy, generous white space around charts.
- Every figure is visually tagged with its data class (badge: `Offermarket data` / `CBS` / `Industry` / `Editorial`).

### 1.3 Roles and what they see

| Surface | Anonymous | Worker | Employer | Admin |
|---|---|---|---|---|
| Homepage | Latest insights + categories, generic market banner | Personalized Market Overview + Your Market + latest | Employer Intelligence panel + latest | same as worker + CMS entry |
| Article | full read (SEO-driven growth) | full read + follow prompts | full read + employer view block | full read |
| Your Market | registration CTA with preview | deep personal view | hiring-market view | — |
| CMS | — | — | — | full CRUD + lifecycle |

---

## 2. Complete screen inventory

| # | Screen | Route | Access |
|---|---|---|---|
| 1 | Insights homepage (dashboard) | `/insights` | public shell; personalization when logged in |
| 2 | Category hub | `/insights/category/[category]` | public |
| 3 | Article | `/insights/[slug]` | public |
| 4 | Your Market (deep) | `/insights/your-market` | worker/employer |
| 5 | Follows & notification prefs | `/profile` section or `/insights/follows` | logged in |
| 6 | Admin CMS list | `/admin/insights` | ADMIN |
| 7 | Admin CMS editor (create/edit) | `/admin/insights/new`, `/admin/insights/[id]/edit` | ADMIN |
| 8 | Admin source registry | `/admin/insights/sources` | ADMIN |
| 9 | Employer intelligence block | embedded on article + homepage | EMPLOYER |

---

## 3. Component hierarchy (web)

```
<Navbar>                       (+ "Insights" tab — only navigation change)
<Footer>

InsightsHomePage
├─ <MarketBanner/>             (not built as a component — shipped as the
│                               homepage hero + tracked registration CTA)
├─ <PersonalMarketOverview/>   (worker): demand, salary range, trend, top skills,
│                               employer count, offer count, recent changes
├─ <EmployerIntelligencePanel/> (employer): hiring difficulty, competitiveness,
│                               competitor ranges, time-to-hire, acceptance rates
├─ <YourMarketCard/>           (the "Electrician · Rotterdam · 5 yr" hero card)
├─ <LatestInsightsGrid/>       (cards: Salary/Demand/Employers/Trends/Industry/Career)
├─ <CategoryChips/>            (5 category hubs)
└─ <DataClassLegend/>          (always-on legend of the 4 data classes)

InsightArticlePage
├─ <ArticleHeader/>            (title, summary, category, profession, region, dates)
├─ <TransparencyBox/>          (sample size, period, scope, methodology, data class)
├─ <ArticleBody/>              (markdown: main content)
├─ <InsightChart/>             (chart renderer for the article's `charts` JSON)
├─ <KeyStatsRow/>              (stat tiles with data-class badges)
├─ <SourceList/>               (citation list with links + publisher + dates)
├─ <ShareBar/>                 (LinkedIn · Facebook · WhatsApp + copy link)
├─ <RelatedInsights/>
└─ <FollowPrompt/>             (follow profession/region/skill)

Admin CMS
├─ InsightListTable            (status filters, publish date, actions)
├─ InsightEditor               (all fields; validation — live preview toggle
│                               deferred, not built)
├─ SourceEditor
└─ StatusBarActions            (schedule → publish → unpublish → archive)
```

---

## 4. Database schema additions (Prisma)

New models (all prefixed `Insight*`; see `apps/api/prisma/schema.prisma` for exact source):

- **InsightArticle** — the CMS record. `status` enum `DRAFT | SCHEDULED | PUBLISHED | UNPUBLISHED | ARCHIVED`.
  Fields: title, slug (unique), category (enum), summary, content (markdown), charts (Json[]),
  statistics (Json[]), keyStats, methodology, dataPeriodStart/End, dataClass enum
  (`OFFERMARKT | OFFICIAL | THIRD_PARTY | EDITORIAL`), profession, regionId?, skills[], authorId,
  seoTitle, metaDescription, socialTitle, publishAt, publishedAt, lastUpdatedAt, viewCount,
  uniqueReaderCount, shareCount. Indexed on status+publishAt, category, slug, profession, regionId.
- **InsightSource** — source registry: name, url (unique per name), publisher, publicationDate,
  dataDate, sourceType (enum: `CBS | UWV | RVO | DUTCH_GOVERNMENT | EUROSTAT | EUROPEAN_COMMISSION |
  INDUSTRY_REPORT | ACADEMIC | INTERNAL`), citation, notes.
- **InsightArticleSource** — m–n join (article ↔ source) with `isPrimary` and order.
- **InsightFollow** — a user follows profession / regionId / skillId (nullable; at least one set).
  Drives notification fan-out on publish. Indexed for look-up by publish fan-out.
- **InsightAnalyticsEvent** — append-only event log: sessionKey (pseudonymous), userId?, articleId?,
  eventType (`ARTICLE_VIEW | UNIQUE_READER | SHARE | REGISTER_CLICK | WORKER_REGISTER |
  EMPLOYER_REGISTER | CATEGORY_VIEW | SEARCH_IMPRESSION`), path, referrer, locale, createdAt.
  Retention: raw events pruned to 12 months; aggregate counters live on InsightArticle.
- **MarketSnapshot** (optional, prepared for later): cached computed aggregates keyed by
  (profession, regionId, snapshotDate) so the dashboard stays fast as data grows.

Sample-size minimums are **config**, not schema: originally `InsightsService`
constants (§12), now admin-editable `AdminSettings` — see Part II, P2.

---

## 5. API endpoints (NestJS `modules/insights`)

```
# Public
GET  /insights/articles                      list (published; filters: category, profession, region, page)
GET  /insights/articles/:slug                article detail (published only)
GET  /insights/categories                    the 5 content categories + counts
                                             (live + tested; UI chips are static for now)
GET  /insights/market/overview               personalized worker dashboard (auth: WORKER)
GET  /insights/market/employer               employer intelligence dashboard (auth: EMPLOYER)
GET  /insights/market/preview                generic (anonymous) market teaser — no numbers below threshold
                                             (live + tested; no UI consumer yet)
POST /insights/analytics/event               anonymous-safe event ingest (sessionKey from cookie)
POST /insights/analytics/conversion          worker/employer registration attribution

# Authenticated (any role)
POST /insights/follows                       follow { profession?, regionId?, skillId? }
DELETE /insights/follows/:id                 unfollow
GET  /insights/follows                       my follows

# Admin (ADMIN role)
POST   /admin/insights/articles              create (draft)
GET    /admin/insights/articles              list (all statuses, filters)
GET    /admin/insights/articles/:id          read any
PATCH  /admin/insights/articles/:id          edit
POST   /admin/insights/articles/:id/schedule { publishAt }
POST   /admin/insights/articles/:id/publish  (immediately or run scheduled publisher)
POST   /admin/insights/articles/:id/unpublish
POST   /admin/insights/articles/:id/archive
DELETE /admin/insights/articles/:id          soft-delete
POST   /admin/insights/preview               render preview without persisting publish state
                                             (NOT BUILT — deferred)
POST   /admin/insights/sources / GET / PATCH /:id / DELETE /:id   source registry CRUD
```

Guards: public endpoints open; market endpoints behind `JwtAuthGuard` + role check
(worker/employer); admin endpoints behind existing admin guard (mirrors `modules/admin`).
Slug validation: lowercase, kebab-case, unique, reserved-word check.

---

## 6. Data transparency & validation rules

Every data-driven article must pass a **publish-time validator**:

1. `sampleSize` required when `dataClass != EDITORIAL`.
2. `sampleSize >= MIN_SAMPLE_FOR_CATEGORY` (see §12) or publish is rejected with the reason.
3. `dataPeriodStart <= dataPeriodEnd`, `dataPeriodEnd` not in the future.
4. Every linked source must exist in the registry and have a URL; THIRD_PARTY sources must have
   publisher + publication date.
5. Charts/statistics JSON validated against the `InsightChart` / `InsightStat` shape.
6. `content` must be non-empty markdown ≤ 50k chars; `summary` ≤ 280 chars.
7. On the public article page the TransparencyBox renders from these fields — never hand-written
   prose like "Based on 247 verified offers submitted on Offermarket between July 1 and
   August 31, 2026." without the matching structured fields (that exact sentence is generated
   from `sampleSize`, `dataClass`, `dataPeriodStart/End` so it can never drift from the data).

---

## 7. Personalization logic ("Your Market" / market overview)

Inputs: worker's `primaryTrade`, `region`, `yearsOfExperience`, `skills` (ProfileSkill),
`certifications`. Computation (real platform data only; all gated by sample-size rules):

```
demandLevel        = count of SUBMITTED offers matching profession (+region) over last 90d
                     → Very High ≥ 100 · High ≥ 50 · Moderate ≥ 20 · Low ≥ 5 · else INSUFFICIENT_DATA
salaryRange        = P25–P75 of currentVersion.salaryMax (annualized) over accepted+submitted offers
salaryTrend        = median salaryMax: last-90d window vs previous-90d window, % delta
mostValuableSkills = skills appearing in ≥ MIN_SKILL_OFFERS matching offers, ranked by
                     salary premium (median salaryMax with skill − median without)
relevantEmployers  = distinct employers sending matching offers in period
relevantOffers     = matching SUBMITTED+ offers in period
recentChanges      = delta rows vs previous period (trend direction arrows)
```

Region fallback: if the worker's city has < min sample, fall back to province → country,
and **display which scope was used** ("Rotterdam sample too small — showing South Holland").
Employer view mirrors this for hiring difficulty, salary competitiveness (their submitted offers
vs market P50), candidate availability (eligible visible workers), time-to-hire (submitted→accepted
median), offer acceptance rate.

---

## 8. Analytics events

| Event | Trigger | Key metric path |
|---|---|---|
| `ARTICLE_VIEW` | article page load | views |
| `UNIQUE_READER` | first view per sessionKey per article | unique readers |
| `SEARCH_IMPRESSION` | article surfaced in search/list | impressions |
| `REGISTER_CLICK` | CTA click on article/homepage | reader → registration |
| `WORKER_REGISTER` / `EMPLOYER_REGISTER` | registration with insights referrer | **north-star: reader → registration** |
| `SHARE` | share button (network param) | virality |
| `RETURNING_READER` | sessionKey seen before | retention |
| `CATEGORY_VIEW` | category hub visit | navigation health |

Aggregates (`viewCount`, `uniqueReaderCount`, `shareCount`, `registerClickCount`, `registrationCount`)
are maintained on the article row; raw events enable funnel queries
`reader → REGISTER_CLICK → WORKER_REGISTER → first offer activity`.

---

## 9. Notifications

`InsightFollow` rows are the subscription list. On publish, a fan-out job matches follows by
profession/region/skill and creates `Notification` rows via the existing `NotificationsService`
(`notificationType: INSIGHT_PUBLISHED`, `actionUrl: /insights/[slug]`) — which lands in the
existing in-app notification pipeline and, through `createAndDeliver`, the transactional email
outbox (i18n'd via the user's `preferredLocale`).

Example email/in-app copy (NL): *"Nieuwe salarisdata voor elektriciens in Rotterdam beschikbaar."*

---

## 10. SEO architecture

- `generateMetadata` per article: SEO title (≤60 chars), meta description (≤155), canonical URL,
  OpenGraph (title/description/type=article/published_time/social image), Twitter card.
- `NewsArticle`-style JSON-LD structured data (headline, datePublished, dateModified, author, image).
- Clean slugs: `/insights/electrician-salary-rotterdam`, `/insights/electrician-demand-netherlands`,
  `/insights/most-in-demand-electrical-skills`.
- `sitemap.xml` includes all PUBLISHED articles (+ `lastmod` = lastUpdatedAt); robots.txt allows
  `/insights`, disallows `/admin`.
- Server-rendered article content (SSR) so crawlers see the full text.

---

## 11. Admin CMS architecture & permission model

- Only `UserRole.ADMIN` reaches `/admin/insights/*` (existing admin guard on API + client-side
  admin layout gate). SUPPORT can read but not write.
- Status lifecycle: `DRAFT → SCHEDULED → PUBLISHED ⇄ UNPUBLISHED → ARCHIVED`.
  A scheduled article publishes automatically when `publishAt <= now` (publisher run on read of
  the admin list + a cron-ish sweep on each insights list request — cheap and reliable for MVP).
- Every CMS mutation writes `AdminAction` audit rows (`entityType: "insight_article"`).
- Author defaults to the acting admin; free-text override allowed.
- Preview was designed as "render the same article component from admin state,
  no SEO indexing (`X-Robots-Tag: noindex` on preview route)" but was **not
  built** — admin review happens through the CMS edit form. The design stays
  valid for a future build.

---

## 12. Sample-size rules (MVP defaults, config in `InsightsService`)

| Statistic | Minimum sample | Notes |
|---|---|---|
| Salary range (P25–P75) | **30** offers | below → "Insufficient data" |
| Salary trend (% change) | **60** offers total across both windows | below → "Not yet measurable" |
| Demand level | **5** offers in 90d | below → INSUFFICIENT_DATA |
| Most valuable skills | **10** offers per skill | skill omitted otherwise |
| Employer cohort aggregates | **8** employers per cohort | never per-employer |
| Time-to-hire benchmark | **20** completed (accepted) offers | |
| Article statistics block | **30** relevant observations | validated at publish |

These thresholds deliberately start high so nothing is published that can't be defended; they're
constants in one place so they loosen as the marketplace grows. *(As of Part II they are
admin-editable runtime config with these values as the defaults.)*

---

## 13. Sample UI layout (homepage, worker view)

```
┌────────────────────────────────────────────────────────────────────┐
│ Home  Offers  Discover  [Insights]  Profile                        │
├────────────────────────────────────────────────────────────────────┤
│ INSIGHTS — Dutch skilled-trade labor market intelligence           │
│                                                                    │
│ ┌─ YOUR MARKET ────────────────────────────────────────────────┐  │
│ │ Electrician · Rotterdam · 5 yrs experience                    │  │
│ │ Demand: VERY HIGH ▲   Typical salary: €4,400–€5,000/mo        │  │
│ │ Trend: +4.2% ▲   Relevant skills: Industrial automation,      │  │
│ │ EV charging, Maintenance   Employers hiring: 12 · Offers: 34  │  │
│ │ ⚠ Based on 34 verified offers, Jul 1 – Aug 31 2026 · Offermarket │  │
│ └───────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ LATEST INSIGHTS                                    Salary Demand…  │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│ │ SALARY    │ │ DEMAND    │ │ EMPLOYERS │ │ TRENDS    │          │
│ │ Electric… │ │ Vacancy…  │ │ Offer…    │ │ Energy t… │          │
│ │ €4.4–5.0k │ │ ▲ 18% QoQ │ │ 12 firms  │ │ +4.2%     │          │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│                                                                    │
│ Data classes: ● Offermarket data  ● Official (CBS/UWV)  ● Industry   │
└────────────────────────────────────────────────────────────────────┘
```

Article page: two-column FT-style — headline + summary + transparency box on top, body + charts
left, key stats + sources + share rail right.

---

## 14. MVP implementation plan (what this build delivers)

1. **Prisma schema + migration** for all §4 models.
2. **API `modules/insights`**: public article/category endpoints, personalized market overview +
   employer view with sample-size gating and region fallback, analytics ingest, follows,
   admin CMS CRUD + lifecycle + sources. Seed: the 5 categories, CBS/UWV/RVO source stubs,
   2–3 EDITORIAL example articles (clearly editorial — no invented market data).
3. **Web**: `Insights` navbar tab (only nav change), homepage dashboard, category hubs, article
   page with TransparencyBox + ShareBar + JSON-LD + OG, sitemap, `Your Market` components,
   anonymous "insufficient data" states.
4. **Admin CMS**: list/editor/source registry with status actions (article
   preview deferred).
5. **Tests**: unit tests for the statistics/sample-size service, component tests for new UI,
   updated lucide-react mocks.

Deliberately deferred (future): scheduled-email digests, A/B testing, chart builder UI beyond JSON
forms, multi-country locales beyond EN/NL.

---

## 15. Future architecture — European labor-market intelligence platform

- **Data lake**: move analytics events + snapshot computation to a warehouse (ClickHouse/BigQuery)
  with dbt models; API serves precomputed `MarketSnapshot` rows instead of live queries.
- **Snapshot engine**: nightly materialized aggregates per (profession, region, skill) — the MVP
  computes on read; the future system computes on write and version-controls methodology.
- **Multi-market**: profession + region become reference data served per country (NL first);
  data-class labels and sample-size thresholds become per-market config.
- **API product**: public/enterprise endpoints for salary benchmarks (partner/AI licensing),
  with rate limits and attribution requirements.
- **Forecasting**: time-series models over snapshots (demand/salary forecast with confidence
  intervals, always labeled `ESTIMATE` + methodology version).
- **Editorial ops**: multi-author workflow, review/approval states, corrections log (every
  published number keeps a correction history — trust is the product).
- **Compliance**: insights data is aggregate-only (no personal data), so GDPR surface stays small;
  analytics events are pseudonymous (sessionKey) with 12-month pruning already in the design.

---

# Part II — Market Intelligence engine (P1–P7, implemented 2026-09-06)

The CMS (Part I) is the editorial surface. The engine below is the **data
product** underneath it: one aggregation service that is the single definition
of every metric, point-in-time snapshots, a versioned profession taxonomy, an
explainable market-value indicator, an auto-draft generator that only ever
creates DRAFTs for admin review, and the admin Market Intelligence console that
exposes all of it. Design rule throughout: **trust is the product** — never
fabricate, never hide sample sizes, never present an estimate as a fact.

## P1 · Aggregation engine — `market-aggregation.service.ts`

- The **single definition** of every market metric (salary range/percentiles,
  demand level, skill premiums + growth, employer cohorts, time-to-hire,
  regional shortages). The snapshot engine, the dashboard and the generator
  all compose this service — no metric is ever recomputed with a second,
  drifting implementation.
- Every return is a `GatedValue` (`{ available, reason? 'INSUFFICIENT_DATA',
  value?, sampleSize? }`); unsupported numbers simply do not exist in the API
  surface.
- `MARKET_ACTIVE_STATUSES` is exported from `market-aggregation.service.ts`
  and defines which offer statuses count toward market aggregates — the
  snapshot, dashboard, generator and profession services all consume the
  aggregation engine rather than recomputing anything. The pre-engine
  on-read personalization path (`insights-stats.service.ts`) keeps an
  identical private copy of the status list; fold it onto the exported
  constant if the two ever diverge.
- Shortage classification per region: offers vs available candidates →
  `HIGH / MODERATE / LOW`, gated by the demand sample threshold.

## P2 · Admin-configurable statistical safeguards — `insights-config.service.ts`

- The §12 sample-size minimums are now **runtime config**, not code constants:
  `AdminSettings` rows `insights.thresholds` and `insights.generator`
  (category `insights`, JSON values).
- `DEFAULT_THRESHOLDS` mirrors the original `SAMPLE_SIZES` (30/60/5/10/8/20/30)
  plus `WINDOW_DAYS: 90` and `SNAPSHOT_RETENTION_DAYS: 730`;
  `DEFAULT_GENERATOR_CONFIG = { enabled: true, salaryChangePct: 3,
  demandGrowthPct: 15, benefitMinSample: 20, benefitMinGapPct: 5 }`.
- Typed fallbacks + defensive merge: unknown keys and type-invalid values are
  ignored; a DB failure degrades to defaults (the engine never fails open on a
  missing settings row). 60-second in-memory cache with explicit invalidation
  on update.
- Every change is audited (`AdminAction` on `admin_settings`).

## P3 · Snapshot + time-series engine — `insights-snapshot.service.ts`

- Nightly cron (`0 30 2 * *`): composes the aggregation engine per
  (profession, regionId, day) and persists `MarketSnapshot` rows with full
  provenance — `{ methodVersion, computedAt, thresholds }` — so every number
  ever published can be reproduced.
- `METHOD_VERSION = 1` is recorded on all provenance; bump it whenever the
  methodology changes so historical snapshots stay interpretable.
- `GET /insights/market/trends?profession&granularity=day|week|month|quarter|yoy`
  builds series from stored snapshots: day = raw, week/month/quarter = calendar
  bucketing (last snapshot in bucket wins), `yoy` pairs same-month snapshots
  across years.
- `SNAPSHOT_RETENTION_DAYS` prunes old rows on the nightly run.
- Admin: `GET /admin/insights/market/snapshots` (paged, profession/region
  filters) + detail — provenance inspection is a first-class admin surface.

## P4 · Profession taxonomy — `market-profession.service.ts` + `Profession` model

- Admin-managed reference data: `slug` (unique), `name`, `nameEn`, `group`,
  `aliases[]`, `description`, `isActive` (soft-disable only — taxonomy history
  is never destroyed), `sortOrder`, `version`.
- **Version bump on definition change**: free-text trades recorded on profiles
  keep resolving against the taxonomy by slug / name / nameEn / alias, so
  renaming a profession never silently re-buckets historical data.
- Seeded with 11 entries (electrician, hvac-technician, industrial-mechanic,
  welder, plumber, nurse, care-worker, truck-driver, bus-driver,
  electrical-engineer, mechanical-engineer) with NL names + EN nameEn +
  aliases; seed upserts use `update: {}` to protect admin edits across re-seeds.
- Public reads (`/insights/market/professions`, groups, skill search);
  admin CRUD with `PROFESSION_CREATED / UPDATED / DEACTIVATED` audits;
  `profession.slug_taken` error surfaced in the admin UI.

## P5 · Explainable market-value indicator — `computeMarketValue` (stats service)

- A transparent **points rubric, max 100**:
  `EXPERIENCE 25 · SKILLS 25 · DEMAND 20 · CERTIFICATIONS 15 ·
  COMPARABLE_OFFERS 15`. Each component returns points, maxPoints, raw inputs
  (`detail`), an `explanationKey` (`MARKET_VALUE.*`) and `explanationParams` —
  the UI renders exactly those, so "why is this my score" is always answerable.
- Insufficient data scores **0 for that component and says so** (e.g.
  `MARKET_VALUE.DEMAND_UNKNOWN`) — never silently skipped.
- `salaryPercentile` is separately gated: the worker's desired salary position
  vs the comparable-offer sample, with `sampleSize` shown.
- Web: `MarketValueCard` (progress bar, per-component rows, expandable
  explanations, honesty note "no hidden model"), embedded in
  `PersonalMarketOverview` and i18n'd EN+NL with ICU plurals.

## P6 · Auto-draft insights generator — `insights-generator.service.ts`

- Nightly cron (`0 45 2 * *`, after snapshots) + manual "Run now".
- Rules over the aggregation engine: salary change (`SALARY_CHANGE`),
  demand growth (`DEMAND_GROWTH`), benefit competitiveness gap
  (`BENEFIT_IMPACT`) — each fires only above its configured trigger and
  sample threshold; below-trigger **silence** (no noise drafts).
- Output is **always `status: DRAFT`, `autoGenerated: true`** — never
  auto-published; admins review and publish through the existing CMS lifecycle.
- Idempotent: `generatedFrom.ruleKey` (e.g.
  `salary:Electrician:country:2026-07`) is queried before create, so a re-run
  never duplicates a draft.

## P7 · Admin Market Intelligence console

- API (`/admin/insights/market/*`, AdminGuard, audited): `dashboard` (totals,
  gated salary + demand with sample sizes, skills, regional shortages,
  pending drafts, methodVersion + window provenance), `thresholds`
  GET/PUT, `generator-config` GET/PUT + `generate` POST, `snapshots`,
  and profession CRUD.
- Web: `/admin/insights/market` — live dashboard with honest gated states,
  the 9-threshold safeguards form with dirty tracking, generator config +
  enabled toggle + run-now with result counts, snapshots table with
  profession filter; `/admin/insights/professions` — grouped taxonomy table,
  create/edit form (group datalist, comma-separated aliases), soft-deactivate.

## Engine wiring

- Migration: `20260906000000_add_intelligence_engine` (Profession table +
  insights fields); seed adds the 11 taxonomy entries and both
  `insights.*` AdminSettings rows.
- Web i18n: `marketValue` section in `insights.json`, `market` + `professions`
  sections in `admin-insights.json` (EN + NL parity enforced).