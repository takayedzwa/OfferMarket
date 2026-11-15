# QUALITY_AND_RISKS

**Version:** v2 (v1 first review + Δ re-review section below, both 2026-11-05)
**Author:** quality-validation — consolidated by CEO
**Date:** 2026-11-05 (all spot-checks dated; live probes read-only)
**Status:** REVIEW COMPLETE — verdicts in §4 feed OFFERMARKET_MASTER_STRATEGY.md

## 1. Findings

### Spot-verification — ALL MAJOR AUDIT CLAIMS CONFIRMED
| Claim | Result | Evidence |
|---|---|---|
| /workers missing from robots disallow (F7/C1) | ✅ CONFIRMED | robots.ts disallow list exact; no /workers, no /insights/your-market |
| Single-domain sitemap/robots env (F2/C3) | ✅ CONFIRMED | both use `NEXT_PUBLIC_SITE_URL ?? "https://offermarket.eu"` |
| offermarket.nl robots.txt advertises EU sitemap | ✅ CONFIRMED (live curl) | nl/robots.txt ends `Sitemap: https://offermarket.eu/sitemap.xml`; nl/sitemap.xml all .eu URLs |
| No canonical/hreflang/OG site-wide (F1) | ✅ CONFIRMED | layout returns only title+description; live homepage matches |
| Admin-only BASIC_VERIFIED | ✅ CONFIRMED | admin.service.ts:447-473 `verifyEmployer` is the only grant path; other occurrences are reads/score inputs |
| €499 intro invoice auto-creation | ✅ CONFIRMED | offers.service.ts accept-flow step 9 → createIntroductionInvoice; billing.service.ts:9 `49900` (admin-tunable) |
| Sequential enumerable publicId | ✅ CONFIRMED | workers.service.ts:1563-1565 nextval → `W-%06d` |
| "Not enumerable/indexable" comment | ✅ CONFIRMED | workers.controller.ts:348-350 (SECURITY E-H7) + @Roles('EMPLOYER') |
| Zero published articles | ✅ CONFIRMED (live) | both sitemaps: 9 static EU URLs, zero articles; /insights empty |
| E8 referral knobs admin-tunable | ✅ CONFIRMED | referral-system.md:21-23 ("without a code deployment"), clamps :211-212 |
| E1 has no KvK API today | ✅ CONFIRMED | auth.dto.ts:45 regex only + uniqueness (auth.service.ts:383-386) |
| Public insights routes (ai-geo OQ3) | ✅ RESOLVED | articles, market/preview, market/trends, professions, skills unguarded; market/overview WORKER, market/employer EMPLOYER |
| Meta description (ai-geo OQ2) | ✅ RESOLVED | live homepage has the description — close open question 2 |
| Qpromo as model incumbent | ✅ CONFIRMED (live) | qpromo.nl H1: "anoniem solliciteren… Jij blijft anoniem tot je zelf ja zegt." Model match verified; **Qpromo already ships Organization + WebSite JSON-LD** — precedent validating the P0 structured-data proposal |
| InsightArticle no locale (F3) | ✅ CONFIRMED | schema.prisma — no locale field, slug globally unique |

### Blocking findings (settle before the affected decision is approved)
**B1 — Three-way salary-keyword collision.** KEYWORD_DATABASE's exclusivity rule ("elektricien salaris" = /insights only) contradicts URL_ARCHITECTURE, which assigns "electrician salary NL" to BOTH `/guide` AND `/market/{profession}`, while insights-architecture.md:286 plans keyword-shaped salary slugs. Required: an explicit keyword-to-page contract — proposed: `/market/{profession}` owns *live-data* framing only ("elektricien verdienen / gemiddeld uurloon", real MarketSnapshot numbers), /guide never ships a salary page, insights own "salaris" SERPs.

