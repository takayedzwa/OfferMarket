# Per-page spec — `/market/elektricien` (NL)

**Δ7 16-field per-page spec** — written against URL_ARCHITECTURE.md Δ3c (one-page-per-intent contract, ratified Q11), Δ4 (unified 30/20 gate + hysteresis), Δ5 (domain matrix), KEYWORD_DATABASE v2 (+ Δ addendum) and QUALITY_AND_RISKS v2 (incl. re-review M-N3, M-N4, m-N3, m-N5).
**Status:** SPEC for approval — no page content drafted, no numbers invented. Every figure that will appear on the final page is a `[DATA: …]` placeholder sourced from the T11 gate endpoint. [DRAFT — not published]

---

## Field 1 — URL, family, phase

- **URL:** `https://offermarket.nl/market/elektricien`
- **Family:** /market role hub (worker-attraction family, Δ3 map). Route owned by T10 `/market/[profession]`.
- **Generation method:** D + editorial intro (Δ3).
- **Phase:** L1 — elektricien only. `/market/verpleegkundige` explicitly excluded until the legal review (Q8, BIG/VOG/Wkkgz wording) closes.
- **Locale rule (Δ1):** URL segment is the unlocalized English-style path shared across domains; all on-page copy is natural Netherlands Dutch served on offermarket.nl only.
- **NL-market content ruling (Δ5):** this page is NL-market content on the NL ccTLD. **It exists on offermarket.nl only.** There is **no EN twin of this page** — /market is canonical-only (see Field 10). The only EN-facing surface OfferMarket offers at launch is the public-data documentation page `/insights/developers` (EN, on offermarket.eu), which documents the T11 public endpoint that carries the same aggregates in EN machine-readable form. No EN market pages, no hreflang manufactured to fill the gap.

## Field 2 — Primary keyword + owner row (Δ3c)

- **Primary query shape:** "wat verdient een elektricien" (question-form family of Cluster D, incl. verified variants netto / zzp / per uur / leerling / leidinggevende — KEYWORD_DATABASE Δ1/Δ6, autocomplete verified 2026-11-05).
- **Secondary "gemiddeld uurloon":** same field. /market/{rol} + /{stad} is the **sole owner** of the shapes: "wat verdient een elektricien", "gemiddeld uurloon", live/city numbers.

**Owner row (Δ3c, verbatim mapping):**

| Query shape | Sole owner here? | Explicitly NOT allowed on this page |
|---|---|---|
| "wat verdient een elektricien" (+ uurloon, live/city) | ✔ this page targets it | insights may not publish live-number benchmark duplicates |
| "wat doet een elektricien" (definition) | ✔ top section of this page | no /beroepen duplicate |
| "elektricien salaris" (+ netto/per maand/hbo; "salaris elektromonteur") | ✘ — owned by `/insights` (category salary + D-cluster article) | no "salaris" head in this page's title/H1 (body/data mention of the *word* salaris OK) |
| "salaris elektricien {stad}" (city+salary) | ✘ — owned by `/market/elektricien/{stad}` child pages | insights must not publish per-city salary articles (supersedes planned `electrician-salary-rotterdam` slugs) |
| "zzp elektricien salaris/tarief/uurtarief", "elektricien tarief" | ✘ — owned by `/insights` (zzp-salary article) and `/zzp/elektricien` respectively | this page must not target "tarief"/"uurtarief" (Δ3c rules in body, m3 rule) |
| "vacature elektricien" (+ {stad} heads) | ✘ — vacature heads not built (Δ2); city tail answered in body and meta title, **never** URL or H1 (m-N3) | Δ2 anti-regression: no "vacatures/vacature/opdrachten gezocht" in URL or H1 — this page renders no listings |

**Terminology note (verified):** "elektromonteur" is the everyday trade term for the same craft family; "wat verdient een elektromonteur" is its own question-form query with a materially weaker SERP (KEYWORD_DATABASE Δ6). Body copy may use "elektromonteur" as the natural synonym where appropriate, but this page claims no separate elektromonteur-page ownership in this spec — whether "wat verdient een elektromonteur" needs its own page later is a **role-row decision, flagged for CTO** (one page per query shape per role never becomes two).

