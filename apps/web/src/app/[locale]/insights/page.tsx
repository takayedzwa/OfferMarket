"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  insightsApi,
  type InsightArticleCard,
  type WorkerMarketOverview,
  type EmployerMarketView,
} from "@/lib/api";
import { useInsightsTrackView, trackInsightEvent } from "@/components/insights/useInsightsTracking";
import CategoryChips from "@/components/insights/CategoryChips";
import LatestInsightsGrid from "@/components/insights/LatestInsightsGrid";
import PersonalMarketOverview from "@/components/insights/PersonalMarketOverview";
import EmployerIntelligencePanel from "@/components/insights/EmployerIntelligencePanel";

/**
 * Insights homepage: the personalized market overview for signed-in workers /
 * employers, the data-class legend (the product's credibility anchor), the
 * five category chips and the latest published insights. Anonymous visitors
 * get the hero + categories + latest grid and a registration CTA — the
 * personalized panel is the reason to join.
 */
export default function InsightsHomePage() {
  const t = useTranslations("insights");
  const { user } = useAuth();
  useInsightsTrackView();

  const [articles, setArticles] = useState<InsightArticleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerOverview, setWorkerOverview] = useState<WorkerMarketOverview | null>(null);
  const [employerView, setEmployerView] = useState<EmployerMarketView | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await insightsApi.listArticles({ limit: 6 });
        if (!cancelled) setArticles(res.data.items ?? []);
      } catch {
        // Empty grid renders the honest "nothing published yet" state.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (user?.role === "WORKER") {
          const res = await insightsApi.workerMarketOverview();
          if (!cancelled) setWorkerOverview(res.data);
        } else if (user?.role === "EMPLOYER") {
          const res = await insightsApi.employerMarketView();
          if (!cancelled) setEmployerView(res.data);
        }
      } catch {
        // No profile / insufficient permissions — the panel simply stays hidden.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

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

      {/* Personalized market overview — workers */}
      {workerOverview && (
        <section className="mb-10">
          <PersonalMarketOverview overview={workerOverview} />
        </section>
      )}

      {/* Personalized intelligence — employers */}
      {employerView && (
        <section className="mb-10">
          <EmployerIntelligencePanel view={employerView} />
        </section>
      )}

      {/* Anonymous CTA */}
      {!user && (
        <section className="mb-10 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900">{t("hero.anonymousCta")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("hero.anonymousNote")}</p>
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            <Link
              href="/register?role=WORKER"
              onClick={() => trackInsightEvent("REGISTER_CLICK")}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t("cta.registerWorker")}
            </Link>
            <Link
              href="/register?role=EMPLOYER"
              onClick={() => trackInsightEvent("REGISTER_CLICK")}
              className="bg-white border border-blue-300 text-blue-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {t("cta.registerEmployer")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-500">{t("cta.clickNote")}</p>
        </section>
      )}

      {/* Categories */}
      <section className="mb-10">
        <CategoryChips />
      </section>

      {/* Latest insights */}
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
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <LatestInsightsGrid articles={articles} />
        )}
      </section>
    </main>
  );
}