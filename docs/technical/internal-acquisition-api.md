# Internal Acquisition Boundary — API contract

Service-to-service endpoints offered by OfferMarket to `offermarket-ai-acquisition`.
The acquisition service may never touch the OfferMarket database directly.

## Authentication

Every call carries the shared secret in the `x-api-key` header. The value is
`INTERNAL_API_KEY` on both sides (`openssl rand -hex 24`). The boundary is
fail-closed: if the env var is empty/unset on OfferMarket, **all** calls are
rejected with 401 `internal.unauthorized`.

## Routes

Global prefix applies (`apps/api/src/main.ts`), so the effective paths are:

| Method | Path                                        | Purpose |
|---|---|---|
| POST | `/api/v1/internal/workers` | Create WhatsApp-acquired worker account + initial profile |
| POST | `/api/v1/internal/workers/:id/profile` | Create/update the profile (partial, workers' own update rules) |
| GET  | `/api/v1/internal/workers/:id/profile` | Whitelisted profile view |
| POST | `/api/v1/internal/workers/:id/activate` | Activate (visibility + availability) |

`:id` is the worker **publicId** (`W-000123`) returned from the create call —
never an internal DB uuid.

## POST /internal/workers

```json
{
  "phone": "+31612345678",
  "idempotencyKey": "conv-<conversation-id>",
  "firstName": "Jan",
  "source": "AI_ACQUISITION",
  "platform": "META",          // optional ad platform — META today; GOOGLE/TIKTOK/ORGANIC later
  "campaignId": "…",           // optional Meta attribution (ids from the CTWA webhook)
  "campaignName": "…",         // optional names, filled when the caller has them
  "adId": "…",
  "adName": "…",
  "adSetId": "…",
  "adSetName": "…",
  "profile": {                  // optional, same shape as worker self-service update DTO
    "yearsOfExperience": 7,
    "primaryTrade": "ELEKTRO",
    "specializations": ["INDUSTRIE"],
    "postalCode": "3011AA"
  }
}
```

Responses:

- `201` — created: `{ workerId, availability, profileVisibility, isProfileComplete, profileCompletenessPct, replayed: false }`
- `200` — replay (`replayed: true`): same idempotency key, or same phone that
  already has a worker. Safe to retry; never creates a duplicate account.
- `409` — phone exists but belongs to a non-acquisition account.

Rules:

- `idempotencyKey` is required and unique per onboarding conversation (unique
  constraint on `Worker.acquisitionIdempotencyKey`; concurrent P2002 resolves
  to the winner).
- The AI service must map free-text answers to **canonical enum values**
  (specializations etc.) before sending; the boundary validates, it does not
  interpret Dutch answers.
- Workers created here have no usable email/password (placeholder email
  `wa-<digits>@acquisition.placeholder`, random unlogged password). If the
  worker gave a real email, send `email`.
- Workers are created with `availability: NOT_AVAILABLE`; call activate to
  publish.
- Account ↔ profile failure compensation: if profile creation fails, the
  just-created account is deleted so retries resolve cleanly.

Attribution note: `Worker.acquisitionPlatform` (+ the optional names) make
"workers created/activated per campaign / ad set / ad" answerable directly on
OfferMarket via SQL joins — `self-service` signups are NULL everywhere, so
`WHERE acquisition_campaign_id IS NOT NULL` isolates the acquired cohort. The
campaign/adset/ad **names** are filled by the AI service's enrichment step
whenever it fetches them from the ad platform API; ids are present from the
webhook at create time.

## POST /internal/workers/:id/profile

Body: any subset of the worker self-service update DTO (`UpdateWorkerDto`).
Naturally idempotent. Returns `workerId`, completeness numbers, availability,
visibility.

## POST /internal/workers/:id/activate

```json
{ "availability": "IMMEDIATE", "profileVisibility": "ALL_VERIFIED" }
```

Both optional with those exact defaults. Idempotent. Activation = availability
off `NOT_AVAILABLE` + visibility; there is no separate activation state in the
domain model.

## Rate limiting

Global throttler (100/min/IP) applies, plus 30/min per internal route. Since
ALL internal traffic shares one caller IP, tune these if the acquisition
service bursts.

## Audit

Every boundary operation writes an `AuditLog` row
(`INTERNAL_ACQUISITION_WORKER_CREATED`, `..._PROFILE_UPDATED`,
`..._PROFILE_ACTIVATED`) with the caller IP / request id. Visible via the
existing admin audit-log endpoints.

## Operations

- Generate/rotate the key: `openssl rand -hex 24`; set `INTERNAL_API_KEY` on
  both services.
- Apply migration `20261004120000_add_worker_acquisition_fields`.
- Related code: `apps/api/src/modules/internal/`, guard in
  `apps/api/src/guards/internal-api-key.guard.ts`, error codes
  `internal.*` in `apps/api/src/i18n/error-codes.ts`.