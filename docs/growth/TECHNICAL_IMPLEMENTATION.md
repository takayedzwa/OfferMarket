# TECHNICAL_IMPLEMENTATION

**Version:** v2 — T1–T9 complete (2026-11-09) + T10–T12 scoped (2026-11-15, /market phase)
**Source:** technical-seo audit (2026-11-05) + marketplace-architect Δ4 + quality M-N4/Q12; grounded in code inspection 2026-11-15 (insights module: nightly MarketSnapshot cron `@Cron('30 2 * * *')` with provenance payloads; public unguarded routes `market/preview|trends`; AdminSettings key/value store)
**Note:** each ticket is a proposed, smallest-coherent change. T9 includes a CTO product decision. Nothing here has been implemented.

## T1 — Per-domain canonical site URL (request-host derived)
- **Fixes:** F2, F4 (root unblocker for the two-domain setup).
- **Files:** `apps/web/src/app/sitemap.ts`, `apps/web/src/app/robots.ts`, `apps/web/src/app/[locale]/insights/[slug]/page.tsx`, `apps/web/src/app/[locale]/layout.tsx`; new `apps/web/src/lib/site-url.ts`.
- **Spec:** derive the site URL from the request host (`headers()` — robots.ts/sitemap.ts receive the request in Next) instead of the single global `NEXT_PUBLIC_SITE_URL`; keep env as fallback.
- **Acceptance:** on offermarket.nl, /robots.txt points at `https://offermarket.nl/sitemap.xml`; /sitemap.xml lists only offermarket.nl URLs; every page's `<link rel="canonical">` self-references its own host; article OG URLs match the serving host.

## T2 — Site-wide canonical + cross-domain hreflang with x-default
- **Fixes:** F1.
- **Files:** `[locale]/layout.tsx` (base alternates/canonical), `[locale]/insights/[slug]/page.tsx`, per-page metadata for home/insights.
- **Spec:** hreflang pairs en→offermarket.eu, nl→offermarket.nl, x-default→offermarket.eu, plus self-canonical.
- **Acceptance:** verified in live HTML on both domains.

## T3 — Server-render the insights listing pages
- **Fixes:** F5, F12.
- **Files:** `[locale]/insights/page.tsx`, `[locale]/insights/category/[category]/page.tsx` (child components as needed); keep personalized panels client-side.
- **Acceptance:** `curl -s https://offermarket.eu/insights | grep <article-slug>` finds article links without JS; category pages likewise; skeleton remains only for personalized panels, CLS-neutral.

## T4 — robots.txt: disallow /workers; noindex token/auth pages
- **Fixes:** F7, part of F10. *(Corroborated by marketplace-architect C1/C2.)*
- **Files:** `apps/web/src/app/robots.ts` (add `/workers`, optionally `/insights/your-market`); small noindex metadata on `verify-email`, `forgot-password`, `reset-password`.
- **Acceptance:** live robots.txt lists Disallow: /workers on both domains; /workers still loads for signed-in employers.

## T5 — Default OG/Twitter image + site-wide OG metadata
- **Fixes:** F12/F8 image gap; also required for T6 article rich results.
- **Files:** `[locale]/layout.tsx` (og:site_name, og:locale, fallback og:image); new `opengraph-image` or static `public/` asset (~1200×630); `[slug]/page.tsx` per-article og:image (editorial field or `next/og`).
- **Acceptance:** home OG tags on both domains; articles pass Twitter card validator; no 404 on shared OG image.

## T6 — Structured-data expansion
- **Fixes:** structured-data gaps (AUDIT_REPORT §2).
- **Files:** layout or home `page.tsx` (Organization + WebSite), `[slug]/page.tsx` (NewsArticle→Article, add `image` + `mainEntityOfPage`, align headline with seoTitle, add BreadcrumbList); fix publisher name to "OfferMarket".
- **Acceptance:** home emits Organization+WebSite (logo resolves); article JSON-LD validates in Rich Results test. **Do NOT add JobPosting or FAQPage** without real content.

