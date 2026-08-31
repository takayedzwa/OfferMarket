# Referral & Reward System — Design & Implementation Reference

**Version:** 1.0
**Date:** August 2026
**Status:** Shipped (branch `share-a-code-to-invite-other-users`)
**Migration:** `apps/api/prisma/migrations/20260829000000_add_referral_program`

---

## 1. Overview

Every user can share a personal referral link (`/register?ref=CODE`). When an
invitee signs up through that link and then verifies their email, the referral
becomes **successful**. Each time the referrer accumulates a configurable
number of successful referrals (initially **5**), they earn a reward
(initially a **€25.00 gift card**), and the counter rolls over — rewards recur
at 5, 10, 15, … successful referrals.

Everything that touches money follows three hard rules:

1. **Nothing is hard-coded.** Threshold, reward amount, currency, reward type,
   recurrence, and the qualification rule all live in one admin-editable
   settings row. Ops can change any of them without a code deployment.
2. **No vendor lock-in.** No gift-card provider is referenced anywhere in the
   core. Rewards are created as `PENDING` ledger rows; a provider-agnostic
   plugin interface (`ReferralRewardProvider`) fulfills them. The initial
   implementation ships a `manual` provider (admin confirms fulfillment in the
   console); a gift-card vendor plugs in as one new class + one registration
   line, later.
3. **The server owns the truth.** The client never submits referral counts,
   progress, or rewards. Every number the UI shows is recomputed from
   immutable database rows. Money is integer minor units end to end — no
   floating-point anywhere in the pipeline.

### At a glance (initial configuration)

| Knob | Initial value | Notes |
|---|---|---|
| Program enabled | `true` | master switch |
| Rewards enabled | `true` | referrals still tracked when off |
| Recurring rewards | `true` | one reward *per* threshold multiple, not just the first |
| Threshold | `5` | successful referrals per reward (1–1000) |
| Reward type | `gift_card` | free-form descriptor, **not** a vendor |
| Reward amount | `2500` minor units (€25.00) | integer minor units |
| Reward currency | `EUR` | ISO 4217, any currency supported |
| Qualification rule | `email_verified` | the only rule implemented |
| Fulfillment | `manual` provider | rewards wait for admin confirmation |

---

## 2. Lifecycle

The system is a five-stage pipeline. Each stage explains what happens, why,
and where the code lives.

```
┌─────────┐   ┌────────────┐   ┌──────────────┐   ┌─────────┐   ┌─────────────┐
│ 1. CODE │──▶│ 2.         │──▶│ 3.           │──▶│ 4.      │──▶│ 5.          │
│         │   │ ATTRIBUTION│   │ QUALIFICATION│   │ REWARDS │   │ FULFILLMENT │
└─────────┘   └────────────┘   └──────────────┘   └─────────┘   └─────────────┘
```

### Stage 1 — Code

- Each user can claim a personal referral code, **lazily** on first use
  (`getOrCreateReferralCode`) — nothing is generated at signup, so there is no
  cost for users who never refer.
