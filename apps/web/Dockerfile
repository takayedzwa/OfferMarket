# syntax=docker/dockerfile:1
#
# OfferMarket Web (Next.js standalone)
#
# Build context MUST be the repository root (npm workspace monorepo).
#
#   docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api/v1 -t offermarket-web .
#
# This container is primarily for local development, CI, and portability —
# production web runs on Vercel, which builds the same app natively. Keeping
# the Dockerfile means contributors get a one-command full stack
# (`docker compose -f docker-compose.prod.yml up`) and we can move off Vercel
# later without refactoring.
#
# NOTE: NEXT_PUBLIC_* values are inlined by Next.js at BUILD time, so
# NEXT_PUBLIC_API_URL must be passed as a build arg, not a runtime env var.

# ---- deps: install workspace dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci

# ---- build: compile Next.js standalone ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
COPY apps/api/package.json ./apps/api/
# Inlined into the client bundle at build time (see note above).
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace=apps/web

# ---- runtime: minimal standalone server ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
# standalone mirrors the monorepo layout: server.js lives under apps/web/
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 3000
CMD ["node", "apps/web/server.js"]