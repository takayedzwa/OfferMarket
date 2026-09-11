"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  insightsApi,
  type WorkerMarketOverview,
  type EmployerMarketView,
} from "@/lib/api";
import PersonalMarketOverview from "@/components/insights/PersonalMarketOverview";
import EmployerIntelligencePanel from "@/components/insights/EmployerIntelligencePanel";
import FollowManager from "@/components/insights/FollowManager";

/**
 * The deep "Your Market" view: the full personalized intelligence panel plus
 * the reader's follow subscriptions. Workers get the worker overview, employers
 * the employer intelligence panel; anonymous users are routed to login.
 */
export default function YourMarketPage() {
  const t = useTranslations("insights");
  const { user, loading: authLoading } = useAuth();

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
        // No profile yet / insufficient permissions — panels render the
        // honest empty states themselves.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (authLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("yourMarket.title")}</h1>
        <p className="mt-2 text-gray-600">{t("hero.anonymousNote")}</p>
        <Link href="/login" className="mt-6 inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {t("hero.anonymousCta")}
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="mb-6 text-sm">
        <Link href="/insights" className="text-blue-600 hover:text-blue-700">
          Insights
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">{t("yourMarket.title")}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t("yourMarket.title")}</h1>
        <p className="mt-2 text-gray-600">{t("yourMarket.subtitle")}</p>
      </header>

      {loading ? (
        <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
      ) : (
        <div className="space-y-10">
          {user.role === "WORKER" && workerOverview && <PersonalMarketOverview overview={workerOverview} />}
          {user.role === "EMPLOYER" && employerView && <EmployerIntelligencePanel view={employerView} />}
          {!workerOverview && !employerView && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("yourMarket.noProfile")}</p>
              <Link href="/profile" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                {t("yourMarket.setupProfile")}
              </Link>
            </div>
          )}

          {user.role !== "ADMIN" && user.role !== "SUPPORT" && <FollowManager />}
        </div>
      )}
    </main>
  );
}