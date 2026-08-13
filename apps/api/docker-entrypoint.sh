#!/bin/sh
# OfferMarket API container entrypoint.
#
# Runs pending Prisma migrations (when RUN_MIGRATIONS=1) before starting the
# NestJS server. Migrations are skipped by default so the same image can be
# used for one-off commands (e.g. `fly ssh console`) without mutating the DB.
#
# For multi-instance production, prefer running migrations as a dedicated
# release step (Fly `release_command` or CI) and leave RUN_MIGRATIONS unset on
# the app machines to avoid concurrent-migration races.
set -e

if [ "${RUN_MIGRATIONS}" = "1" ]; then
  echo "▶ Running prisma migrate deploy…"
  npx --no-install prisma migrate deploy
fi

exec "$@"