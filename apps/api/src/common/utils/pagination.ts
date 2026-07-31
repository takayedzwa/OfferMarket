/**
 * Shared pagination parsing for admin/support endpoints.
 *
 * A-M2: controllers previously parsed `page`/`limit` query strings with a bare
 * `parseInt()` and no bounds checking, so a client could request
 * `limit=10000` and pull an unreasonably large result set. These helpers
 * clamp the values to a safe range:
 *   - page  must be a finite integer >= 1
 *   - limit must be a finite integer in [1, max] (default max 100)
 * Non-numeric / missing values fall back to the provided defaults.
 */

const DEFAULT_MAX_LIMIT = 100;

export function parsePage(raw: string | undefined, fallback = 1): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export function parseLimit(
  raw: string | undefined,
  fallback = 20,
  max = DEFAULT_MAX_LIMIT,
): number {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}