## T7 — Sitemap cleanup + failure visibility
- **Fixes:** F8, F9 (drop the /login decision was architect's C4 too).
- **Files:** `sitemap.ts` (drop /login; add /terms, /privacy, /cookies, /dsa/report; add lastModified; resolve force-dynamic-vs-comment contradiction; log instead of silently swallowing insightsApi failures).
- **Acceptance:** no /login in sitemap; generation errors appear in server logs; documented cadence matches behaviour.

## T8 — Article page TTFB caching
- **Fixes:** F12b.
- **Files:** `[slug]/page.tsx` (ISR/revalidate; on-demand purge hook from admin publish/unpublish if added later).
- **Acceptance:** stable cache behaviour, TTFB not gated on api.offermarket.eu per request; edits appear within the documented window.

## T9 — Publish the first insights batch (editorial) + cross-domain article policy decision
- **Fixes:** F13, F3 — unblocks live verification of T1/T2/T6.
- **Action:** publish ≥3 articles via the existing admin insights CMS; **CTO decision recorded** for F3: (a) canonicalise NL article URLs to the EU equivalent until per-locale content exists, or (b) add per-locale content fields to `InsightArticle` + emit hreflang pairs.
- **Acceptance:** ≥3 published articles live on both domains; article URLs in both sitemaps (or canonicalised per decision).

## Dependency order
T1 → T2 (T2 needs T1's per-host URL) · T3, T4, T5, T7 independent · T6 after T5 (image) · T8 any time · T9 editorial, unblocks re-verification.

## Review flow (per repo rules)
All code tickets: standard review flow, focused tests, human approval before touching production. T9's editorial batch should go through the dutch-content agent once keyword clusters (KEYWORD_DATABASE) and the approved architecture (URL_ARCHITECTURE) are confirmed.

---

# /MARKET PHASE (scoped 2026-11-15 — implementation pending approval)

Grounding (code-verified 2026-11-15): `InsightsSnapshotService.writeDailySnapshots()` writes per-(profession, region, day) MarketSnapshot rows with provenance (thresholds, method version, computedAt); public unguarded API routes exist for `market/preview` and `market/trends`; `AdminSettings` is a validated key/value store used the same way by referral knobs. The unified gate (Q12 ruling) = salary sample ≥ **30** indexable / < **20** twice consecutively = exit (hysteresis), display thresholds stay engine-side.

## T11 — Gate machinery + stable public data endpoint (API, M)
Owner: backend. No schema change (quality M3/M-N4 constraints — sign-off + hysteresis state live in `AdminSettings` key `market_page_gates`).
1. **Public endpoint** `GET /insights/market/public/:profession` (and `/:profession/:citySlug`): returns exactly the GatedValue payload (sampleSize, percentiles, demand level, methodVersion, computedAt, provenance.thresholds) + `{ indexable: boolean, citySlug? }`. Permissive CORS + `Cache-Control` with documented revalidate — this is simultaneously the D2.4 public data feed (Dataset `contentUrl` target) and the web page's data source. Guard-free like `market/preview`; no per-worker data (internal-workers controller stays out).
2. **Gate service** `MarketPageGateService` (pure evaluation fn + persistence): input = latest N=2 monthly snapshot sampleSizes + sign-off entry; output = indexable | 404-eligible. Unit-tested as pure fn (threshold pass, hysteresis enter @30, exit after 2 consecutive <20, sign-off required for city pages only, ≥2-employer condition = OFF by default pending aggregation query feasibility).
3. **Admin sign-off endpoints**: `GET/POST/DELETE /admin/market/gate-signoffs` on AdminSettings (`{profession, citySlug, signedOffBy, signedOffAt}`), reusing the referral-knob validation pattern + admin guard/roles.
4. **Hysteresis job**: extend the existing daily snapshot cron tail with a monthly-rolling log entry per (profession, city) so the 2-consecutive-months rule has data.
Acceptance: pure-fn tests cover enter/exit/missing-sign-off; endpoint contract test (no auth 200, payload shape, provenance fields present); admin CRUD test; gate state change logged.

## T10 — /market web pages (web, M)
Owner: frontend. Server components (T3 pattern — constants server-safe, clients only for CTAs).
1. **`/market/[profession]`** (elektricien only at launch): editorial intro (T+E) + salary-range module (from T11 endpoint, gated display) + demand gauge + **provenance label** (window + sample size + method version) + Occupation JSON-LD (`estimatedSalary` from snapshot aggregates **+ `occupationLocation` NL** — quality's missing-field note) + Dataset JSON-LD (`distribution` → T11 endpoint) + BreadcrumbList + canonical-only alternates (Δ5 row 2: **no hreflang** — NL-market content) + worker register CTA + `/for-employers` link.
2. **`/market/[profession]/[citySlug]`**: server gate check on render (T11 service via endpoint response) → `notFound()` when gate fails (404, not a noindex shell — Δ4 doctrine). Content: city data modules (province-fallback ladder display-only, "distinct-source check": city row must differ from province) + city-unique editorial block (sign-off prerequisite; ≥40% city-unique body per Δ4) + Place JSON-LD only if `Region.lat/lng` non-null (F-N1: import seed-geography coordinates or omit geo) + M6 bucketed counts ("20+") only.
3. **`/market` hub index**: lists gate-passing (profession, city) pages server-side; noindex until ≥1 profession ships if empty.
4. **Sitemap integration**: sitemap.ts reads gate-passing (profession, city) set from T11 endpoint and emits those URLs + hub.
5. **Per-page specs**: dutch-content fills the Δ7 template (16 fields) for `/market/elektricien` + first city pages before build — the B1 owner-row ("wat verdient/uurloon → /market") is the enforcement point.
Acceptance: gate-failing city URL returns 404 (not 200-noindex); page HTML contains provenance labels + Occupation JSON-LD; verify-script checks added (canonical, 404-on-gate-fail, JSON-LD presence); jest test for gate→notFound behavior.

## T12 — Insights ↔ market cross-links (small, after T10)
One-line addition to the insights article module: when `Article.profession`/`regionId` resolve, inject the "related market data" module linking to `/market/{profession}(/{city})`. Only links to gate-passing pages.

## Sequencing & conditions
T11 → T10 → T12. **Do NOT ship `/market/verpleegkundige` until the outstanding BIG/VOG/Wkkgz legal review closes (Q8).** Current supply reality means many city pages will stay 404 initially — per design (M2), template ships, pages follow data. Effort: T11 ≈ M (3–5 sessions), T10 ≈ M (3–5 + editorial content), T12 ≈ S.
