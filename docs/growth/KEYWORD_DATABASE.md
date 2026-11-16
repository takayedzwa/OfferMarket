# KEYWORD_DATABASE

**Version:** v2 (v1 + Δ addendum, 2026-11-05)
**Author:** seo-intelligence — consolidated by CEO
**Date of research:** 2026-11-05
**Status:** RESEARCH — clusters are inputs to URL_ARCHITECTURE.md; no pages built

## Data-limitation preamble (authoritative for this document)
- **No measured search volume.** No keyword tool is connected. Every "volume tier" below is an estimate derived from Google autocomplete footprint (suggestqueries.google.com, queried 2026-11-05, hl=nl), SERP competitor density, and variant-suggestion counts. Tier = qualitative ranking, not a number.
- Autocomplete output was geo-skewed toward Belgium (VDAB, Antwerpen, Gent, West-Vlaanderen); only NL-relevant terms were kept. Belgian demand exists but is out of scope.
- SERP observations come from the research agent's web-search tool — directional, verified per-URL where cited; NOT identical to live Google.nl SERPs (e.g. Indeed likely under-represents). Confirm with a rank tracker before acting on rank-sensitive choices.
- Unverifiable claims are flagged **ASSUMPTION** + cheapest test.

# 1. Keyword clusters

## Cluster A — Generic vacancy / job listing (WORKER intent) — HIGH (est.), competition VERY HIGH
vacature elektricien; elektricien vacatures; vacature elektricien zonder ervaring / met opleiding / zzp; + city/province variants (vacature elektricien amsterdam/rotterdam/den haag; "elektricien vacatures limburg").
Evidence: rich autocomplete variants incl. zzp, zonder ervaring, almere, den haag, arnhem (2026-11-05); SERP dominated by job boards — Nationale Vacaturebank (/vacatures/functie/elektricien, 208 vacancies), Indeed, Techniekwerkt (609 electrician vacancies), Intermediair.
Verdict: **do not chase the head** (job boards with thousands of fresh vacancy pages); worker-side marketplace landing + long-tail variants only.
⚠ **Structural gap flagged to the architect:** `/offers/*` is robots-disallowed (`apps/web/src/app/robots.ts:17`) — OfferMarket's live offers cannot rank while every competitor's vacancy detail pages do. *Single biggest structural visibility gap.*

## Cluster B — "Gezocht / gevraagd / urgent demand" (MIXED intent — **keyword trap**) — HIGH head (est.), underaanneming modifier MID
elektricien gezocht; elektricien gezocht zzp; elektricien gezocht **onderaanneming** (subcontracting — genuine B2B signal); elektricien gezocht [city]; elektricien gevraagd.
Trap: "elektricien gezocht **spoed**" is CONSUMER emergency-repair intent — same head keyword, opposite audience. Do not blend.
Competitor: elektriciensgezocht.nl exact-match domain, thin single lead-gen page, no blog.
Content: employer-side marketplace landing + "hire ZZP/subcontractor" explainer; never consumer-emergency framing.

## Cluster C — ZZP electrician (WORKER intent — **OfferMarket's sweet spot**) — HIGH (est.), competition MEDIUM
zzp elektricien; zzp elektricien gezocht; zzp elektricien salaris/tarief/uurloon; opdrachten; woningbouw/utiliteit; [city].
Evidence: richest autocomplete set of any seed (9 NL variants incl. woningbouw, utiliteit, 2026-11-05); ZZP rates €40–90+/uur by specialism (zakelijkvooruit.nl 2026 salary/ZZP guide; Indeed carriergids). SERP: conversion-only platform homepages (Techers, Tech Matchers, YouLinked, Hollandworx, FixThatNow), almost no informational content.
Differentiator: **proprietary rate data**. Winnable in months, not years — no incumbent informational authority.

