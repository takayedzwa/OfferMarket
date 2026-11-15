import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { insightsApi, type InsightArticleCard } from "@/lib/api";
import { INSIGHT_CATEGORIES, type InsightCategory } from "@/components/insights/categories";
import LatestInsightsGrid from "@/components/insights/LatestInsightsGrid";
import CategoryChips from "@/components/insights/CategoryChips";
import { InsightsViewTracker } from "@/components/insights/InsightsClient";
import { buildSharedAlternates } from "@/lib/metadata";

/**
 * Category browse page (SERVER-RENDERED, T3): /insights/category/salary (plus
 * demand, employer, industry, career — and `all` for the full archive). Clean
 * URLs, no query params, so each category is separately indexable. The
 * article grid is server-fetched: links are in the initial HTML.
 *
 * An unknown category falls back to the full archive and canonicalises to the
 * /all URL (same content, one canonical).
 */
type CategoryPageProps = {
  params: Promise<{ locale: string; category: string }>;
};

function resolveCategory(rawCategory: string | undefined | null): "ALL" | InsightCategory {
  const raw = (rawCategory ?? "all").toUpperCase();
  return INSIGHT_CATEGORIES.includes(raw as InsightCategory)
    ? (raw as InsightCategory)
    : "ALL";
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale, category } = await params;
  // Unknown categories render the archive — canonicalise to the /all URL.
  const raw = (category ?? "all").toUpperCase();
  const known = INSIGHT_CATEGORIES.includes(raw as InsightCategory);
  const path = known ? `/insights/category/${lower(category)}` : "/insights/category/all";
  return { alternates: buildSharedAlternates(locale as "en" | "nl", path) };
}

function lower(v: string) {
  return v.toLowerCase();
}

export default async function InsightCategoryPage({ params }: CategoryPageProps) {
  const { locale, category } = await params;
  const resolved = resolveCategory(category);
  const isAll = resolved === "ALL";

  const t = await getTranslations({ locale, namespace: "insights" });

  let articles: InsightArticleCard[] = [];
  try {
    const res = await insightsApi.listArticles({
      limit: 24,
      category: isAll ? undefined : (resolved as InsightCategory),
    });
    articles = res.data.items ?? [];
  } catch {
    // Empty grid renders the honest "nothing published yet" state.
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InsightsViewTracker category={isAll ? undefined : resolved} />

      <nav className="mb-6 text-sm">
        <Link href="/insights" className="text-blue-600 hover:text-blue-700">
          Insights
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">
          {isAll ? t("latest.title") : t(`category.${resolved as "SALARY"}`)}
        </span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isAll ? t("latest.title") : t(`category.${resolved as "SALARY"}`)}
        </h1>
        {!isAll && (
          <p className="mt-2 max-w-2xl text-gray-600">
            {t(`category.${resolved as "SALARY"}_DESC`)}
          </p>
        )}
      </header>

      <section className="mb-8">
        <CategoryChips />
      </section>

      <LatestInsightsGrid articles={articles} />
    </main>
  );
}
