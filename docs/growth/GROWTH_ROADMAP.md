# GROWTH_ROADMAP

**Version:** v1.1 (v1 + segment-matrix Δ addendum, 2026-11-05)
**Author:** growth-cro — consolidated by CEO
**Date of research:** 2026-11-05
**Status:** PROPOSED experiments — not approved, not run
**KPI note below:** targets and definitions measurable from current server rows; web analytics is consent-gated PostHog with NO product events (only pageviews) — funnel measurement is server-state + ledger based until instrumentation is added (friction F10).

## 1. Current funnel map (as built; evidence file:line)

### Worker (supply)
1. **Home** `apps/web/src/app/[locale]/page.tsx:26-37` — two CTAs; hero copy from `messages/en/common.json` home.hero; **no social proof** (no counts, testimonials, logos) anywhere.
2. **Register** `register/page.tsx:20-23,36-41,57-70` — role toggle, email, optional phone, password, `?ref=CODE` referral pre-seed; **5 GDPR consent blocks (3 mandatory)**, fire-and-forget consent fetches after register response (page.tsx:115-121) that can silently fail.
3. **Email verification** `verify-email/page.tsx:61-88` — mandatory 6-digit OTP; role from localStorage.
4. **Worker profile wizard** `profile/setup/page.tsx` — 4 steps, ~14 fields (availability, experience, notice, trade, skills builder, country/province/city/postal, radius, salary min/max **defaulting €50–70k**, employment types, schedule, industry prefs, career priorities, visibility). Only primaryTrade gates progression (page.tsx:889,899). **Does NOT collect headline, summary, specializations, certifications, languages, driving licence or work authorisation** — those exist only in `profile/edit/page.tsx:248-272`.
5. **Worker dashboard** `dashboard/worker/page.tsx:295-303` — empty state is text-only, **no next action, no visibility stats, no alerts**. Workers can't browse anything by design (reverse model) — demand is push-only.
6. **Acceptance** — view-then-accept (`offers.service.ts:685-691`); accept → OfferStatus.ACCEPTED → **€499 introduction invoice auto-created** (`createIntroductionInvoice`, offers.service.ts:739-740; `introduction_fee_cents: 49900` in `billing.service.ts:9`).

### Employer (demand)
1. Home → `/register?role=employer` → **companyName + kvkNumber required at signup** (`register/page.tsx:129-132,353-366`) — identity friction before any value shown.
2. Email verification → 3-step company profile (`profile/setup-employer/page.tsx`, validation :85-103); "save for later" dumps to localStorage (:159-165).
3. Employer dashboard `dashboard/employer/page.tsx:225-268` — Quick Actions; redirect loop to setup on 404 (:48-52).
4. **Worker search** `workers/page.tsx` — rich filters (trade, availability, experience, specialisations, NEN 3140/VCA certs, skills, language+CEFR, work authorisation, employment type).
5. **Offer creation** `offers/create/page.tsx` — **6 steps** (job, compensation, contract, benefits, arrangement, requirements), salary defaults €60–80k (:90-91), raw free-text `workerId` field (:75-82,355-365) that only makes sense via `?workerId=` from a worker card (workers/page.tsx:168-172).
6. **Hard gate:** SUBMIT disabled unless employer verified (:160-163,216-220,276-295) — but `BASIC_VERIFIED` is granted **only by an admin in-app** (`admin.service.ts:453`), despite `docs/business/marketplace-mechanics.md:266-272` describing automated KvK/domain/phone checks. New employers sit in PENDING indefinitely with a yellow banner.
7. Anonymous visitors: search UI fires on mount (`workers/page.tsx:302`) but the endpoint is `@Roles('EMPLOYER')` (workers.controller.ts ~:44) → silent empty state (:993-1004) — dead-end 401.