- Format: 10 characters from a 32-character alphabet that excludes
  look-alikes (`0/O`, `1/I`): `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
  Generated from `crypto.randomBytes`; because 32 divides 256, the modulo
  mapping is exactly unbiased.
- Space of ~1.1 × 10¹⁵ makes guessing impractical; the unique index on
  `User.referralCode` plus a P2002-retry loop (5 attempts) makes concurrent
  assignment safe. Codes carry no internal id.
- Blocked for deleted accounts (`ForbiddenException`).

### Stage 2 — Attribution (registration time)

- The register endpoints accept an optional `referralCode`. Attribution runs
  **inside the registration transaction** (`attributeReferral(tx, …)`), so a
  referral row and the new user row commit atomically.
- **Silent by design.** Every failure path simply skips attribution; a referral
  can never break or reject a signup, and invalid codes cannot be probed
  through the register endpoint:
  - empty/whitespace code → skip
  - program disabled → skip
  - code unknown, or owner deleted/banned/not `ACTIVE` → skip
  - **self-referral** (code owner == new account) → skip
  - invitee already has a referral (unique `referredUserId`, P2002) → skip —
    **first attribution wins**
  - any unexpected DB error → logged, swallowed
- Code normalization is server-side: trim + uppercase. The client's
  `?ref=` value is capture-only; the server decides validity.

### Stage 3 — Qualification

- Qualification is what turns a pending referral into a "successful" one. The
  implementing rule is `email_verified`: after either email-verification flow
  (OTP or magic link) sets `emailVerified: true`, `auth.service` calls
  `referralsService.recordQualification(inviteeId)`.
- Eligibility is re-derived **server-side** from the user row — the caller is
  trusted for nothing but the id.
- The `PENDING → QUALIFIED` transition is a conditional `updateMany` that
  requires `count === 1`. A duplicate verification, a retry, or a race between
  the two verification endpoints updates 0 rows → the referral is counted
  **exactly once**, and the reward reconciliation runs exactly once.
- If a settings value names a rule this build doesn't know, qualification is
  skipped **loudly in logs** rather than silently counting unqualified
  referrals.
- Best-effort: `recordQualification` never throws into the verification flow —
  a reward hiccup can never fail email verification.

### Stage 4 — Rewards (the threshold engine)

When a referral qualifies, `issueRewards(referrerId)` reconciles the ledger in
one transaction:

1. **Row-lock the referrer** (`SELECT … FOR UPDATE` on the `User` row) —
   concurrent qualifications serialize on this mutex.
2. Read settings **inside the transaction** (so a config change can't be
   half-visible mid-computation).
3. Compute the target number of rewards earned so far:
   ```
   target = recurringRewards
     ? floor(qualified / threshold)
     : qualified >= threshold ? 1 : 0
   ```
4. Count rewards already issued — **all-time** (for sequence numbering) and
   **active** (excluding `CANCELLED`, for what's owed).
5. Mint `target − activeIssued` rewards. Each insert gets
   `sequenceNumber = allTimeIssued + 1 + i`, guarded by the
   `@@unique([ownerId, sequenceNumber])` index: a concurrent reconciliation
   that loses the race hits P2002 and is discarded — the correct idempotent
   outcome.
6. Write an `AuditLog` row per issued reward with the full context snapshot
   (qualified count, threshold, amount, currency, sequence).
7. Emit `REFERRAL_REWARD_EARNED` per new reward **after** commit.

Two properties fall out of this design:

- **Idempotent.** The method recomputes target-vs-issued on every call. A
  dashboard load, a retry, or a crash mid-qualification can all re-run it; it
  mints only what's missing and self-heals gaps (e.g. after an outage, the next
  qualification catches up all unissued milestones at once).
- **Cancelled milestones stay cancelled.** Sequence numbers are seeded from
  *all-time* rows including `CANCELLED`. Cancelling reward #2 therefore never
  causes the engine to mint a replacement at the same milestone; the next
  reward is #3. Admins void rewards with the ledger staying honest.

Reward rows snapshot the settings that created them (`thresholdSnapshot`,
`amountMinor`, `currency`, `rewardType`), so later config changes never rewrite
what a past reward meant.

### Stage 5 — Fulfillment

- `manual` is the only registered provider initially. Rewards stay `PENDING`
  until an admin confirms fulfillment in the console
  (`POST /admin/referrals/rewards/:id/fulfill`).
- `processPendingRewards()` exists (claims via conditional
  `PENDING|FAILED → PROCESSING` update, then calls the provider) but is **not**
  wired to any scheduler while the manual provider is active — this is the
  entry point for a future automated provider.
- Fulfillment is retry-safe: only the caller that wins the conditional claim
  ever talks to the provider; a lost claim fails gracefully instead of
  double-issuing. `FAILED` rewards can be re-attempted.

---

## 3. State machines

**Referral** (owned by `Referral.status`):

```
PENDING ──(invitee verifies email)──▶ QUALIFIED
   │                                      │
   └─────────(admin invalidates)──────────┴───▶ INVALIDATED
```

**Reward** (owned by `ReferralReward.status`):

```
PENDING ──▶ PROCESSING ──▶ FULFILLED   (terminal)
   │  ▲         │
   │  │         └──▶ FAILED          FAILED ──(retry)──▶ PROCESSING
   │  └──────────────────┘
   └──▶ CANCELLED        (admin void; FULFILLED is final)
