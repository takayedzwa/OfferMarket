import type { Metadata } from "next";
import { siteUrlForLocale, type AppLocale } from "@/i18n/routing";

/**
 * Shared-template canonical + cross-domain hreflang alternates.
 *
 * Implements the Δ5 canonical/hreflang matrix from docs/growth/URL_ARCHITECTURE.md
 * for the "shared bilingual template" surface class (home, /pricing, listing
 * hubs, static/legal pages):
 *   - self-canonical on the locale's own domain (host-authoritative i18n)
 *   - languages: same path on each locale domain (unlocalized path set)
 *   - x-default → offermarket.eu (the EN/international domain)
 *
 * Static, derived from the locale param — no request-time API, so pages using
 * it keep their per-locale prerendering. Article hreflang is deliberately NOT
 * provided by this helper (audit M4: article pairs are mis-signalling until
 * per-locale article content exists — insights use self-canonical only).
 */
export function buildSharedAlternates(
  locale: AppLocale,
  path: string,
): NonNullable<Metadata["alternates"]> {
  const eu = siteUrlForLocale("en", path);
  const nl = siteUrlForLocale("nl", path);
  return {
    canonical: siteUrlForLocale(locale, path),
    languages: {
      en: eu,
      nl: nl,
      "x-default": eu,
    },
  };
}

// ============================================================================
// OG/Twitter image defaults (T5)
// ----------------------------------------------------------------------------
// The opengraph-image file convention (app/opengraph-image.tsx) serves the
// 1200×630 PNG at /opengraph-image AND injects og:image/twitter:image on
// every route — but a page that defines its own `openGraph`/`twitter`
// metadata object REPLACES the inherited object, dropping the injected tags.
// Any page with a custom openGraph/twitter object must include these images
// explicitly. Relative URLs resolve against the per-domain metadataBase,
// so /opengraph-image is correct on both locale domains.
// ============================================================================
export const OG_IMAGE_REFERENCE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "OfferMarket",
} as const;

type OpenGraphImages = NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;

export function ogImages(): OpenGraphImages {
  return [OG_IMAGE_REFERENCE];
}

export function twitterImages(): string[] {
  return ["/opengraph-image"];
}