**Secondary keywords (≤5, no overlaps outside the owned rows):**
1. gemiddeld uurloon elektricien
2. hoeveel verdient een elektricien (question-form word-order variant)
3. hoeveel verdient een elektricien netto (Δ6-verified variant — answered in body; no "salaris" head anywhere in title/H1)
4. wat doet een elektricien
5. verdient een elektricien (leerling / leidinggevende) — Δ6-verified variants, answered by the experience-level breakdown inside the data module

## Field 3 — Intent, audience, persona

- **Intent:** informational, worker-first (Δ3 row: informational worker | worker-first). The searcher is evaluating their market value — often the switch-moment phrasing rather than active job-seeking (Cluster J logic, KEYWORD_DATABASE Δ4).
- **Audience:** practitioners and career-changers in elektrotechniek/installatietechniek (worker ≈ 80% of expected traffic), plus a minority of employers benchmarking pay.
- **Persona A (vaste baan):** een elektromonteur of elektricien bij een installatiebedrijf die wil weten of zijn maandloon redelijk is en wat werkgevers realistisch bieden — zoekt gericht, vergelijkend, kijkt naar cijfers en direct daarna hoe hij verhaal kan halen.
- **Persona B (zzp'er of twijfelende overstapper):** vergelijkt vaste aanstelling vs. opdrachten; leest niet verder dan een cijfer en een logisch vervolg ("wat levert dat op", "kan ik het anoniem laten checken").
- **Persona C (employer, minor):** wil weten wat het markttarief is voor budgettering — geleid via Field 11 secondaire CTA naar `/for-employers` en `/pricing`; deze pagina schrijft voor Persona A/B en noopt de werkgever niet in de introductie.
- **Tone:** "je" consistent (worker family), direct en zakelijk-warm; branchejargon (uurtarief, cao, VCA, NEN 3140) mag voorkomen als het in het vervoer van de zinhoofdstukken past — geen jargon-stubs.

## Field 4 — SERP anchor competitors

From KEYWORD_DATABASE Δ6 (question-form family check, evidence dated 2026-11-05, directional — confirm with rank tracker before rank-sensitive decisions; per m-N5 one stated source per claim):

| Competitor | Position | What they hold | Why we can displace |
|---|---|---|---|
| Intermediair | question-form result, self-reported band figure | template salary page, self-report sample | no structured offer-data benchmark |
| mijntechcarriere.nl | cao-scales page | CAO TIB (Technisch Installatiebedrijf) scale A–J figures + cao-agreement dates | small domain with CAO data — corroborates CAO line but no live marketplace rates |
| wr.nl Salarisgids | salaris-guide figure | annual guide figure | static, no period-labelled live aggregates |
| vnom/Manpower blogs | informational blogs | generic career content | no data layer, no demand module |

**No Indeed / Nationale Vacaturebank result was retrieved for this question form** (they rank on "elektricien salaris" heads) — the question-form SERP is materially weaker than the salaris head; small data-carrying domains (mijntechcarriere) already rank, which is the pattern this page exploits. Note: the competitor figures themselves stay out of our page copy; on-page comparisons only follow the honesty rules (no guarantee claims per QUALITY_AND_RISKS v2 sections; any competitor-figure mention on-page needs its own source and date — default: don't mention competitor numbers).

## Field 5 — SEO title + meta description

- **SEO title (≤60 chars, keyword-first):**
  `Wat verdient een elektricien? Uurloon uit echte offers` (53 chars as written; verified ≤60).
  Alternative candidate (if editorial prefers the uurloon key): `Gemiddeld uurloon elektricien — live data uit offers` (52 chars). Both contain no salaris head, no tarief head, no vacature wording, no year that will go stale.
- **Meta description (≤155 chars, keyword-first, one concrete mechanism fact — no invented numbers):**
  `Hoeveel verdient een elektricien per uur of per maand? Live cijfers uit echte salarisoffers van werkgevers op OfferMarket, met periode en aantal offers erbij vermeld.`
  Count as written: [DATA: verify ≤155 in the CMS at build; re-count after any edit].
  The single concrete differentiating fact is the **mechanism**: the numbers come from real, employer-made salarisoffers (offer-grounded MarketSnapshot aggregates) rather than self-reported surveys — exactly the gap every incumbent has — plus the provenance promise (periode + sample size always shown, per R13). No figure appears in the meta because the live numbers are gate-dependent; the meta stays valid while the data refreshes.
- **Honesty rules (carried from QUALITY_AND_RISKS v2):** no guarantee claims ("waarborgen", "minimal verdienen" formulations are forbidden), no superlatives that cannot be evidenced, competitor numbers not quoted on-page by default.

## Field 6 — H1 + numbered H2 outline

- **H1:** `Wat verdient een elektricien?`
- **H2 outline** (marks: **[DM]** = data module rendered from the T11 gate endpoint, only when the gate passes with a valid display payload; **[ED]** = editorial block written dutch-content → signed per Field 16; **[DM+ED]** = data module with an editorial explainer around it):

1. **[ED]** Wat doet een elektricien? — definitie + werksoorten (woningbouw, utiliteit, industrie).
2. **[DM+ED]** Wat verdient een elektricien? — gemiddeld uurloon en maandloon.
   - Data module: salaryRange uit het T11-gate eindpunt — `[DATA: salaryRange p25/p50/p75 from GET /api/v1/insights/market/public/elektricien]` plus provenance label `[DATA: window + sampleSize + methodVersion from the same endpoint payload]`.
   - Editorial explainer around the module: wat p50 betekent in gewone taal, dat dit cijfers zijn uit echte salarisoffers (niet zelf-gerapporteerd), en dat netto/bruto wordt uitgelegd in de tekst eronder.
3. **[ED]** Uurloon, maandloon en netto — hoe je de cijfers vergelijkt.
4. **[DM+ED]** Hoe zwaar is de vraag naar elektriciens? — live-demand module.
   - Data module: demand level from the same endpoint payload — `[DATA: demand-level + provenance from the T11 endpoint payload]`, counts only as M6-bucketed figures ("20+") — never a raw small-cell count.
5. **[DM+ED]** Hoeveel verdient een leerling, een ervaren monteur en een leidinggevende elektricien? — experience-level breakdown if the engine exposes cohort splits.
6. **[ED]** In welke sectoren werkt een elektricien, en wat bepaalt je tarief? — mention of sector vocabulary only (installatietechniek, industrie, utiliteit); any *rate* numbers stay inside the data module; "zzp elektricien" worded only as part of the "werk" vocabulary — **no tarief/zzp-tarief head claim** (that is `/zzp/elektricien`'s job, see Field 8).
7. **[ED]** Waarom OfferMarket deze cijfers kan tonen — korte uitleg over het omgekeerde marktplaatsmechanisme en wat werkgevers anoniem aan vakmensen bieden. (No guarantee language; no "meer dan X%"-styled claims.)
8. **[ED + module]** Elektricien per stad — koppelingsblok naar passerende stads-landing `[/market/elektricien/{stad}]` — **only rendered as indexable-link block for cities that pass the Δ4 gate** (see Field 12); non-passing cities silently absent, not listed as "binnenkort".
9. **[ED]** Veelgestelde vragen (plain-text Q&A; no FAQPage markup — D2.3 forbids it).
  Suggested QA (drafted at content-build, each answer grounded in Field 7 data, never a number):
  - "Wat verdient een elektricien per uur?"
  - "Hoeveel verdient een elektricien netto?"
  - "Is elektricien een goed betaald beroep?"
  - "Hoe kun je checken of je salaris redelijk is?"
10. **[ED + CTA]** Bekijk nu wat het markt van je vraagt — Field 11 primary CTA block.

## Field 7 — Unique-content requirements

Real data modules (all served by the T11 gate endpoint, `GET /api/v1/insights/market/public/elektricien`, TECHNICAL_IMPLEMENTATION T11):
1. **Salary-range module** — `[DATA: salaryRange p25/p50/p75 uit MarketSnapshot-aggregaat (profession=elektricien, landelijk), sampleSize, periode (window), methodVersion, computedAt — exacte velden uit het GatedValue-payload]`. Display thresholds remain the live engine's; indexability is decided by Field 12 only.
2. **Demand module** — demand level + bucketed counts (M6: counts under min-sample suppressed or bucketed; "20+" bucket language; never a raw count in a thin cell).
3. **Experience-cohort module** (if the aggregation layer exposes splits) — otherwise the section stays editorial-without-numbers and says so truthfully ("nog onvoldoende offers voor een betrouwbaar onderscheid — dat veranderen we" instead of inventing an answer).
4. **Provenance display** — every data module shows metric period + sample size + methodVersion (R13). "Live" wording allowed only for the data being live from real offers, never for real-time claims.

Thresholds: **indexability gate 30/20 (Δ4)** applies with the **country-level (profession = elektricien) snapshot**; display thresholds stay the engine's own (SALARY_RANGE 30, DEMAND_LEVEL 5, per seed.ts / insights-snapshot contract verified by quality re-review).

Editorial minimums:
- The editorial intro + definition + explainer sections are hand-written (E-layer), not spun; one editor per Field 16.
- Definition block must be ≥150-woorden substantief content that an installatiemonteur would recognise — no boilerplate list of "wat een elektricien doet" copied from competitors' vocabulary; use verified trade terms (elektromonteur as everyday term, installatiemonteur, servicemonteur, monteur middenspanning; see KEYWORD_DATABASE cluster H for correct vocabulary).
- No fabricated listings/candidate tiles (QUALITY_AND_RISKS M5; Δ2 anti-doorway line); no per-offer state; no employer names on a worker-facing page beyond neutral mechanism wording.

Forbiddens (enforced at page build + content review):
- No "salaris" in title or H1 (Δ3c).
- No "tarief/uurtarief" target in title/H1 (Δ3c zzp/tarief rule).
- No "vacatures"-framed URL/H1 (Δ2 anti-regression).
- No invented numbers anywhere; every figure is a `[DATA: …]` from the T11 endpoint or a source-cited figure from insights articles (never copy competitor survey-figures as our own).
- No guarantee claims (honesty rules); no availability promises beyond bucketed aggregates.
- JobPosting, FAQPage, Person, ProfilePage markup: never on this page (Field 9).
- FAQ only if genuinely helpful answerable Q&A exists against real content — do not manufacture an FAQ for keyword coverage.

## Field 8 — Internal links IN / OUT

**Links OUT from `/market/elektricien`** (v1 §2 cross-linking list, unchanged by Δ):
1. `→ /market/elektricien/{stad}` — passing city pages only, from the city-link module in section 8; anchor intent: "uurloon elektricien in {stad}" (city-tail shape; ≤8 sibling links, Δ4 cap).
2. `→ /insights` salary-cluster articles — top 3 matching insights, anchor intent from article-side ownership ("salaris elektricien uitgelegd", "hoe het cao-mechanisme werkt" worded in insights' own framing). Anchor must NOT re-target the question-form head; the question-form head is owned locally.
3. `→ /guide/{slug}` — 2–3 relevant guides; anchor intent in guide-own framing (worden/omscholen/VCA) referencing market data as a module, never a "salaris" head (M-N2 fix).
4. `→ /for-workers` — brand + anon-profile conversion framing.
5. `→ /for-employers` — employer-side secondary path.
6. `→ /zzp/elektricien` (once live, L2) — only inside the "werkvormen" section, framed as "opdrachten vs vaste baan"; the /zzp page's data module links BACK to this page as its source (single-direction salaris/tarief separation, Δ3c).

**Links IN to `/market/elektricien`** (pages that should carry this page's link):
- `/market` hub (navigational index).
- `/insights` salary-category article(s) — linked as the "live numbers" companion (M-N2: insights may reference, never duplicate live-number framing).
- `/insights/{slug}` via the auto "related market data" module (T-something line item — v1 §2 note: one-line generator change reusing Article.profession/regionId).
- `/guide/{slug}` — referenced as market-data module, never as a competing salary page.
- `/market/elektricien/{stad}` city pages — back-link to profession hub.
- `/for-workers` — "bekijk je waarde anoniem" conversion-adjacent link.
- `/pricing` and `/hire/elektricien` (L2 employer family) — links from the employer-secondary side back to market data as its rate-benchmark source.

**Anchor quality rule:** no generic "lees meer"/"hier" anchors; every anchor carries the target page's query shape in the anchor text (enforcement point for C-N1 cannibalisation).

## Field 9 — Structured data

Per Δ3d + TECHNICAL_IMPLEMENTATION T10.1 + ai-search-geo D2.3 (13-type evaluation table):

| Type | Eligibility marker (D2.3) | On this page? | Fields |
|---|---|---|---|
| `Occupation` (name, occupationLocation NL, estimatedSalary, skills) | **CONDITIONAL USE** — estimatedSalary rich-result retired (notice ~2025-11-12); semantic layer only | ✔ only on gate-passing renders | `estimatedSalary` from real aggregates only [DATA: p25/p50/p75, currency EUR, from T11 endpoint]; `occupationLocation` Address → **Country NL** (the field quality flagged as required); `specialty` from Profession slug; `skills` mapped to visible, non-personal skill names |
| `Dataset` + `DataDownload` | **USE** — active surface for this family (Occupation's rich-result retirement made Dataset the operative channel; Google Dataset Search feeds on it per D2.4) | ✔ only on gate-passing renders | `name`, `description` ≥50 chars, `distribution` → `DataDownload` with `contentUrl` = `https://api.offermarket.nl/...` — **cite the T11 public endpoint: `GET /api/v1/insights/market/public/elektricien`** (TECHNICAL_IMPLEMENTATION T11.1 route), `variableMeasured` (uurloon p25/p50/p75, sample size, methodVersion), `isAccessibleForFree` true, `license`, `spatialCoverage` NL |
| `BreadcrumbList` | USE on all P1+ families | ✔ | Home → /market → /market/elektricien |

Forbiddens on this page (D2.3 verdict column + Δ2):
- `JobPosting` — never (Δ2: no public listings; false signalling for a reverse marketplace).
- `FAQPage` — never (Google restricted since Aug 2023; plain-text QA only).
- `Person` / `ProfilePage` — never on worker-derived data (R5; the aggregate shadow only).
- `SearchAction` inside `WebSite` — never (retired; C-N2 resolved: AI annex rules).
- No employer-identifiable detail inside any value (aggregate-safe only, R5).

Server-injected only, only when the endpoint gate passes (Δ3d: "only on gate-passing pages").

## Field 10 — Canonical / hreflang (Δ5 matrix) + OG plan

- **Canonical:** `https://offermarket.nl/market/elektricien` — self-canonical on .nl.
- **Hreflang: none.** Δ5 row "NL-market content (/market/*, /zzp/*, /hire/*…)": self-canonical, no hreflang — never manufacture an EN twin just for hreflang. (Consequence stated here: /market has no EN presence on offermarket.eu at launch.)
- **EN-facing surface at launch:** none for this family. The only EN surface tied to the same data is `/insights/developers` (EN on offermarket.eu) documenting the public endpoint (D2.4 machine-readable feed spec). EN *market content pages* are out of scope until an explicit CTO decision to extend the family beyond the Δ5 matrix — flag any EN-market page request here so the domain matrix is not silently broken.
- **OG plan:** `og:title` = Field 5 title; `og:description` = Field 5 meta; `og:type` = website; `og:url` = Field 10 canonical; `og:locale` = `nl_NL`; `og:image` = site OG image route (already built via the technical-SEO OG image ticket — reference the site-level OG image; do not build a bespoke OG asset for this page in wave 1). No twitter-card variant beyond the same fields unless the site template already emits them.

## Field 11 — CTAs

Primary CTA (worker-side, above the fold after the data module + repeated in section 10):
- **Wording (worker family, "je"):** "Bekijk wat werkgevers nu anoniem aanbieden — zonder je naam te delen." (Framing from the anon-profile product mechanic; no guarantee of placement or salary lift.)
- **Destination:** `/register?role=worker` (conversion event in Field 15).

Secondary CTA (employer-side minority traffic, placed low):
- **Wording:** "Je zoekt een elektricien? Zie hoe werkgevers hier vakmensen bereiken."
- **Destination:** `/for-employers` (from there to `/pricing` and eventually `/hire/elektricien` at L2 — never directly to `/register?role=employer` from a worker-first page).

**Dual-audience split rule (KEYWORD_DATABASE Δ3 trap rule) does not apply here** (no gezocht-/zzp-string in this page's target), but the page must not accidentally frame itself as an opdrachten-board: counts come only from the demand module in bucketed form.

## Field 12 — Indexability gates + pre-index checklist

Gate rule (Δ4 unified — one number, country-level row for the hub):
- Indexable only when **MarketSnapshot sampleSize ≥ 30** for (profession = elektricien) on the **country-level** row.
- **Hysteresis:** once indexable, stays indexable while sampleSize ≥ 20 on two consecutive monthly re-checks; below that, exits the sitemap next generation (R11/R13 — display labels change; indexability flip only after the two misses).
- Indexability is decided solely by 30/20; display thresholds (which numbers the module shows) remain the live engine's own contract.

**Pre-index checklist (before the page enters the sitemap):**
1. [ ] Gate endpoint (`GET /api/v1/insights/market/public/elektricien`) returns `indexable: true` from the live T11 service on the country row (30/20 check).
2. [ ] Provenance labels rendered correctly — period + sampleSize + methodVersion visible on every data module (R13).
3. [ ] Demand module shows only M6-bucketed counts (no raw small-cell number, M6).
4. [ ] Occupation JSON-LD present, `occupationLocation` = NL, estimatedSalary only from real aggregates (re-review's missing-field note).
5. [ ] Dataset JSON-LD present, contentUrl points at the T11 public endpoint, description ≥50 chars.
6. [ ] BreadcrumbList renders; canonical points at .nl; **no hreflang on this page** (Δ5 row 2).
7. [ ] No salaris/tarief head in title or H1; no vacature wording in URL/H1 (C-N1 enforcement, m-N3, Δ2 anti-regression).
8. [ ] No invented numbers: every figure traceable to the T11 payload or a cited source with date.
9. [ ] No guarantee/availability claims; no fake listings; no FAQPage markup.
10. [ ] Editorial intro signed per Field 16.
11. [ ] Sitemap generation picks the page up next generation (`offermarket.nl/sitemap.xml`, C3 fix prerequisite — the nl-sitemap ticket).
12. [ ] robots.txt on .nl advertises the .nl sitemap (already-ticketed T7; prerequisite for any /market family indexing).

## Field 13 — Generation method + data dependencies

- **Generation:** D (dynamic/ISR from data) + editorial intro (Δ3 row for /market/{profession}).
- Render flow: server checks the T11 gate → gate passes → renders editorial intro + data modules + JSON-LD, serves 200, enters next sitemap generation; gate fails → serve **404** (not a noindex shell — Δ4 doctrine applies the same way here as on city pages; a shell is crawl-budget waste and the doorway pattern itself).
- **Data dependencies:**
  1. T11 — gate machinery + stable public endpoint (TECHNICAL_IMPLEMENTATION T11; depends on nothing blocked; daily snapshot recompute exists, verified).
  2. T10 — `/market/[profession]` route implementation (TECHNICAL_IMPLEMENTATION T10).
  3. Daily snapshot recompute + monthly gate re-check + gate-transition logging (re-review risk 15).
  4. Editorial layer — this spec's Field 6 sections 1/3/5–10 (dutch-content, signed per Field 16; M-N4 sign-off ticket).
  5. nl sitemap + robots fix (C3 prerequisite, T7/T1 — blocked pages cannot enter the sitemap they never had).

## Field 14 — Freshness plan (labels, cadence, owner)

- **Labels:** every data module renders metric period (window), sampleSize, methodVersion — always visible, never collapsed behind a tooltip (R13).
- **Data cadence:** snapshot engine recomputes daily (insights-snapshot cron, verified). Gate re-check runs on the same schedule with a monthly confirm; gate transitions logged (re-review risk 15 mitigation).
- **Editorial cadence:** 90-day review cycle (Field 16) — confirm the intro/definition still matches the data mechanism wording, the CTA copy, and the QA block; check no stale framing (e.g. a demand framing that no longer matches the demand module's bucket).
- **Display-language rule:** no real-time claims; the module may say "cijfers uit het huidige venster ({period}, {sampleSize} offers)" — the word "live" is reserved for describing that the underlying data comes from real offers, never for real-time updating claims.
- **Staleness:** >180 days period → keep indexability per hysteresis but display the period prominently (R11); the page must never present old-window data without the period label.

## Field 15 — Success metrics

- **Target queries (measurement):** "wat verdient een elektricien" (+ variants netto/hoeveel/per uur), "gemiddeld uurloon elektricien", "wat doet een elektricien". Track via Search Console (nl property) + the keyword-Planner/rank-tracker pass (prerequisite for measured tiers — KEYWORD_DATABASE Δ10).
- **AI-probe question (monthly human probe set, AI_SEARCH_STRATEGY §4 cadence):** "Wat verdient een elektricien per uur in Nederland?" — record whether any AI assistant (ChatGPT, Perplexity, Gemini, AI Overviews) cites offermarket.nl/market/elektricien. Success ladder: S4 (an AI assistant cites the page on ≥1 probe) — the probe set already includes the city variant "wat verdient een elektricien in Rotterdam?" which is the child page's probe (city-template spec).
- **Conversion event:** worker register completion via `/register?role=worker` reached from `/market/elektricien` (PostHog event; verify the event name at implementation — [DATA: confirm PostHog event name in the analytics implementation]). Secondary signal: clicks from the primary CTA into /register (click-through as an early indicator).
- **Content-quality signal (not vanity):** position trajectory on the question-form head over the 90-day review cycles, plus the page being cited in AI answers (S4) — these two, not raw visits, are the intended success of the page per its C-N1/Δ3c ownership role.

## Field 16 — Editorial sign-off + review cycle

- **Sign-off model (M-N4 — name the signer):** draft by **dutch-content** (this agent + any content editor), sign-off by **CTO (or the content owner the CTO appoints)** before the page's first indexable render — logged in the sign-off allowlist config (InsightsConfigService admin-config pattern, buildable per M-N4's ticket). Sign-off covers: intro/definition/QA blocks, CTA wording, and the honesty rules in Field 7.
- **Review cycle:** **90 days** default (Δ7). Each cycle re-confirms: data-module provenance wording, no stale claims, link map still accurate (insights/guides/zzp/hire links into this page), QA block still factual against the current module payload.
- **Staleness hooks:** gate-failure on two consecutive monthly re-checks → exit sitemap next generation (R11/R13, no indexability flapping before that); >180-day old window stays indexable but with prominent period label (R11).
- **City child pages** review: per city template spec (companion file `market-city-template-spec.md`), which carries its own sign-off per (profession, city).

---

## Appendix — explicit CTO asks carried by this spec

1. **Elektromonteur page question** (Field 2 note): does "wat verdient een elektromonteur" get its own market page, or is the elektricien hub's synonym mention sufficient for launch? One page per query shape per role is the contract — this spec writes only the elektricien hub and flags the sibling for a separate decision.
2. **Sign-off ownership** (M-N4): confirm the signer and the allowlist ticket before any /market content ships.
3. **EN surface at launch:** confirm "no EN /market pages at launch; `/insights/developers` (EN on .eu) is the EN data-facing surface" (Field 1/Field 10).
4. **PostHog event name** for the worker register conversion (Field 15 placeholder).
