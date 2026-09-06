"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  insightsApi,
  type InsightArticleDetail,
  type InsightArticleCard,
} from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import { useInsightsTrackView, trackInsightEvent } from "@/components/insights/useInsightsTracking";
import DataClassBadge from "@/components/insights/DataClassBadge";
import TransparencyBox from "@/components/insights/TransparencyBox";
import MarkdownContent from "@/components/insights/MarkdownContent";
import InsightChart from "@/components/insights/InsightChart";
import ShareBar from "@/components/insights/ShareBar";
import FollowPrompt from "@/components/insights/FollowPrompt";
import LatestInsightsGrid from "@/components/insights/LatestInsightsGrid";

/**
 * The article reader. Server-rendered shell (SEO/JSON-LD) + this client view:
 * body markdown, charts, the transparency box, structured sources, share rail,
 * follow prompt, related insights and the registration CTA with click
 * tracking (Insight reader → platform registration is the product's key
 * funnel metric).
 */
export default function ArticleView({ article }: { article: InsightArticleDetail }) {
  const t = useTranslations("insights");
  const tCat = useTranslations("insights.category");
  const { date } = useFormat();
  const pathname = usePathname();
  useInsightsTrackView({ articleId: article.id });

  const [shareUrl, setShareUrl] = useState(`/insights/${article.slug}`);
  const [related, setRelated] = useState<InsightArticleCard[]>([]);

  useEffect(() => {
    setShareUrl(`${window.location.origin}${pathname}`);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await insightsApi.listArticles({ limit: 3, category: article.category });
        const items: InsightArticleCard[] = res.data.items ?? [];
        if (!cancelled) setRelated(items.filter((item) => item.id !== article.id).slice(0, 3));
      } catch {
        // Related insights are additive — no failure state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [article.category, article.id]);

  const sources = article.sources ?? [];
  const keyStats = Array.isArray(article.keyStats) ? article.keyStats : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="min-w-0">
          {/* Header */}
          <header className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/insights/category/${article.category.toLowerCase()}`}
                className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:text-blue-700"
              >
                {tCat(article.category as "SALARY")}
              </Link>
              <DataClassBadge dataClass={article.dataClass} />
              {article.profession && (
                <span className="text-xs text-gray-500">{article.profession}</span>
              )}
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">{article.title}</h1>
            <p className="mt-3 text-lg text-gray-600">{article.summary}</p>
            <div className="mt-4 flex items-center gap-3 text-sm text-gray-500 flex-wrap">
              <span>
                {t("article.by")}{" "}
                <span className="font-medium text-gray-700">
                  {article.authorName || t("article.editorialTeam")}
                </span>
              </span>
              {article.publishedAt && (
                <span>
                  · {t("article.published")} {date(article.publishedAt, { dateStyle: "medium" })}
                </span>
              )}
              {article.lastUpdatedAt && (
                <span>· {t("article.updated")} {date(article.lastUpdatedAt, { dateStyle: "medium" })}</span>
              )}
            </div>
          </header>

          {/* Body */}
          <MarkdownContent content={article.content} />

          {/* Charts */}
          {(article.charts ?? []).map((chart, i) => (
            <InsightChart key={i} chart={chart} />
          ))}

          {/* Key statistics */}
          {keyStats.length > 0 && (
            <section className="my-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                {t("article.keyStats")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {keyStats.map((stat: { label?: string; value?: string | number }, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Transparency box — mandatory on data-driven insights */}
          <TransparencyBox
            dataClass={article.dataClass}
            sampleSize={article.sampleSize}
            dataPeriodStart={article.dataPeriodStart}
            dataPeriodEnd={article.dataPeriodEnd}
            profession={article.profession}
            scope={article.region?.name ?? null}
            methodology={article.methodology}
          />

          {/* Sources */}
          {sources.length > 0 && (
            <section className="my-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                {t("article.sources.title")}
              </h2>
              <ol className="space-y-3">
                {sources.map((ref, i) => (
                  <li key={ref.source.id} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          [{i + 1}] {ref.source.name}
                          {ref.isPrimary && (
                            <span className="ml-2 text-xs font-medium text-blue-600">★</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t("article.sources.publisher")}: {ref.source.publisher}
                          {ref.source.publicationDate && (
                            <> · {t("article.sources.published")} {date(ref.source.publicationDate, { dateStyle: "medium" })}</>
                          )}
                          {ref.source.dataDate && (
                            <> · {t("article.sources.dataDate")} {date(ref.source.dataDate, { dateStyle: "medium" })}</>
                          )}
                        </p>
                        {ref.source.citation && <p className="mt-1 text-xs text-gray-600">{ref.source.citation}</p>}
                      </div>
                      <a
                        href={ref.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                      >
                        {t("article.sources.viewOriginal")} ↗
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <FollowPrompt profession={article.profession} regionId={article.region?.id} regionName={article.region?.name} />
        </article>

        {/* Sidebar */}
        <aside className="min-w-0">
          <div className="sticky top-20 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
              <ShareBar url={shareUrl} title={article.title} articleId={article.id} />
            </div>

            {/* Registration CTA — the funnel this product exists for */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
              <p className="text-sm font-medium text-gray-700">{t("cta.clickNote")}</p>
              <Link
                href="/register?role=WORKER"
                onClick={() => trackInsightEvent("REGISTER_CLICK", article.id)}
                className="mt-3 block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {t("cta.registerWorker")}
              </Link>
              <Link
                href="/register?role=EMPLOYER"
                onClick={() => trackInsightEvent("REGISTER_CLICK", article.id)}
                className="mt-2 block bg-white border border-blue-300 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                {t("cta.registerEmployer")}
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Related insights */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t("article.related")}</h2>
          <LatestInsightsGrid articles={related} />
        </section>
      )}
    </main>
  );
}