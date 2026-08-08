import { defineRouting } from 'next-intl/routing';

// Single source of truth for supported locales. To add a language, append its
// code here, create the matching `src/messages/<locale>/` catalog, and add it
// to the backend `preferredLocale` allow-list. No other code changes required.
export const routing = defineRouting({
  locales: ['en', 'nl'],
  defaultLocale: 'en',
  // Always prefix URLs with the locale (`/en/...`, `/nl/...`) for SEO and so the
  // backend can read the locale from the request path.
  localePrefix: 'always',
  // Detection order: URL path -> NEXT_LOCALE cookie -> Accept-Language -> default.
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];