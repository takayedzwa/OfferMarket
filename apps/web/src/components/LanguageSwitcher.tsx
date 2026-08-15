"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { routing, localeUrl, type AppLocale } from "@/i18n/routing";
import { authApi } from "@/lib/api";
import { Globe, Check } from "lucide-react";

// Compact locale picker for the navbar. With domain-based routing, switching
// locale means navigating to the other domain (e.g. offermarket.eu →
// offermarket.nl), preserving the current path. For authenticated users the
// choice is also persisted server-side via PATCH /auth/me/preferred-locale
// (User.preferredLocale) so it survives across sessions/devices and drives
// server-side email rendering. The PATCH is best-effort and fire-and-forget —
// a failure must not block the domain switch.
export default function LanguageSwitcher() {
  const t = useTranslations("common.languageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchTo(next: string) {
    setOpen(false);
    if (next === locale) return;
    // Domain-based routing: switching locale = navigating to the other domain,
    // preserving the current path. `localeUrl` reads the shared locale→domain
    // map so this works in both dev (*.localhost) and prod.
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      authApi.updatePreferredLocale(next).catch(() => { /* best-effort */ });
    }
    window.location.href = localeUrl(next as AppLocale, pathname);
  }

  const labelFor = (l: string) => (l === "en" ? t("en") : l === "nl" ? t("nl") : l);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded transition-colors"
        aria-label={t("label")}
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline uppercase">{locale}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchTo(l)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors ${
                l === locale
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {labelFor(l)}
              {l === locale && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}