**B2 — Consent-withdrawal design (R2) incomplete for /p/{publicId}:**
(a) eligibility must be re-evaluated **server-side at request time** (or short-revalidate ISR driven by DB state) — never a baked/stored flag; today's consent recording is fire-and-forget and can silently fail (register/page.tsx:114-121) — that pattern must NOT be reused for PROFILE_PUBLIC_INDEXED;
(b) withdrawal ordering must be specified: noindex/**410 first**, then cache purge, then sitemap drop, then URL-removal requests;
(c) R6's cross-domain hreflang pair must be dropped in the same generation on withdrawal (both domains render the identical publicId path → consent is domain-wide);
(d) noindex is a request, not deletion — AI-crawler caches retain content at unknown cadence; the only guarantee is 410 first + residual exposure disclosed in the withdrawal UI;
(e) certifications (issuing body + validity) can be quasi-identifying in tiny cells (one paneelbouwer in Hengelo) — apply min-sample suppression to profile *data classes*, not just aggregates; CITY cap alone insufficient for profession×city×specialisation n=1.

**B3 — E1 (KvK auto-verification) is an authorization-behaviour change + external dependency, not a "ticket".** Verified: no KvK validation exists today (regex only). Official KvK API exists and is cheap (developers.kvk.nl — Zoeken free, profile €0.02/call, onboarding requires KvK number + authorised signatory, up to 7 business days). But auto-granting BASIC_VERIFIED changes who can submit offers, and verification feeds ratings/trust-score logic (ratings.service.ts:549-552, trust.service.ts:1317-1319) — weakening it silently weakens platform trust. Recommended: auto-verify existence + name/address match, but introduce a distinct `KVK_REGISTERED` auto-state separate from human-granted BASIC_VERIFIED — or get explicit human approval for auto-grant. Requires CTO approval per CLAUDE.md (auth/authorization).

### Major findings
- **M1 — R4 threshold vs live thresholds + no hysteresis.** Three differing threshold sets (R4 ≥10; marketplace-mechanics ≥10/≥50; live insights SAMPLE_SIZES: SALARY_RANGE 30, DEMAND_LEVEL 5; ai-geo's "≥5"). Pick ONE documented indexability threshold, distinct from display thresholds, **with hysteresis** (once indexable, stay indexable through decay — gate flip-flopping churns crawl signals).
- **M2 — City pages must be built-on-demand, not built-then-gated.** sampleSize ≥10 per (profession, city) won't be met for most cities in year 1 (code itself has a region-fallback ladder expecting thin city samples). Ship the template, zero-index the pages until data exists — inverted precedence.
- **M3 — "No schema change to launch" is false for the consent gate.** `PROFILE_PUBLIC_INDEXED` is not in ConsentType enum (schema.prisma:1513) → enum addition + migration + consent-service changes; scope it explicitly as an approval-required change.
- **M4 — hreflang on articles before the F3 decision is a misuse.** Emitting en↔nl pairs on identical content is a signal misuse. Dependency order: T2 applies to home/static pages now; article hreflang only after T9's F3 policy decision.
- **M5 — The /offers robots disallow is NOT "the single biggest structural gap" (KEYWORD_DATABASE framing is wrong).** It's a deliberate, defensible privacy tradeoff (anonymous reverse marketplace; per-person unconsented data). Do not "fix" it; access vacancy terms via guide/market/insights families only.
- **M6 — E2 aggregate-count leakage.** "(n) immediate verified electricians within 30 km" cells can be n=1 in small cities — expose counts only above the min-sample rule or bucket ("20+").
- **M7 — E5 consent migration is more than timing.** Mandatory consents are PRIVACY_POLICY, TERMS_OF_SERVICE, DATA_PROCESSING (registered with legalBasis CONSENT, register/page.tsx:97-99). Moving ToS/Privacy to "first login" is only defensible with basis restated as contract/acceptance (bundling terms acceptance as GDPR consent is itself a defect); DATA_PROCESSING deferrable only if Art. 6(1)(b)-scoped. Also: the existing fire-and-forget failure mode means mandatory consents today may be silently unrecorded — E5 must fix that bug, not replicate it.

### Minor
m1. Consent blocks: 5 for employers, 6 for workers (immigration consent is worker-conditional, register/page.tsx:439-441). m2. Cluster E is the weakest keyword bet — settle volume via the E4 Ads LP before any "elektricien inhuren" content; /for-employers as P2 is fine regardless. m3. Extend the D-cluster ownership table: role hub owns role+salaris; "zzp elektricien salaris/tarief/uurloon" needs an assigned owner (market data page vs insights) before either is built. m4. Cluster F vs /guide P1 conflict — resolves as guide *modules* (how-to context), not standalone jargon explainers. m5. T4: robots Disallow doesn't remove already-indexed URLs — with ~zero indexation the risk is nil; if /workers appears in the index first, noindex-then-disallow. m6. JobPosting exclusion corroborated as airtight (spam-policy risk). m7. llms.txt skip sound. m8. Master strategy robots list should include /privacy/dashboard (doc drift fixed in synthesis). m9. Qpromo's live Organization+WebSite JSON-LD is a useful precedent — cite in T6 acceptance review.

## 2. Risk register
| # | Risk | L×I | Mitigation |
|---|---|---|---|
| 1 | /p cache/residual retention after withdrawal | Med × High | B2: live gate at render, 410-first, purge after, disclosure |
| 2 | Consent recorded non-atomically | Med × High | transactional consent write at registration; precondition for any indexation consent |
| 3 | Salary keyword collision (/guide,/market,/insights) | High × High | B1 contract before any P1/P2 build |
| 4 | /market city thin-page mass | High × Med | M2 build-on-demand |
| 5 | Gate flapping on decaying snapshots | Med × Med | M1 hysteresis |
| 6 | E1 auto-verification weakens trust/authorization | Med × High | B3: distinct state or explicit approval |
| 7 | Sequential publicId enumeration once profiles indexed | Med × Med | hashed-slug default (architect Q4), /workers robots-fixed first |
| 8 | hreflang misuse on identical article content | High(untill F3) × Low-Med | M4 ordering |
| 9 | Small-cell counts in E2 tiles / aggregates | Low × High | M6 min-sample suppression/bucketing |
| 10 | **DPIA not updated for new processing purpose** | Med × Med | public indexing of worker profiles = new purpose + "systematic monitoring of publicly accessible area" trigger named in docs/legal/dpia.md §1 (dpia.md dates July 2026, assumes employer-search-only). **DPIA addendum required before /p ships.** |
| 11 | /employers/{slug} review display carries worker personal data | Low × Med | special-category-policy §2 warning-against-free-text; filter reviewTitle/reviewText before publish; noted under R3 |

## 3. Conflicts between specialists (named; resolutions proposed by CEO in MASTER_STRATEGY)
- CF1. Intro rate 15% (revenue-model.md:289) vs >5% (marketplace-mechanics.md:93).
- CF2. Capacity math: launch-strategy.md:653-657 (200 employers, 100 intros/mo ≈ €599k) vs revenue-model.md:215 (150 × €8k = €1.2M) — neither reconciles without naming subscription/success-fee revenue.
- CF3. Four different "public data" thresholds (R4 ≥10; mechanics ≥10/≥50; live SAMPLE_SIZES; ai-geo ≥5).
- CF4. "No schema change to launch" (URL_ARCHITECTURE §2) vs new ConsentType (§3).
- CF5. Salary page ownership (B1).
- CF6. Certification content placement (m4).
- CF7. 70% verified-signup target vs documented signup friction — realism flag, not a conflict.
Cross-agent corroboration claims all verified — no fabricated corroboration found.

## 4. Verdict — solid enough to act on
**Act now (verified in code/live):** T4 (robots /workers + /insights/your-market), T1 (per-domain site URL — root cause verified; ONE caveat: validate T1's "robots/sitemap receive the request" assumption against the installed Next.js version's docs, see apps/web/AGENTS.md "NOT the Next.js you know"), T2 (static pages only, per M4), T3, T7, T9, E4 (/pricing), E10 (concierge SLA), E8 (knob tuning), entity model, consent-architecture concept (with B2 fixes), Qpromo positioning + P0 entity actions, llms.txt skip, JobPosting exclusion.
**Hold until conflicts resolve:** /p family (B2 + DPIA addendum + hashed-slug default), /market city family (M1+M2), salary-page allocation (B1), /guide landing choices (m4/CF6), E1 (B3 approval + KvK API onboarding), E5 (counsel + legalBasis fix), E2 (small-cell rule).
**All volume tiers remain estimates** until the Keyword-Planner pass; cluster E is the weakest until measured.

---

# Δ RE-REVIEW (quality-validation, 2026-11-05 — second review of the four v2 delta packages)

## Headline
The deltas are substantially self-consistent; the three big rulings (/vacatures do-not-build, unlocalized paths, two-domain keep) are mutually reinforcing and evidence-backed. But the re-review surfaced **two real cross-agent contradictions** (C-N1, C-N2), one overconfident factual claim (F-N1) and several one-decision fixes. Q15 resolves cleanly positive; Q12's ≥2-employer condition remains the only untouched feasibility hole.

## Spot-checks (all 2026-11-05)
✅ Region.latitude/longitude fields exist (schema.prisma:424-425) ⚠ but data claim fails (F-N1) · ✅ Skill.isCertification/certificationBody confirmed (:242-243) · ✅ Employer aggregate-rating rich result buildable (Rating model incl. isPublished/isVerifiedHire/reviewTitle/reviewText :603-631; computed on read; Google eligibility satisfiable) · ✅ ConsentType lacks PROFILE_PUBLIC_INDEXED (M3 stands) · ✅ **Q15 RESOLVED YES** — User.lastLoginAt (:30) + Worker.updatedAt (:208) exist; no migration needed for R9's 180-day rule · ✅ IndustryType/INTERNSHIP real · ✅ Δ4 threshold consistent with live contract (seed.ts:152 "at least 30 relevant offers"); daily snapshot recompute exists (insights-snapshot.service.ts:66 @Cron) → monthly gate re-checks have a data source · ✅ insights-architecture.md:285-286 city-salary slugs confirmed present — Q11 override note needed · ⚠ Occupation also requires `occupationLocation` per Google semantic requirements — add to D2.2#4 · ⚠ Anthropic IETF-signal date inconsistency (Feb-2026 coverage citing an Oct-2026 event — re-source or drop the date).

## Findings
**Blocking-class:**
- **C-N1 — "wat verdient een X" has two owners.** Keyword Δ6 rule (→ /insights, with "X salaris") contradicts architect Δ3c (→ /market/{rol} sole owner; Δ3 map literally gives /market the wat-verdient primary). **Recommended resolution:** keep Δ3c as the master contract; rewrite Δ6 to "one page per *query shape* per role — wat-verdient/uurloon → market; salaris heads → insights; a role never has two pages of the same shape." CTO ratifies at Q11 (per-page specs are written off Δ3c).
- **C-N2 — SearchAction contradiction.** Δ3d includes SearchAction; AI annex D2.3 rules it out (Sitelinks search box retired ~Nov 2024). AI annex is right; Δ3d is stale → amend before T6 (one-line).

**Major:**
- **M-N1** — Growth's guide-family employer assets (`/guide/elektricien-inhuren-kosten`) collide with Δ3c (inhuren+kosten → /pricing + /hire module). Fix: "/pricing owns inhuren kosten; /hire carries the pricing comparison as a module; guide asset reframes to mechanism (onderaanneming alternatief — allowed)."
- **M-N2** — AI annex Q1's "/guide salary articles" and Q2's "Rotterdam insights article (salary benchmarks)" collide with B1/Δ3c. Fix: Q1 guides = career/qualification articles *referencing* market data as modules (never "salaris" heads); Q2 article = demand/employer-landscape framing, salary numbers live only on `/market/elektricien/rotterdam`.
- **M-N3** — Q1's "90-day: named data source" is overconfident (chained behind F13 zero articles, Δ4 30-sample city gate [no city will pass in 90d at current supply], zero entity footprint, passive-candidate unprovability). Reframe to S-ladder logic; Q2 city page explicitly 404 until Δ4 gate.
- **M-N4** — Δ4 editorial-sign-off allowlist has no owner, ticket or UI (InsightsConfigService admin-config pattern exists — buildable, unbuilt). Scope one ticket (allowlist + sign-off flag + 404↔200 gate) before any L2 city build; name who signs (dutch-content vs CTO).
- **M-N5** — 90-day IC×E table ranks blocked items above unblocked ones and omits the Wave-0 technical layer + monthly AI-probe cadence; also E-numbering collision (experiments E1–E10 vs segments E1–E10 — rename segments SEG-E1…).

**Minor:** m-N1 Δ5 hreflang on /insights+categories premature — state interim treatment (shared-content articles: self-canonical only; hreflang only once per-locale content ships) · m-N2 T9 doc-drift: TECHNICAL_IMPLEMENTATION.md:51 still presents F3 option (a) as live — update on Q14 approval · m-N3 Δ3c city-page rule needs "answered in body and meta title, never URL or H1" line (vacature-tails vs Δ2 anti-regression) · m-N4 /vacatures reversal trigger sets differ (architect's = strict superset → authoritative) · m-N5 NVB figures quoted from different pages — per-page specs must pick one source per claim · m-N6 = Anthropic date inconsistency.

## Risk register additions
| # | Risk | L×I | Mitigation |
|---|---|---|---|
| 12 | Δ3c breached by page specs (C-N1/M-N1/M-N2) — cannibalisation before first indexable page | High×High | Q11 ratification w/ corrected Δ6 rule; Δ7 template owner-row = enforcement point |
| 13 | Region geo NULL → Place markup empty (columns exist, values seeded null) | High×Low | one-off coordinate import for seed geography, or Place-without-geo decision |
| 14 | Sign-off allowlist never built → gate-passed cities stay 404 or ship as doorway | Med×Med | M-N4 ticket pre-approval |
| 15 | Gate-drift between daily snapshots + monthly recheck vs sitemap | Low×Med | gate check in the daily cron, monthly confirm, log transitions |

## Conflicts register
v1 CF1–CF7 all still open, plus **CF-C1 (new, near-blocking)** = C-N1 → merges into CF5 (salary ownership) at Q11 · **CF-C2** = C-N2 (resolved in AI annex's favour, one-line amendment) · **CF-C3** = guide-owned employer cost content (M-N1). Resolved/absorbed by deltas: CF3 threshold → Δ4 30/20 (display thresholds engine-side, verified); CF4 unchanged (consent enum + R9 fields exist). Δ2/Δ8 mutually consistent (Δ8 self-declares); Δ5 overrules AUDIT F3 option (a) → doc drift (m-N2). Growth Δ §0 matches architect Δ3 exactly.

## Updated verdict
**Act now (v1 list +):** T4, T1 (Next.js-version caveat), T2 static-only, T3, T7, T9, E10, E4 /pricing, E8, P0 entity actions; **add:** Keyword-Planner pass (unblocks the most ASSUMPTIONs), filter-gap fix (task 8, near-no-risk), Q15 closed yes, Q14 "keep two domains" recommend-approved as the F3 resolution (with m-N2 T9 update).
**Hold until:** 1. **Q11 ruling (C-N1+CF5)** — single largest blocker; every dutch-content spec depends on it. 2. Δ3d amendment (C-N2) before T6. 3. Δ4 package (Q12) + M-N4 sign-off ticket + F-N1 geo import scoped before city L2. 4. /p family (unchanged: B2 pack + DPIA + R12 hashed slug — Q13 ready). 5. E1 KvK authorization decision. 6. E2/E6 small-cell rule (also gates the six-query Q5 promise).
**New approval list:** Q9–Q14 with the amendments (Q11 w/ corrected Δ6 rule; Q14 w/ T9 update + interim-article hreflang note); Q15 closed; scope M-N4 ticket + F-N1 import within Q12; accept M-N3 reframing of the AI 90-day language. **All volume tiers remain estimates — the Planner pass now blocks cluster E content, solar/charging (task 12) and two of the six AI-query promises.**
