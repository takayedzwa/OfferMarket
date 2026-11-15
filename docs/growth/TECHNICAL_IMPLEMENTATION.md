# TECHNICAL_IMPLEMENTATION

**Version:** v1 — proposed developer tickets (NOT yet approved for implementation)
**Source:** technical-seo audit (2026-11-05), see [AUDIT_REPORT.md](./AUDIT_REPORT.md)
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
