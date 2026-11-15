import type { MetadataRoute } from "next";
import { insightsApi } from "@/lib/api";
import { getSiteUrl } from "@/lib/site-url";

// SEO architecture: clean URLs + a generated sitemap that includes every
// published insight article. Static marketing/legal routes are listed
// directly; article slugs come from the Insights API at generation time.
//
// Generation semantics (T7 fix): `force-dynamic` means this regenerates on
// EVERY request (not per deploy, as the old comment claimed) — an API hit per
// fetch. Keep the semantics explicit in code and in this comment; revisit
// with a short revalidate under T8 if the API load ever matters.
//
// Indexable-only surfaces (URL_ARCHITECTURE Δ3a): no /login (auth page,
// noindex), legal pages included so crawlers don't rely on footer discovery.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getSiteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}`, changeFrequency: "daily", priority: 1, lastModified: new Date() },
    { url: `${siteUrl}/insights`, changeFrequency: "daily", priority: 0.9, lastModified: new Date() },
    { url: `${siteUrl}/for-workers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/for-employers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/register`, changeFrequency: "monthly", priority: 0.7 },
    // Legal / DSA pages — indexable, low priority.
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/dsa/report`, changeFrequency: "yearly", priority: 0.2 },
  ];

  for (const category of ["salary", "demand", "employer", "industry", "career"]) {
    staticRoutes.push({
      url: `${siteUrl}/insights/category/${category}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  try {
    const res = await insightsApi.listArticles({ limit: 100 });
    const articles: Array<{ slug: string; lastUpdatedAt?: string }> = res.data.items ?? [];
    return [
      ...staticRoutes,
      ...articles.map((article) => ({
        url: `${siteUrl}/insights/${article.slug}`,
        lastModified: article.lastUpdatedAt ? new Date(article.lastUpdatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    // T7 fix: the outage must not fail the sitemap, but it may not pass
    // silently either — articles silently vanishing from the sitemap is
    // exactly the failure mode this catch used to hide.
    console.error("[sitemap] insightsApi.listArticles failed; emitting static routes only:", error);
    return staticRoutes;
  }
}
