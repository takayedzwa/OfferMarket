// ============================================================================
// EMAIL I18N CATALOG LOADER
// ----------------------------------------------------------------------------
// Minimal, dependency-free server-side email translation. Rendered at send
// time from `User.preferredLocale` so outbound email matches the recipient's
// chosen language. This deliberately avoids a third-party i18n dependency —
// the MailService is described as "deliberately minimal, dependency-free", and
// transactional emails only need dot-key lookup + `{param}` interpolation.
//
// Scalability: adding a language = create `<locale>/email.ts` and add one
// entry to `CATALOGS` below + list it in `SUPPORTED_EMAIL_LOCALES`. No other
// code changes.
//
// Zero-regression: unknown locale or missing key falls back to English, which
// matches the historical hardcoded strings exactly.
// ============================================================================

import { enEmail } from './en/email';
import { nlEmail } from './nl/email';

/** Locales that have a complete email catalog. Mirrors frontend locales. */
export const SUPPORTED_EMAIL_LOCALES = ['en', 'nl'] as const;
const DEFAULT_LOCALE = 'en';

// Catalog registry. To add a language: import it here and add an entry.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CATALOGS: Record<string, any> = {
  en: enEmail,
  nl: nlEmail,
};

/** Coerce an arbitrary (possibly null/undefined) locale to a supported one. */
export function resolveEmailLocale(locale?: string | null): string {
  if (locale && (SUPPORTED_EMAIL_LOCALES as readonly string[]).includes(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
}

/** Look up a dot-notation key (e.g. "verification.body") in a catalog object. */
function lookup(catalog: Record<string, unknown>, dotkey: string): string | null {
  const parts = dotkey.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = catalog;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : null;
}

/** Replace `{name}` placeholders with params (single pass, no recursion). */
function interpolate(tpl: string, params?: Record<string, string | number>): string {
  if (!params) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (match, name: string) => {
    const val = params[name];
    return val === undefined ? match : String(val);
  });
}

/**
 * Translate an email message key in the given locale, interpolating params.
 * Falls back to English when the key is absent in the requested locale, and to
 * the raw key when absent everywhere (defensive — should not happen for
 * catalogs that mirror English).
 */
export function translateEmail(
  key: string,
  locale?: string | null,
  params?: Record<string, string | number>,
): string {
  const loc = resolveEmailLocale(locale);
  const catalog = CATALOGS[loc] ?? CATALOGS[DEFAULT_LOCALE];
  const raw = lookup(catalog, key) ?? lookup(CATALOGS[DEFAULT_LOCALE], key);
  if (raw === null) return key;
  return interpolate(raw, params);
}