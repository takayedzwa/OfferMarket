# OfferMarket — Deployment Guide

End-to-end deployment strategy for the testing and production environments.

## Architecture at a glance

```
            ┌─────────────┐
  browser ──▶│   Vercel    │  apps/web   (Next.js + next-intl, EN/NL)
            │  Next.js    │
            └──────┬──────┘
                   │ REST + WebSocket (socket.io-client)
                   ▼
            ┌─────────────┐         ┌──────────────┐
            │   Fly.io    │────────▶│   Neon       │  PostgreSQL (managed)
            │ apps/api    │         └──────────────┘
            │ (Docker)    │──▶ ┌──────────────┐
            └─────────────┘    │  Upstash     │  Redis (managed, Socket.IO adapter)
                 ▲  ▲  ▲       └──────────────┘
                 │  │  │
          AWS S3 · AWS SES · Stripe · Twilio · PostHog · Sentry · KvK API
                       (existing managed SaaS — nothing to host)
```

| Piece | Testing | Production |
|---|---|---|
| `apps/web` | Vercel Preview, **or** `docker compose -f docker-compose.prod.yml up` | **Vercel** (eu-central) |
| `apps/api` | Fly.io (ams) **or** the same compose | **Fly.io** (ams), Docker |
| PostgreSQL | compose container / Neon branch | **Neon** (eu-central, backups + PITR) |
| Redis | compose container / Upstash | **Upstash** (eu-central) |
| Files / email / SMS / payments | S3 / SES / Twilio / Stripe (test keys) | production keys |
| Domains / TLS | Caddy (compose `proxy` profile) or Vercel + Fly auto-TLS | Vercel + Fly auto-TLS |

Two facts drove this split:

1. The API is a **long-running process with WebSockets** — it cannot run on serverless (Vercel functions). It belongs in a container.
2. The product is **Dutch / GDPR-scoped**, so every region is EU (`ams`, `eu-central`) and only EU-resident providers are used.

## Why these choices

- **Vercel for web** — zero-config for Next.js + `next-intl`, automatic previews per PR, edge image optimization. Cheapest path for the frontend.
- **Fly.io for the API** — websocket-friendly, EU region, scale-to-zero for cheap testing, builds the Docker image remotely, runs a `release_command` so migrations always land before new code is live.
- **Neon / Upstash** — managed Postgres/Redis give backups, PITR, and scaling without you running databases in containers in prod. (GDPR Art. 32: availability + recoverability.)
- **Docker for both apps anyway** — even though web runs on Vercel, the web `Dockerfile` (standalone build) keeps local dev, CI, and a future Vercel-exit path identical to the API. Contributors get one command for the whole stack.

## Prerequisites

- Node 20+, Docker, `npm` (workspace root).
- Accounts: Vercel, Fly.io (`flyctl auth login`), Neon, Upstash, plus existing AWS/Stripe/Twilio/PostHog/Sentry.
- GitHub secrets (for CI deploy): `FLY_API_TOKEN` (`flyctl auth token`).

---

## Part A — Local / integration testing (the whole stack on one machine)

### 1. Prepare env files
```bash
cp .env.example .env                          # root: compose vars + secrets
# generate strong secrets
openssl rand -hex 32  # → JWT_SECRET
openssl rand -hex 32  # → JWT_REFRESH_SECRET
head -c 32 /dev/urandom | base64 | head -c 32  # → ENCRYPTION_KEY (32 chars)
# fill JWT_SECRET / JWT_REFRESH_SECRET / ENCRYPTION_KEY / POSTGRES_* in .env

cp apps/api/.env.example apps/api/.env        # SaaS keys (S3, SES, Stripe, Twilio, KVK, Sentry, PostHog)
# fill the third-party keys you actually use
```

### 2. Build and run everything
```bash
docker compose -f docker-compose.prod.yml up --build
```
- web → http://localhost:3000
- api → http://localhost:3001/api/v1
- Postgres + Redis start with healthchecks; the API waits for both, runs
  `prisma migrate deploy` (`RUN_MIGRATIONS=1`), then boots NestJS.

