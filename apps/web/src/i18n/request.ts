import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

// Resolves the locale + message catalog for each request. The locale is
// negotiated by the proxy (`src/proxy.ts`) and provided via `requestLocale`;
// we validate it and fall back to the default if anything is off.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // Each locale has an `index.ts` barrel that re-exports all namespace JSON
    // files, so adding a namespace = one file + one re-export line.
    messages: (await import(`@/messages/${locale}/index`)).default,
  };
});