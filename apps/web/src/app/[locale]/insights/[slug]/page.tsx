import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { insightsApi, type InsightArticleDetail } from "@/lib/api";
import { ogImages, twitterImages } from "@/lib/metadata";
import { siteUrlForLocale } from "@/i18n/routing";
import { buildArticleJsonLd, articleBreadcrumbJsonLd } from "@/lib/structured-data";
import ArticleView from "./ArticleView";

// T8 — article TTFB: uncached per-request API fetch was the audit F12b
// finding. With no request-time APIs in this route, `revalidate` enables
// ISR: the rendered page is cached for 5 minutes, so article TTFB is not
// gated on api.offermarket.eu for every view. Edited/published articles
// surface within the 5-minute window. An on-demand purge hook from the
// admin publish/unpublish flow remains a future enhancement (T8 note in
// TECHNICAL_IMPLEMENTATION.md).
export const revalidate = 300;

// [slug] paths are generated on demand (empty list), then ISR-cached with the
// revalidate window above — documented App Router pattern for content routes
// whose slugs live in a CMS.
export async function generateStaticParams() {
  return [];
}

// The article payload is fetched once per request and shared between
// generateMetadata and the page body via React's per-request cache.
const getArticle = cache(async (slug: string): Promise<InsightArticleDetail | null> => {
  try {
    const res = await insightsApi.getArticle(slug);
    return res.data as InsightArticleDetail;
  } catch {
    return null;
  }
});

// Clean, stable URLs — SEO requirement: /insights/electrician-salary-rotterdam
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Insight" };

  // SEO fields are editorially managed in the CMS; fall back to the article's
  // own title/summary when the editor left them blank.
  const title = article.seoTitle || article.title;
  const description = article.metaDescription || article.summary;

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: `/insights/${slug}`,
    },
    openGraph: {
      siteName: "OfferMarket",
      title: article.socialTitle || title,
      description,
      type: "article",
      images: ogImages(),
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.lastUpdatedAt ?? undefined,
      tags: article.skills ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.socialTitle || title,
      description,
      images: twitterImages(),
    },
  };
  // Per-host canonical/OG base: resolved from the locale's authoritative
  // domain (static — using request-time getSiteUrl here would force the whole
  // article route dynamic and defeat the revalidate caching below).
  metadata.metadataBase = new URL(siteUrlForLocale(locale as "en" | "nl", "/"));
  return metadata;
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  // Structured data (T6): Article (evergreen content, not NewsArticle),
  // mainEntityOfPage, publisher "OfferMarket", and a breadcrumb trail.
  // No `image` yet — that asset arrives with the T5 OG image ticket.
  const pageUrl = siteUrlForLocale(locale as "en" | "nl", `/insights/${slug}`);
  const jsonLd = buildArticleJsonLd(article, slug, pageUrl);
  const breadcrumbLd = articleBreadcrumbJsonLd(locale as "en" | "nl", article, slug, articleCategoryLabel(article));

  return (
    <>
      <script
        type="application/ld+json"
        // Static JSON built from structured fields — no user-injectable markup.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <ArticleView article={article} />
    </>
  );
}

/** Article payload categories are lowercase URL slugs (e.g. "salary"). */
function articleCategoryLabel(article: InsightArticleDetail): string {
  return article.category;
}