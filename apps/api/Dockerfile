# syntax=docker/dockerfile:1
#
# OfferMarket API (NestJS + Prisma)
#
# Build context MUST be the repository root (this is an npm workspace monorepo,
# so the build needs the root package.json + lockfile to resolve dependencies).
#
#   docker build -f apps/api/Dockerfile -t offermarket-api .
#
# Used in production (Fly.io) and in docker-compose for local/integration testing.

# ---- deps: install all workspace dependencies (dev + prod) ----
FROM node:20-alpine AS deps
# bcrypt ships a native addon; it needs a toolchain to compile on alpine.
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci requires every workspace's package.json to be present to validate
# the lockfile, so copy both apps even though we only build the api.
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci

# ---- build: generate Prisma client, compile NestJS ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/
# Generate the Prisma client into node_modules (runtime depends on it).
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
# Compile the NestJS app to ./apps/api/dist
RUN npm run build --workspace=apps/api

# ---- runtime: minimal production image ----
# NOTE: we intentionally keep the full node_modules (no `npm prune --omit=dev`)
# so the `prisma` CLI remains available for `prisma migrate deploy` at start.
# Slim this later by moving migrations to a separate release step (see
# DEPLOYMENT.md) and pruning dev dependencies.
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
# Prisma's query/schema engines link against OpenSSL; alpine doesn't ship it.
RUN apk add --no-cache openssl
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
# Copy with --chown=app:app so the non-root user owns the files at copy time
# (a separate `chown -R` would duplicate the whole tree into a new layer).
# Ownership of node_modules lets Prisma extract engine binaries into
# node_modules/@prisma/engines at migrate time.
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=app:app /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=app:app /app/apps/api/package.json ./apps/api/package.json
COPY --chown=app:app package.json package-lock.json ./
COPY --chown=app:app apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh
USER app
WORKDIR /app/apps/api
EXPOSE 3001
# Optional: set RUN_MIGRATIONS=1 to run `prisma migrate deploy` before boot.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]