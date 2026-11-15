import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { insightsApi, type InsightArticleCard } from "@/lib/api";
import CategoryChips from "@/components/insights/CategoryChips";
import LatestInsightsGrid from "@/components/insights/LatestInsightsGrid";
import { AnonymousCta, InsightsViewTracker, PersonalPanels } from "@/components/insights/InsightsClient";
import { buildSharedAlternates } from "@/lib/metadata";

/**
 * Insights homepage (SERVER-RENDERED, T3): hero, the data-class legend (the
 * product's credibility anchor), the five category chips and the latest
 * published insights are present in the initial HTML — this page is in the
 * sitemap, so crawlers get the real article links. The personalized market
 * overview / employer intelligence panels, the anonymous CTA and view
 * tracking remain client-side (see InsightsClient.tsx).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: buildSharedAlternates(locale as "en" | "nl", "/insights"),
  };
}

export default async function InsightsHomePage() {
  const t = await getTranslations("insights");

  let articles: InsightArticleCard[] = [];
  try {
    const res = await insightsApi.listArticles({ limit: 6 });
    articles = res.data.items ?? [];
  } catch {
    // Empty grid renders the honest "nothing published yet" state.
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{t("hero.eyebrow")}</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">{t("hero.title")}</h1>
        <p className="mt-3 max-w-3xl text-gray-600">{t("hero.subtitle")}</p>
      </section>

      {/* Data-class legend — the transparency promise, stated on every page */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900">{t("dataClasses.title")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["OFFERMARKT", "OFFICIAL", "THIRD_PARTY", "EDITORIAL"] as const).map((key) => (
            <div key={key} className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-900">{t(`dataClasses.${key}`)}</p>
              <p className="mt-1 text-xs text-gray-500">{t(`dataClasses.${key}_DESC`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Client-only view tracking (no SSR output) */}
      <InsightsViewTracker />

      {/* Personalized market overview / employer intelligence (browser only) */}
      <PersonalPanels />

      {/* Anonymous CTA (client-gated on auth state) */}
      <AnonymousCta />

      {/* Categories */}
      <section className="mb-10">
        <CategoryChips />
      </section>

      {/* Latest insights — server-fetched: article links are in the HTML */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("latest.title")}</h2>
            <p className="text-sm text-gray-500">{t("latest.subtitle")}</p>
          </div>
          <Link href="/insights/category/all" className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap">
            {t("latest.viewAll")} →
          </Link>
        </div>
        <LatestInsightsGrid articles={articles} />
      </section>
    </main>
  );
}