### 3. (Optional) Add the TLS reverse proxy
Point `offermarket.nl` and `api.offermarket.nl` DNS at this host, edit `Caddyfile`, then:
```bash
docker compose -f docker-compose.prod.yml --profile proxy up -d
```
Caddy issues Let's Encrypt certs automatically. For purely local TLS testing, keep the commented `:80` block in `Caddyfile`.

> The existing `docker-compose.yml` (postgres + redis only) is unchanged and still used by the host-based `npm run dev` workflow.

---

## Part B — Production

### Step 1 — Provision managed data services (EU)

1. **Neon** — create a project in `eu-central` (AWS Frankfurt). Create a `main` branch for prod and a `testing` branch for staging. Copy the pooled connection string.
2. **Upstash** — create a Redis DB in `eu-central-1`. Copy the endpoint URL. *(Note: the `@socket.io/redis-adapter` is declared but not yet wired into `notifications.gateway.ts`; Redis is provisioned now so enabling multi-instance WebSockets later is a config-only change. Until then the app runs fine with a single API instance.)*

### Step 2 — Deploy the web app to Vercel
1. Import the repo in Vercel. Root directory: leave as repo root; Vercel detects the Next.js workspace.
2. Set the project root to `apps/web` (or configure build to run `npm run build --workspace=apps/web`).
3. Environment variables (production):
   - `NEXT_PUBLIC_API_URL` = `https://api.offermarket.nl/api/v1`
   - any `NEXT_PUBLIC_*` analytics keys.
4. Domains → add `offermarket.nl` (Vercel manages TLS + DNS).
5. Every push to `main` auto-deploys; PRs get preview URLs.

> `NEXT_PUBLIC_*` values are baked in at build time, so they must be set in Vercel's project env **before** the first production build.

### Step 3 — Deploy the API to Fly.io
```bash
flyctl launch --no-deploy          # one time: creates the app, links fly.toml
# Set all runtime secrets (one-time, then on rotation):
flyctl secrets set DATABASE_URL="postgresql://..." \
  REDIS_URL="rediss://..." \
  FRONTEND_URL="https://offermarket.nl" \
  JWT_SECRET="..." JWT_REFRESH_SECRET="..." ENCRYPTION_KEY="..." \
  AWS_REGION="eu-west-1" AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." \
  AWS_S3_BUCKET="offermarket-documents" SES_FROM_EMAIL="noreply@offermarket.nl" \
  STRIPE_SECRET_KEY="..." STRIPE_WEBHOOK_SECRET="..." STRIPE_PRICE_ID_INTRODUCTION="..." \
  TWILIO_ACCOUNT_SID="..." TWILIO_AUTH_TOKEN="..." TWILIO_PHONE_NUMBER="..." \
  KVK_API_KEY="..." KVK_API_URL="https://api.kvk.nl/" \
  SENTRY_DSN="..." POSTHOG_API_KEY="..." POSTHOG_HOST="https://app.posthog.com"

flyctl deploy --config fly.toml --remote-only
```
- `fly.toml` `release_command` runs `prisma migrate deploy` before each deploy is promoted — the new code never serves against an old schema.
- `internal_port = 3001` matches the NestJS `PORT`.
- `auto_stop_machines = true` keeps testing cheap; for prod set `min_machines_running = 1` (or more) to avoid cold starts and support WebSockets.
- Custom domain: `flyctl certs add api.offermarket.nl` → add the returned CNAME → Fly provisions TLS.

### Step 4 — Configure the API's CORS
The API allows origins from `FRONTEND_URL` (comma-separated). In prod:
```
flyctl secrets set FRONTEND_URL="https://offermarket.nl,https://www.offermarket.nl"
```
Add any Vercel preview domains you want to allow.

### Step 5 — Stripe webhook
Point Stripe's webhook endpoint at `https://api.offermarket.nl/api/v1/payments/webhook` and set `STRIPE_WEBHOOK_SECRET` to the signing secret Stripe shows you.

### Step 6 — CI/CD (`.github/workflows/deploy.yml`)
- On push to `main`: install → prisma generate → api tests → web tests → `flyctl deploy --remote-only`.
- Add the `FLY_API_TOKEN` GitHub secret.
- Web deploys are handled by Vercel's own GitHub integration (no CI step needed).
- PRs still run tests via `.github/workflows/pr-tests.yml`.