```

- `CANCELLED` rewards keep their `sequenceNumber` (they remain in the ledger).
- Invalidating a referral does **not** claw back issued rewards; an admin must
  cancel them explicitly. Financial history is never silently rewritten.

---

## 4. Configuration — no deploys required

### Storage

One row in the generic `AdminSettings` key/value store:

- **key:** `referral_program`, **category:** `referral`
- value: a JSON blob of `ReferralProgramSettings` (see §1 table)

Why this shape:

- **Partial PATCH merges server-side** over the stored value — the admin
  console can never accidentally wipe fields it didn't render.
- **Per-field fallback on read** (`parseReferralSettings`): one malformed field
  in the JSON degrades to its clamped default instead of breaking the whole
  program.
- **Clamps:** `threshold` ∈ [1, 1000], `rewardAmountMinor` ∈ [1, 1e9],
  currency ≤ 3 chars. The admin API validates strictly on write
  (`@IsInt @Min @Max`, `@Matches(/^[A-Z]{3}$/)`, `@IsIn(qualificationRules)`);
  the parser only guards reads.
- The qualification `rule` is a settings **enum** (`email_verified` today), so
  future rules slot in without touching the settings shape.
- Every change writes an `AdminAction` (`REFERRAL_SETTINGS_UPDATED`) containing
  `{ previous, next }`.

### What each knob controls

| Setting | Effect when changed |
|---|---|
| `enabled: false` | New attributions stop; existing referrals/dashboards remain |
| `rewardsEnabled: false` | Referrals keep being tracked; issuance is skipped entirely (no reconciliation runs) |
| `recurringRewards: false` | One-time mode: only the first threshold earns a reward, ever |
| `threshold` | Changes the math for **new** qualifications only; already-issued rewards keep their snapshot |
| `rewardAmountMinor` / `rewardCurrency` / `rewardType` | Snapshotted into each reward at issuance |
| `rule` | Only `email_verified` is implemented; unknown values halt qualification with a loud log |

Because the engine always recomputes `target − issued`, changing the threshold
retroactively "catches up" users who cross the new bar on their *next*
qualification — historical rewards are never re-issued.

---

## 5. Data model

### `Referral` — the attribution ledger

| Column | Type | Notes |
|---|---|---|
| `referrerId` | `String?` FK → User | `onDelete: SetNull` |
| `referredUserId` | `String?` FK → User | **unique** — first attribution wins; one referral per user, ever |
| `referralCode` | `String` | as presented at signup (normalized) |
| `status` | enum `PENDING` / `QUALIFIED` / `INVALIDATED` | |
| `attributedAt` / `qualifiedAt` / `invalidatedAt` | `DateTime?` | audit timestamps |
| `invalidatedReason` | `String?` | |
| `attributedIp` | `String?` | abuse forensics |

### `ReferralReward` — the financial ledger

| Column | Type | Notes |
|---|---|---|
| `ownerId` | `String?` FK → User | `onDelete: SetNull` |
| `sequenceNumber` | `Int` | 1-based per owner; `@@unique([ownerId, sequenceNumber])` |
| `rewardType` | `String @default("gift_card")` | descriptor, not a vendor |
| `amountMinor` | `Int` | integer minor units; `CHECK > 0` |
| `currency` | `@default("EUR")` | `CHECK ~ '^[A-Z]{3}$'` |
| `thresholdSnapshot` | `Int` | settings at issuance; `CHECK > 0` |
| `status` | enum `PENDING` / `PROCESSING` / `FULFILLED` / `FAILED` / `CANCELLED` | |
| `rewardProvider` | `@default("manual")` | id into `RewardProviderRegistry` |
| `providerReference` | `String?` | provider's own id (e.g. `manual:<adminUserId>`) |
| `providerMetadata` | `Json?` | provider-specific extras |
| `lastError` | `String?` | why FAILED / cancellation reason |
| `fulfilledAt` | `DateTime?` | |

Indexes: `@@unique([ownerId, sequenceNumber])`, `@@index([ownerId, status])`,
`@@index([status, createdAt])`.

### `User.referralCode`

`String? @unique` — nullable, assigned lazily, never contains `0/O/1/I`.

### Why `SetNull` on both user FKs

GDPR erasure (user hard-deleted) must not be blocked by the financial ledger,
and the ledger must not lose history. Both FKs are nullable with
`onDelete: SetNull` (matching the `EmailOutbox` precedent): the rows survive
with the user link nulled, preserving amounts, dates, and sequences for audit,
while the user's identity is gone.

---

## 6. Concurrency & integrity model

| Threat | Mechanism |
|---|---|
| Two concurrent registrations claim the same referral code | Unique `User.referralCode` + P2002 retry (5 attempts, fresh code each time) |
| Invitee attributed twice under race | Unique `Referral.referredUserId`; loser gets P2002 → silently skipped (first wins) |
| Double qualification (OTP + magic-link race, retries) | Conditional `updateMany PENDING → QUALIFIED` requiring `count === 1` |
| Two qualifications reconcile rewards simultaneously | `SELECT … FOR UPDATE` row-lock on the referrer inside the issuance transaction |
| Duplicate reward insertion at the same milestone | `@@unique([ownerId, sequenceNumber])`; P2002 → skipped as idempotent success |
| Double fulfillment (two admins, scheduler + admin, retries) | Conditional `updateMany PENDING/FAILED → PROCESSING` claim; only the winner reaches the provider |
| Misconfigured/unknown provider id | `RewardProviderRegistry.resolve()` falls back to `manual` so fulfillment is never bricked |
| Lost financial history for deleted users | Nullable FKs with `SetNull` (see §5) |

**Money rules:** amounts are integer minor units (`amountMinor`) end to end.
The web UI converts at the edges (admin form ×100 on write, ÷100 via
`useFormat()` on read). Currency is any ISO-4217 3-letter code; business logic
is currency-agnostic (`Intl.NumberFormat` handles display).

---

## 7. API reference

Global prefix `api/v1`. User routes are JWT-authenticated
(`req.user.id`); admin routes are `AdminGuard` + throttled to 60/min.

### User endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/referrals/me` | Full dashboard payload: code (created lazily), shareable link, config snapshot, stats, progress, reward list |
| `GET` | `/referrals/me/referrals` | Referred users + qualification status (paginated) |
| `GET` | `/referrals/me/rewards` | Reward ledger (paginated) |

