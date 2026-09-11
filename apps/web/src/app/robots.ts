import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://offermarket.eu";

// Public Insights pages are meant to be crawled. Signed-in marketplace areas
// (dashboards, offers, admin, support) are excluded.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/dashboard",
          "/offers",
          "/profile",
          "/conversations",
          "/support",
          "/privacy/dashboard",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}