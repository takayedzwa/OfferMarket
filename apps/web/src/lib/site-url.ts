import { headers } from "next/headers";

/**
 * Per-domain site URL.
 *
 * OfferMarket runs domain-authoritative locale routing (src/i18n/routing.ts):
 * offermarket.eu serves EN, offermarket.nl serves NL. robots.txt, sitemap.xml
 * and canonical/OG URLs must self-reference the host that serves the request,
 * so a single global NEXT_PUBLIC_SITE_URL (which previously made offermarket.nl
 * advertise offermarket.eu's sitemap) is only a last-resort fallback here.
 *
 * Request-time API (headers) — route handlers and metadata functions using
 * this render per request in this Next version's robots/sitemap conventions.
 * Dev mirrors production via the *.localhost subdomains defined in routing.ts
 * (bare `localhost[:port]` is treated as the EN/default domain).
 */
function isEuHost(host: string): boolean {
  return (
    host === "offermarket.eu" ||
    host === "www.offermarket.eu" ||
    host.startsWith("offermarket.localhost") ||
    /^localhost(:\d+)?$/.test(host) ||
    host.startsWith("127.0.0.1")
  );
}

function isNlHost(host: string): boolean {
  return host === "offermarket.nl" || host.startsWith("offermarket-nl.localhost");
}

export async function getSiteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    if (host && isNlHost(host)) return "https://offermarket.nl";
    if (host && isEuHost(host)) return "https://offermarket.eu";
  } catch {
    // No request context (e.g. build-time generation) — fall through.
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://offermarket.eu";
}
