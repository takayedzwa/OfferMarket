import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Public Insights pages are meant to be crawled. Signed-in marketplace areas
// (dashboards, offers, admin, support) are excluded, as are the employer-only
// worker search/profile surfaces (/workers, /workers/[publicId]) — their code
// requires the URL to be neither enumerable nor indexable (SECURITY E-H7) —
// and the personalised insights panel (auth-gated).
// Per-domain: each host must self-reference its own sitemap.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/dashboard",
          "/insights/your-market",
          "/offers",
          "/profile",
          "/conversations",
          "/support",
          "/privacy/dashboard",
          "/workers",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}