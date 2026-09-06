"use client";

import { useTranslations } from "next-intl";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import type { WorkerMarketOverview, GatedValue } from "@/lib/api";
import InsufficientData from "./InsufficientData";

/**
 * The "Your Market" panel — the personalized market overview for a signed-in
 * worker: demand, salary range, trend, most valuable skills, employer/offer
 * counts and recent changes. Every statistic is a GatedValue: when the
 * marketplace sample cannot support the number, the panel shows the honest
 * insufficient-data state instead of a figure (the core product constraint).
 */

const DEMAND_STYLES: Record<string, string> = {
  VERY_HIGH: "bg-emerald-100 text-emerald-800",
  HIGH: "bg-blue-100 text-blue-800",
  MODERATE: "bg-amber-100 text-amber-800",
  LOW: "bg-gray-100 text-gray-700",
};

function trendIcon(direction: string) {
  if (direction === "up") return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  if (direction === "down") return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
}

function GatedStat({ gated, children }: { gated: GatedValue<unknown>; children: () => React.ReactNode }) {
  if (!gated.available || gated.value === undefined) {
    return <InsufficientData sampleSize={gated.sampleSize} />;
  }
  return <>{children()}</>;
}

export default function PersonalMarketOverview({ overview }: { overview: WorkerMarketOverview }) {
  const t = useTranslations("insights.yourMarket");
  const { currency } = useFormat();

  if (!overview.profile.profession) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("noProfile")}</p>
        <Link href="/profile" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {t("setupProfile")}
        </Link>
      </div>
    );
  }

  const scopeKey = overview.scopeUsed === "province" ? "province" : overview.scopeUsed === "country" ? "country" : "city";

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden" aria-label={t("title")}>
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-gray-900">{overview.profile.profession}</span>
            {overview.profile.regionName && <span className="text-gray-500"> · {overview.profile.regionName}</span>}
            {overview.profile.yearsOfExperience != null && (
              <span className="text-gray-500"> · {t("experience", { years: overview.profile.yearsOfExperience })}</span>
            )}
          </div>
        </div>
        {overview.scopeUsed && overview.scopeUsed !== "city" && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
            {t(`scopeNote.${scopeKey}`)}
          </p>
        )}
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Demand */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("demand")}</p>
          <div className="mt-2">
            <GatedStat gated={overview.demand}>
              {() => {
                const level = overview.demand.value!.level;
                return (
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${DEMAND_STYLES[level] ?? "bg-gray-100 text-gray-700"}`}>
                      {t(`demandLevel.${level as "HIGH"}`)}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">{overview.demand.value!.offers} offers</p>
                  </div>
                );
              }}
            </GatedStat>
          </div>
        </div>

        {/* Salary range */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("typicalSalary")}</p>
          <div className="mt-2">
            <GatedStat gated={overview.salaryRange}>
              {() => {
                const range = overview.salaryRange.value!;
                return (
                  <>
                    <p className="text-xl font-bold text-gray-900">
                      {currency(range.p25, range.currency)} – {currency(range.p75, range.currency)}
                    </p>
                    <p className="text-xs text-gray-500">{t("typicalSalaryNote")}</p>
                  </>
                );
              }}
            </GatedStat>
          </div>
        </div>

        {/* Trend */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("trend")}</p>
          <div className="mt-2">
            <GatedStat gated={overview.salaryTrend}>
              {() => {
                const trend = overview.salaryTrend.value!;
                return (
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {trendIcon(trend.direction)}
                    {trend.changePct > 0 ? "+" : ""}
                    {trend.changePct}%
                  </p>
                );
              }}
            </GatedStat>
          </div>
        </div>

        {/* Most valuable skills */}
        <div className="rounded-lg bg-gray-50 p-4 sm:col-span-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("skills")}</p>
          <div className="mt-2">
            <GatedStat gated={overview.mostValuableSkills}>
              {() => (
                <div className="flex flex-wrap gap-2">
                  {overview.mostValuableSkills.value!.map((skill) => (
                    <span key={skill.skill} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      {skill.skill} +{skill.premiumPct}%
                    </span>
                  ))}
                </div>
              )}
            </GatedStat>
          </div>
        </div>

        {/* Employers / offers */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("employers")}</p>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("offers")}</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <div>
              <GatedStat gated={overview.relevantEmployers}>
                {() => <p className="text-xl font-bold text-gray-900">{overview.relevantEmployers.value!.count}</p>}
              </GatedStat>
            </div>
            <div>
              <GatedStat gated={overview.relevantOffers}>
                {() => <p className="text-xl font-bold text-gray-900">{overview.relevantOffers.value!.count}</p>}
              </GatedStat>
            </div>
          </div>
        </div>
      </div>

      {/* Recent changes */}
      {overview.recentChanges.length > 0 && (
        <div className="px-6 pb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t("recentChanges")}</p>
          <ul className="space-y-1.5">
            {overview.recentChanges.map((change) => (
              <li key={change.metric} className="text-sm text-gray-700 flex items-center gap-2">
                {trendIcon(change.direction)}
                {t(`changes.${change.metric as "offers"}`, {
                  change: Math.abs(change.change),
                  direction: change.direction,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-6 pb-6">
        <Link href="/insights/your-market" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          {t("viewDeep")} →
        </Link>
      </div>
    </section>
  );
}