## Cluster D — Salary intelligence (WORKER intent — **data-moat cluster**) — HIGH (est.); head HIGH competition, per-specialism MID
elektricien salaris (+ zzp/netto/per uur/per maand/hbo); salaris elektromonteur; installatiemonteur/servicemonteur/paneelbouwer salaris; werkvoorbereider elektrotechniek salaris; + city variants (Indeed runs city salary pages, e.g. nl.indeed.com/career/elektricien/salaries/Rotterdam, 1.3k reports).
Incumbents: Nationale Vacaturebank /salaris/elektricen (€3.459/mo, 2026), Intermediair (same template), Indeed carriergids (€3.272/mo; starters €2.300–2.700, 5+ yrs €3.500–4.500) — all self-reported samples; **none holds structured offer-data benchmarks**. OfferMarket's OfferVersion data is the moat.
Strategy: win the per-specialism/per-city tail first, converge on the head later. `/insights/category/salary` already reserved for this cluster.

## Cluster E — Employer-side hiring (EMPLOYER intent — **highest commercial value per visitor**) — MID core + long-tail
elektricien inhuren (+ kosten); uitzendbureau elektricien / elektrotechniek / techniek [city] (autocomplete city-loaded: rotterdam, groningen, nijmegen, eindhoven, deventer, heerenveen…); technisch personeel inhuren; elektriciens werven; vacature elektricien plaatsen.
Evidence: "elektricien inhuren" autocomplete = exactly ["elektricien inhuren kosten"] — thin footprint = LOW volume (est.) but **pure purchase intent**. SERP: staffing firms with templated shallow pages (MAATT — thin/boilerplate, no salary data, no case studies; PIT — only player publishing hourly rate bands: starter €15-18 → projectleider €32-45; JJM Personeel, Talent4s/Electric4s, FlexHero).
Gap: **cost-comparison content** — nobody answers structured pricing for hiring/posting vacancies. ASSUMPTION (volume unmeasured): cheapest test = run the 5 core employer queries in Keyword Planner/Ads for a week before committing content.

## Cluster F — Certifications & regulatory info (WORKER intent, authority layer) — MID, competition MEDIUM
VCA certificaat (kosten/halen/betekenis); NEN 3140 (cursus, VP, VOP, keuring, geldigheid); NEN 1010; werken op of naast spanning; cao technisch installatiebedrijf (2026 wage data: 3% per 1-3-2026, €132 uitkering nov 2026, €115/maand per 3-2027 — verified in salary research 2026-11-05); BEI-certificaat (seen on live vacancy, 2026-11-05).
Note: sector **jargon** — supporting content only, never primary landing pages. Rich autocomplete for both seeds (10 variants each).
Content: explainers + "which certificates raise your rate" data piece (nobody covers the data angle).

## Cluster G — Career / education funnel (WORKER, top of funnel) — HIGH head (est.); MID-HIGH competition
elektricien worden (+ zonder opleiding / omscholen / op latere leeftijd); elektricien opleiding (avond/bbl/mbo); elektromonteur opleiding (bbl, niveau 3/4); installatiemonteur worden.
Evidence: rich autocomplete 2026-11-05; career-switch ("omscholen") signal aligns with UWV omscholing/zij-instroom programme (UWV Kansrijke Beroepen 2026-2027, checked 2026-11-05). Education providers (ROC/SBB) occupy SERP. **Defer** until P1–P4 content exists; aspirational traffic is far from offer-ready. Launch-strategy.md already names "how to become electrician NL" as an SEO target (docs/business/launch-strategy.md:212-214).

