"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { authApi } from "@/lib/api";
import { Globe, Check } from "lucide-react";

// Compact locale picker for the navbar. Persists the choice to the NEXT_LOCALE
// cookie (read by the proxy on the next request) and navigates to the same path
// under the new locale. For authenticated users the choice is also persisted
// server-side via PATCH /auth/me/preferred-locale (User.preferredLocale) so it
// survives across sessions/devices and drives server-side email rendering. The
// PATCH is best-effort and fire-and-forget — a failure must not block the UI
// locale switch.
export default function LanguageSwitcher() {
  const t = useTranslations("common.languageSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
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
    // Navigating to the localized path also persists the choice: the proxy
    // (`src/proxy.ts`) sets the NEXT_LOCALE cookie when it processes the
    // request, so future visits resolve to this locale.
    router.replace(pathname, { locale: next });
    // Persist server-side for authenticated users (best-effort). The interceptor
    // attaches the JWT if present; a 401/403 just means the user is a guest —
    // the cookie above already handles their session.
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      authApi.updatePreferredLocale(next).catch(() => { /* best-effort */ });
    }
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