`GET /referrals/me` response shape (all math server-side):

```jsonc
{
  "programEnabled": true,
  "rewardsEnabled": true,
  "referralCode": "ABX23DEFG9",
  "referralLink": "https://offermarket.eu/register?ref=ABX23DEFG9",
  "config": { "threshold": 5, "rewardType": "gift_card",
              "rewardAmountMinor": 2500, "rewardCurrency": "EUR",
              "recurringRewards": true },
  "stats": { "pending": 2, "qualified": 7, "invalidated": 0, "rewardsIssued": 1 },
  "progress": { "successfulReferrals": 7, "nextMilestoneAt": 10, "remaining": 3 },
  "rewards": [ … ]
}
```

### Admin endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/admin/referrals/settings` | `{ settings, fulfillmentProviders }` |
| `PATCH` | `/admin/referrals/settings` | Partial update; merges over stored config; audited |
| `GET` | `/admin/referrals` | Referral ledger; filters `status`, `referrerId` |
| `POST` | `/admin/referrals/:id/invalidate` | Void a referral (body: `reason`) |
| `GET` | `/admin/referrals/rewards` | Reward ledger; filters `status`, `ownerId` |
| `POST` | `/admin/referrals/rewards/:id/fulfill` | Confirm manual fulfillment (or retry FAILED) |
| `POST` | `/admin/referrals/rewards/:id/cancel` | Void a PENDING/FAILED/PROCESSING reward |

### Registration payload

`POST /auth/register/worker` and `/auth/register/employer` accept an optional
`referralCode` (validated as exactly 10 chars from the referral alphabet).
The global validation pipe is `forbidNonWhitelisted`, which is why the field
is explicitly declared on both register DTOs.

### Error codes (stable, i18n-mapped)

| Code | Meaning |
|---|---|
| `referral.not_found` | Referral id unknown |
| `referral.already_invalidated` | Invalidate called twice |
| `referral.reward_not_found` | Reward id unknown |
| `referral.reward_already_fulfilled` | FULFILLED is final |
| `referral.reward_already_cancelled` | CANCELLED is final |
| `referral.reward_already_processing` | Reward mid-fulfillment |
| `referral.settings_invalid` | Settings payload rejected |

All are declared in `apps/api/src/i18n/error-codes.ts` and translated in
`apps/web/src/messages/{en,nl}/errors.json` (the `check:i18n` CI guard
enforces parity).

---

## 8. Notifications & emails

Three events ride the existing EventEmitter2 → `NotificationsService` →
Postgres-outbox pipeline (email + push; notification rows persist in the DB).
The title/body stored in English are fallbacks — the web bell renders
localized copy client-side from `notificationType` + `actionData`.

| Event | Trigger | Payload params |
|---|---|---|
| `REFERRAL_QUALIFIED` → `referral_qualified` | Invitee's email verified | `inviteeFirstName` |
| `REFERRAL_REWARD_EARNED` → `referral_reward_earned` | Reward minted (post-commit) | `sequenceNumber`, `threshold`, `rewardType`, `amountMinor`, `currency` |
| `REFERRAL_REWARD_FULFILLED` → `referral_reward_fulfilled` | Provider reported FULFILLED | `rewardType`, `amountMinor`, `currency` |