## Cluster H — Role-term hubs (WORKER + EMPLOYER; **the defensible long tail**)
Role terms with verified independent autocomplete footprints (each 2026-11-05): **elektromonteur** (everyday term), **installatiemonteur**, **servicemonteur** (+elektrotechniek), **paneelbouwer** (niche; city/geographic-specific: breda, hengelo, friesland), **werkvoorbereider elektrotechniek** (niche; incl. equans, zeeland). Each supports the modifier set {vacature, salaris, zzp, opleiding, city}. Plus specialism modifiers from market copy: monteur laag-/middenspanning, storingsmonteur.
**Energy-transition sub-cluster — ASSUMPTION:** laadpaal installateur, zonnepaneel monteur, warmtepomp installateur — visible in vacancy copy (GOG Group, UWV klimaatbanen) but demand NOT verified. Cheapest test: Keyword Planner + "opdrachten" modifier.
High-value new-content category (per-role hub pages: definition + salary + demand + certifications); hub model proven in this SERP niche (koel-monteur.nl, voort.com/vacatures/installatietechniek).

## Cluster I — Demand / market intelligence (EMPLOYER intent, brandable) — long-tail, high PR value
tekort elektriciens; vacature elektricien moeilijk te vervullen; salaris benchmark installatietechniek; arbeidsmarkt installatietechniek 2026.
Evidence: UWV lists elektriciens/installateurs as "kansrijk" (2026-2027); UWV klimaatbanen Q1 2026: ~87,350 climate/energy vacancies vs ~23,270 jobseekers (uwv.nl, checked 2026-11-05). Powers the existing insights/demand category + quarterly market report.

## NOT recommended now
Consumer "spoed elektricien" (wrong customer); vacancy head terms vs job boards (unwinnable pre-supply, and offer pages are robots-disallowed); Belgian geo-modifiers (out of scope).

## ⚑ Cannibalisation rule (feeds architect + content)
- The ONLY already-foreseeable cannibalisation pair: **"elektricien salaris"** — Cluster D must stay the exclusive territory of `/insights` (category salary + salary articles); role/city hub pages own role+city+vacature intents; insights own data/benchmark/career-guide intents. Never two "elektricien salaris" pages.
- Current cannibalisation: effectively none (3 seeded meta articles target no keyword), BUT the insights architecture doc already plans keyword-shaped slugs (electrician-salary-rotterdam etc., docs/insights/insights-architecture.md:285-286) — keep those within the D-cluster rule.
- Today's seeded articles: "why-offermarket-insights-exists", "how-offermarket-salary-data-is-built", "reading-offermarket-insights-data-clr" (apps/api/src/prisma/seed.ts:136-160).

## Measured-volume follow-ups (replaces every estimate above)
Run Keyword Planner / Rank tracker on the ~25 head keywords of clusters A–E; confirm live Google.nl SERP positions for "elektricien salaris" + "elektricien gezocht"; verify energy-transition sub-cluster demand.

---

# Δ ADDEDUM v2 (seo-intelligence, 2026-11-05 — reconciles CTO brief v2; all evidence re-dated 2026-11-05)

## Δ1. Brief queries mapped (worker side)
- elektromonteur gezocht → **B definition widened role-symmetric** ("elektromonteur gezocht zzp" verified).
- elektromonteur vacatures Rotterdam → A role+city tail; **strongest city-tail autocomplete of any role seed** — "elektromonteur vacatures" = 10 NL variants (zuid limburg, amsterdam, groningen, nijmegen, zzp, zeeland, rotterdam, friesland, den haag).
- "werk zoeken als elektricien", "nieuwe baan als elektricien", "andere baan als elektromonteur", "werk voor ervaren elektriciens" → **new Cluster J proposal (worker switch-moment)** — thin autocomplete but distinct intent: *currently-employed evaluation*, not aspirational top-of-funnel (do NOT merge into G). Low volume (est.), near-zero competition, feeds C and H.
- "beste werkgever voor elektriciens" → **Cluster K candidate (employer evaluation)** — thin autocomplete, but SERP gap: only ranking content is voorelektromonteurs.nl's 2023 Glassdoor/Indeed-derived top-5 (netbeheerders dominate) + a generic Matika article. Nothing fresher, nothing data-driven.
- "wat verdient een elektromonteur" → D, richer than v1 assumed: 10 variants (netto, zzp, niveau 2/3/4, per uur, gemiddeld, **leidinggevende, leerling**).
- "zzp elektricien opdrachten" → C confirmed (opdrachten in the verified 10-variant zzp set).

