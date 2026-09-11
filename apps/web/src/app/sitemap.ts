import type { MetadataRoute } from "next";
import { insightsApi } from "@/lib/api";

// SEO architecture: clean URLs + a generated sitemap that includes every
// published insight article. Static marketing/marketplace routes are listed
// directly; article slugs come from the Insights API at generation time
// (regenerated on each deploy — articles published between deploys surface
// on the next deploy, which matches the current CI/CD cadence).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://offermarket.eu";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/insights`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/register`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];

  for (const category of ["salary", "demand", "employer", "industry", "career"]) {
    staticRoutes.push({
      url: `${SITE_URL}/insights/category/${category}`,
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
        url: `${SITE_URL}/insights/${article.slug}`,
        lastModified: article.lastUpdatedAt ? new Date(article.lastUpdatedAt) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // The sitemap must not fail the deploy when the API is unreachable.
    return staticRoutes;
  }
}