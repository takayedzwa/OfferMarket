import { defineRouting } from 'next-intl/routing';

// Single source of truth for supported locales. To add a language, append its
// code to `LOCALES`, create the matching `src/messages/<locale>/` catalog, add
// its domain below, and add it to the backend `preferredLocale` allow-list.
const LOCALES = ['en', 'nl'] as const;
export type AppLocale = (typeof LOCALES)[number];

const isDev = process.env.NODE_ENV === 'development';

// Single source of truth for locale → canonical domain. Shared by routing and
// LanguageSwitcher (via `localeUrl`). The domain is authoritative for language;
// public URLs contain no /en or /nl prefix.
//
// Dev uses *.localhost subdomains, which resolve to 127.0.0.1 automatically on
// macOS (Linux needs the two /etc/hosts entries documented in the README). Prod
// uses the real domains.
const DOMAIN_FOR_LOCALE: Record<AppLocale, string> = isDev
  ? { en: 'offermarket.localhost:3000', nl: 'offermarket-nl.localhost:3000' }
  : { en: 'offermarket.eu', nl: 'offermarket.nl' };

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
  // Locale is determined by the domain. Public URLs do not contain /en or /nl.
  localePrefix: 'never',
  domains: [
    { domain: DOMAIN_FOR_LOCALE.en, defaultLocale: 'en', locales: ['en'] },
    { domain: DOMAIN_FOR_LOCALE.nl, defaultLocale: 'nl', locales: ['nl'] },
  ],
  // The domain is authoritative for language. Do not let the browser's
  // Accept-Language override it.
  localeDetection: false,
});

// Build a full URL for `locale` on its canonical domain, preserving the current
// path. Used by LanguageSwitcher to switch domains. No localized pathname
// mappings exist today, so the path is passed through unchanged.
export function localeUrl(locale: AppLocale, pathname: string): string {
  const proto = isDev ? 'http' : 'https';
  return `${proto}://${DOMAIN_FOR_LOCALE[locale]}${pathname}`;
}