## Δ2. Employer side: cluster E is two-layered
Every conversational employer query from the brief ("voor mijn bedrijf", "waar vind ik goede…", "personeel elektrotechniek vinden", "tekort oplossen", "passieve kandidaten…") returns **zero or self-only suggestions** (2026-11-05). E's volume layer = the short city-loaded heads (verified v1); a **conversational layer** exists with pure purchase intent but no autocomplete echo — exactly the phrasing used with AI assistants. **New E rule: pages rank on the short heads and must answer the conversational forms in content** ("voor mijn bedrijf", "waar vind ik", "oplossen"). Extra form found: question-form "is er een tekort aan elektriciens" (→ I×E).

## Δ3. New trap in this batch
"elektricien gezocht zzp" / "zzp elektricien gezocht" is **dual-audience** — same string = worker looking for opdrachten AND employer looking for a zzp'er (Proton Group publishes a zzp-elektricien-gezocht employer page, verified 2026-11-05). Rule: role+zzp+gezocht pages need an explicit dual-CTA split (worker: "zie opdrachten" / employer: "plaats een vraag"), or intent bleeds. ("tekort aan elektriciens oplossen" is NOT the trap — clean employer intent, I×E.)

## Δ4. Passive-candidate intent — evidence-based
- Verified practitioner vocabulary/claims (technischrecruitment.nl, wervingtechnischpersoneel.nl, Elvatix, Ventas, Profile Group; 2026-11-05): "latent zoekende" vs passief; strong technicians rarely apply; scarcer vakman → lower ad-response; switch moments (reorganisatie, verhuizing, projectafronding, gezinsuitbreiding); offer must beat the *current* job; pipeline 6–12 weeks + notice; **specialist fee benchmark 20–25% no cure no pay; LinkedIn = passive channel, Indeed = active** (Elvatix). This gives E a citable cost/time metric it lacked.
- The worker side isn't the word "passief" — it's **switch-moment phrasing** (Cluster J). A passive monteur who tips into searching uses the *situation* form. Autocomplete thinness = low frequency, high conversion if the page recognises the moment ("overstappen zonder te solliciteren").
- **Unoccupied slot:** every recruitment content site answers *how employers reach passive candidates* (with fees); **nobody answers how a passive monteur explores options without applying** — OfferMarket's exact mechanic; job boards structurally cannot (their page demands an application; ours doesn't).
- Worker page framing: switch-moment recognition + "vergelijk je huidige baan met wat je waard bent" with D-cluster data as proof. Employer framing: "bereik monteurs die niet op vacatures reageren" + fee/pipeline counterweight (20–25%, 6–12 weeks).

