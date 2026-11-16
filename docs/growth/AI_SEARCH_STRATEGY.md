# AI_SEARCH_STRATEGY

**Version:** v2 (v1 + Δ annex D2, 2026-11-05)
**Author:** ai-search-geo — consolidated by CEO
**Date of research:** 2026-11-05
**Status:** RESEARCH — not approved, not implemented
**Evidence convention:** VERIFIED (checked 2026-11-05: live web probes, repo reads, published research) vs SPECULATION (labelled, with cheap test)

## Headline finding
OfferMarket (the NL reverse-talent marketplace) is currently **invisible in web/AI search in every probed context — and the name is occupied by an unrelated US company**.

## 1. Current visibility assessment

### Brand collision — VERIFIED
- `"offermarket"`, `"offermarket platform elektricien"`, `"offermarket.eu"` → **zero results for offermarket.eu**. The name is owned by [offermarket.us](https://www.offermarket.us/) — US Baltimore real-estate-investing platform (DSCR loans, founded 2020, ~25k members, $150M+ funded), strong footprint (LinkedIn, CB Insights, PitchBook, trade press). Secondary collision: offermarket.gr (Greek retail offers).
- offermarket.us already describes a public "DSCR Quote API for developers/AI agents" — an AI-oriented OfferMarket likely occupies model memory. **SPECULATION:** the NL OfferMarket risks inheriting zero brand association or mis-attribution. *Cheap test:* manually ask ChatGPT/Perplexity "what is OfferMarket" and record which entities surface.
- `"reverse talent marketplace"` (OfferMarket's exact H1 positioning) → Zagg (AU), TalentBid, SmartHire — not offermarket.eu.

### Category SERPs — VERIFIED
Not surfaced on any of:
- "beste platform om een elektricien te vinden" → Werkspot, elektriciensbijmij.nl, Techniek Nederland's vind-een-vakman, FixThatNow, Trustoo.
- "elektricien inhuren zzp" → Techers, Lance Free, YouLinked, SkilledContractors, FixThatNow.be.
- Anonymous/salary-transparency model → **Qpromo (qpromo.nl)** — near-identical model (anonymous profiles, employer-pays, mandatory salary in offers, KvK-based employer blocklist) — and JobQ; internationally Discreet.so. **Qpromo is the NL incumbent of the model segment = the co-occurrence/comparison target, not Werkspot.**

### Technical/SEO surface — VERIFIED (live fetches + repo)
- Both domains live (HTTP 200; eu→EN, nl→NL per `apps/web/src/i18n/routing.ts`).
- robots.txt allows all AI crawlers implicitly (no AI-crawler-specific rules) — current posture effectively permissive.
- Live sitemap: 9 URLs, **zero insight articles** (prod has no published articles; /insights shows empty list).
- JSON-LD only on insight articles: `NewsArticle` with publisher **"Offermarket"** (single word — brand inconsistency; correct form is "OfferMarket"). No site-wide Organization/WebSite JSON-LD, no sameAs, no OG image, no canonical/hreflang between the two domain locales (layout sets only title/description).
- Meta-description discrepancy: layout code emits one (`common.site.description`) but homepage fetch showed none visible — needs a `curl` check (open question 2).
- **No llms.txt** in repo or live site.

### Entity footprint — VERIFIED
- Wikidata "OfferMarket" → 0 results. No Wikipedia presence.
- KvK/Dutch registries/directories/review platforms: nothing surfaced (all results = US firm). Legal entity exists (KvK number appears in homepage example) but is not represented anywhere crawlable found by probes.

## 2. Entity strategy (prioritised)

**P0 — brand disambiguation & indexability (cheap, evidence-backed):**
1. Enforce canonical written name **"OfferMarket"** everywhere; fix JSON-LD publisher "Offermarket" on insight pages. Every reference co-anchors to the niche: "OfferMarket — reverse talent marketplace voor elektriciens (offermarket.eu)". Co-occurrence is the primary lever against the offermarket.us collision (web + LLM retrieval both use it).
2. Site-wide **Organization JSON-LD** (name, url, logo, legalName, KvK as `identifier`, address, `sameAs` once created).
3. **hreflang/canonical alternates + per-domain metadataBase** between offermarket.eu and offermarket.nl.
4. **Build real indexed surface:** publish first insight articles (engine + CMS + NewsArticle JSON-LD already exist) and add market pages to the sitemap.

**P1 — entity consolidation:** LinkedIn company page (NL entity) with a consistent one-line description; KvK imprint/legal info on site; 2–3 independent Dutch trade/HR press mentions (Emerce, Sprout, Techniek Nederland/InstallQ ecosystem) — **prerequisite for Wikidata**; skip Wikidata until independent reliable sources exist.

**P2 — co-occurrence & comparison:** earn entries in roundups for the anonymous-application model segment (Qpromo, JobQ) and reverse/anonymous-hiring discourse; Werkspot only as generic "alternatives" mention.

**P3 — monitoring:** offermarket.us "AI agents API" presence; quarterly re-check for brand conflation in AI surfaces.

## 3. Machine-readable public data proposal

### Already exist (VERIFIED)
- `apps/api/src/modules/insights/market-aggregation.service.ts` computes salary percentiles (p25/p50/p75), benefit prevalence, acceptance stats from real submitted offers — **gated by admin-configurable sample-size thresholds** (`InsightsConfigService`), each output carrying provenance (methodVersion, period, sample sizes, computedAt, effective thresholds), persisted per (profession, region, day). Unusually clean foundation for public data.
- Public API reads exist: `/insights/market/preview|overview|employer|trends`, `/professions`, `/professions/groups`, `/skills` (per-route auth decorators NOT verified — cheap unauth curl test outstanding).
- `internal-workers.controller.ts` (AI-acquisition API) is InternalApiKeyGuard-guarded and private — correctly outside any crawlable surface.

### Proposal
(a) Site-wide Organization + WebSite JSON-LD (P0).
(b) **Public aggregate market endpoint** (`GET /insights/market/professions/{slug}` — nearly exists) mirrored as a stable, cacheable, permissive-CORS surface third parties/AI systems can cite, returning exactly what GatedValue allows: sampleSize, percentiles, currency, region coverage, methodVersion, computedAt.
(c) **Indexable content pages per profession/city** — the highest-leverage GEO content: the page AI systems can cite for "what does an electrician earn in Rotterdam" — question OfferMarket is uniquely positioned to answer with offer-grounded data. *(Matches the architect's `/market/*` family.)*
(d) `Dataset`/`DataFeed` JSON-LD on aggregates; RSS for insights.

**JobPosting schema: NOT applicable — by design, not just GDPR.** Reverse marketplace: employer offers are made to individual anonymous workers; there are no public job-listing URLs. Publishing JobPosting would be false signalling. (High-confidence mechanism inference from repo evidence + product model.)

### GDPR constraints
- Only aggregates passing existing sample-size thresholds published (reuse `insights.thresholds`; documented k, e.g. ≥5, chosen at implementation).
- Aggregate-only; small-cell suppression already handled; region/profession granularity only (no city+specialty+experience combos recreating small cells); numbers carry methodology + period.
- No candidate-derived text in any public surface; worker-data modules already excluded from robots.

## 4. Measurement framework
**Probes (monthly):** AI-channel probes by the human (ChatGPT, Perplexity, Gemini, AI Overviews, Claude) on a fixed prompt set in both locales — "beste platform om een elektricien te vinden" / "elektricien inhuren zzp" / "wat verdient een elektricien in Rotterdam?" / "anoniem solliciteren met salaris" / "wat is OfferMarket?" / "reverse talent marketplace" — recording mentions + cited URLs. Automated web-search probes (the §1.2 clusters + `offermarket.eu` + `"reverse talent marketplace"`). Internal signals: Search Console on both domains; PostHog referrers from chatgpt.com/perplexity.ai/gemini (PostHogProvider exists in `apps/web/src/components/analytics/`).
**Success signals, in order:** S1 — offermarket.eu present on the branded SERP (vs US firm) → S2 — ranks ≥1 category query → S3 — ≥2 third-party comparison/press mentions → S4 — ≥1 AI assistant cites offermarket.eu on ≥1 probe → S5 — "OfferMarket" probes return the NL marketplace unprompted.
**Cadence:** monthly probes; quarterly review of crawler policy + llms.txt decision.

## 5. Open questions / unverified claims
1. **Is offermarket.eu indexed by Google at all?** (gates everything; check via Search Console or `site:offermarket.eu`) — CEO to confirm.
2. Homepage meta-description discrepancy — `curl -s https://offermarket.eu | grep -i description`.
3. Auth state of `/insights/*` public routes (guard vs @Public per route) — one unauth curl.
4. Why prod sitemap has zero articles — manual /admin insights check.
5. Do the AI assistants know the NL OfferMarket? — manual probe (also settles §1.1 speculation).
6. Does a LinkedIn/company footprint for the NL entity exist? — CEO knows.
7. LLM-memory effect of the brand collision — speculation, cheap test given.
8. **"Arvo" (from the brief) does not exist as an electrician-sector body in the NL** as far as this agent could verify — the plausible intended references are Arbo(wet)/Arboportaal. Verified quality/certification anchors: VCA, NEN 1010/3140, **InstallQ** (surfaced live in SERP probes as the installation-sector quality mark). Strongest citation targets: Techniek Nederland (verified live in SERP), CBS/UWV/RVO/Eurostat (verified as named sources on the live /insights page). CBS StatLine electrician salary series to be confirmed at article-writing step.

## llms.txt policy — VERIFIED, recommendation: skip
Google will not support it (Illyes, July 2025; Mueller compared it to the keywords meta tag, April 2025); OpenAI docs point to robots.txt instead; 300k-domain analysis (Nov 2025) found ~10% adoption and no measurable AI-citation effect. The established practice is a deliberately permissive robots.txt for AI crawlers (already current behaviour) plus citable structured content. Revisit at quarterly review.

---

# Δ ANNEX D2 (ai-search-geo, 2026-11-05 — CTO brief v2 deep-dive; extends v1, does not replace)

## D2.1 The six brief queries — concrete AI-search strategy
**Shared verified mechanism layer:** AI answers cite from content reaching each pipeline: Googlebot → AI Overviews/AI Mode (Google "AI Features and Your Website", fetched 2026-11-05); OAI-SearchBot → ChatGPT search; ChatGPT-User on-demand fetches ("robots.txt rules may not apply", developers.openai.com); PerplexityBot → search results, Perplexity-User ignores robots.txt (docs.perplexity.ai); ClaudeBot/Claude-SearchBot → Claude search, Claude-User honours robots.txt (Anthropic, via Feb-2026 coverage; honours IETF no-AI-training signal since 2026-10-30); Bingbot → Copilot grounding (Bing blog 2026-10-30). **Query fan-out verified for Google** (AIO/AI Mode issue "multiple related searches") — subtopic coverage per page family matters, not just head queries. All "what would be cited today" = SERP-evidence inference, not transcripts; manual ChatGPT/Perplexity/Gemini probes remain the outstanding test (v1 OQ5).

- **Q1 electrician job NL:** plausible cites today = Indeed.nl (1,000+ elektromonteur listings), NVB (208 + salary €2,600–4,500), Elektrobanen.nl, voorelektromonteurs.nl (464 vacancies). **We cannot/should not be the vacancy answer** — citable role is the *market-context* layer: salary levels, demand, qualifications around the listings list. Pages: `/market/elektricien` + `/guide` salary/career articles + `/for-workers`. 90-day: be the *named data source* for pay/demand context; blocked hardest by zero published articles (F13).
- **Q2 companies looking in Rotterdam:** cites today = employer career pages directly (AXS, Oranjegroep, Van Dorp, Spindler — €2,700–3,900/mo) + boards. We have no public employer entities (`/employers/{slug}` is P3 R3-gated). **Worst-fit query.** Page: `/market/elektricien/rotterdam` + a Rotterdam-market insights article to enter the retrieval set; employers pages a later cycle.
- **Q3 employers finding experienced electricians:** cites = staffing agencies (MAATT, HESKO, Konekta, FlexWerk, TecLine…) + RedFix (563+ companies). **Strongest near-term query:** no current retrievable page explains the reverse-marketplace *mechanism* — a "staffing vs vacature-site vs reverse marketplace: hoe vind je elektriciens" comparison article + `/for-employers` can earn a mention slot via 1–2 trade-press mentions.
- **Q4 platforms specialising in electrical professionals:** EN retrieval returns **UK/US niche boards only** — **the "NL electrical-specialist talent platform" slot is empty in English**. 90-day: be *added* to such answers (third-party inclusion); measure via monthly probes.
- **Q5 anonymous exploration of better opportunities:** the product itself. Cites today = **JobQ** (anonymous profile, blocklist, elektricien landing + anonymous-applying blog) and **Qpromo** (beroepen/elektricien + CBS-data salary page €2,950–4,250/mo), solliciteeranoniem.nl secondary. **Single most winnable query** — only 2–3 retrievable NL sources; SPECULATION caveat: years of co-occurrence inertia (cheap test = monthly probe, S2/S4 ladder).
- **Q6 qualified industrial electricians:** "qualified" is answered by *certification language* — our VERIFIED-certs model + `Skill.isCertification`/`certificationBody`/`Specialization.INDUSTRIAL_INSTALLATIONS` can own it. Pages: `/for-employers` verification section + `/guide` verifying-qualifications article (NEN 3140/VCA/InstallQ defined-term content).

## D2.2 Entity ecosystem map (edges → machine-readable locus; Prisma-verified)
1. OfferMarket↔Netherlands → Organization JSON-LD homepage (`addressCountry:"NL"`, legalName, **own** KvK as identifier — "never KvK" rule concerns *employer* kvkNumber only).
2. OfferMarket↔Profession → `Organization.knowsAbout` + `/market/{profession}` `Occupation` (source: Profession.slug/name/aliases via MarketProfessionService).
3. Profession↔Region hierarchy → `/market/{rol}/{stad}` `Place` with **geo from Region.latitude/longitude (already in schema)** + containedInPlace + BreadcrumbList. Zero new data needed.
4. Profession↔MarketSnapshot↔salary → `Occupation.estimatedSalary` (p25/p50/p75 MonetaryAmountDistribution, EUR, gated) + `Dataset` node (aggregation layer already emits GatedValue+provenance).
5. Profession↔Skills → co-occurrence on guides/market + `Occupation.skills`; external: map to **ESCO URIs + Wikidata occupation QIDs (P2, lookup deferred)**; `Skill.parentSkillId` gives a mirable hierarchy.
6. Skill↔Certification → DefinedTerm on guide glossaries (VCA, NEN 1010/3140, InstallQ; fields: isCertification, certificationBody).
7. Worker↔everything → **no public machine-readable locus — deliberately private**; public graph gets only the aggregate shadow (MarketSnapshot) on /market; consented /p would add content-level only (R1/R2 default noindex).
8. Worker↔Employer → AggregateRating on consented+verified `/employers/{slug}` only; acceptance stats stay private.
9. Employer↔Industry → Organization subset `industry/knowsAbout` mapped to IndustryType enum (15 values).
10. Offer↔EmploymentType → content-level columns on /market ("full-time/zzp split"); never offer-level values; optional Dataset.variableMeasured.
11. Cities↔Industries↔demand → Insights auto "related market data" module.
12. OfferMarket↔brand cluster → sameAs/LinkedIn/KvK/press → Wikidata chain (v1 P1 unchanged).
**Key line for the CTO:** the marketplace's moat edges (worker↔skill↔cert↔offer) are deliberately private; the public entity graph is the aggregate shadow of them — every public edge terminates in a gated aggregate or a consented opt-in page.

## D2.3 Schema type evaluation (13 types, against Google's live rich-results gallery, fetched 2026-11-05)
| Type | Eligibility (doc evidence) | Verdict |
|---|---|---|
| Organization | Rich result yes; no required props | **USE** (P0): name, url, logo ≥112px, sameAs, legalName, address, contactPoint, vatID; homepage/about only |
| WebSite | Sitelinks-Search-Box **retired from gallery** (~Nov 2024) | **USE minimally** (name, url, publisher); **no SearchAction** |
| WebPage | No rich result | wrapper only |
| BreadcrumbList | In live gallery | **USE** on all P1+ families |
| JobPosting | Still in gallery — ruling stands for a *product* reason (no public listings; false signalling) | **NOT APPLICABLE** (kept) |
| ProfilePage | In gallery; "primary focus must be a single person/organization **affiliated with the website**"; required mainEntity+name — **"a handle in name is acceptable if that's the only identifier… alternateName fulfills the requirement"** | **DO NOT USE on worker pages for now** — see ruling below |
| Person | limited to identified people | **NOT on worker pages** (kept) |
| Service | no rich result | **CONDITIONAL** optional Service+Offer block on /for-employers, mirroring visible copy |
| Article | In gallery | **USE** (Article/BlogPosting, not NewsArticle, for evergreen pieces — audit accord) |
| DefinedTerm | no rich result; exact paraphrase target for AI definitions | **USE** on /guide glossaries |
| **Occupation** | **estimatedSalary rich result RETIRED** (Google occupation page: "may be a temporary situation", notice ~2025-11-12; gallery absence confirmed) | **CONDITIONAL USE on /market/{rol}**: semantic layer + stay correct if the feature returns; **pair with Dataset as the active surface** |
| Place | generic Place no rich result | **CONDITIONAL USE on /market/{rol}/{stad}** (geo data already in schema) |
| FAQPage | restricted to authoritative government/health sites since Aug 2023 | **DON'T USE**; plain-text Q&A in guides |

**Anonymous-profile ruling (explicit):** schema-wise a handle as name would be *acceptable* to Google (quote above; our pages are website-affiliated) — but **purpose-wise no** (ProfilePage is for first-handed-perspective pages, not employer-discovery cards; meaningful Person wants name/photo, which anonymisation removes, giving ~0 retrieval value) and **policy-wise moot** (/p is default-noindex; Google eligibility requires indexed+snippet-eligible — a noindex page's markup is dead weight). **Keep both v1 rulings. Revisit only if an opt-in public-profile product ships: use ProfilePage with `{name: user-chosen handle, identifier: publicId, description: worker-authored headline}`, zero identity fields — remembering publicId stays personal data under GDPR even pseudonymised (linkage re-identification).**
**Bonus:** "Employer aggregate rating" is a **live rich-result type** (the Glassdoor mechanism) — the one legit structured-data win on R3-gated /employers pages (≥3 published ratings).

## D2.4 Public data feed / API discovery question answered
**Do AI systems consume site APIs?** No verified push mechanism exists — every documented pipeline indexes *web pages* (OAI-SearchBot, PerplexityBot, Bingbot, Googlebot); user-triggered fetchers fetch on demand and may ignore robots.txt. **Verified indirect surface:** `Dataset` markup feeds **Google Dataset Search** (doc fetched; required name + 50–5000-char description; recommended variableMeasured, creator, license, spatialCoverage, isAccessibleForFree) — the only machine-readable feed channel with a named Google surface. Speculation (agents discovering our endpoint unprompted) labelled with cheap test (PostHog/log watch for chatbot referrers).
**Minimal shippable spec:** (1) stable aggregate endpoint on the existing public insights routes — response = exactly the GatedValue payload (sampleSize, percentiles, currency, region coverage, methodVersion, computedAt, threshold config version), `Access-Control-Allow-Origin: *`, long cache + documented revalidate; {region} variant only after city pages land. (2) Indexable docs page `/insights/developers` (EN on .eu, NL on .nl). (3) Dataset JSON-LD on /market pages + docs page with `distribution`→`DataDownload.contentUrl`. (4) Sitemap entries (per-domain per F2/C3 fix). (5) llms.txt skipped (v1). (6) Never expose per-worker data; InternalApiKeyGuard's internal API stays out of the crawl surface.

## D2.5 Bing Copilot + Google AI Mode — current directive state
- **Google:** AIO **and AI Mode** are powered by **Googlebot** ("robots.txt directives for Googlebot is the control"); "You don't need to create new machine readable files, AI text files, or markup"; eligibility = indexed + snippet-eligible. No separate AI-Mode crawler; **blocking Google-Extended would NOT remove us from AI Mode/AIO** (it limits other Gemini systems — no reason to block). Snippet controls (`nosnippet`, `max-snippet`, `data-nosnippet`) explicitly cover AI features (robots-meta doc, updated Mar 2025) — relevant only to private pages we keep out via noindex/robots anyway. **Policy change: none — our permissive posture is exactly what Google prescribes.**
- **Bing/Copilot** (Bing blog, Krishna Madhavan, 2026-10-30): Copilot grounds on Bingbot content; no separate Copilot UA officially documented ("BingCopilot" token = community usage, low-confidence). New dated mechanics: robots.txt token `__usage_ai-training` (default Allow) + page-level `<meta name="Bingbot" content="ai-training:disallow | ai-grounding:disallow | ai-grounding:disallowextended">` (disallowextended limits grounding to "Microsoft-operated experiences… Copilot"); Microsoft honours preferences **from Feb 1, 2027**; NoArchive/NoCache deprecated **Mar 1, 2027**. Defaults=Allow → **no action; we already allow**. `data-nosnippet` support by Bing reported ~Oct 2025 (medium confidence → quarterly review).
- **New measurement signal:** Bing Webmaster Tools **"AI Performance"** report (public preview, Feb 2026) shows Copilot/AI-summary citations per page — add to the monthly probe checklist alongside Search Console + PostHog chat-domain referrers. Quarterly-review log: Anthropic's IETF signal support (since 2026-10-30), Claude-User robots.txt honouring, Occupation gallery status, dataset-search appearance.

## D2.6 Open questions carried forward
1. Manual AI-assistant probes on all six prompts (SERP-derived only so far). 2. Wikidata QID lookups deferred. 3. "BingCopilot" token officialness. 4. Profession.group alias-chain live check. 5. Occupation rich-result status re-check (may return). 6. Sitelinks retirement date not re-confirmed (gallery absence = operative fact).

## Sources (all accessed 2026-11-05)
Google ai-features doc · robots-meta spec · rich-results gallery · Organization/ProfilePage/Dataset/Occupation docs · 2023-08-08 FAQ blog. Bing blogs 2026-10-30 (content choice) + Feb 2026 (AI Performance preview). OpenAI bots doc · Perplexity bots guide · Anthropic crawl doc (via Feb-2026 coverage). SERP probes: NVB, Elektrobanen.nl, voorelektromonteurs.nl, Indeed NL, AXS/Oranjegroep/Van Dorp/Spindler, MAATT/HESKO/Jobxion/Konekta/RedFix/TecLine/FlexWerk/TPS/FADA/AtoZ, JobQ, Qpromo, solliciteeranoniem.nl, UK/US niche boards.
