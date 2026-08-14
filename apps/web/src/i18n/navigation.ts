import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware navigation helpers. Use these instead of `next/link` and
// `next/navigation`. The active locale is determined by the current domain, so
// public URLs do not contain /en or /nl; `href`s are written without a prefix
// (e.g. `"/offers"`) and `usePathname()` returns the locale-stripped path (so
// `isActive` matching keeps working).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);