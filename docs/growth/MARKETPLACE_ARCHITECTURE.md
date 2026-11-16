# MARKETPLACE_ARCHITECTURE

**Version:** v1 DRAFT — pending SEO keyword evidence + technical-seo feasibility review
**Author:** marketplace-architect — consolidated by CEO
**Date:** 2026-11-05
**Status:** PROPOSED — not approved, not implemented
**Companion document:** [URL_ARCHITECTURE.md](./URL_ARCHITECTURE.md) (URL map, indexing rules R1–R8, open questions — the URL-specific content lives there and is not duplicated here)

## Scope
The marketplace entity model and the public/private data architecture that makes the entity inventory legible to search engines without exposing candidate personal data. Grounded in `apps/api/prisma/schema.prisma` (verified 2026-11-05); nothing assumed.

## Entity model
| Entity | Key attributes | Plays in the SEO system |
|---|---|---|
| Profession | slug, NL name + nameEn | slugs for `/market/{profession}`; resolves InsightArticle.profession (via existing alias service) |
| Skill | slug, hierarchy; ─m:n─ Worker (ProfileSkill) | profile pages; future specialisation pages |
| Certification | Skill-linked | shown on profiles only when VERIFIED (never certificationNumber) |
| Region | hierarchy COUNTRY > PROVINCE > CITY; name/nameEn | city slugs; profession×city rollups |
| MarketSnapshot | (profession, region, date) aggregates | data source for `/market/*` pages (R4 gate) |
| Worker | publicId (sequential W-%06d via `worker_public_id_seq`), regionId, primaryTrade, specializations, headline/summary, skills, certifications, languages, yearsOfExperience, postalCode (private), desired salary/rate (private) | consented public profile cards `/p/{publicId}` |
| Offer / OfferVersion | private pipeline; OfferVersion compensation structured | aggregate source only (≥10 samples per benchmark row, ≥50 for "high") |
| Rating | Offer-linked, isPublished, anonymised | employer AggregateRating on public employer pages |
| Employer | companyName/tradeName, industry, addresses (JSON, private), kvkNumber (**never public**), verification, reputation | public credibility pages `/employers/{slug}` |
| EmployerVerification | PENDING/BASIC/PREMIUM/REJECTED | gate for employer indexing (R3) |
| Consent (User) | ConsentType rows | new proposed type: PROFILE_PUBLIC_INDEXED — the public-indexing gate |
| InsightArticle | PUBLISHED/DRAFT | existing editorial SEO surface; gains "related market data" cross-links |

## Cross-linking design
- `/market/{profession}` hub → passing city pages, top 3 matching insights, 2–3 same-profession guides, `/for-workers`, `/for-employers`.
- `/market/{profession}/{city}` → profession hub, sibling cities (same province), matching insights, worker CTA.
- `/guide/{slug}` → its `/market/*` hub + matching insights category.
- `/insights/{slug}` → auto "related market data" module when Article.profession/regionId resolve.
- `/p/{publicId}` → ONLY its `/market/{profession}` hub + home/register. Never other worker cards.
- `/employers/{slug}` → employer insights, badge explainer, `/for-employers`.
- Discovery hubs: `/market`, `/employers/discover`.

## Public / private data matrix
See URL_ARCHITECTURE.md §3 — grounded field-by-field in schema.prisma (full matrix with worker, employer, offer, article entries and rationale).

## Consent architecture (the core governance point)
1. **Existing ProfileVisibility enum governs employer search only** (ALL_VERIFIED | SELECTED_COMPANIES | HIDDEN). Public search-engine indexing is a *different processing purpose* and cannot inherit it.
2. Proposed new ConsentType **`PROFILE_PUBLIC_INDEXED`** (legalBasis: CONSENT), worker + employer variants.
3. Worker gate = consent **and** profileVisibility=ALL_VERIFIED **and** isProfileComplete=true, completenessPct ≥ 70, user.status=ACTIVE, not blacklisted, certifications VERIFIED-only, region capped at CITY.
4. Employer gate = employer-side indexing consent **and** verification ∈ {BASIC_VERIFIED, PREMIUM_VERIFIED} **and** ≥3 published ratings (R3).
5. Withdrawal → immediate noindex + sitemap drop + cache-purge/URL-removal request + 410 (never redirect keeping personal data cached) — R2.
6. Default for every account: NOT indexable.

## GDPR / privacy guardrails
- workAuthorization: binary only, ever, and only with SPECIAL_CATEGORY consent; currently never rendered even on employer view — must stay out of all public markup.
- No Person JSON-LD on worker pages; Organization + AggregateRating allowed on employer pages (juridical person; Art. 2 employment-data exemption).
- KvK numbers never in URLs or markup.
- Worker data below CITY granularity never public; postalCode stays private.

## Multi-vertical scalability
Nurses already enabled (Profession row + certification flow) — `/market/verpleegkundige` drops in with zero architecture change. Constraint: specialisations enum is electrician-only, so city×specialisation waits on the per-trade specialisation migration already noted in `docs/business/vertical-playbook.md`; launch horizon uses city×profession. Nurse pages additionally gated on the outstanding BIG/VOG/Wkkgz legal review (Q8 in URL_ARCHITECTURE.md).

## Open questions
Tracked centrally in URL_ARCHITECTURE.md §5 (Q1–Q8), incl. band vs exact yearsOfExperience, hash-based public slug vs sequential publicId for indexed profiles, localized NL path maps, guide-module vs insight-category choice.