### Cross-side / channels
- **Referrals** (`referrals/page.tsx`, `docs/technical/referral-system.md` §1): shipped = **€25 gift card per 5 email-verified referrals**, admin-tunable, manual fulfilment; entry only via Navbar item (`Navbar.tsx:63,74`) + register `?ref`. The planned **employer-side referral** (€250 referrer / €100 referee credit, `launch-strategy.md:326-341`) is **NOT implemented** — single consumer-shaped program.
- **AI acquisition channel** (`docs/technical/internal-acquisition-api.md`): service-to-service WhatsApp funnel with full Meta CTWA attribution + idempotency + post-acquisition profile data — worker acquisition increasingly bypasses the web funnel.
- **Analytics:** PostHog consent-gated, pageviews only (`PostHogProvider.tsx:38-75`); **no product events captured anywhere**; no UTM handling on register.

## 2. Friction points (evidence-backed, ranked F1–F10)

| # | Friction | Evidence | Consequence |
|---|---|---|---|
| F1 | **Manual admin verification gates offer submission** — self-serve employer can wait days; docs' promised KvK automation doesn't exist | offers/create/page.tsx:160-163,216-220; admin.service.ts:453; marketplace-mechanics.md:266-272 | #1 demand-side blocker |
| F2 | KvK + company name required at signup, zero supply seen first | register/page.tsx:129-132; JobQ benchmark = 2-min profile (jobq.com, 2026-11-05) | "ask me later" violation |
| F3 | Anonymous visitors see zero supply (401 rendered as empty) | workers.controller.ts ~:44; workers/page.tsx:302, 993-1004; launch-strategy.md:317 planned public supply proof | no demand-side motivation |
| F4 | Wizard omits headline/certs/licence → cards fall back to publicId as title, score low on employer filters — verification is 25% of worker reputation, profile quality 10% of match score | profile/setup/page.tsx:66-91; workers/page.tsx:1026, 81-82; marketplace-mechanics.md:192-197,364 | undersold supply |
| F5 | Signup heaviness: 3 mandatory consents + confirm-password + OTP + 14-field wizard ≈ 5 screens to first value | register/page.tsx:36-41,57-70,288-330; profile/setup/page.tsx:93-98 | measurable signup loss |
| F6 | Worker post-setup dead end — nothing pushes toward the 40% activation target | dashboard/worker/page.tsx:295-303; revenue-model.md:291 | supply retention risk |
| F7 | Referral program 5× weaker than plan, undeliverable discovery-wise | referral-system.md §1 vs launch-strategy.md:189-205; only Navbar entry | target was 20% participating (launch-strategy.md:204) |
| F8 | **No pricing page / employer economics anywhere pre-signup** — "€499 only when your candidate accepts" (strongest antidote to agency-fee anxiety) is invisible; no Google-Ads LP that launch-strategy.md:298 planned | no `/pricing` route; no price copy on home | employer pipeline leak |
| F9 | Offer creation 6-step form, generic defaults, raw workerId free-text | offers/create/page.tsx:27-34,75-82,90-91 | 5 offers/employer/week target (launch-strategy.md:390) unrealistic |
| F10 | Consent-gated analytics, no product events, no UTM capture → funnel stages unattributable (organic funnel has none of what the AI-acquisition service already has) | PostHogProvider.tsx:32-75; register page no campaign params | can't measure anything below |

## 3. Prioritised conversion experiments (E1–E10)

