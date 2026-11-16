# City-page spec template — `/market/elektricien/{stad}` (NL)

**Δ7 16-field per-page spec, written as a reusable TEMPLATE + three seed-city instances.** Companion to `market-elektricien-page-spec.md` (which the template references for shared rules; those are not restated in full here unless the city page differs). Written against URL_ARCHITECTURE Δ3/Δ3c/Δ4/Δ5, TECHNICAL_IMPLEMENTATION T10.2/T11.1, KEYWORD_DATABASE v2 (cluster A role+city tails — strongest autocomplete of any role seed, Δ1; Δ4 seed geography, evidence-ordered) and QUALITY_AND_RISKS v2 (M-N4 sign-off ticket, F-N1 geo caveat, m-N3).
**Status:** SPEC for approval — template + editorial briefs only. No page content drafted; every figure is a `[DATA: …]` placeholder from the T11 city endpoint. [DRAFT — not published]

---

## Seed-city selection (per Δ4 evidence-ordered geography)

**Amsterdam, Rotterdam, Den Haag** are the three seed cities that matter most at launch — the first three of Δ4's evidence-ordered list (Amsterdam, Rotterdam, Den Haag, Utrecht, Eindhoven). Each has the deepest expected employer density for elektrotechniek demand and precedes the second wave (Utrecht, Eindhoven; then Almere, Arnhem, Breda, Groningen, Nijmegen). **Cities ship strictly on-demand when data clears the gate** (Δ4: gate-crossing generates the page); nothing in this template pre-builds indexable shells.

