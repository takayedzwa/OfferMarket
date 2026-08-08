"use client";

import { useLocale } from "next-intl";
import { formatCurrency, formatDate } from "@/lib/api";

// Locale-aware formatting for client components. Delegates to the canonical
// `lib/api` helpers so there is a single formatting implementation (the hook
// just supplies the active locale from `useLocale()`). Replaces the many
// inline `Intl.NumberFormat('nl-NL', …)` / `toLocaleDateString()` call sites
// that were hardcoded to Dutch regardless of the user's chosen language.
//
// Usage:
//   const { currency, date } = useFormat();
//   <span>{currency(amount)}</span>          // €1.234,56 (nl) / €1,234.56 (en)
//   <span>{date(offer.createdAt)}</span>     // long date in the active locale
export function useFormat() {
  const locale = useLocale();

  return {
    locale,
    currency: (amount: number, currency = "EUR", options?: Intl.NumberFormatOptions) =>
      formatCurrency(amount, currency, locale, options),
    date: (date: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, locale, options),
  };
}