| # | Hypothesis | Experiment | Metric | Effort | Impact |
|---|---|---|---|---|---|
| E1 | Unblocking submission removes the #1 demand stall | **KvK auto-verification**: API-validate KvK at signup (already collected) → instant BASIC_VERIFIED + async admin review; manual only for flags | % new employers with SUBMITTED offer <48h ≥ 60% | M | Very high (feeds €499 invoices) |
| E2 | Employers need supply proof before identity friction | **Public anonymous supply tiles** on /workers + home: "34 immediate verified electricians within 30 km of Rotterdam" (aggregates, blurred cards; public count endpoint) | search→signup ≥5% | M | High (fixes F3) |
| E3 | Card quality drives search-to-offer | **Extend worker wizard**: headline (1 line), primary cert, licence toggle (≤4 clicks, prefillable); rest via completeness nudge in /profile/edit | % profiles with headline ≥80%; search→offer ≥10% (marketplace-mechanics.md:95) | S | High |
| E4 | "Nothing unless she accepts" removes price anxiety | **Employer economics strip** on home + `/pricing` page: €499-on-acceptance vs 20–30% agency fees (revenue-model.md:163-164) | home→employer-register CTR; Ads LP exists | S | High, cheap |
| E5 | Fewer fields = more signups | **Registration minimisation**: email+password+role; KVK+address into setup; consents into first login (after counsel verifies legal necessity) | register completion ≥ +15% | M | Medium-high |
| E6 | Workers churn when invisible | **Activation loop**: dashboard empty state → "Complete 3 items to enter the verified pool" + weekly "N verified employers can see you" email (notifications module exists) | time-to-first-offer <7d; activation 40% (revenue-model.md:291) | M | High |
| E7 | Employer referral is a different product | **Launch employer referral** (€250 referrer / €100 first-intro credit, launch-strategy.md:326-341) on existing credit/billing patterns | 30% of employers refer ≥1; referral CAC ≈ €200 vs €600 blended (revenue-model.md:79-81) | M | Medium-high, best CAC |
| E8 | Referral threshold too high | **Tune knobs in admin settings** (no deploy — referral-system.md §1.1): threshold 5→2 or priority-placement reward | referrals/user ≥0.3; participation ≥20% | S | Medium |
| E9 | Templates cut creation effort | **Trade templates + smart defaults**: 3-step create, pre-filled electrician defaults (VCA, 38-40h, per-CAO benefits); kill raw workerId free-text (card-arrival prefill only) | offers/employer/week → 5; DRAFT abandonment | M | Medium |
| E10 | Slow manual wait leaks before E1 ships | **Concierge SLA stopgap**: instant ops alert on new employer signup, verification <4h working-hours, weekly unverified sweep | signup→BASIC_VERIFIED <4h | S | Medium (transitional) |

**Sequence:** E10 + E4 (days, no risk) → E1, E2 → E3, E7 → E5 (after counsel), E6, E8, E9.

## 4. Partnership shortlist (NL, electricians)
1. **Techniek Nederland + Wij Techniek** — member recruitment pain; angle: private-sector werving/instroom tool; member discount on intro credits; co-published salary benchmark. Route: regiomanagers / Wij Techniek TeamWork Servicepunt. (technieknederland.nl/bedrijfsvoering/personeel/werving-instroom, 2026-11-05)
2. **NVKL** — publicly recruiting companies for stage/leerbanen spots → co-announce graduate/BBL leaver profiles for member contractors (nvkl.nl 2026-07-04 post, 2026-11-05).
3. **MBO/AOC schools via SBB channels** (launch-strategy.md:127-147 designs this): erkend-leerbedrijf employers + schools with students lacking leerwerkplekken (Yonder Tilburg, Summa Eindhoven — Techniek Nederland Dec 2025/Feb 2026); free premium profiles for graduates, target 50/school.
4. **FNV Bouw / CNV Vakmensen** — member benefit + wage transparency ("know your worth"); anti-union sensitivity → position as employee-leverage; slow, high-touch.
5. **VCA / NEN 3140 training & exam providers** — reciprocal funnels ("complete your VCA, then land structured offers"); enables certification-registry verification partnerships (marketplace-mechanics.md:261-262). Speculative: not yet contacted.
6. **Wholesaler/tool communities** (Technische Unie, Sonepar) — low-cost co-marketing; validate appetite with one pilot.
7. **Internal:** extend the existing WhatsApp AI-acquisition funnel (full attribution already built, internal-acquisition-api.md) to employer-side Meta CTWA campaigns.
Note: "Arvo" and "Svak" from the brief did not surface as NL industry bodies (2026-11-05) — treat as unverified; confirm internally before any outreach (consistent with seo-intelligence + ai-search-geo findings).

## 5. KPI framework (measurable from server rows; PostHog page-funnels when instrumented)
| Stage | Definition (current code) | Target |
|---|---|---|
| Visit → Signup | User row via /auth/register-worker/-employer | worker 5–10%, employer 3–6% of anonymous visits (ASSUMPTION — instrument first) |
| Signup → Verified | `emailVerified` (also the referral qualification rule, referral-system.md §3) | ≥70% within 24h |
| Verified → Profile complete | Worker `isProfileComplete` (≥90% completeness, workers.service.ts:327-328); Employer ≥ BASIC_VERIFIED | worker ≥60%; employer ≥70% |
| Profile → First offer | Employer first SUBMITTED; worker first offer received | 60% verified employers <7d; 40% active profiles receive ≥1 offer (revenue-model.md:291) |
| Offer → Introduction | ACCEPTED (invoice auto-created, offers.service.ts:739-740) | acceptance 15–25% (marketplace-mechanics.md:94); intro rate 15% (revenue-model.md:289) — **docs conflict:** liquidity doc says >5% (marketplace-mechanics.md:93); recommend one canonical 15% |
| Introduction → Placement | Defined only in revenue-model.md:170-172, **not instrumented anywhere** — needs placement/paid-invoice data | invoice paid <14d ≥90% |

