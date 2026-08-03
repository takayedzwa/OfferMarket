import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware navigation helpers. Use these instead of `next/link` and
// `next/navigation` so links automatically include the active locale prefix and
// `usePathname()` returns the locale-stripped path (so `isActive` matching keeps
// working). `href`s stay written without the prefix (e.g. `"/offers"`).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);