## Δ5. Segment terminology (evidence-based; unverified = ASSUMPTION)
1. Installation companies: self-terminology "installatiebedrijf/installatiemonteur/installatietechniek"; speak in *werk* terms (woningbouw/utiliteit verified).
2. **Industrial — terminology correction:** NL says **"elektricien industrie" / "elektromonteur industrie"**, NOT "industrieel elektricien" (that SERP is Belgian-dominant, incl. its salaris variant). Live titles: Elektromonteur Industrie (Renewi Moerdijk €3.400–4.250), Electrician dagdienst (Almatis Botlek €2.977–4.334), Hoofdmonteur Elektrotechniek (TES, NEN 3140/STIPEL), Monteur Middenspanning Industrie (BAM).
3. Construction: "zzp elektricien woningbouw" (v1); platform adjacency BouwZZPers (requires KvK/BTW/VCA-VOL).
4. **Infrastructure — verified family "monteur middenspanning": 10 variants** incl. middenspanningsdistributie, salaris, vacatures, zzp, **eerste monteur middenspanningsdistributie, leerling monteur** — netbeheer career-ladder vocabulary; new H-modifier set {laagspanning, middenspanning, distributie, eerste/leerling}.
5. Energy/netbeheerders: employer brands dominate "beste werkgever" (Alliander 4.12, Enexis, TenneT, Stedin); citation/conversation targets, not commercial competitors; their vocabulary = middenspanning family.
6. **Solar — correction:** live term is **"zonnepanelen monteur"** (plural), NOT "zonnepaneel installateur". Verified: "zonnepanelen monteur gezocht" → + zzp variant; live ZZP market: Maatt /zzp/opdrachten/zonnepanelen-monteur, Sunneroo (~€350/day aanneemsom), ZZP Klus €30–40/uur, Vakwerkplatform €40–65/uur, Freelapp/Hoofdkraan (HeraVolt €1.000–2.000/project).
7. **Charging — biggest upgrade:** "laadpaal monteur" autocomplete = **10 variants** (zzp ×3 incl. "zzp uurtarief", vacature, opleiding, cursus, worden, gezocht, almere). Use "laadpaal monteur", never "laadpaal installateur" ("laadpaal installateur vacatures" → self-only).
8. Staffing agencies: price anchors now citable — platforms charge **9–9.75% per hour** (Vakwerkplatform 9%, Lance Free 9.75%/7.5%), Bndle €7.95/mo zzp-side.
9. Recruitment companies: vocabulary "passieve kandidaten/direct search", fee 20–25% no cure no pay; their content sites are the first evidenced *employer-informational* competitors beyond staffing conversion pages.
10. Maintenance: verified rich family **"service- en onderhoudsmonteur"** (opleiding, salaris, vacature, cv); "storingsmonteer" rate evidence: allround storingsmonteur €61–70/uur (BlueBeaver live assignments).

## Δ6. Job-title matrix corrections (cluster H)
Per title × {vacatures, salaris, zzp, opleiding, city} — strongest: **elektromonteur × {salaris + vacatures-city-tail}** (footprint rivals the elektricien head, SERP weaker). The brief's Dutch family is really: elektromonteur · service- en onderhoudsmonteur · monteur middenspanning · laadpaal monteur · zonnepanelen monteur. "Industrieel elektricien" and "service monteur elektrotechniek" are NOT strong Dutch hubs — industrial hub built on "elektromonteur industrie", maintenance on "service- en onderhoudsmonteur".
- **Cluster D sequence sharpened:** enter via the *question-form* family ("wat verdient een elektromonteur" + netto/zzp/per uur/leerling/leidinggevende): SERP materially weaker than the elektricien salaris head — Intermediair €3.515 (band 3.065–3.965), vnom/Manpower blogs, **mijntechcarriere.nl (small domain with CAO TIB scale A–J €2.422–5.292, 3% per 3-2026 + €115/mo per 3-2027 — corroborates v1 CAO data)**, wr.nl Salarisgids €3.300. No Indeed/NVB retrieved. Small data-carrying domains rank → winnable materially earlier than the head.
- **Cannibalisation rule addition:** "wat verdient een X" and "X salaris" are both D-cluster/insights — one page per role, never two.
- BE-skew rule tightened: check variant-by-variant, not seed-by-seed (some high-footprint seeds are Belgian demand inside NL queries).