**Reverse math to target (docs internally inconsistent — flag):** €1.2M ARR at €499 → ~2,400 intros/yr (~200/mo) → at 15% intro rate ~16,000 offers/yr (~1,333/mo) → at 150 active employers ≈ 9 offers/employer/mo (today's 6-step form makes 5/week theoretical ceiling → E9). At 20% acceptance + 40% activation: ~2,000 workers receiving ≥1 offer × 1.5 intros ≈ 3,000-intro capacity — consistent with 5,000 profiles. **Conflict:** launch-strategy.md's 12-month table says 200 employers & 100 intros/mo (= €600k) — either 150 employers paying avg €8k (revenue-model.md:215) or pricing must rise. **Recommend revenue-model table as canonical.**
Dashboard-ready health ratios from marketplace-mechanics.md: offer-to-profile > 0.5, search-to-offer > 10%, time-to-first-offer < 7d, marketplace health score (§89-115). Fix referral-KPI mismatch (€25 per referral vs €25 per 5) when E8 tunes knobs.

## 6. External benchmarks (2026-11-05)
- **JobQ** (jobq.com/werknemer/landing/installatietechniek): same anonymous-matching concept; ~2-min profile (salary wish, hours, commute); employers approach — **the signup-friction benchmark for F5**.
- **Temper** (go.temper.works/nl-nl/signup; help centre): email → ID/BSN → selfie → IBAN *after* first value moment; employer path starts from KvK lookup — heavy verification AFTER value works.
- **Zoofy** (zoofy.nl/vakman): profile + KvK, €19.95/mo membership, apps-first.
- **Werkspot/YouLinked/Roamler**: zzp lead-gen; Werkspot penalised for lead costs; YouLinked 9% only on completed jobs. OfferMarket's "free until acceptance" sits well vs this landscape but is invisible pre-signup (F8).
- **TechniekMatch / TechniekWerkt / Jobs in de Techniek**: free two-click job alerts — supports E6-style proactive worker loops.

## 7. Biggest single insight
The build is compliance-rich but conversion-poor in exactly two places: **(a)** employers hit a manual human gate (`BASIC_VERIFIED` is admin-only, admin.service.ts:453) between signup and their first action — with no supply visible before it (anonymous search 401s silently) and no pricing page to sell the model; and **(b)** workers pass a 4-step/14-field wizard that ships them into employer search *without the fields employers filter on* (headline, VCA/NEN 3140, licence), landing on a dashboard with no next action. Both are small, high-leverage fixes (E1, E2, E3, E4, E6) sitting directly on the ARR math — every verified employer posting an offer in week one is worth ~€8k/yr if unit economics hold (revenue-model.md:89-99).

---

# Δ SEGMENT-MATRIX ADDENDUM (growth-cro, 2026-11-05 — reconciles CTO brief v2 with v1)

## 0. Architecture constraint shaping every answer
URL_ARCHITECTURE defines **no per-industry employer URL family** (the architect's Δ v2 confirms: employer family = `/for-employers` + `/employers/{slug}` + `/hire/{profession}`). Inventing `/for-employers/industrial` routes would violate the one-page-per-intent contract. Segment depth in 90 days lives in: (a) content modules inside `/for-employers`, (b) `/guide/{slug}` evergreen explainers per segment, (c) `/insights/category/employer` articles. If a segment later proves volume, it graduates to its own route via the architect.

## 1. Employer segment matrix (10 segments)
**Verified filter surface:** trade, availability (incl. IMMEDIATE), experience min/max, specialisations, NEN 3140, VCA, skills, language+CEFR, work authorisation, employment type (`workers/page.tsx:181-216`, `workers.service.ts:71-166`).
**Filter gap:** `IndustryType` (schema.prisma:1051-1067) and worker `industryPrefs` are collected but **not filterable in employer search** — segment matching rests on Specialization only (enum covers RESIDENTIAL/COMMERCIAL/INDUSTRIAL_INSTALLATIONS, MAINTENANCE, HIGH/LOW_VOLTAGE, SOLAR_PV, EV_CHARGING, CONTROL_PANELS, PLC, AUTOMATION, BMS, FIRE_ALARM, SECURITY, DATA_CABLING, MARINE, RENEWABLE_ENERGY). One-line filter gap, cheap (candidate E9/E3 scope addition).
**Cross-segment pricing anchor (2026-11-05):** agencies charge 15–25% of annual salary, no cure no pay, ~1 month guarantee, 2–8 weeks lead (wervingtechnischpersoneel.nl; Lumina 25% + detavast; WVI). OfferMarket = €499 per accepted introduction (~6–8% of one agency fee), employer-side only, on acceptance. This comparison is the single most reusable employer-asset component.

| # | Segment | Searches (evidence base) | Conversion angle | Asset + family | 90-day? |
|---|---|---|---|---|---|
| E1 | Electrical installation companies | "elektricien gezocht( zzp/[city])", "gevraagd" (cluster B HIGH); "inhuren (kosten)", "vacature elektricien plaatsen", "werven" (E); "uitzendbureau elektricien [city]" | €499-on-acceptance vs 15–25% agency fee; reverse = no posting cost | `/for-employers` core block; `/guide/elektricien-inhuren-kosten`; `/pricing` | **YES — core** |
| E2 | Industrial | "elektricien industrie gezocht", "monteur E&I" (vacancy-title evidence: Mavertech Rotterdam, Ymatch Waalhaven/Shell+EON, Xelvin Eemshaven €3.700–4.400 excl. ploegentoeslag; exact query strings ASSUMPTION → Planner) | Shift-premium economics; scarce-skill premiums honest here (€3.769–5.043) | /guide + /insights industry content; **not a headline segment — supply thin** (INDUSTRIAL specialisations) | LATER (day 60+, supply threshold) |
| E3 | Construction / bouw & utiliteit | "elektricien gezocht onderaanneming" (genuine B2B modifier, MID); "elektricien bouw" (ASSUMPTION) | Subcontract capacity without onderaanneming risk; pay-per-accepted-worker fits project spikes; competitor elektriciensgezocht.nl is thin exact-match | `/guide/elektricien-onderaanneming-alternatief`; /for-employers module | **YES — wave 2** |
| E4 | Infrastructure (GWW/grid) | "monteur laagspanning gezocht", "middenspanning monteur", werkvoorbereider H-footprint (verified); net-manager strings ASSUMPTION | MSP/LS scarcity premium; but enterprise procurement buyers | /guide explainer only | **NO** (HIGH_VOLTAGE supply likely insufficient) |
| E5 | Energy/utilities | "servicemonteur energie" (ASSUMPTION); demand context verified: UWV klimaatbanen Q1 2026 ~87,350 climate vacancies vs ~23,270 seekers | Enterprise procurement; relationship-led | /insights demand report (P7) for brand trust | **NO** |
| E6 | Solar | "zonnepaneel monteur gezocht", "installateur zonnepanelen zzp", "PV monteur gezocht" (ASSUMPTION — H sub-cluster demand unverified; Planner test); employer evidence strong: Zonneplan careers 6 sites €2.650–3.800 + own academy; Livingsun hires vak **óf ZZP** 4 days/wk; Dijkman 20→60 staff (€2.272–4.084); EPOWER requires VCA + vakbekwaamheidscertificaat; Solar & Storage May 2026: demand rebounded, specialists scarce | SOLAR_PV + RENEWABLE_ENERGY enums exist; EmploymentType FREELANCE fits ZZP installers — pay-per-intro native to segment | /guide + paneelbouwer role-hub (city-concentrated: breda, hengelo, friesland); /for-employers module if supply | **CONDITIONAL** — Planner volume AND SOLAR_PV profiles present |
| E7 | Charging infrastructure | "laadpaal monteur gezocht/inhuuren" (PIT ranks the latter with dedicated page, €15–38/uur tiers, 48h claims); LinkedIn direct-hunt posts; DKV Mobility Oct 2025: monteur-tekort = rollout bottleneck | EV_CHARGING enum exists; NEN 3140+VCA toggles match NL Mobility vacancy requirements (2026-11-05); DLE.energy hires ZZP (recruitee listing) | /guide explainer + role-hub module | **CONDITIONAL** — same test as E6 |
| E8 | Technical staffing agencies | Agencies ARE the SERP competition (FlexHero, Konekta, Talent4s/Electric4s, MAATT all "leveren elektromonteurs aan installateurs") | **None — blocked on business decision**: agencies buy *and* own supply; worker-poaching optics + re-marketing with mark-up | None in 90d; if ever accepted: separate contract tier | **NO — CTO business decision** |
| E9 | Recruitment companies | "werving elektriciens" — incumbents own with fee content (Lumina 25% + detavast; HRM@WORK ~180 installateurs; wervingtechnischpersoneel 15–20% benchmarks) | Same conflict, sharper (our €499 undercuts their 25%); **use their public fee data as /pricing ammunition (E4)** | None; fee data feeds E4 | **NO — blocked; data feeds E4** |
| E10 | Maintenance contractors | "storingsmonteur gezocht", "servicemonteur elektrotechniek" (H verified); "onderhoudspartij elektra gezocht" (ASSUMPTION) | MAINTENANCE + BUILDING_MANAGEMENT + FIRE_ALARM; availability-driven; recurring work = strongest repeat-intro argument — **but repeat-hire fee policy is UNDEFINED (per-introduction re-charging unclear) — business question** | Role-hub content | LATER + policy question |

**90-day verdict:** E1 + E3 fully realistic; E6/E7 conditional on two cheap validations (Planner volumes + profile-count check); E2 at day 60+; E4/E5/E10 later; E8/E9 blocked on a business decision. **8 of 10 segments lack verified demand volume, have a business conflict, or thin supply — concentrate on E1 + E3.**

## 2. Worker segment matrix (9 segments)
| Segment | Searches | Funnel + credible positioning | 90-day? |
|---|---|---|---|
| Active job seekers | "vacature elektricien" heads unwinnable; long-tail city variants only | Hub/`/for-workers` → E2 supply counter ("X verified installateurs looking now" **only if real**) → register. Pre-E2 fallback: lead with €0-for-you + anonymity mechanics, not volume | YES (Wave 2) |
| **Passive candidates** | They don't search jobs — they search **rate validation** ("zzp elektricien salaris/uurloon", "elektricien salaris") | Salary-data entry → anonymity pitch anchored on blocklist → register. See §3 — the phrase must not appear without live mechanics | **YES — biggest value pool** |
| ZZP electricians | "zzp elektricien gezocht", "opdrachten", rates €40–90/uur | /market/elektricien + cluster C content → register. Proof = structured compensation vs Werkspot-style lead-quota abuse; cite Werkspot contrast only if mechanics hold | YES |
| Experienced (5+) | "elektricien salaris" head, werkvoorbereider tail | Salary entry → wizard pitch centred on E3 (headline+certs make the card rank; profile quality = 10% of match score, mechanics.md:364). Today's cards fall back to publicId (F4) — **product promise structurally broken until E3** | YES, gated on E3 |
| Industrial | "elektromonteur industrie vacature", "monteur E&I" (€3.700–4.400 + 15% ploegentoeslag evidence) | Scarcity-leverage framing: "midden-/hoogspanning + VCA profielen krijgen structureel betere aanbiedingen" — defensible, pay gap published | LATER (supply thin) |
| Installation | "installatiemonteur vacature/salaris" | Standard phrasing, gated on E2 counts | YES (after elektricien hub) |
| Maintenance technicians | "servicemonteur vacature/storingen" (Zonneplan listings exist) | Structured-benefits emphasis (per-CAO benefit templates E9) — mostly want loondienst stability | LATER |
| Recent starters | "elektricien salaris starter" (€2.300–2.700 Indeed), "zonder ervaring" | Salary-trajectory page (yr 1 vs yr 5 from MarketSnapshot) → register. **No leverage claims**: "your profile is ready the day your cert is — employers see certified starters, and you know what you're worth before your first interview." Wizard must treat 0 yrs + school cert as complete (E9 starter template) | YES if starter template exists |
| Apprentices (BBL) | "elektricien opleiding bbl" (cluster G deferred) | **Not reverse-marketplace:** BBL students need leerwerkplekken, not offers. School/SBB partnership (launch-strategy.md:120-147; NVKL route — nvkl.nl publicly recruits leerbaan companies, 2026-07-04); employer-side demand verified (Rijndorp, INCO Groep SBB-IDs, Van der Poel, Elektra 21/21 Groep BBL listings, 2026-11-05). Honest pitch: free forever + profile already in employer search at graduation + per-niveau salary data + EmploymentType.INTERNSHIP exists in schema (schema.prisma:1082-1089). **Arvo/Svak still unverified — never name them in apprentice copy** | PARTIAL — school outreach only |

## 3. The passive-candidate problem
Passive elektromonteurs will not register for a promise, only for a **mechanism**.
**§3.1 What's real (all verified in code):** (1) "employers approach you" is literally true (workers can't browse; push-only); (2) anonymity is structural (anonymised cards; identity fields private); (3) "not looking" is switchable — ProfileVisibility ALL_VERIFIED|SELECTED_COMPANIES|HIDDEN + `blockedCompanies`/`visibleCompanies` = **"your current employer never sees you" is a product control, not a promise**; (4) offers state money up front (OfferVersion structured comp; €0 worker-side, €499 employer-side); (5) no lead-pool spam mechanism exists.
**§3.2 What must be built before the phrase is credible:** E2 live counts (blocked on small-cell rule); E6 passive dashboard stats ("N verified employers searched your region this week" — nothing computable exists today, F6); E3 card quality (the highest-value profile currently renders publicId as title, F4); a first-class HIDDEN/opt-out control surfaced on /for-workers (exists but buried in edit); **no invented guarantee mechanics** — the honest promise set is exactly §3.1's five facts; no testimonials until placements are instrumented (Introduction→Placement not instrumented, §5).
**§3.3 /for-workers must show for a passive monteur:** the three mechanics in plain NL · E2 tiles (small-cell-gated) · one blurred anonymised example offer card (needs public aggregate-preview endpoint — doesn't exist) · the €0 statement + €499-on-acceptance copy (currently nowhere site-wide, F8) · rate-comparison entry to /market/elektricien · explicit absence-of-claims line until real placements exist.
**Verdict:** architecturally truthful, currently unprovable. E2+E6+E3 are the deciding approvals — a build-completion problem, not a copywriting one.

## 4. Employer funnel spec (segment → first offer), E-experiments annotated
1. **Segment search → asset** (/guide explainer or /for-employers module): E4 pricing comparison (verified fee anchors); per-segment supply count (small-cell-gated).
2. **Asset → /for-employers**: E2 tiles + €499-on-acceptance strip above the fold (currently invisible site-wide, F8).
3. **→ /register?role=employer** (KvK+companyName required, register/page.tsx:129-132): E5 (post-counsel), E10, `?ref` (E7 when shipped). **No UTM capture exists (F10) — per-segment attribution impossible; F10 instrumentation is a funnel prerequisite.**
4. **Register → BASIC_VERIFIED → search** (human gate, admin.service.ts:453): E1 (BLOCKED: authorization approval + KVK_REGISTERED state + ~7d KvK onboarding), E10 meanwhile.
5. **→ offer draft → SUBMIT** (6-step, generic €60–80k defaults, raw workerId free-text): E9 templates + **per-segment default comp sets** — the €60–80k default is above bouw/installatie reality (Zonneplan senior €2.750–3.250 ≈ €33–39k; Dijkman €2.272–4.084) and below industry premiums (€3.700–4.400 + ploegen) — **overpriced offers for E1/E3 segments; correcting this is an E9 requirement**.
6. **ACCEPT → introduction** (€499 invoice, offers.service.ts:739-740): E7 + E8 fire post-first-success; repeat-hire fee policy question unresolved.
**Gap:** stage 2→3 has no segment retargeting (context lost at generic register) — cheapest fix: `?segment=` param + echo block (S-effort, E5-adjacent).

## 5. 90-day acquisition priority (impact × confidence × ease; I/C/E 1–5)
| # | Task | Type | I | C | E |
|---|---|---|---|---|---|
| 1 | E4 /pricing + economics strip — now with **verified agency-fee data** (15–25%) | No-risk | 4 | 5 | 5 |
| 2 | **Keyword-Planner validation pass** (cluster E heads + energy-transition sub-cluster + C/D assumptions) — resolves every ASSUMPTION before content spend | No-risk measurement | 4 | 5 | 4 |
| 3 | R7 robots fix (/workers + /insights/your-market) | 1 file | 2 | 5 | 5 |
| 4 | E6-lite /for-workers + supply-count module | Blocked on small-cell rule | 5 | 4 | 4 |
| 5 | Employer explainer guides (inhuren kosten, onderaanneming alternatief) | Content | 4 | 4 | 4 |
| 6 | E2 public tiles | Blocked on small-cell rule (+possible legal) | 5 | 4 | 3 |
| 7 | E1 KvK auto-verification | **BLOCKED — CTO authorization decision** + ~7d onboarding | 5 | 4 | 2 |
| 8 | Filter-gap fix: make IndustryType/industryPrefs searchable (S) | Near-no-risk | 3 | 4 | 4 |
| 9 | SBB/AOC school outreach (10 schools × 50 grads) | Founder-led | 3 | 3 | 2 |
| 10 | Techniek Nederland / NVKL outreach | Outreach only | 4 | 3 | 2 |
| 11 | E7 employer referral | Post-first-success | 4 | 3 | 2 |
| 12 | Solar/charging segment content | **Blocked on task 2 + supply check** | 3 | 2 | 3 |
| 13 | Agencies as buyers | **BLOCKED — CTO business decision** | 2 | 2 | 2 |

**CTO decision scoreboard (acquisition):** small-cell rule (→ tasks 4, 6) · KvK authorization (→ 7) · agency-as-buyer (→ 13) · Arvo/Svak name verification (→ 9, 10 copy) · repeat-hire fee policy (→ E10 segment, funnel stage 6).

## External sources (all 2026-11-05)
Fee benchmarks: wervingtechnischpersoneel.nl/elektriciens-werven (15–20%, €6.026–8.035 example); lumina.nl/werving-selectie (25% + detavast); wviprofessionals.nl (1-mo guarantee); hrmatwork.nl (~180 clients); pitbv.nl/diensten/werving-selectie.
Industrial rates: mavertech.nl (€2.800–3.500 Rotterdam); ymatch.nl (€3.300–3.900, Shell/EON); werkenbij.ballast-nedam.nl (E&I); nationalevacaturebank.nl Eemshaven listing (€3.700–4.400 + 15% ploegentoeslag, Xelvin).
Solar: careers.zonneplan.nl (junior €2.650–2.850 / senior €2.750–3.250 / elec €3.200–3.800); livingsun.nl (vast óf ZZP); dijkman.nl (€2.272–4.084); epower.energy (VCA + vakbekwaamheidscertificaat); solarmagazine.nl (May 2026 — demand rebounded).
Charging: dle.recruitee.com (ZZP mogelijk); pitbv.nl/personeel/laadpaal-monteur (€15–38/uur, 48h); nlmobility.nl (NEN 3140 + rijbewijs B); dkv-mobility.com (Oct 2025 bottleneck).
BBL employer demand: werkenbijrijndorp.nl; werkenbij.incogroep.nl (SBB-IDs); werkenbijvanderpoel.nl; 21groep.nl (BBL leerling vacature); jbeenen.nl.
Staffing SERP: flexhero.com/elektrotechniek; konektagroup.com; talent4s.nl/electric4s; maatt.nl; elektriciensgezocht.nl.

**Bottom line:** concentrate 90-day acquisition on installation companies + bouw/contractors (E1+E3), hold solar/charging behind two cheap validations, and treat the passive-candidate promise as an E2/E3/E6 build-completion problem rather than a copywriting one.
