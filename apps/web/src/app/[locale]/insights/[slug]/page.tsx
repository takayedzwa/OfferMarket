import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { insightsApi, type InsightArticleDetail } from "@/lib/api";
import ArticleView from "./ArticleView";

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
  const { slug } = await params;
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
      title: article.socialTitle || title,
      description,
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.lastUpdatedAt ?? undefined,
      tags: article.skills ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.socialTitle || title,
      description,
    },
  };
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    metadata.metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL);
  }
  return metadata;
}

export default async function InsightArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  // Structured data (NewsArticle) for search engines — same clean URL.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.metaDescription || article.summary,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.lastUpdatedAt ?? undefined,
    author: { "@type": "Organization", name: article.authorName || "Offermarket Editorial" },
    publisher: { "@type": "Organization", name: "Offermarket" },
    articleSection: article.category,
    ...(process.env.NEXT_PUBLIC_SITE_URL
      ? { url: `${process.env.NEXT_PUBLIC_SITE_URL}/insights/${slug}` }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Static JSON built from structured fields — no user-injectable markup.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleView article={article} />
    </>
  );
}