- **Slug conventions (v1 §1):** lowercased name-slug, accents kept, from `Region` (type=CITY). Expect `amsterdam`, `rotterdam`, and for Den Haag the Region-row slug (`s-gravenhage` per the convention's example) — **[DATA: verify actual Region.slug values in the seeded database before first build]**. The URL uses the region slug, not the display name.

---

# PART A — Template (identical for every city; the three fields that vary per city are marked ⟐)

## Field 1 — URL, family, phase

- **URL pattern:** `https://offermarket.nl/market/elektricien/{stad-slug}` → for the seeds: `/market/elektricien/amsterdam`, `/market/elektricien/rotterdam`, `/market/elektricien/s-gravenhage`.
- **Family:** /market city × profession data page (Δ3 row). Route owned by T10 `/market/[profession]/[citySlug]`.
- **Generation method:** T+E on data-driven demand; **404 otherwise** (Δ3). Template exists from L2; the page renders only when the Δ4 gate passes.
- **Phase:** L2, built-on-demand (M2 doctrine: not built-then-gated — a gate-failing URL is a 404, never a zero-index shell).
- **Locale rule (Δ1):** unlocalized path segment, natural Netherlands Dutch copy, served on offermarket.nl only.
- **NL-market ruling (Δ5):** NL-market content, canonical-only, no hreflang, .nl only — as with the role hub, there is **no EN twin at launch**; the EN-facing surface for the same data remains `/insights/developers` (EN on offermarket.eu).

## Field 2 — Primary keyword + owner row (Δ3c)

- **Primary query shape:** "uurloon elektricien {stad}" tail (Δ3c row: live/city numbers → `/market/{rol}/{stad}` sole owner).
- **City+salary row:** "salaris elektricien rotterdam" (city+salary) → this family's sole owner; **insights must not publish per-city salary articles** (supersedes the planned `electrician-salary-rotterdam` insight slugs — Q11 note required to insights-architecture.md).
- **Role+city tail row:** "elektricien {stad}", "vacatie-tails" — Δ3c row: `/market/{rol}/{stad}` owns role+city tails. **m-N3 rule (enforce): the vacature-tail query is answered in body and in the meta title, NEVER in the URL or H1** — Δ2 anti-regression applies verbatim (no "vacatures" in URL/H1; the page renders no listings).

**Owner changes from parent (only these):**
- Title/H1 keyword is the city tail, not the national question head.
- The parent hub keeps the definition + national module; the city page **does not re-own "wat verdient een elektricien"** (national question head) in its title/H1 — it answers the local number. Overlap control: the city page's H1 names the city; the parent hub's city-link module anchors into it.

**Secondary keywords (≤5, no overlaps outside owned rows):**
1. salaris elektricien {stad} (city+salary owner row)
2. uurloon elektricien {stad} (head of the tail family — actually the primary's head variant; listed for anchor-text use)
3. elektricien {stad} (role+city tail, answered in body + meta title only, not H1/URL)
4. hoeveel verdient een elektricien in {stad} (question-form × city — owned here, never by insights)
5. elektromonteur {stad} (everyday-term tail — body vocabulary use; full ownership question flagged in the parent spec's Field 2 appendix, CTO to decide)

## Field 3 — Intent, audience, persona

- Same informational worker-first intent as the hub, one rung more specific: the searcher has already decided to evaluate the local market ("wat verdient een elektricien in rotterdam?"). Often paired with a concrete job-scouting or overstap-in-gezicht search (Cluster A's role+city tails are the strongest autocomplete of any role seed — KEYWORD_DATABASE Δ1).
- **Persona A (lokaal vergelijker):** monteur die in {stad} woont of wil verhuizen en de lokale markt wil snappen — steden-tail traffic is the highest-converting informational segment (closest to the offer).
- **Persona B (nieuwkomer/omscholer):** bekijkt een stad als werkgebied; leest het lokale landschaal-blok (Field 6 section ⟐2) en de cijfers, dan de register-CTA.
- Employer traffic (minor) → secondary CTA, as on the hub.
- **Tone:** "je", direct, place-aware — de stad mag voerken als kennis van de lokale branche ("hier werken veel monteurs aan …" style) alleen als die kennis in het gesigneerde blok staat (Field 7 sign-off scope covers this).

## Field 4 — SERP anchor competitors (city tail)

Evidence base (KEYWORD_DATABASE cluster D + Δ7, directional, 2026-11-05 — confirm per-city with a rank tracker before treating rank as a KPI):
- **Indeed carriergids city salary pages** (e.g. nl.indeed.com/career/elektricien/salaries/{Stad}) — self-reported-survey city salary page; the direct incumbent for the city+salary shape.
- **Job boards' role+city listing heads** (Nationale Vacaturebank, Techniekwerkt, Indeed, Werkzoeken.nl, Jobbird — cluster A heads reinforced by Δ7) — they hold the vacature-shape, but **our page does not compete on listings** (Δ2); we take the data-shape answer.
- **Self-report salary guides** (Intermediair/wr.nl-style, national) — weak on city tails: no per-city offer-grounded number.

**Gap this page exploits:** nobody on a city tail holds structured, offer-grounded, provenance-labelled market data. The city rate row is unique per city by construction (distinct-source check, Field 12).

## Field 5 — SEO title + meta description (per-city values)

Template pattern (keyword-first, ≤60; no salaris/tarief head; no vacature wording):
- **Title:** `Uurloon elektricien in {Stad} — live data uit offers` (e.g. `Uurloon elektricien in Rotterdam — live data uit offers` = 55 chars; verify per city, the length moves with the city slug — for `S-Gravenhage` the count is 58 as written, still ≤60).
- **Meta description (≤155, keyword-first + mechanism fact, no invented numbers):**
  `Wat verdient een elektricien in {Stad} per uur? Live cijfers uit echte salarisoffers van werkgevers in {Stad}, met periode en aantal offers erbij vermeld.` (≈150–155 as written in the parent's format; [DATA: verify char-length per city at build]).
- **Per-city meta variation rule:** the city name appears in title + meta; everything else stays mechanically identical, so the three seed pages do not read as copies of one another.

## Field 6 — H1 + numbered H2 outline (data-module vs editorial marks)

- **H1:** `Wat verdient een elektricien in {Stad}?`
- **H2 outline** (⟐ = city-specific block; **[DM]** gate-served data module; **[ED]** editorial):

1. **[DM+ED]** Wat verdient een elektricien in {Stad}? — lokaal salarisdatablok.
   - Data module: city-row salaryRange from the T11 city endpoint — `[DATA: salaryRange p25/p50/p75 from GET /api/v1/insights/market/public/elektricien/{citySlug}, plus sampleSize + window + methodVersion]`.
   - Editorial explainer: hoe dit zich verwijt-tot het landelijke cijfer (link naar de hub als bron-vergelijking — the hub is linked as the national framing source; the city page does not duplicate the national module).
2. **[ED, city-unique, ⟐]** Elektrotechniek in {Stad} — het lokale landschaal-blok. **The city-unique editorial block (Δ4 core).** 150–250 woorden, gesigneerd per (profession, city); city briefs for the three seeds in PART B.
3. **[DM+ED]** Hoe zwaar is de vraag in {Stad}? — city demand module (bucketed counts, M6; no raw small-cell figure).
4. **[ED]** Wie werken hier in de elektro? Korte sectoren-blok derived *from* the signed city block (no new claims beyond it; no employer names unless verified in the sign-off).
5. **[ED + module]** Elektricien in nabij-{region}-steden — sibling-city links, **province-children only, ≤8 per page, never an all-cities×all-professions mesh** (Δ4 safeguard).
6. **[ED]** Veelgestelde vragen (plain-text; no FAQPage — D2.3): "Wat verdient een elektricien in {Stad} per uur?" / "Hoeveel verdient een elektricien in {Stad} netto?" / "Is er in {Stad} veel werk voor elektriciens?" — only questions whose answers exist in section 1/3 data or the signed city block; no manufactured FAQ.
7. **[ED + CTA]** Primary CTA block (Field 11).

## Field 7 — Unique-content requirements

- **City-unique editorial block ≥40% of body** (Δ4). For the seed cities this is the PART B brief, 150–250 words, written from genuine local-market knowledge and signed; every unverifiable local claim carries `[DRAFT — needs local-knowledge verification]` until a source or a signed correction exists.
- **Data modules served by the T11 city endpoint** (`GET /api/v1/insights/market/public/elektricien/{citySlug}`): city salaryRange row + city demand row + provenance (period, sampleSize, methodVersion) — placeholders only in this spec: `[DATA: … from city endpoint payload]`.
- **Province fallback is display-only:** a display-ladder fallback may show the province row when the city row lacks a display-eligible payload, but a page whose "local" number is actually the province fallback must never index (distinct-source rule, Field 12) — label the fallback explicitly and truthfully in the module ("cijfers op regioniveau (provincie) — de stad had nog geen eigen voldoende offers").
- **Honesty rules:** no guarantee claims; no availability promises beyond bucketed aggregates; no employer names that are not in the signed block; competitor figures never quoted as our own.
- **Forbiddens (city-specific sharpening of the parent list):** no vacature-tail wording in URL/H1 (m-N3/Δ2), no salaris/tarief heads outside the owned city+salary row, no Place markup when geo is absent (F-N1), no cross-city copying of the signed block ("one block per city, signed once, never reused as the template's default text").

## Field 8 — Internal links IN / OUT

**OUT from a city page (v1 §2 + Δ4 caps):**
1. `→ /market/elektricien` — back to the profession hub (anchor: "uurloon elektricien in Nederland" / "wat verdient een elektricien" question-head anchor stays on the hub).
2. `→ sibling city pages` — province-children only, ≤8 (Δ4); anchor "uurloon elektricien in {sibling-stad}".
3. `→ /insights` matching articles — top 2–3, insights-own framing anchors.
4. `→ /for-workers` + worker register CTA (Field 11) + one `/for-employers` link.

**IN from other pages:**
- Parent hub's city-link module (hub → city, once the city passes its gate; hub carries the link *only* for passing cities).
- InsightArticles with profession/region = this city/province — via the auto "related market data" module and where editorially relevant.
- Sibling city pages (reciprocal within the ≤8 province-children cap).
- `/zzp/elektricien` city mentions (later wave) may link the city data page as source, consistent with the /zzp → /market source-link direction rule.

## Field 9 — Structured data (city page)

| Type | Eligibility | On city page? | Notes |
|---|---|---|---|
| `Occupation` (with `estimatedSalary` from the city row + `occupationLocation` at **City** granularity) | CONDITIONAL, semantic layer only | ✔ on gate-passing renders | `occupationLocation` → the City's Place reference (not Country — the city row is the page's answer); estimatedSalary only from real aggregates [DATA: city endpoint payload] |
| `Place` (city) | no rich result; generic | ✔ **conditional on geo** | `geo` from `Region.latitude/longitude` **only when non-null** (F-N1: columns exist but seed values are null — one-off coordinate import is ticketed within Q12 scope; until it runs the page must omit `geo` or the empty Place markup is dead weight) + `containedInPlace` → the Province |
| `Dataset` + `DataDownload` | USE (the active feed surface) | ✔ | contentUrl = `GET /api/v1/insights/market/public/elektricien/{citySlug}` (T11 city endpoint), spatialCoverage = the city |
| `BreadcrumbList` | USE | ✔ | Home → /market → /market/elektricien → /market/elektricien/{stad} |

Forbiddens identical to the hub (JobPosting / FAQPage / Person / ProfilePage / SearchAction — never), plus: **no Place markup without geo**, and never an estimatedSalary sourced from the province fallback (the distinct-source check makes that structurally impossible on an indexable page anyway).

## Field 10 — Canonical / hreflang (Δ5) + OG

- **Canonical:** `https://offermarket.nl/market/elektricien/{stad-slug}` — self-canonical .nl.
- **Hreflang: none** (Δ5 row 2, NL-market content).
- OG: same plan as the hub with the city values (og:title/meta above, og:locale nl_NL, site-level OG image).

## Field 11 — CTAs

Same as the hub, locally worded:
- **Primary (worker):** "Bekijk wat werkgevers in {Stad} nu anoniem aanbieden." → `/register?role=worker`.
- **Secondary (employer, low):** "Je zoekt een elektricien in {Stad}?" → `/for-employers`.
- Placement: primary above the fold after the local data module, repeated in the CTA section (H2 item 7); no availability promise in the CTA copy ("nu" refers to the data window, which is always labelled).

## Field 12 — Indexability gates + pre-index checklist (the Δ4 package, per city)

Gate rule (Δ4, unified — one number):
- Indexable only when **MarketSnapshot sampleSize ≥ 30** for exactly (profession = elektricien, city = {Stad}).
- **Hysteresis:** once indexable, stays indexable until sample < **20** on **two consecutive** monthly re-checks; then exits the sitemap next generation.
- Indexability decided by 30/20 only; display thresholds are the engine's separate contract.

**Pre-index checklist per city (all items must hold before the URL leaves 404):**
1. [ ] **Gate ≥30:** T11 city endpoint returns `indexable: true` for (elektricien, city) — fresh daily-cron state, monthly confirm.
2. [ ] **Hysteresis state machine wired** (30→ in, <20 twice → out; transitions logged — re-review risk 15).
3. [ ] **Distinct-source check:** the city's rate row differs from the province fallback row (a display-fallback-only page does not index). Fallback may appear *in addition* as labelled region context, never *instead of*.
4. [ ] **(Preferred, Q12) ≥2 distinct employers** contributed to the city's sample — droppable with a logged note if the aggregation query proves not cheaply available; the note must exist before the item is dropped.
5. [ ] **Editorial sign-off logged** for (elektricien, city) in the sign-off allowlist config (M-N4 ticket) — signer named per Field 16; sign-off covers the PART B city block verbatim.
6. [ ] **City-unique editorial block ≥40% of body** (Δ4), written per PART B, [DRAFT] markers resolved.
7. [ ] **Provenance labels** (period + sampleSize + methodVersion) on every data module (R13).
8. [ ] **M6 bucketing** on all demand counts (no raw small-cell number).
9. [ ] **Place markup only if `Region.lat/lng` non-null**; otherwise Place-without-geo decision as logged for Q12/F-N1.
10. [ ] **Sibling-city links ≤8**, province-children only.
11. [ ] **Title/H1/URL rules:** no salaris/tarief head; no vacature wording in URL/H1; city slug = Region slug.
12. [ ] **No invented numbers** anywhere; every figure = T11 city payload or cited source with date.
13. [ ] **Entry into next sitemap generation** for offermarket.nl (C3 prerequisite).

## Field 13 — Generation method + data dependencies

- **Generation:** T+E on data-driven demand; **404 until the gate passes** (Δ4). Gate-crossing (snapshot recompute) generates the page; it enters the sitemap next generation.
- **Dependencies:** T11 city endpoint + gate service; T10.2 route with server-side gate check on render (`notFound()` on fail); daily snapshot recompute; M-N4 sign-off allowlist ticket; F-N1 geo import decision (within Q12 scope); nl sitemap (C3).

## Field 14 — Freshness plan

Same as the hub (R13 labels period + sampleSize + methodVersion on every module; no real-time claims; >180-day window keeps indexability per hysteresis but displays the period prominently). Additional city item: the **distinct-source check is re-verified on the monthly re-check** — if a city collapses into province-fallback equality (both rows suppressed), the page's indexability is re-evaluated under the 30/20 + distinct-source rules, not silently left with a stale claim.

## Field 15 — Success metrics

- **Target queries:** "uurloon elektricien {stad}", "salaris elektricien {stad}", "hoeveel verdient een elektricien in {stad}" (+ role term variants per KEYWORD_DATABASE Δ1's city-loaded autocomplete set).
- **AI-probe question (monthly set):** "Wat verdient een elektricien in {Stad}?" — the Rotterdam variant is already in the fixed probe set (AI_SEARCH_STRATEGY §4); extend the probe set to Amsterdam and Den Haag as those pages index. Record citations at S4 (an AI assistant cites the page).
- **Conversion event:** worker register completion via `/register?role=worker` from the city page [DATA: confirm PostHog event name at implementation].
- **Rank caveat:** every city-tail volume/position figure stays an estimate until the Keyword-Planner/rank-tracker pass (KEYWORD_DATABASE Δ10; QUALITY_AND_RISKS verdict).

## Field 16 — Editorial sign-off + review cycle

- **Sign-off:** one logged sign-off **per (profession, city)** in the allowlist config (Δ4.4 + M-N4). Draft: dutch-content. Sign-off: CTO (or the content owner the CTO appoints). The sign-off binds the PART B city block verbatim — text-only edits within its scope are re-signed (small-claim edits re-check the block's sources; the block is never silently edited).
- **Review cycle:** 90-day default per city page (hub Field 16 cadence) — incl. re-check that the city block's local claims still hold and that the block has not drifted toward a template default.
- **Launch cap:** ≤10 indexed city pages per profession per quarter (Δ4 safeguard) — the three seeds all fit inside the first cap.

---

# PART B — Seed-city editorial briefs (each signed per (elektricien, city))

Instructions for the writer of each block: 150–250 woorden, echte lokale markt­kennis, geen nummers uit andere bronnen gekopieerd (nummers komen uitsluitend uit de data­module), geen garantie-uitingen, geen werk­gevers­namen zonder verificatie in de sign-off. Every factual claim that this agent cannot source today is marked. Each block below is an **editorial brief** — the signed page copy follows from it; the brief's claims list is the verification unit.

---

## B1 — Amsterdam (`/market/elektricien/amsterdam`)

**City-unique block brief (target 150–250 woorden op de pagina):**

Amsterdam als werkgebied voor elektriciens wordt grotendeels bepaald door de nieuwbouw- en utiliteitsmarkt: kantoorclusters (Zuidas is de klassieke referentie), woningnieuwbouw-programma's en renovatie in de bestaande bouw, en een sterke segment van facilitair/onderhoudswerk in een dichte dienstensector. De vraag uit de utiliteitsbouw (installatiebedrijven aan grotere projecten zoals kantoortorens, scholen en ziekenhuizen) verschilt daar wezenlijk van de woningsbouwaanpak in kleinere steden: meer projectmatig werk, grotere teams, vaker in dienstverband of met inleenconstructies. Daarnaast zijn datacentra een kenmerkend Amsterdamse werkgeverscategorie voor elektrotechnisch personeel — een segment met eigen eisen (o.a. hoogspannings-/middenspannings­ervaring) en zijn eigen arbeidsmarkt­dynamiek. [DRAFT — needs local-knowledge verification: relatieve omvang nieuwbouw vs renovatie; rol van datacenter­werkgevers; typische cao/inlenersamenstelling per segment]

Netbeheerder-context: Liander exploiteert het net in het grootste deel van Noord-Holland, met directe netten­functies in Amsterdam regio. [DRAFT — needs local-knowledge verification: Liander's exact service area incl. Amsterdam; extent of netbeheerder-demand as a share of the local electrician market — the "beste werkgever"-evidence in KEYWORD_DATABASE Δ5 (Alliander among top-rated netbeheer employers) supports the segment's relevance, not its local size.]

Waarom het cijfer in Amsterdam kan verschillen: dit blok legt de mechanismen uit die het lokale uurloon drijven (project­gedreven utiliteit, datacenter­segment, dichtheid van werk­gevers), en verwijst voor het cijfer zelf naar de data­module erboven — het blok beweert nooit zelf een tarief.

**Verification list before sign-off:** bronnen voor (a) nieuwbouw/utiliteit-dominantie, (b) datacenter-segment (AMDC/Van Lange-style operator references only if individually verified — default: no employer names), (c) Liander-servicarea (Liander's own site, checked at sign-off date).

---

## B2 — Rotterdam (`/market/elektricien/rotterdam`)

**City-unique block brief (target 150–250 woorden op de pagina):**

Rotterdam ontleent de helft van zijn electrotechnische werkgeversveld aan de haven‑ en maritieme wereld — anders dan in de meeste Nederlandse steden: scheepsbouw, scheepsreparatie, haven­logistiek, en industriële terminals, met een aandeel 24/7- en industriële elektrotechniek dat je in het binnenland niet in die vorm vindt. De monteur­vocabulaire loopt mee: "elektromonteur industrie" is de gecontroleerde term voor het industriële segment (KEYWORD_DATABASE Δ5.2: NL zegt "elektricien/elektromonteur industrie", niet "industrieel elektricien" — die vorm is Belgisch-dominant), en de Middenspanning-familie (monteur middenspanning, eerste monteur middenspanningsdistributie) hoort in een haven­profiel thuis vanwege industriële netten. [DRAFT — needs local-knowledge verification: exact rol van haventerminals en scheepsreparatie-bedarven in de lokale vraag; typische ploegen­/zwaarte­profiel; netbeheerder Stedin's HQ-regio claim — verify before any statement about Stedin's Rotterdam presence.]

De haven­context betekent ook dat tarief­mechanismen variëren dat anders dan in de woningsbouw: industriële toelagen, onregelmatigheids­toelagen en ploeg­werk bepalen mede wat een werk­gever realistisch biedt — precies de mechanismen die de lokale data­module (Field 6, item 1) laat zien en het blok dus niet zelf benoemt in cijfers.

**Verification list before sign-off:** (a) haven/maritiem elektrotechniek demand share from a citable source (Port of Rotterdam reports, industry publications — cite with date), (b) "elektromonteur industrie" Rotterdam-terminology check against live NL vacancy titles (the Δ5.2 evidence was live titles from Moerdijk/Botlek — Rotterdam-proper needs its own check), (c) Stedin service-area/HQ claim (Stedin's own site, at sign-off date).

---

## B3 — Den Haag (`/market/elektricien/s-gravenhage`)

**City-unique block brief (target 150–250 woorden op de pagina):**

Den Haag onderscheidt zich van Amsterdam en Rotterdam doordat de overheid als werkgever (Rijks­gebouwen­dienst-bewaakte kantoren, provinciehuis, gemeentelijk vastgoed, internationale organisaties) een deel van de utiliteits­vraag drijft, plus de aanwezigheid van de netbeheerder­-nabij sector: het netbeheerder­-landschap (Stedin/Liander/Enexis/TenneT als de in het trefwoord­onderzoek geverifieerde top-werkgever­merken voor elektrotechnici — KEYWORD_DATABASE Δ5.5) onderhoudt­ in het Zuid-Hollandse profiel direct netten­functies rond Den Haag; de vraag daar is vaker middenspannings- en distributie­gerelateerd dan in de wonings­bouw-blokken. [DRAFT — needs local-knowledge verification: (a) extent of government-buildings demand for electricians in Den Haag (Rijksvastgoedbedrijf outsourcing model — the sector's actual hiring channel), (b) which netbeheerder serves Den Haag's local grid (Stedin vs Liander service boundary — verify on the operators' own sites), (c) whether international-organisation demand for electricians exists at all as a segment worth naming.]

Overheden inkopen installatiewerk anders dan commerciële partijen — vaker via aanbestedingen en vaste kaders — wat een ander tarief­mechanisme betekent dan het projectgebonden Amsterdams. Het blok legt dit mechanisme uit en verwijst voor de cijfers naar de data­module.

**Verification list before sign-off:** (a) Rijksvastgoed-/overheidsvastgoed-hiring channel, (b) netbeheerder service boundary (Stedin/Liander sites, at sign-off date), (c) internationale-organisaties segment (accept-or-drop: if not verifiable, the block omits it and notes the omission in the sign-off).

---

**Cross-city rule:** each block is written once, for its city, with its own verification list and sign-off. Blocks never share paragraphs; "city-unique" means the sign-off covers the text as city-specific, so copying a sentence between cities voids the sign-off and the ≥40% city-unique body requirement.

---

## Appendix — CTO asks carried by this template

1. **M-N4 ticket (allowlist + sign-off flag + 404↔200 gate)** before any L2 city build — this template depends on it.
2. **F-N1 geo import** (Region coordinates) or an explicit Place-without-geo decision, within the Q12 package.
3. **Q12's ≥2-employer condition** — droppable with a logged note; confirm feasibility of the aggregation query or log the drop.
4. **Region.slug verification** for `s-gravenhage` vs alternates before first city build (Field 1 placeholder).
5. **insights-architecture.md one-line note** (Q11): the planned per-city insight salary slugs are superseded — city+salary belongs to this family; insights do not publish per-city salary articles.
