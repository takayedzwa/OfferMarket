"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { insightsApi, type InsightArticleCard } from "@/lib/api";
import { useInsightsTrackView } from "@/components/insights/useInsightsTracking";
import LatestInsightsGrid from "@/components/insights/LatestInsightsGrid";
import CategoryChips, { INSIGHT_CATEGORIES } from "@/components/insights/CategoryChips";

/**
 * Category browse page: /insights/category/salary (plus demand, employer,
 * industry, career — and `all` for the full archive). Clean URLs, no query
 * params, so each category is separately indexable.
 */
export default function InsightCategoryPage() {
  const params = useParams<{ category: string }>();
  const raw = (params.category ?? "all").toUpperCase();
  const category = INSIGHT_CATEGORIES.includes(raw as (typeof INSIGHT_CATEGORIES)[number]) ? raw : null;
  const isAll = category === null;

  const t = useTranslations("insights");
  useInsightsTrackView({ category: isAll ? undefined : category! });

  const [articles, setArticles] = useState<InsightArticleCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await insightsApi.listArticles({
          limit: 24,
          category: isAll ? undefined : category!,
        });
        setArticles(res.data.items ?? []);
      } catch {
        setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, isAll]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="mb-6 text-sm">
        <Link href="/insights" className="text-blue-600 hover:text-blue-700">
          Insights
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{isAll ? t("latest.title") : t(`category.${category! as "SALARY"}`)}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isAll ? t("latest.title") : t(`category.${category! as "SALARY"}`)}
        </h1>
        {!isAll && <p className="mt-2 max-w-2xl text-gray-600">{t(`category.${category! as "SALARY"}_DESC`)}</p>}
      </header>

      <section className="mb-8">
        <CategoryChips />
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <LatestInsightsGrid articles={articles} />
      )}
    </main>
  );
}