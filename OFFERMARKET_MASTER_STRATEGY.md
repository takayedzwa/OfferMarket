# OFFERMARKET_MASTER_STRATEGY

**Version:** 3.0 — full research (2 waves) + 2 quality reviews complete; awaiting CTO approval of the decisions list before any implementation
**Last updated:** 2026-11-05
**Owner:** OfferMarket CEO agent (orchestrated from the main session)
**Standing rules (CTO):** never merge anything without explicit approval; nothing touches production; research-only until approved.

## Controlling brief
- **Brief v2 (2026-11-05, the "dominate Dutch electrical recruitment" master prompt):** 19 sections, 18 deliverables. Supersedes brief v1 where they conflict. All delta research is consolidated into docs/growth/ and quality-reviewed twice.
- **Status:** every deliverable in the brief is either complete (audit §3, keyword research §4/§2, competitor analysis §9, AI-GEO strategy §5, inventory strategy §6, KPI framework §13) or specified-but-gated (complete URL map §4 + per-page specs §14.8 → gated on the Q11 contract ruling and Dutch-content phase; 90-day roadmap below §12; JSON-LD examples ship inside the approved tickets).

## The strategic position (all evidence dated 2026-11-05; detail in docs/growth/)
1. **OfferMarket is currently invisible** (site:offermarket.eu → zero; brand SERP owned by offermarket.us; no entity footprint anywhere) and the site has **zero published content** against a working CMS.
2. **The visibility gap is ~60% technical and cheap:** one domain-blind env var (NL serves EU's sitemap), zero canonical/hreflang/OG, client-rendered listing pages, /workers crawlable. All have verified, small fixes (tickets T1–T8).
3. **The moat is real but private:** gated salary aggregation with provenance (nobody — not Indeed, NVB, Jobbird, Werkzoeken — has offer-level rate data), verified-certification model (the answer to "qualified" queries), reverse-marketplace mechanics no competitor's page can copy.
4. **The SERP has an evidenced entry path:** question-form salary family ("wat verdient een elektromonteur") and cluster C/H hubs are materially weaker than the heads and demonstrably rankable by small data-carrying domains (mijntechcarriere, koel-monteur precedents). The anonymous-applying query (the product itself) has only 2–3 retrievable sources. The "beste werkgever voor elektriciens" SERP is a stale 2023 Glassdoor scrape. The EN "NL electrical-specialist platform" slot is empty.
5. **Conversion chokes on two gates:** employers face a manual admin-only verification (docs promise automation that doesn't exist) with no public supply proof and no pricing page; workers finish a wizard that omits the fields employers filter on and land on a dead-end dashboard.

## Approved research conclusions (CEO-consolidated, quality-verified)
- **No /nl/ path prefix** — domain-based locales stay; unlocalized paths (Q9). Brief's /nl/ examples absorbed: beroepen→/market, salaris→/insights, gezocht→/hire, werkgevers/elektriciens→/hire, city→/market/{rol}/{stad} (Q10–Q12).
- **No /vacatures pages** — a vacancy-look without listings is the doorway pattern; reversal triggers documented; live-demand data framing instead (Q10). Evidence and design ruling converged independently.
- **Two domains, each exclusive to its locale; .nl = definitive NL-market domain; no migration** (zero SEO equity exists); never canonicalise NL→EU (Q14).
- **One-page-per-intent contract (B1 v2):** wat-verdient/uurloon → /market; salaris heads → /insights; zzp/tarief → /zzp; gezocht/inhuren/werven → /hire; kosten → /pricing; career/VCA → /guide modules; role never has two pages of the same query shape (Q11 — the single largest pending ruling).
- **Salary pages sequence:** question-form family + elektromonteur matrix first; heads deferred. Verified demand families: laadpaal monteur, zonnepanelen monteur, monteur middenspanning; "industrieel elektricien" and "service-monteur-elektrotechniek" are NOT the NL terms (use "elektromonteur industrie", "service- en onderhoudsmonteur").
- **Passive-candidate positioning is architecturally truthful but currently unprovable** — credibility requires E2 counts (small-cell rule) + E6 dashboard loop + E3 card quality, not copy.
- **AI search:** no llms.txt; robots unchanged (exactly what Google prescribes for AIO/AI Mode); the six brief queries have concrete page/press plans with two overconfident promises reframed; Bing "AI Performance" report added to monthly probes; Bing AI-preference cutover (Feb 2027) logged review-only.
- **Sitemap of record:** 90-day acquisition concentrates on installation companies + bouw/onderaanneming employers; 8 of 10 employer segments fail the 90-day bar (unverified volume/conflict/thin supply); solar/charging gated on the Keyword-Planner pass.

## 90-DAY IMPLEMENTATION ROADMAP (Impact × Confidence × Ease ordering; every task needs approval per wave)

### Days 1–15 — Foundation
**STATUS 2026-11-05: implemented & tested — T4 robots fix, T1 per-domain site URL, E4 /pricing page (EN+NL), E10 concierge SLA (ops alert + weekly sweep). Awaiting CTO actions: E8 knob change in admin console (threshold 5→2), review/publish the 3 drafted articles (docs/growth/content/), deploy approval.**
**CTO decisions gating this window: RESOLVED 2026-11-05 (see Decisions section).**
- D1–5 (developer): **T4** ✅ done · **E10** ✅ done · **E8** referral knobs (admin settings, threshold 5→2) — ⏳ CTO action in admin console
- D1–7 (marketing/content): **E4** /pricing page — €499-on-acceptance vs verified benchmarks (agencies 20–25% + 6–12-week pipeline; platforms 9–9.75%/hr; boards €250–425/vacancy) · Keyword-Planner pass #1 (cluster E heads + energy-transition family) — unblocks the most assumptions
- D5–15 (developer): **T1** per-domain site URL (validate against installed Next.js docs — apps/web/AGENTS.md) → **T2** canonical+hreflang static pages · **T7** sitemap cleanup + failure logging
- D10–15 (content, SEO+developer): publish first 3–5 insights articles (existing CMS; brand/career/anonymous-applying framing; **no salary-head pages** per contract) · Organization+WebSite JSON-LD + publisher-name fix (**no SearchAction**) — part of T6 acceptance

### Days 16–30 — Core marketplace SEO
**STATUS 2026-11-11: Days 16–30 TECHNICAL WORK COMPLETE + content wave started — T2–T8 ✅, /for-workers + /for-employers landings ✅ (35-check verify script; build clean; web 202/202, api 697/697). Landing copy honours the honesty rules (five product facts only, no counts/guarantees); dutch-content review of the copy recommended before deploy. CTO actions still open: E8 admin-knob change, article review/publish, deploy approval.**
- **T3** server-render insights+category listings (done: server components; personalized panels/CTA/tracking stay client via InsightsClient.tsx; category constant moved to server-safe module — Turbopack client-reference gotcha documented) · **T5** ✅ site-wide OG image: code-generated 1200×630 via next/og file convention + explicit images in every custom openGraph/twitter object (Next replaces inherited objects); **proxy.ts matcher exclusions added for metadata routes per Next docs** · **T6** ✅ Organization/WebSite JSON-LD site-wide (no SearchAction), article schema → Article + mainEntityOfPage + image + BreadcrumbList + publisher "OfferMarket" · **T7** ✅ sitemap: no /login, legal pages added, lastModified on home/insights, API failures logged not swallowed · **T8** ✅ article ISR: revalidate=300 + generateStaticParams([]) — article metadataBase switched to the static locale-derived domain (request-time headers() would have forced the route dynamic); build verified route prerenderable; runtime cache-HIT evidence lands with the first published article
- (content) `/for-workers` and `/for-employers` landings per GROWTH_ROADMAP §3.3 — mechanics-led copy, no unbacked promises; Q5-query article (anonymous applying, NL+EN)
- Q3-query comparison article ("staffing vs vacature-site vs reverse marketplace") + `/hire/elektricien` T+E build
- `/market/elektricien` D-build if data gate passes; `/market` hub index
- (marketing) trade-press mention #1 (Emerce/Sprout/InstallQ ecosystem); LinkedIn NL company page + KvK imprint

### Days 31–60 — Market coverage
- City-page package (gated on Q12 + M-N4 sign-off ticket + F-N1 coordinate import): `/market/elektricien/{stad}` for seed cities that clear the 30/20 gate — current supply means most will remain 404; template ships, pages follow data
- `/zzp/elektricien` (C-cluster; dual-CTA split per Δ trap rule); `/guide` hub + first certification/how-to modules (DefinedTerm markup)
- `/market/elektricien/rotterdam` demand-framing content on the city gate; "beste werkgever" data-driven concept article (stale-2023 SERP)
- **Planner pass #2** (segments E2 industrial/solar/charging + cluster J/K volumes); decide segment E2/E6/E7 builds on results
- Filter-gap fix (IndustryType/industryPrefs searchable — near-no-risk, E9-adjacent); **E2** public supply tiles if small-cell rule decided (+legal read)
- Entity: press mention #2; ESCO/Wikidata QID lookups; Dataset JSON-LD on /market + `/insights/developers` docs page

### Days 61–90 — Authority, inventory & loops
- Digital PR: quarterly UWV-sourced market report; "beste werkgever" data piece; third-party roundup pitches (Qpromo/JobQ comparison segment)
- **E6** worker activation loop (dashboard next-actions + weekly visibility email); **E3** wizard fields (headline, primary cert, licence)
- `/p` + `/employers` work begins ONLY after: DPIA addendum, PROFILE_PUBLIC_INDEXED consent type, R9–R13 packaging, hashed slugs (Q13) — i.e. Wave-3 package approval
- **E1** KvK auto-verification IF authorized (distinct KVK_REGISTERED state recommended; ~7d KvK API onboarding lead time — start onboarding at approval)
- KPI baseline + instrumented funnel (F10: UTMs + product events) so the 30/60/90 measurement (below) means something

**Day-30/60/90 checkpoints:** measured vs baseline on the KPI framework (GROWTH_ROADMAP §5) + AI-probe ladder S1–S5 (AI_SEARCH_STRATEGY §4) + Search Console (both domains) + Bing WMT AI Performance report.

## Decisions pending for the CTO (consolidated approval list)
**✅ ALL APPROVED 2026-11-05 (CTO):** 1. **Q11** — B1 contract v2 ratified as written (one page per query shape per role: wat-verdient/uurloon → /market; salaris heads → /insights; city salary → /market/{rol}/{stad}; insights-architecture.md per-city salary slugs superseded; T9 doc fix on record). 2. **Q14** — two domains, .nl = NL-market definitive, never canonicalise NL→EU. 3. **Small-cell rule** — publish with bucketing ("20+"); small cells hidden. 4. **Days 1–15 scope approved — implementation started.** 5. **E1 KvK auto-verification** — approved as auto-check + separate KVK_REGISTERED state (KvK API onboarding to start; admin still grants BASIC_VERIFIED). 6. **Agencies-as-buyers excluded** for the first phase (fee data still feeds /pricing). 7. **Repeat-hire of the same worker: free** (new policy decision recorded). 8. **Q9/Q10/Q13 approved** — no /nl/ prefix; no /vacatures pages (reversal triggers documented); hashed public slugs firm.
**Still open (non-blocking):** E5 registration-minimisation (needs counsel sign-off on consent-basis reclassification) · Arvo/Svak name verification (before any outreach copy) · Q12 remaining sub-item: scope of the city sign-off allowlist ticket + coordinate import (pack for Wave 2).

## Measurement
Monthly: AI-probe prompt set (6 brief queries + brand probes), Search Console both domains, Bing WMT AI Performance, PostHog chat-domain referrers; S-ladder S1 brand SERP → S2 category ranks → S3 third-party mentions → S4 AI citation → S5 unprompted disambiguation. Marketplace funnel per GROWTH_ROADMAP §5 (reverse-ARR math, canonical-intro-rate decision CF1/CF2 recommended revenue-model table). All keyword volumes remain autocomplete-based estimates until the Planner passes.

## Documents (docs/growth/)
AUDIT_REPORT (F1–F13) · TECHNICAL_IMPLEMENTATION (T1–T9) · KEYWORD_DATABASE v2 · COMPETITOR_ANALYSIS v2 · AI_SEARCH_STRATEGY v2 · URL_ARCHITECTURE v2 (+Δ, Q9–Q12 rationale) · MARKETPLACE_ARCHITECTURE · GROWTH_ROADMAP v1.1 (E1–E10, segments) · QUALITY_AND_RISKS v2 (both reviews). Team definitions: .claude/agents/ (permanent).
