# AUDIT_REPORT

**Version:** v1 — initial technical audit
**Author:** technical-seo — consolidated by CEO
**Date of audit:** 2026-11-05 (all live fetches read-only GETs dated 2026-11-05)
**Status:** AUDIT — no code changed; tickets require human approval before implementation

## Summary
The technical foundation is structurally sound (SSR home pages, correct redirects, clean crawl hygiene) but **the domain architecture is blind to the two-domain setup**: a single `NEXT_PUBLIC_SITE_URL` env value serves robots.txt, sitemap, and canonicals for both domains, so **offermarket.nl currently advertises offermarket.eu's sitemap and has never had its own homepage declared**. Combined with **zero published insights** (the only content surface) and client-rendered listing pages, the site is close to invisible to search. The AI-search report's brand-collision finding makes this urgent rather than merely bad.

---

## Findings (evidence: file:line or live URL + date)

| # | Severity | Finding |
|---|---|---|
| F1 | HIGH | No canonical, hreflang, x-default or og:* anywhere except insight articles. Live HTML of offermarket.eu and offermarket.nl (2026-11-05): only title+description. Code: `[locale]/layout.tsx:29-40` returns only title/description; metadata exists only in `[locale]/insights/[slug]/page.tsx:33-56`. Domain-authoritative routing (`src/i18n/routing.ts:24-34`) means every route exists in two languages on two domains with no reciprocity signals. Fix: canonical + `alternates.languages` (en→eu, nl→nl, x-default→eu) site-wide via request-host-derived metadataBase. |
| F2 | HIGH | offermarket.nl robots.txt and sitemap.xml are copies of the EU domain. Live: offermarket.nl/robots.txt points at `https://offermarket.eu/sitemap.xml`; the sitemap lists only .eu URLs. Root cause: `sitemap.ts:9` / `robots.ts:3` use single build-time env `NEXT_PUBLIC_SITE_URL ?? "https://offermarket.eu"`. NL homepage never declared in a sitemap. Fix: derive site URL from request host (or per-domain envs). |
| F3 | HIGH | Cross-domain duplicate-content risk for insights articles: `InsightArticle` has **no locale field** (`schema.prisma:2149-2179`), slug globally unique → identical EN content renders on both domains. NL article URLs are neither canonicalised nor submitted. Fix **needs CTO decision**: (a) canonicalise NL→EU articles until per-locale content exists, or (b) add per-locale content fields + emit hreflang pairs. |
| F4 | MEDIUM | Article canonical/metadataBase depends on the same domain-blind global env (`[slug]/page.tsx:53-55`) → on .nl every article canonical would point at .eu; if env unset, OG URLs break. Unverifiable live only because zero articles exist (F13). Fix: same as F1/T1. |
| F5 | HIGH | `/insights` and `/insights/category/*` are client-only rendered ("use client" + useEffect fetch, `insights/page.tsx:1-2,26-43`, category page same) — server HTML shows loading skeleton, zero article links. These exact URLs are in the sitemap. Future articles discovered via sitemap only, no internal-link equity. Same bug class on /insights/your-market and /workers. Fix: server-render the listing grids; keep personalized panels client. |
| F6 | WIN | Home page, article body, and legal pages are server-rendered (async server component, `page.tsx:6-8`; article content arrives as RSC prop; static translations SSR'd). Live home HTML contains full translated hero/H1 on both domains. |
| F7 | MEDIUM | `/workers` is crawlable (live 200) but authenticated-only tool; missing from robots disallow (`robots.ts:13-22`); API is properly JWT+EMPLOYER-gated and IDOR-hardened (code comment states URL must be neither enumerable nor indexable). No data leak — crawler budget/index pollution only. Fix: add `/workers` to robots disallow. *(Same fix already surfaced independently by marketplace-architect as C1 — cross-agent agreement.)* |
| F8 | MEDIUM | Sitemap quality: `/login` included (zero search value); legal pages absent; no lastModified on home; `force-dynamic` contradicts the file's own "regenerated on each deploy" comment (it regenerates per request, API hit per fetch — decide: accept + fix comment, or add revalidate). |
| F9 | MEDIUM | Silent failure in sitemap generation (`catch { return staticRoutes }`, `sitemap.ts:41-44`) — an API outage during a deploy silently drops every article URL with no log. Fix: keep catch, add telemetry/log. |
| F10 | LOW | No noindex meta anywhere; /insights/your-market, /verify-email, /forgot-password, /reset-password, /register crawlable. Recommend noindex for /verify-email + /reset-password (token URLs), low priority rest. `/api/*` on web domain already renders the Next 404 with noindex (real API on api.offermarket.eu) — not an issue. |
| F11 | WIN | Crawl hygiene sound: www→308, locale-prefix /en //nl → 307 cross-domain, trailing-slash 308, proper 404s (incl. non-article slugs), correct per-domain `lang` attributes. |
| F12 | MEDIUM | Client-side data fetching on marketing pages → CLS risk + delayed content (F5 pattern). No LCP blockers on home (text H1, next/font preloaded). PostHog loads only after analytics consent via dynamic import — excellent. `public/` has 5 starter SVGs: **no image assets at all** (→ F14/T5 gap). |
| F12b | LOW | Article TTFB: uncached per-request API fetch (`cache()` per-request only, no ISR). Fine at low traffic; add `revalidate` once articles exist. |
| F13 | HIGH | **Zero published insights.** Live API `{"items":[],"total":0}`, sitemap has no article URLs, /insights grid empty. The entire insights SEO surface — the only indexable content beyond a 1-page marketing site — is empty. Fix is editorial: publish the first batch; this unblocks live verification of everything else. |

## Structured-data inventory
- **Present (only schema in codebase):** `NewsArticle` on `/insights/[slug]` (`[slug]/page.tsx:69-90`) — server-injected. Gaps: no `image` (required for Google article rich results), no `mainEntityOfPage`, likely wrong type for evergreen market-data analysis (should be `Article`/`BlogPosting`), headline/seoTitle inconsistency, publisher name "Offermarket" (brand inconsistency — flagged also by ai-search-geo).
- **Absent:** Organization (contactPoint data already exists in Footer), WebSite+SearchAction, BreadcrumbList, og:image defaults, article images.
- **Explicitly not applicable:** JobPosting (reverse marketplace — no public job listings; independent conclusion agreeing with ai-search-geo); FAQPage (no genuine FAQ content; don't shoehorn); profile schema (profiles are employer-gated; revisit only if public profile pages are built).

## Developer tickets (T1–T9) — full specifications in [TECHNICAL_IMPLEMENTATION.md](./TECHNICAL_IMPLEMENTATION.md)
T1 per-domain site URL (request-host derived) · T2 site-wide canonical + hreflang/x-default · T3 server-render insights listings · T4 robots /workers + noindex token pages · T5 OG/twitter image + site-wide OG metadata · T6 structured-data expansion · T7 sitemap cleanup + failure visibility · T8 article TTFB caching · **T9 publish first insights batch (editorial) + F3 cross-domain article policy decision (CTO)**.

## Cross-agent corroboration (consolidator's note)
- `/workers` robots fix: found independently by technical-seo (F7) and marketplace-architect (C1) — consistent.
- Single-domain sitemap/env: found independently by technical-seo (F2) and marketplace-architect (C3) — consistent.
- Zero published articles: found independently by technical-seo (F13) and ai-search-geo (open question 4) — consistent.
- `/insights/your-market` disallow: technical-seo F10 + marketplace-architect C2 — consistent.
- JobPosting not applicable: technical-seo + ai-search-geo — consistent, independent.

## Open items re-verification (once articles exist)
Actual per-deployment value of `NEXT_PUBLIC_SITE_URL` (F4) and per-domain env parity in Vercel; live behaviour of article canonical/JSON-LD.