Localization keys live in `messages/{en,nl}/notifications.json` under the
snake_case type. Action URL is always `/referrals`.

---

## 9. Audit trail

Two ledgers, both append-only:

- **`AuditLog`** (module-written): `REFERRAL_REWARD_ISSUED` per minted reward
  with `{ sequenceNumber, qualifiedReferrals, threshold, rewardType,
  amountMinor, currency }` — proves *why* each reward exists.
- **`AdminAction`** (admin console): `REFERRAL_SETTINGS_UPDATED`
  (`{previous, next}`), `REFERRAL_REWARD_FULFILLED` (`{ownerId, amount,
  provider}`), `REFERRAL_REWARD_CANCELLED` (`{reason, owner, amount}`),
  `REFERRAL_INVALIDATED` (`{reason, referrerId, referredUserId,
  previousStatus}`).

A reward can always be traced back through: reward row → threshold snapshot →
qualified referrals at the time → who attributed/qualified → which admin
fulfilled it and with what reference.

---

## 10. Frontend

### User dashboard — `/[locale]/referrals`

- Copy/share buttons: link + code, via `navigator.clipboard` with a Web Share
  API fallback and an i18n'd error string if the clipboard is unavailable.
- Blue summary banner, progress bar that resets per milestone window
  (`successfulReferrals % threshold`), "N more referrals until your next €X",
  success/state counters, reward history with lifecycle chips.
- Money rendered via `useFormat().currency(amountMinor / 100, rewardCurrency)`.

### Admin console — `/[locale]/admin/referrals`

- Settings form (all eight knobs; amount edited in **major units** and
  converted to minor on submit) — partial PATCH, server-side merge.
- Referral ledger with status filter + invalidate action.
- Reward ledger with status filter + fulfill/cancel actions + provider
  reference and last-error display.
- Wired through the central axios client (`referralAdminApi`), never raw
  fetch — auth headers and 401/refresh handling are inherited.
- Reachable from the admin dashboard tile.

### Registration capture — `/[locale]/register`

- `?ref=` validated to the 10-char alphabet client-side and uppercased; passed
  to both register endpoints; a green notice confirms the applied code. The
  capture is cosmetic — the server re-validates everything.

### i18n

- New namespace `referrals.json` (en + nl, registered in both `index.ts`
  barrels).
- `auth.register.referralApplied` for the register notice.
- `errors.json` → `referrals.*` section for all seven error codes.
- `notifications.json` → three new notification types.
- `enums.json` → `referral.rewardMilestone` for admin mileage labels.
- Parity enforced by `npm run check:i18n` (3033 = 3033 keys).

### Auth integration

- `/referrals` added to `PROTECTED_PREFIXES` in `AuthContext` (redirects
  anonymous visitors to login).
- «Referrals» link added to both role menus in `Navbar`.

---

## 11. Testing & validation

### Threshold matrix (new spec: `referrals.service.spec.ts`, 43 tests)

