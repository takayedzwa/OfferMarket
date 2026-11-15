# URL_ARCHITECTURE

**Version:** v2 (v1 + Δ-amendments; supersedes v1 where marked) — pending seo-intelligence delta evidence, ai-search-geo eligibility cross-checks and CTO approval of decisions Q9–Q15
**Author:** marketplace-architect — consolidated by CEO
**Dates:** v1 + Δ 2026-11-05
**Status:** PROPOSED — not approved, not implemented

## 0. Current route reality (verified in code, 2026-11-05)
Public (crawlable intent): `/` (home, SSR), `/insights`, `/insights/[slug]`, `/insights/category/[category]` (hardcoded: salary|demand|employer|industry|career), `/register` (role=worker|employer), `/login`, `/forgot-password`, `/reset-password`, `/verify-email`, `/terms`, `/privacy`, `/cookies`, `/dsa` + `/dsa/report` + `/dsa/status/[publicId]`.
Auth-gated client pages: `/workers` + `/workers/[publicId]` (employer-only, anonymised), `/offers*/`, `/profile*`, `/dashboard*`, `/conversations*`, `/insights/your-market`, `/referrals`, `/support*`, `/privacy/{consent,dashboard,delete,export}`, `/admin/**`.
Locales: domain-based (offermarket.eu = EN, offermarket.nl = NL), localePrefix "never", identical paths across domains; no localized path mappings.
Sitemap: home, /insights, /register, /login, 5 category pages, published InsightArticles — **single domain only**.
robots.ts disallows: /admin, /api/, /dashboard, /offers, /profile, /conversations, /support, /privacy/dashboard.
Public API facts: `/insights/articles`, `/insights/market/preview|trends`, `/insights/professions`, `/insights/skills` are public; MarketSnapshot caches (profession, region, date) aggregates.