---

## Environment variables — where each one lives

| Variable | Where it's set | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Vercel project env (prod) / web build arg (compose) | Baked at build time |
| `DATABASE_URL` | Fly secret (prod) / compose `environment` (local) | Neon pooled string in prod |
| `REDIS_URL` | Fly secret (prod) / compose `environment` (local) | Upstash `rediss://` in prod |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` | Fly secret + root `.env` | Generate strong values; never commit |
| `FRONTEND_URL` | Fly secret + root `.env` | Drives API CORS |
| SaaS keys (S3/SES/Stripe/Twilio/KVK/Sentry/PostHog) | Fly secrets + `apps/api/.env` | See `apps/api/.env.example` |

## Migrations

- **Dev:** `npm run db:migrate` (`prisma migrate dev`) — creates + applies migrations.
- **Prod:** `prisma migrate deploy` only — never `migrate dev`. Fly's `release_command` runs it automatically; the compose stack runs it via `RUN_MIGRATIONS=1`.
- For Neon, apply the same migrations to the `testing` branch first, then promote to `main`.

> **Baseline reset (2026-08-10):** the previous migration history had drifted
> badly from `schema.prisma` — two enums (`IndustryType`, `TicketPriority`)
> were referenced by migrations but never created, and `IndustryType`'s values
> had been redesigned so the old `ALTER` added values that no longer exist in
> the schema. Since there was no production database yet, the history was
> replaced with a single baseline migration `20260810000000_init` generated
> from the current `schema.prisma` (verified zero drift: DB matches schema
> exactly after `migrate deploy`). The old migrations are kept in
> `apps/api/prisma/migrations.old/` for reference and in git history — safe to
> delete once you've confirmed the baseline works.
>
> **Existing dev databases must be reset** to pick up the new baseline:
> ```bash
> npm run db:migrate --workspace=apps/api -- reset   # or: npx prisma migrate reset
> ```

> **Prisma engine targets:** `schema.prisma` pins `binaryTargets` to
> `["native", "linux-musl-openssl-3.0.x", "linux-musl-arm64-openssl-3.0.x"]`
> so the Prisma query engine loads inside the alpine Docker image (openssl 3)
> on both arm64 and x64. If you change the generator block, run
> `npm run db:generate` and rebuild the API image.

## GDPR / data-residency checklist

- All compute regions are EU (`ams`, `eu-central`, `eu-west-1`).
- Postgres (Neon) and Redis (Upstash) in `eu-central`.
- S3 bucket in `eu-west-1` (Dublin — EU).
- PostHog / Sentry: prefer EU-hosted endpoints; switch `POSTHOG_HOST` / `SENTRY_DSN` to EU instances.
- Backups enabled on Neon (PITR) — satisfies Art. 32 availability/recoverability.
- `ENCRYPTION_KEY` (worker-PII field encryption) is rotated via Fly secrets; never logged.

## Operational checklist

- [ ] Fly health checks passing (`flyctl status`)
- [ ] Vercel build green, preview deploy reviewed
- [ ] Neon automated backups + PITR enabled
- [ ] Stripe webhook signing secret set and verified
- [ ] `JWT_SECRET` / `JWT_REFRESH_SECRET` / `ENCRYPTION_KEY` generated (not `change-this-in-production`)
- [ ] `prisma migrate deploy` runs in release step (Fly) / on boot (compose)
- [ ] DNS + TLS: `offermarket.nl` (Vercel), `api.offermarket.nl` (Fly certs)
- [ ] Sentry DSN + PostHog keys set for prod

## Optional improvements

- **Slimmer API image:** move migrations to a dedicated release step only (already done via Fly `release_command`), then add `RUN npm prune --omit=dev` after the build stage in `apps/api/Dockerfile` and re-add the `prisma` CLI via a thin runtime install, or copy `node_modules/.bin/prisma` + its package explicitly. Saves ~100 MB.
- **Push images to GHCR** and have Fly deploy the prebuilt image (faster deploys, better supply-chain control) instead of `--remote-only` source builds.
- **Wire the Redis adapter** into `notifications.gateway.ts` (`createAdapter`) so WebSockets work across multiple API instances — then you can scale `min_machines_running` beyond 1.