| Qualified referrals | Threshold 5, recurring | Rewards issued |
|---:|---|---:|
| 0 | below threshold | 0 |
| 4 | below threshold | 0 |
| 5 | at threshold | 1 |
| 9 | between milestones | 1 |
| 10 | second threshold | 2 |
| 15 | third threshold | 3 |
| 15 (0 issued — self-heal gap) | catch-up run | 3 (sequences #1–#3) |
| 10 (2 issued) | idempotent re-run | 0 |
| 5 after 1 active + 1 cancelled | cancelled milestone | 1 (sequence #3, not a replacement #2) |
| 7 (1 issued), one-time mode | non-recurring | 0 |
| 15, one-time mode | non-recurring | 1 |

Also covered: code generation/retry/uniqueness, full attribution matrix
(valid/empty/disabled/unknown/banned/self/duplicate/error-swallowing),
qualification idempotency and `emailVerified` gating, config-change scenarios
(threshold 10 and 50 → nothing issued; `rewardsEnabled: false` → no
reconciliation; new amount/currency snapshot), settings merge + audit,
fulfillment idempotency and refusal paths, cancel/invalidate guards,
dashboard progress math.

### Validation results

| Check | Result |
|---|---|
| API jest | **593/593 pass** (38 suites, incl. 43 new referral tests) |
| API `tsc --noEmit` + `nest build` | clean |
| Web jest | **176/176 pass** (2 test files needed the new `Gift` icon added to their `lucide-react` mocks) |
| Web `tsc` + `next build` | clean |
| `check:i18n` | en/nl parity 3033 = 3033 keys |
| `prisma migrate status` | schema up to date; migration applied to dev DB |
| API lint (pre-existing) | fails repo-wide: **no ESLint config exists in the repo at all** — unrelated to this feature |

---

## 12. Assumptions & trade-offs

1. **Qualification = email verification.** The only implemented rule. Chosen
   because the platform already gates transactional actions behind
   `VerifiedEmailGuard`; the rule is settings-driven for future options.
2. **Silent-ignore of invalid codes.** Better for signup reliability and
   anti-enumeration; the trade-off is that a fat-fingered code gives no
   feedback (only visible post-login in the dashboard counts).
3. **First attribution wins, permanently.** One referral per user, ever.
   Re-registration or a "better" code cannot re-attribute.
4. **No automatic claw-back.** Invalidating a referral does not rewind
   already-issued rewards; admins cancel them explicitly. History is never
   silently rewritten, at the cost of a two-step fraud remediation.
5. **Referrer must be `ACTIVE`.** Banned/deleted referrers' links silently stop
   attributing.
6. **Rewards stay PENDING until an admin acts.** Deliberate for the manual
   provider; the same code path serves automated providers later.
7. **Missing invitee name in notifications** falls back to a neutral English
   string (server-side) — localized fully client-side.

---

## 13. Future gift-card integration

The only work needed to plug in a real vendor:

1. **Implement** `apps/api/src/modules/referrals/rewards/<vendor>-reward-provider.ts`
   against the `ReferralRewardProvider` interface —
   `fulfill(ctx) → { status: 'FULFILLED' | 'FAILED', providerReference?,
   providerMetadata?, lastError? }`. Idempotency at the service layer is
   already guaranteed (one claim → one provider call).
2. **Register** it: one line in `RewardProviderRegistry`
   (like `manual` in the constructor). Registering twice throws.
3. **Switch settings**: set rewards' `rewardProvider` default (or extend
   `UpdateReferralSettingsDto` with a `defaultRewardProvider` knob) and call
   `processPendingRewards()` from a scheduler/cron — the method already
   claims, fulfills, and records everything.
4. **No schema, engine, or manual-fulfillment changes required.** Historical
   `manual` rewards keep their provider; history remains auditable.

---

## 14. File map

**Backend (`apps/api`)**

```
prisma/schema.prisma                              Referral + ReferralReward models, enums, User.referralCode
prisma/migrations/20260829000000_add_referral_program/migration.sql
prisma/migrations/migration_lock.toml             (restored — was missing from the repo)
src/modules/referrals/referrals.service.ts        lifecycle engine (code → attribution → qualification → rewards → fulfillment)
src/modules/referrals/referrals.controller.ts     user routes (JwtAuthGuard)
src/modules/referrals/referral-admin.controller.ts admin routes (AdminGuard, throttled)
src/modules/referrals/referral-settings.ts        settings schema, defaults, read-time parser/clamps
src/modules/referrals/dto/                        RegisterReferralCodeDto, UpdateReferralSettingsDto, ReferralActionDto
src/modules/referrals/rewards/reward-provider.ts  provider interface
src/modules/referrals/rewards/manual-reward-provider.ts
src/modules/referrals/rewards/reward-provider-registry.ts
src/modules/referrals/__tests__/referrals.service.spec.ts   43 tests
src/modules/auth/auth.service.ts                  attribution (registration tx) + qualification (verify flows)
src/modules/notifications/notifications.service.ts  3 referral listeners
src/i18n/error-codes.ts                           7 new codes
src/common/utils/frontend-base-url.ts             shared FRONTEND_URL helper
src/prisma/seed.ts                                referral_program default row
```

**Frontend (`apps/web`)**

```
src/app/[locale]/referrals/page.tsx               user dashboard
src/app/[locale]/admin/referrals/page.tsx         admin console
src/app/[locale]/register/page.tsx                ?ref= capture + notice
src/lib/api.ts                                    referralsApi, referralAdminApi, register params
src/components/Navbar.tsx                         role-menu links (Gift icon)
src/contexts/AuthContext.tsx                      /referrals in PROTECTED_PREFIXES
src/messages/{en,nl}/referrals.json               new namespace
src/messages/{en,nl}/{auth,errors,notifications,enums,admin,admin-list,nav}.json
```