### Collisions / issues found (flagged, NOT proposing deletion or redirects)
- **C1** — `/workers` + `/workers/[publicId]` are auth-gated but NOT in robots disallow: crawlable client-side shells; worker publicId is sequential (`W-%06d` via `worker_public_id_seq` → enumerable). Fix: add `/workers` to robots disallow; never build public SEO profiles under `/workers`.
- **C2** — `/insights/your-market` is personalised/auth, allowed by robots, absent from sitemap → should be disallowed.
- **C3** — Sitemap single-domain: the NL domain gets no sitemap at all.
- **C4** — `/login` in sitemap at priority 0.3 (valueless; drop candidate — CEO's call).

## 1. Proposed URL map
Design principles: new families live in NEW reserved segments (`guide`, `market`, `employers`, `p`) that collide with no existing segment; profession slugs come from `Profession.slug` (NL name + EN alias exist), city slugs from `Region` (type=CITY); locales stay domain-based.

### Worker-attraction family → funnels to `/register?role=worker`
| Page | URL | Intended cluster | Indexable | Phase |
|---|---|---|---|---|
| Trades hub for workers | `/guide` | ⚑ electrician salary NL, career-change clusters | Yes | P1 |
| Certification/how-to guide | `/guide/{slug}` | ⚑ how to become electrician NL, NEN 3140, VCA (launch-strategy seed clusters) | Yes | P1 |
| Salary/demand data per profession | `/market/{profession}` | ⚑ electrician salary NL (data page, complements editorial insights) | Yes, gated on data (R4) | P2 |
| City × profession data page | `/market/{profession}/{city}` | ⚑ electrician jobs/salary + city | Yes, gated on data + inventory (R4) | P2 |
| Profession hub index | `/market` | navigational | Yes | P2 |
| Worker landing | `/for-workers` | ⚑ brand + anonymous-profile queries | Yes | P2 |

### Employer-attraction family → funnels to `/register?role=employer`
| Page | URL | Intended cluster | Indexable | Phase |
|---|---|---|---|---|
| Employer landing | `/for-employers` | ⚑ hire electrician, hire skilled trades | Yes | P2 |
| Employer public credibility profile | `/employers/{employer-slug}` | ⚑ verification/trust queries; link economy | Yes, consent + verification gated (R3) | P3 |
| Employers index | `/employers/discover` | (aggregate) | **No** — noindex at launch | P3 |

### Public profiles (consent-gated, opt-in only)
| Page | URL | Intended cluster | Indexable | Phase |
|---|---|---|---|---|
| Worker public profile card | `/p/{publicId}` | not a ranking play; crawl-trust + link economy (links inward to its `/market/*` hub) | Only if all consent gates pass (R1–R2); default noindex | P3 |

### Existing pages: keep as-is
`/insights`+article+category (indexable); `/terms /privacy /cookies /dsa*` (indexable-legal); auth pages (register/login/forgot/reset/verify) — noindex,nofollow (drop from sitemap). NOT indexable, no change proposed: `/workers*`, `/offers*`, `/profile*`, `/dashboard*`, `/conversations*`, `/support*`, `/referrals*`, `/admin*`, `/privacy/{dashboard,consent,export,delete}`, `/insights/your-market`, `/dsa/status/*`.

### Slug conventions
- Professions: `Profession.slug` verbatim. Cities: lowercased name-slug, accents kept (`rotterdam`, `s-gravenhage`). Guides: kebab-case descriptive. Employer slug: `{companyNameSlug}-{shortId}` (deterministic, derived from id — **never the KvK number in URLs**). Worker profile URLs keep existing publicId string but under `/p`, never `/workers`.

## 2. Entity model & cross-linking (uses existing Prisma models, no schema change to launch)
`Profession ─1:n─ MarketSnapshot ─n:1─ Region (COUNTRY>PROVINCE>CITY)`; `Profession ─1:n─ InsightArticle.profession`; `Skill──m:n──Worker (ProfileSkill)`; `Skill──1:n──Certification`; `Worker─n:1─Region`; `Worker─1:n─Offer─1:n─OfferVersion` (structured compensation = salary aggregate source); `Offer─1:1─Rating─n:1─Employer`; `Employer─1:1─EmployerVerification (PENDING/BASIC/PREMIUM/REJECTED)`; `User─Consent`.

Cross-linking: `/market/{profession}` → passing city pages + top 3 matching insights + 2–3 guides + `/for-workers` + `/for-employers`; city page → back to profession hub + sibling cities (province children) + matching insights + worker CTA; `/guide/{slug}` → `/market/*` hub + insights category; `/insights/{slug}` gains auto "related market data" module (one-line generator change, reuses Article.profession/regionId); `/p/{publicId}` links ONLY to its `/market/{profession}` hub + home/register (single-hop neighbourhood, no worker-to-worker crawl rings); `/employers/{slug}` → employer-category insights + badge explainer + `/for-employers`; `/market` and `/employers/discover` are the discovery hubs.

Multi-vertical: nurses already have Profession row + certification flow — `/market/verpleegkundige` and city pages drop in with zero architecture change. Gap: specialisations enum is electrician-only (non-electrical sanitised to []) → city×specialisation only after the per-trade specialisation migration from the playbook; for now it is city×profession.

## 3. Public/private data matrix (grounded in schema.prisma)

### WORKER — public on a consented indexed `/p` page
publicId; primaryTrade (via Profession); specializations; worker-authored headline+summary; region at CITY granularity max (**never** Worker.postalCode); yearsOfExperience (render as a band — see Q2); skills (name + SkillLevel, isPrimary); certifications ONLY with verificationStatus=VERIFIED showing name/issuingBody/validity, **never certificationNumber** (established policy per vertical-playbook.md); languages; isVerified boolean.

### WORKER — private, never in public markup/sitemap/JSON-LD
User identity fields (name/email/phone); postalCode; desiredSalaryMin/Max/desiredHourlyRate; travelDistanceKm; workAuthorization detail (only binary may EVER surface, only with SPECIAL_CATEGORY consent `immigrationConsentGiven`; currently never shown even on employer view — keep out of all public markup); education institution; ProjectExperience (opt-in later); acquisition* attribution; reputation/safety/fraud/blacklist/TrustScore internals; region below CITY; noticePeriodDays; visibleCompanies/blockedCompanies.

**Consent rules:** existing ProfileVisibility enum (ALL_VERIFIED|SELECTED_COMPANIES|HIDDEN) governs *employer search only*. Public indexing is a **different processing purpose** → requires new explicit `ConsentType` (proposed `PROFILE_PUBLIC_INDEXED`, legalBasis CONSENT) **plus** profileVisibility=ALL_VERIFIED **plus** isProfileComplete=true, completenessPct ≥ 70, user.status=ACTIVE, not blacklisted. Withdrawal → immediate noindex + sitemap removal + cache purge (R2). Default: NOT indexable.

### EMPLOYER — public on verified+published `/employers/{slug}`
companyName, tradeName, industry, companySize, foundedYear, website, city-level region (from registeredAddress country/city only), verification badge only when BASIC/PREMIUM_VERIFIED, derived reputation tier, aggregate rating stats over isPublished=true ratings (+ published reviewTitle/reviewText), isVerifiedHire, totalHires. Raters always anonymised.

### EMPLOYER — private
kvkNumber (**never in URLs or markup** — enumeration + DuplicateAccountCheck implications); vatNumber; full address JSON; phone/billingEmail; billing, subscription, invoicing; totalOffersSent, offerAcceptanceRate, avgResponseTimeHours (internal ranking signal until Q3 decides); EmployerVerification kvkData/documents; risk/notes/logs; invoices.
**Consent rules:** existing KVK_PROCESSING consent covers underlying processing; public credibility page needs its own employer consent choice, hard-gated on verification ∈ {BASIC_VERIFIED, PREMIUM_VERIFIED}.

### OFFER — never public per-record
Private pipeline (robots already disallows /offers). OfferVersion compensation appears publicly ONLY as aggregates (MarketSnapshot/stats) with marketplace-mechanics.md confidence rules: ≥10 samples for a benchmark row, ≥50 for "high"; below threshold → suppressed or noindex (R4). No identity or offer-level fields in any public markup. InsightArticle stays public when PUBLISHED.

## 4. Indexing policy rules
- **R1** Opt-in, not opt-out: no entity indexable without explicit indexing consent; default everywhere noindex.
- **R2** Withdrawal = instant de-index: noindex immediately, drop from sitemap generation, request cache purge/URL removal, serve 410/noindex (never redirect-to-content keeping personal data cached).
- **R3** Employer page gate: noindex until BASIC/PREMIUM_VERIFIED **and** ≥3 published ratings (thin-page rule).
- **R4** `/market/*` data-density gate: indexable only with MarketSnapshot sampleSize ≥10 for that (profession, region) **or** ≥1 published insight with that profession+region; else noindex,follow, not in sitemap. Phase-2 cities only after Randstad gains data (Amsterdam, Rotterdam, Den Haag, Utrecht).
- **R5** No personal data in markup: aggregate-safe structured data only. No Person JSON-LD with names/contact/special-category data; workAuthorization never in ANY public markup. Employer pages may use Organization + AggregateRating (juridical person, GDPR Art. 2 employment-data exemption); worker pages never use Person schema.
- **R6** Sitemap hygiene: one sitemap per domain with cross-domain hreflang alternates (eu↔nl, x-default on offermarket.eu) — requires extending `sitemap.ts`, which today emits a single domain (C3). Sitemap = indexable-only surfaces.
- **R7** robots.ts fix: add `/workers` and `/insights/your-market` to disallow (C1/C2); keep the rest.
- **R8** Pruning: pages failing their gate on re-check are dropped from sitemap next generation + served noindex; stale published profiles re-reviewed on 90-day cycle (align with retention schedule).

## 5. Open design questions (CEO / human decides)
Q1. Localized path mappings — one unlocalized path set both domains (fast) vs next-intl `pathnames` NL maps (/markt/…). Recommendation: P1/P2 unlocalized; P3 add NL path maps for `/market` only if NL keyword evidence supports it.
Q2. Worker yearsOfExperience on public pages: exact vs band. Recommendation: band (re-identification risk in thin profession×city cells).
Q3. Employer response-time / acceptance-rate stats public? Recommendation: keep private until employees see competitive pressure.
Q4. Confirm `/p/{publicId}` as the public profile family; consider non-sequential hash-based public slug for indexed profiles (sequential W-%06d + crawlable pages → enumeration pressure; consent gating mitigates but a hashed slug is safer).
Q5. Accept city×profession instead of city×specialisation for the launch horizon (schema migration per playbook needed otherwise).
Q6. `/market/*` data source/serving cost at crawl frequency (confirm snapshot engine: MVP computes on read).
Q7. Guides as separate `guide` module (recommended — keeps /insights editorial, /guide evergreen clusters) vs InsightArticle category + rewrite.
Q8. Nurse `/market/verpleegkundige` family: must not ship until the outstanding legal review (BIG/VOG/Wkkgz wording) closes — verified-badge claims on indexable pages are legal statements.

## Dependencies
⚑ clusters pending from seo-intelligence (running in parallel). technical-seo must review feasibility of R6 (sitemap/hreflang) and R7 (robots.ts) — the only touches to existing shared files. Nothing existing is deleted or redirected; `/workers` stays as employer-only product surface behind a robots disallow.

---

# Δ ARCHITECTURE v2 (marketplace-architect, 2026-11-05 — reconciles CTO brief v2 with v1; supersedes where marked)

## Δ1. Locale-path decision: NO `/nl/` prefix — definitive ruling
Reject the brief's `/nl/vacatures/…` style URLs. All URLs are unlocalized EN path segments shared by both domains; language comes solely from the domain.
1. `/nl/` is redundant on the domain that would carry it: offermarket.nl *is* the NL domain (`routing.ts:22-34`); on offermarket.eu it would be wrong (.eu = EN/international).
2. The router already rejects locale-prefixed paths — `/en/…` and `/nl/…` resolve to 307 cross-domain redirects (audit F11, live-verified); every brief URL in that shape fails at today's router.
3. Dutch lives fully in content (titles, meta, H1/H2, body, slug tails like `/market/elektricien`, plus intent words in folder names `/zzp/…`, `/inhuren/…`).

What next-intl `pathnames` adoption would have required (documented, deferred): a pathnames map (`.nl→/markt` etc. sketch in hand-over report), no route collisions found in either language, but **the real cost is link generation**: the cross-domain switcher passes paths untranslated (`routing.ts:39-42`) and any `<Link>` not going through next-intl link APIs silently serves EN paths on .nl → wide shared-file regression surface for a thin ranking gain. **Revisit trigger:** if the rank-tracker pass later shows NL long-tail underperforming with the content right, the pathmap is a contained change (near-zero indexation → no 301 debt). Decision deferred, not lost.

Effect on brief URLs: `/nl/vacatures/…` → rejected (Δ2); `/nl/werkgevers/elektriciens` → `/hire/{profession}`; `/nl/elektricien-gezocht` → `/hire/elektricien`; `/nl/beroepen/elektricien` → `/market/elektricien` top section; `/nl/salaris/elektricien` → `/insights` (B1 contract); `/nl/elektricien-vacatures/rotterdam` → `/market/elektricien/rotterdam` (Δ4 gate).

## Δ2. `/vacatures` family ruling: DO NOT BUILD
No `/vacatures/*`, no `/{rol}-vacatures/{stad}` — not now, not as an "honest aggregation" v1.
1. Unwinnable head under our supply reality: job boards win on thousands of fresh listings; our offers are private (robots `/offers` disallow is a deliberate tradeoff, quality M5) and JobPosting ruled misleading by three independent agents.
2. Anything that *looks* like a vacancy board without listings is the doorway pattern the brief itself forbids. The same data framed as what it is converts better: a **live-demand data page** ("Hoeveel werkgevers zoeken naar elektriciens — live vraag, tarieven, beschikbaarheid"), uniquely fueled by MarketSnapshot aggregates.
3. Count modules must bucket ("20+") per M6.

**Reversal triggers (documented, conditional):** (a) if seo-intelligence evidence finds a winnable long-tail, an *existing* family owns it (`/zzp/{rol}` opdrachten section or `/market/{rol}/{stad}`) — a new family is never opened; (b) if the CTO later approves making offers themselves publicly publishable (employer+consent+product+robots change + JobPosting re-check) — that is the one event justifying a real `/vacatures` family; outside this architecture's scope. **Anti-regression rule:** no page family uses "vacatures/vacature/opdrachten gezocht" in URL or H1 unless the page renders itemized, real, public listings — sole exception: "opdrachten" framing inside `/zzp/{rol}` describing how reverse bidding works, never a count promise.

## Δ3. Revised URL map v2
Generation methods: **D** = dynamic-from-data (build/ISR with gates), **T+E** = template + editorial sign-off, **E** = editorial-manual. Phases: L0=Wave 0, L1=Waves 1–2, L2=Wave 2/3 remainder, L3=Wave 3, L4=post-nurse.

| Page | URL (EN+NL identical, Δ1) | Primary keyword/cluster | Intent | Audience | Indexable | Generation | Phase |
|---|---|---|---|---|---|---|---|
| Home | `/` | brand + "anoniem solliciteren platform" | brand/convert | both | Yes | D+template | existing |
| Pricing | `/pricing` | "elektricien inhuren kosten" (E tail) | convert | employer | Yes | E | **L0** |
| Insights hub / article / category | `/insights…` | B1 editorial salary etc. | informational | both | Yes | D (T3) / E / template+D | existing |
| Career/how-to guide hub | `/guide` | "elektricien worden", VCA/NEN (F/G) | informational | worker | Yes | E | L1 |
| Guide article | `/guide/{slug}` | G/F modules | informational | worker | Yes | E | L1 |
| Worker landing | `/for-workers` | brand + anon-profile queries | convert | worker | Yes | E | L1 |
| Employer landing | `/for-employers` | "elektricien werven", platform pitch | convert | employer | Yes | E | L1 |
| Market data hub (role) | `/market/{profession}` | "wat verdient een elektricien", "gemiddeld uurloon" + live demand | informational worker | worker-first | Yes, Δ4 gate | D + editorial intro | L1 (elektricien only; verpleegkundige after legal Q8) |
| Market hub index | `/market` | navigational | nav | both | Yes | D | L1 |
| City × role data page | `/market/{profession}/{city}` | "uurloon elektricien {stad}" tail | informational | worker-first | **Conditional** (Δ4) | T+E on data-driven demand; **404 otherwise** | L2, built-on-demand |
| ZZP / freelance page | `/zzp/{profession}` | "zzp elektricien" + tarief/uurtarief (C) | informational+convert | worker | Yes (elektricien launch) | T+E + market-data module | L2 |
| Employer hiring page | `/hire/{profession}` | "elektricien inhuren", "gezocht/onderaanneming/werven" (E/B) | research+convert | employer | Yes | T+E | L2 |
| Worker profile card | `/p/{hashSlug}` (R12) | none (crawl-trust/link economy) | trust | employer | consent gates only (B2-hardened R1–R2) | D | L3 (privacy package first) |
| Employer credibility page | `/employers/{companySlug}-{shortId}` | "{bedrijf} ervaringen", trust | trust | worker | gate R3 + R10 staleness | D | L3 |
| Auth pages | `/register` etc. | — | utility | both | **Noindex,nofollow**, out of sitemap | — | existing |
| Auth-gated surfaces | `/workers* /offers* /profile* /dashboard* /conversations* /support* /referrals* /admin* /privacy/{dashboard,consent,export,delete} /insights/your-market /dsa/status/*` | — | private | — | No (robots R7/T4) | — | existing |

**Brief families rejected with destination:** `/beroepen/{rol}` → `/market/{rol}` (definition+salary+demand, one hub); `/salaris/{rol}` → `/insights` (B1); `/werkgevers/{beroep}`-as-hire-page → `/hire/{profession}` (employer **entities** stay `/employers/{slug}` — collision the brief's example would have created); `/elektricien-gezocht` → `/hire/elektricien` (one page owns hoofd+gezocht+zzp+onderaanneming; no keyword-shaped stubs); `/vacatures/*` → Δ2.

**Supersession log:** v1 §1 map → Δ3a; v1 Q1 → decided (unlocalized, Δ1); v1 Q4 → **firm ruling R12** (hashed slug); v1 R4 → unified Δ4 threshold; m3 owner assignments → Δ3c.

### Δ3c. B1 one-page-per-intent contract (complete)
Hard rule: every launch page declares exactly one primary query family; query shape decides ownership.

| Query shape | Sole owner | Explicitly NOT allowed |
|---|---|---|
| "elektricien salaris" (+ netto/per maand/hbo; "salaris elektromonteur" heads) | `/insights` (category salary + D-cluster articles) | /market, /guide, /zzp must not target a "salaris" head in title/H1 (body/data mention OK) |
| "wat verdient een elektricien", "gemiddeld uurloon", live/city numbers | `/market/{rol}` (/{stad}) | insights must not publish live-number benchmark duplicates |
| "salaris elektricien rotterdam" (city+salary) | `/market/{rol}/{stad}` | **insights must NOT publish per-city salary articles** — supersedes the planned `electrician-salary-rotterdam` slugs (insights-architecture.md:285-286) |
| "zzp elektricien" (+ opdrachten/woningbouw/utiliteit) | `/zzp/{rol}` | /for-workers brand-only; /market stays earn-data framing |
| "zzp elektricien salaris/uurloon" | `/insights` zzp-salary article | /zzp renders rates as data modules only |
| "zzp elektricien tarief/uurtarief", "elektricien tarief" | `/zzp/{rol}` (module sourced from /market data, linked as source) | /market doesn't target "tarief" |
| "elektromonteur salaris" (role+salaris) | `/insights` per-role salary article | role data page targets alleen verdien/uurloon forms |
| "elektricien {stad}", "vacature elektricien {stad}" tails | `/market/{rol}/{stad}` | no /vacatures (Δ2) |
| "vacature elektricien" heads | **not built (Δ2)** | — |
| "elektricien gezocht (zzp/onderaanneming/{stad})/gevraagd", "inhuren(+kosten)", "werven", "technisch personeel inhuren" | `/hire/{rol}` (+`/pricing` for kosten) | consumer "spoed" excluded everywhere |
| "wat doet een elektricien" (definition) | `/market/{rol}` top section | no /beroepen duplicate |
| "elektricien worden/omscholen/opleiding", VCA/NEN/cao | `/guide` modules (not jargon stubs) | never standalone primary landing pages until cluster G evidence |
| "tekort elektriciens", arbeidsmarkt benchmarks | `/insights` demand category + quarterly report | — |
| brand, "anoniem platform", verification/trust | `/for-workers`, `/for-employers`, `/employers/{slug}` | — |

### Δ3d. Structured-data placement (placement only; type eligibility = ai-search-geo cross-check)
- `Occupation` (estimatedSalary from real aggregates) → `/market/{profession}`(+`/{city}`), server-injected, only on gate-passing pages, never employer-identifiable detail.
- `ProfilePage` → `/p/{hashSlug}` ONLY if ai-search-geo confirms safety for anonymised entities. **Tension pre-flagged:** Google's ProfilePage pattern expects mainEntity Person with a name; our cards are name-free (R5). If it fails: plain page + BreadcrumbList (R5 default stands).
- `DefinedTerm`/`DefinedTermSet` → `/guide` glossary modules (VCA, NEN 3140/1010, cao terms).
- `Organization`+`WebSite`(+SearchAction) site-wide (T6, name "OfferMarket", sameAs per Wave 2); `Article`/`BlogPosting` on insights replacing misfit NewsArticle; `BreadcrumbList` on market/guide/insights; `Organization`+`AggregateRating` on `/employers/*`. **Forbidden:** JobPosting (Δ2), FAQPage without genuine FAQ content, Person on worker pages (R5).

## Δ4. Location-page doctrine (genuinely useful, door-proof)
A city page ships indexable only when ALL hold:
1. **Unified data gate (M1/CF3 — one number):** MarketSnapshot sampleSize ≥ **30** for (profession, city), matched to the live engine's SALARY_RANGE display threshold. **Hysteresis:** once indexable, stays indexable until sample < **20** for two consecutive monthly re-checks. Inside-page display thresholds stay the engine's; indexability decided by 30/20 only.
2. **Distinct-source check:** city's rate row must differ from the province fallback — display-fallback-only pages don't index.
3. **Preferred (feasibility Q12):** contributions from ≥2 distinct employers; droppable with a note if not cheaply queryable.
4. **Editorial sign-off:** logged human sign-off per (profession, city), stored as a config allowlist (no schema change), covering a city-unique editorial block.

Ship-before-data, honestly: route+template exist, but a gate-failing city URL **404s** (not a noindex shell — a shell is crawl-budget waste and the doorway pattern itself). Gate-crossing (snapshot recompute) generates the page; enters sitemap next generation. Province fallback is a display ladder only, never an indexability source.

Editorial layer (anti-doorway core): every indexed city page carries a city-unique editorial block (150–250 words of real local employer landscape — e.g. Rotterdam haven/maritiem elektrotechniek, Eindhoven Brainport utiliteit) + city data modules; template H2 skeleton may be shared but ≥40% of body city-unique.

Doorway safeguards (enforceable): no URL until gate passes (404, not shell) · no automated text spinning, every indexed page needs logged editorial sign-off · provenance (period + sample size) on data modules, M6 bucketing on counts · sibling-city links province-children only, ≤8 per page, never an all-cities×all-professions mesh · launch cap ≤10 indexed city pages per profession per quarter · freshness labels per R13; no availability promises beyond bucketed aggregates.

**Seed geography (evidence-ordered):** Amsterdam, Rotterdam, Den Haag, Utrecht, Eindhoven; then Almere, Arnhem, Breda, Groningen, Nijmegen; province pages only for Limburg/Friesland if their own gate passes. Cities ship strictly on-demand when data clears 30.

## Δ5. Domain strategy (brief §11) — answer
Evidence: both domains near-zero-indexed (site:offermarket.eu → zero; F13 zero content); nl robots/sitemap advertise EU (F2 live-confirmed); no canonical/hreflang except articles (F1); domain-authoritative routing; locale-prefixed paths 307 cross-domain; sitemap single-domain.

**Recommendation: keep two domains, each exclusive to its locale. offermarket.nl = definitive NL-market domain; offermarket.eu = EN/international. There is no SEO equity to migrate — no authority, backlinks, indexed pages or rankings — so any consolidation/migration is pointless churn against the already-built domain-based i18n architecture (routing.ts, localeUrl, backend preferredLocale, CORS dev subdomains). Considered and rejected.**

Rules:
1. NL-market content only on .nl, EN-market only on .eu; each self-canonical, own robots.txt + sitemap (T1/T7); no cross-domain canonicals.
2. **F3 outcome (v2):** NL articles render on .nl self-canonical; EN on .eu. **Never canonicalise NL content → .eu** (audit's option (a) is wrong under v2: .eu would rank the NL market's asset on the international property). Per-locale content/slugs arrive with the first localisation.
3. Canonical + hreflang matrix:

| Surface | Canonical | hreflang | x-default |
|---|---|---|---|
| Shared bilingual templates (home, /for-*, /guide hub, /pricing, /insights+categories, /register, legal) | self on own domain | en→.eu, nl→.nl | offermarket.eu |
| NL-market content (/market/*, /zzp/*, /hire/*, NL-specific guide/article) | .nl self | none (never manufacture an EN twin just for hreflang) | — |
| EN-market content without NL twin | .eu self | none | — |
| /p and /employers pages | **offermarket.nl canonical on both domains** (NL hiring surfaces; consent domain-wide per B2c) | none | — |

4. Geo: .nl ccTLD inherently NL-targeted; hreflang + content language carry the rest; Bing Webmaster language per-site; no deprecated international-targeting/geo-meta features. (Note: .nl here is a ccTLD while .eu is a generic TLD — the ccTLD's geo signal is a real asset, another reason against consolidation.)
5. Migration steps: none beyond already-scoped tickets (T1, T2, T7) + Search Console and Bing properties per domain. No redirects, no domain move.

## Δ6. Inventory rules — extends v1 R1–R8 with R9–R13
- **R9 /p freshness:** eligibility server-side at request time (B2a). Indexed profile additionally requires activity (sign-in or profile update) within **180 days** (activity/updatedAt field = assumption Q15, schema check). Annual re-consent prompt for PROFILE_PUBLIC_INDEXED; no response → noindex. Withdrawal stays B2b-ordered (410 first), both domains in one generation (B2c).
- **R10 employer pages:** verification downgrade/revocation → immediate noindex; last *published* review > **24 months** → noindex,follow until a new one; withdrawal 410-first; review free-text filtered per risk 11 before publish.
- **R11 expiry:** no public page renders per-offer state (offers always private). /p availability is worker-controlled with expiry (availableUntil ≤60 days if added); expired/unknown → neutral wording, never stale "available now". Public demand counts only as MarketSnapshot aggregates with M6 bucketing; snapshots older than 180 days keep indexability (hysteresis) but display their data period prominently; gate failure on two consecutive monthly checks exits the sitemap next generation.
- **R12 duplicates (Q4 now firm):** /p uses **hash-based public slug** — sequential W-%06d never in a crawlable URL; withdrawn slugs never reused (410 permanent). One page per employer entity (re-registered/duplicate employers resolve to one slug; tradeName vs companyName one page). Employer slugs `{companyNameSlug}-{shortId}` (deterministic, never KvK).
- **R13 freshness labels:** every dynamic public data module shows metric period + sample size; no real-time claims; sitemap lastModified from entity updatedAt; staleness affects display labels only — indexability decided solely by the Δ4 gates, never by freshness (no flapping).

## Δ7. Per-page spec template (for dutch-content, post-approval)
Sixteen fields per launch page: URL+family/phase · primary keyword+owner row from Δ3c (secondary ≤5, no overlaps) · intent+audience+persona · SERP anchor competitors · SEO title ≤60 chars + meta description ≤155 (with one concrete differentiating fact) · H1 + numbered H2 outline (data-module vs editorial marking) · unique-content requirements (which real data modules, minimum thresholds, min city-unique %, forbiddens) · internal links IN/OUT with anchor intent (v1 §2 + Δ4 caps) · structured data types + eligibility marker + forbiddens · canonical/hreflang per Δ5 matrix + OG plan · primary/secondary CTAs per audience+section · indexability gates (R1–R13+Δ4) + pre-index checklist · generation method + data dependencies · freshness plan (labels, cadence, owner) · success metric (target queries + an AI-probe question + conversion event) · editorial sign-off + review cycle (90-day default; 24/180-month staleness).

## New decisions for the CTO (v2; outstanding v1 Q2/Q3/Q5/Q6/Q7/Q8 remain)
- **Q9 (Δ1):** confirm no-`/nl/`-prefix unlocalized ruling; defer pathnames with the documented map.
- **Q10 (Δ2):** confirm do-not-build `/vacatures` + documented reversal trigger.
- **Q11 (Δ3c):** confirm B1 contract v2, incl. superseding insights-architecture.md per-city salary slugs (one-line note to that doc on approval).
- **Q12 (Δ4):** confirm unified 30/20 threshold + ≥2-employer condition (feasibility of the aggregation query unverified — droppable with note).
- **Q13 (R12):** hashed public slug now firm for /p.
- **Q14 (Δ5):** domain matrix + F3 outcome (never canonicalise NL→EU).
- **Q15:** schema check for worker activity/freshness field (R9 assumption).

**Risks carried into the quality re-review:** (i) editorial-sign-off allowlist becomes a content-team dependency — a gate-passed city without sign-off stays 404 and may miss its window; (ii) /vacatures leaves a head-traffic family untouched — deliberate; reversal trigger is the containment against "just build one" pressure; (iii) /zzp and /market are intentionally close — the B1 title/H1 rules keep them apart, so per-page specs must be written against them; (iv) ≥2-employer condition is the only unverified feasibility item.
