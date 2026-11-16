"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { insightsApi, type WorkerMarketOverview, type EmployerMarketView } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useInsightsTrackView, trackInsightEvent } from "@/components/insights/useInsightsTracking";
import PersonalMarketOverview from "@/components/insights/PersonalMarketOverview";
import EmployerIntelligencePanel from "@/components/insights/EmployerIntelligencePanel";

// ============================================================================
// INSIGHTS CLIENT CHUNKS — the per-user / analytics parts of the insights
// pages that genuinely need the browser (auth context, tracking, personalized
// API calls). Everything else on the insights pages is server-rendered (T3) so
// the article grid, hero, legend and categories are present in crawler HTML.
// ============================================================================

/** Client-side view tracking; renders nothing. */
export function InsightsViewTracker({ category }: { category?: string }) {
  useInsightsTrackView({ category });
  return null;
}

/**
 * Auth-gated personalized panels. Fetches after mount (browser-only data
 * paths: JWT-authenticated endpoints), so they stay skeletons for crawlers —
 * exactly the "personalized panels stay client-side" rule from T3.
 */
export function PersonalPanels() {
  const { user } = useAuth();
  const t = useTranslations("insights");
  const [workerOverview, setWorkerOverview] = useState<WorkerMarketOverview | null>(null);
  const [employerView, setEmployerView] = useState<EmployerMarketView | null>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (loading) {
    return (
      <>
        {/* CLS-neutral single-row skeleton while the personalized call is in flight */}
        <div className="mb-10 h-1 w-full rounded bg-gray-100" aria-hidden />
      </>
    );
  }

  return (
    <>
      {workerOverview && (
        <section className="mb-10">
          <PersonalMarketOverview overview={workerOverview} />
        </section>
      )}

      {employerView && (
        <section className="mb-10">
          <EmployerIntelligencePanel view={employerView} />
        </section>
      )}
    </>
  );
}

/** Anonymous registration CTA (worker/employer); hidden for signed-in users. */
export function AnonymousCta() {
  const { user } = useAuth();
  const t = useTranslations("insights");

  if (user) return null;

  return (
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
  );
}
