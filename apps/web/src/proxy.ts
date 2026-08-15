import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same functionality, new name).
// This runs before every matched request and resolves the locale from the
// request hostname (domain-authoritative; localeDetection is off, so the
// NEXT_LOCALE cookie and Accept-Language header are ignored). Public URLs carry
// no /en or /nl prefix. The matcher below excludes API routes, Next internals,
// and files with extensions (static assets).
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};