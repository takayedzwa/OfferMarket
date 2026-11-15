import type { InsightArticleDetail } from "@/lib/api";
import { siteUrlForLocale } from "@/i18n/routing";

// ============================================================================
// STRUCTURED DATA BUILDERS (T6) — pure functions, JSON-LD for @type context
// ----------------------------------------------------------------------------
// Implements the Δ3d placement plan from docs/growth/URL_ARCHITECTURE.md:
//   - Organization + WebSite site-wide (in [locale]/layout.tsx)
//   - Article (not NewsArticle — evergreen market content) on insight pages,
//     with mainEntityOfPage and publisher/author name "OfferMarket"
//   - BreadcrumbList on insight articles (Insights → category → article)
//
// Deliberately NOT included (evidence in AUDIT_REPORT / AI_SEARCH_STRATEGY):
//   - SearchAction (sitelinks search box retired from Google's gallery ~Nov 2024)
//   - FAQPage (restricted to gov/health sites since Aug 2023)
//   - JobPosting (reverse marketplace — no public listings; false signalling)
//   - Person on worker pages
//
// Known gap, intentionally open until T5: `image`. Google's article rich
// result requires a representative image; the site has no brand image asset
// yet, so image is omitted rather than shipping a placeholder favicon as a
// "representative" image.
// ============================================================================

type JsonLd = Record<string, unknown>;

export const SITE_NAME = "OfferMarket";

export function buildOrganizationJsonLd(locale: "en" | "nl"): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    // The Organization is the same legal entity on both locale domains; the
    // serving locale's canonical domain is the URL anchor.
    url: siteUrlForLocale(locale, "/"),
    description:
      locale === "nl"
        ? "Omgekeerde talentmarktplaats voor elektriciens: anonieme profielen, gestructureerde voorstellen, salaris vooraf."
        : "Reverse talent marketplace for electricians: anonymous profiles, structured offers, salary stated up front.",
  };
}

export function buildWebSiteJsonLd(locale: "en" | "nl"): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrlForLocale(locale, "/"),
  };
}

/** BreadcrumbList from an ordered list of { name, url } hops. */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Article JSON-LD for an insight article. Evergreen market data content is
 * `Article`, not `NewsArticle` (audit finding: NewsArticle is a misfit for
 * benchmark/analysis pieces). Headline aligns with the SEO title, matching
 * the visible <title>.
 */
export function buildArticleJsonLd(
  article: InsightArticleDetail,
  slug: string,
  pageUrl: string,
): JsonLd {
  const title = article.seoTitle || article.title;
  // Article rich results require a representative image; the site-wide OG
  // image (app/opengraph-image.tsx, 1200×630) is the site default — per-
  // article images arrive when the CMS grows an image field (T5 note).
  const ogImageUrl = `${new URL(pageUrl).origin}/opengraph-image`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: article.metaDescription || article.summary,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    image: [ogImageUrl],
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.lastUpdatedAt ?? undefined,
    articleSection: article.category,
    author: {
      "@type": "Organization",
      name: article.authorName || "OfferMarket Editorial",
    },
    // Fixed: publisher name was the single-word "Offermarket" (brand
    // inconsistency flagged independently by ai-search-geo + technical-seo).
    publisher: { "@type": "Organization", name: SITE_NAME },
    keywords: article.skills,
  };
}

/**
 * Breadcrumb for an insight article page: Insights → Category → Article.
 * URLs are locale-anchored (same paths on both locale domains).
 */
export function articleBreadcrumbJsonLd(
  locale: "en" | "nl",
  article: InsightArticleDetail,
  slug: string,
  categoryName: string,
): JsonLd {
  const pageUrl = siteUrlForLocale(locale, `/insights/${slug}`);
  const items: Array<{ name: string; url: string }> = [
    { name: "Insights", url: siteUrlForLocale(locale, "/insights") },
    { name: categoryName, url: siteUrlForLocale(locale, `/insights/category/${slug_lower(categoryName)}`) },
    { name: article.title, url: pageUrl },
  ];
  return buildBreadcrumbJsonLd(items);
}

function slug_lower(categoryName: string): string {
  // Category values are already lowercase URL slugs on article payloads
  // (e.g. "salary"); be forgiving with any upper-cased display value.
  return categoryName.toLowerCase();
}
