# Trade Enablement Playbook

How to enable a new trade (vertical) on OfferMarket. Written after enabling
**Nurses** (Sept 2026) as the second vertical, alongside electricians.

---

## 1. Regulatory scoping (do this first)

For each trade, determine whether the profession is **regulated** in the
Netherlands. This drives everything else:

| Type | Examples | Platform implication |
|---|---|---|
| Protected title (BIG/Wet BIG) | Verpleegkundige, Arts, Fysiotherapeut | Title verification required before "Verified" badges can be shown |
| Regulated trade | Gas installatie (NEN), elektrotechniek | Voluntary certifications (NEN 3140, VCA, SCIOS) |
| Unregulated | Most generic crafts | No verification obligation; soft trust signals only |

Key research questions:

1. Is the title protected, and who maintains the register (e.g. CIBG for BIG)?
2. Does the register have a public API? (BIG-register does **not** — it is
   manual lookup only, and the site rate-limits; expect admin to verify
   against the public search by hand.)
3. Is a VOG (Verklaring Omtrent Gedrag) customary or required?
4. Is professional liability insurance customary?
5. Are there sector-specific legal regimes that touch the offer flow?
   (For healthcare: Wkkgz care-quality obligations, VAT-exempt medical care,
   and the July 2025 zzp toetsingsmatrix replacing the DBA.)

Anything marked for legal review should be resolved with counsel **before**
launching paid offers in that trade.

## 2. Code changes (the enablement checklist)

### Minimal enablement (unregulated trades)

1. `apps/api/src/modules/workers/workers.service.ts` — `getAvailableTrades()`:
   add the trade to the hardcoded array (`value`, `label`, `available: true`).
2. `apps/api/src/prisma/seed.ts` — add a `professionSeed` row (slug, NL name,
   EN name, group) and any catalog `skillSeed` rows for the trade.
3. `apps/web` — trades fallback lists in `profile/setup`, `profile/edit` and
   `workers` search page include the new trade.
4. `apps/web/src/messages/{en,nl}/profile.json` — update `tradeNote`.

### If the trade has specializations

`Specialization` is a Prisma enum; values are electrician-specific. Until
per-trade specialization sets exist, non-electrical trades are sanitized to
`specializations = []` via the `isElectricalTrade()` helper (present in
`workers.service.ts` and mirrored in the web edit page and search filter —
the UI hides the specialization picker for those trades). Enabling
specializations for a new trade requires a schema migration plus mirroring
the helper/enum handling in the frontend.

### If the trade is regulated (credential verification)

The platform verifies credentials using the existing `Certification` model
(`verificationStatus`: PENDING → VERIFIED / REVOKED, plus `verifiedAt`,
`verifiedBy`, `verificationMethod`, `documentUrl`). No migration needed.

1. **Worker side** — `profile/edit` presets: add preset buttons for the
   trade's core credentials (name, issuing body). Nurses use:
   BIG-registration (CIBG), VOG (Justis), liability insurance.
2. **Admin side** — already generic: `GET /admin/certifications/pending`,
   `POST /admin/certifications/:id/verify`, `POST .../:id/reject` with
   AdminAction audit rows and atomic PENDING-only transitions. The review
   queue appears in `admin/verifications`; per-worker panel in
   `admin/users/[id]`.
3. **Worker notification** — the `credential.reviewed` event notifies the
   worker on verify/reject (admin notes are never forwarded).
4. **Trust signals** — `computeBadges()` in `workers.service.ts` derives
   badges from *verified* certification names (e.g. `BIG_REGISTERED`,
   `VOG_VERIFIED`) and `calculateSafetyScore()` adds score points for them.
   Add trade-appropriate badge/score hooks here.
5. **Employer side** — offer form copy in `messages/{en,nl}/offers.json`
   (`requiredCertificationsHint` / placeholder) should name the trade's
   credentials so employers request them.

### Deliberate policy

- **No hard gate on hiring unverified workers** — supply-first; verified
  status is a trust signal, not a hiring precondition. Revisit per trade
  when volume justifies it.
- **Public profiles expose only VERIFIED certifications** and never the
  certification number itself (privacy + fraud-resistance).
- Editing a verified credential's content resets it to PENDING for re-review.

## 3. Launch checklist per trade

- [ ] Regulatory research documented; legal-review items resolved
- [ ] Trade enabled in `getAvailableTrades()` + frontend fallbacks
- [ ] Profession + skill catalog seeded
- [ ] Credential presets (if regulated) + admin review flow smoke-tested
- [ ] Notification on credential review confirmed end-to-end
- [ ] Offer-form copy mentions the trade's credentials
- [ ] `launch-strategy.md` updated with the new vertical
- [ ] i18n parity check green (`npm run check:i18n`), both locales reviewed
- [ ] Full API + web test suites green

## Verticals status

| Trade | Status | Notes |
|---|---|---|
| Electrician | Live (beachhead) | — |
| Nurse (verpleegkundige) | Enabled, Sept 2026 | BIG/VOG/insurance verification; Wkkgz + zzp offer wording flagged for legal review |
| Verzorgende (care worker) | Planned follow-up | After nurse vertical stabilizes |