## Δ7. Competitor check: Werkzoeken.nl & Jobbird — both verified, both generic Tier 1
- **Werkzoeken.nl** (Vacatures Online B.V.): ~246k vacancies claim, /vacatures-voor/elektromonteur/ aggregator with live listings (Industrie €3.100–4.000, leerling €2.442–2.957, 5-ploegendienst Amsterdam €3.751–5.181).
- **Jobbird**: NL/DE/UK, ~133k NL vacancies; **/nl/beroepsgroep/bouw/elektricien = 324 vacancies**; beroepengids salary €2.350–2.800.
- Verdict: reinforce cluster-A-head verdict (two more domains with hundreds of fresh electrician listings) + two more self-report salary pages to the D incumbent list. Neither threatens C/E/H. (Utopik/Dua/Arvo remain unverifiable and stay excluded.)
- **Incidental new Tier 3 additions (verified live):** BlueBeaver (assignment pages with rates: elektromonteur €46–50/uur, storingsmonteur €61–70/uur), ConnectZZP, BouwZZPers, Bndle (€7.95/mo zzp subscription), Lance Free (25k+ freelancers, 9.75%/7.5% margin), Vakwerkplatform (9% margin). Plus informational/E-comps: technischrecruitment.nl, wervingtechnischpersoneel.nl, voorelektromonteurs.nl, mijntechcarriere.nl; niche boards elektrobanen.nl (€290/vacancy) and installatietotaal.nl (€250/vacancy, ~21k newsletter).
- **Correction to v1 gap 2:** vacancy-posting pricing IS published (€250–425/vacancy, Indeed CPC). The still-unoccupied gap is **offer-level hourly-rate data + placement-cost comparison against those published prices** — reframe cost-content accordingly.

## Δ8. The `/vacatures` head question — evidence assessment (input to architect's Δ2 ruling)
1. Head volume comes from **inventory**: every ranking example (Jobbird 324, Werkzoeken aggregator, Synsel/AXS/Alstom/Eminent individual vacancy URLs) has real fresh listings behind it; ingredients = inventory depth + fresh role×city pages.
2. What a reverse marketplace could legitimately carry: (a) live marketplace demand/supply where indexable — but `/offers/*` is robots-disallowed (the v1-flagged structural gap; untangling that is a *prerequisite* for any vacancy-type URL to rank); (b) the unique data layer (rates per role×city, certificate-requirement distributions — job boards have none); (c) H/D supporting content. A role×vacature page with neither listings nor unique data is the thin-landing pattern (cautionary example: elektriciensgezocht.nl).
3. Staged recommendation in evidence terms — build nothing now; the decision runs on two verifiable triggers: (a) offers become indexable, (b) enough live offers per role×city to fill a role-vacature index page. Until then the intent is served by role hubs + salary data pages (C/D/H), which compete in demonstrably weaker SERPs. *(Consistent with marketplace-architect Δ2: do-not-build now, documented reversal triggers.)*

## Δ9. Corrections to v1 verdicts (summary)
1. Energy-transition sub-cluster: ASSUMPTION → **partially verified, with corrected terms** (laadpaal monteur ✓ 10 variants; zonnepanelen monteur gezocht ✓; warmtepomp installateur still unverified).
2. Cluster D sequence: question-form family + elektromonteur matrix first (weaker SERP), head later.
3. Cluster A verdict **strengthened** (Werkzoeken + Jobbird add hundreds of listings).
4. Cluster B widened role-symmetric + dual-audience zzp+gezocht trap rule (Δ3).
5. Cluster H terminology corrections (Δ6) + Belgium rule per-variant (Δ6).
6. E-gap narrowed: posting prices published; unoccupied gap = offer-level rates + placement-cost comparison (Δ7).
7. E two-layered (Δ2). 8. Unchanged: spoed trap, Belgian geo out of scope, single-page wat-verdient/X-salaris rule, per-role hub model (koel-monteur re-verified live).

## Δ10. Planner pass scope (replaces v1 follow-up list)
Keyword Planner test set now: cluster E short heads (uitzendbureau elektricien [city], inhuren kosten) + conversational layer sample + energy-transition family {laadpaal monteur, zonnepanelen monteur, monteur middenspanning} × {gezocht, zzp} + "industrieel elektricien" vs "elektricien industrie" volume check + Cluster J/K candidates.
