'use client';

import { useTranslations } from 'next-intl';

/**
 * useApiErrorMessage — translates backend error codes to user-facing strings.
 *
 * The backend AllExceptionsFilter normalizes every error response to
 * `{ statusCode, message, code?, params? }`. Migrated throw sites carry a
 * stable `code` (e.g. `auth.invalid_credentials`) that maps to a key in the
 * `errors` next-intl namespace; `params` holds ICU interpolation values.
 *
 * Resolution order (zero-regression by design):
 *   1. If the error carries a `code` AND the `errors` catalog has a translation
 *      for it → return `t(code, params)`. (Specific, localized message.)
 *   2. Else if a backend `message` is present → return it as-is. (English
 *      fallback for unmigrated throw sites — preserves the specific text the
 *      backend produced, so partial migration never degrades UX.)
 *   3. Else if it's a network error (no response) → `t('error.network')`.
 *   4. Else → `t('error.unknown')`.
 *
 * `t()` throws on a missing message key in dev; the try/catch falls through to
 * the English `message` so a forgotten catalog entry never breaks the UI. The
 * Phase 5 CI missing-key guard catches such gaps at build time.
 */
export function useApiErrorMessage() {
  const t = useTranslations('errors');

  return (error: unknown): string => {
    const data = extractApiErrorData(error);
    const code = data?.code;
    const params = (data?.params ?? {}) as Record<string, string | number | Date>;
    const message = data?.message;

    if (code) {
      try {
        return t(code, params);
      } catch {
        // No translation for this code yet — fall through to the English message.
      }
    }

    if (message) {
      // ValidationPipe errors arrive as an array; join for display.
      return Array.isArray(message) ? message.join(' ') : String(message);
    }

    // No backend payload — likely a network/transport error.
    const hasResponse = !!(error as { response?: unknown })?.response;
    return hasResponse ? t('error.unknown') : t('error.network');
  };
}

interface ApiErrorData {
  code?: string;
  message?: string | string[];
  params?: Record<string, unknown>;
}

function extractApiErrorData(error: unknown): ApiErrorData | undefined {
  // Axios-shaped errors carry the backend body under `response.data`.
  const response = (error as { response?: { data?: ApiErrorData } })?.response;
  if (response?.data) {
    return response.data;
  }
  return undefined;
}