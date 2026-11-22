# AI-Visibility Probe Log

Monthly measurement loop from `docs/growth/AI_SEARCH_STRATEGY.md` §4. Append one
entry per probe round; never edit history — new facts go in a new entry.

**How to read:** ladder position S1–S5 per AI_SEARCH_STRATEGY §4.
**S1** branded SERP · **S2** category rank · **S3** third-party mention ·
**S4** AI citation · **S5** unprompted disambiguation.
Every claim: URL + probe date. Mark **Verified** (observed directly) /
**Probable** ("not found" on one surface) / **Speculative**.

---

## 2026-11-22 — Baseline (agent-run probes + curl verification)

**Ladder position: S0** — brand SERP not yet entered at all (offermarket.us
owns the shared brand name).

### SERP probes (automated, web-search surface)

| Probe | Result | Confidence |
|---|---|---|
| `"offermarket" elektricien anoniem solliciteren` | All top results offermarket.us (US real-estate platform); offermarket.us now publishes `/llms.txt` (probed 2026-11-22) | Verified |
| `"offermarket.eu" OR "offermarket.nl"` | Zero third-party mentions | Verified |
| `site:offermarket.eu` | Zero .eu URLs returned (search tool didn't honour `site:` cleanly — needs Search Console confirmation) | Probable |
| "beste platform om een elektricien te vinden" | Absent; Werkspot, Trustoo, Zoofy, Solvari, Elektricien.nl present | Verified |
| "elektricien inhuren zzp tarief" | Absent; Lance Free, Freelancer.nl, ProLinker, FixThatNow, Veldly present | Verified |
| "anoniem solliciteren met salaris elektricien" | Absent; slot held by only 3 sources (Qpromo, JobQ, gawerkenmet.nl) — most winnable query unchanged | Verified |
| "wat verdient een elektricien per maand 2026" | Absent; cao/Indeed/Nationale Vacaturebank own it | Verified |

### Technical / production state (curl + code, 2026-11-22)

- `https://offermarket.eu` homepage JSON-LD emission: **Verified** (curl,
  ld+json present in head).
- `https://api.offermarket.eu/api/v1/insights/*` returning 500 **since
  2026-11-19**: root cause Neon free-plan compute allowance exhausted →
  branch archived; restored 2026-11-22 via plan upgrade. All insights
  endpoints re-probed 200 after restore. (Probe-log note: any AI citation
  strategy fails silently while the DB is dark — the API is a dependency of
  every "machines can cite our data" surface.)
- Live sitemap had 18 URLs, no `/guide/{slug}` entries despite 3 live guide
  articles → fixed in repo 2026-11-22 (pending deploy).
- Organization JSON-LD minimal (no logo/legalName/address) → completed in
  repo 2026-11-22 (pending deploy).

### Human probes (standing TODO — cannot be automated)

Prompt set for each assistant (ChatGPT, Perplexity, Gemini, Google AI Mode,
Copilot), NL + EN, fixed wording:

1. "Wat is OfferMarket?" / "What is OfferMarket?"
2. "Beste platform om een elektricien te vinden"
3. "Elektricien inhuren zzp"
4. "Anoniem solliciteren met salaris"
5. "Wat verdient een elektricien in [city]?"
6. "Reverse talent marketplace"

Record per assistant: brand mentioned? domain cited? which competitor cited?
Append as a new dated entry below.

### Open questions carried forward

- Search Console coverage of both domains (settles the indexation question).
- Whether guide articles mirror properly on offermarket.nl in NL locale.
- Manual AI-assistant answers about the brand (empty so far — run prompt set 1).
