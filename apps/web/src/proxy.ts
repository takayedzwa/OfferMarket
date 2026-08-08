import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same functionality, new name).
// This runs before every matched request, negotiates the locale (URL → cookie →
// Accept-Language → default), and rewrites/redirects so every route is served
// under a locale prefix. The matcher below excludes API routes, Next internals,
// and files with extensions (static assets).
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};