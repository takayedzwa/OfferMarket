"use client";

import { useTranslations } from "next-intl";
import type { EmployerMarketView, GatedValue } from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import InsufficientData from "./InsufficientData";

/**
 * Employer-side intelligence: hiring difficulty, salary competitiveness, demand
 * by region, candidate availability, competitor offer ranges, time-to-hire and
 * market acceptance rate. Strictly cohort-level aggregates — the API computes
 * them over an employer cohort and never over individual candidates, and every
 * figure is sample-gated like the worker view.
 */

const DIFFICULTY_STYLES: Record<string, string> = {
  VERY_HARD: "bg-red-100 text-red-800",
  HARD: "bg-orange-100 text-orange-800",
  MODERATE: "bg-amber-100 text-amber-800",
  EASY: "bg-emerald-100 text-emerald-800",
};

function GatedStat({ gated, children }: { gated: GatedValue<unknown>; children: () => React.ReactNode }) {
  if (!gated.available || gated.value === undefined) {
    return <InsufficientData sampleSize={gated.sampleSize} />;
  }
  return <>{children()}</>;
}

export default function EmployerIntelligencePanel({ view }: { view: EmployerMarketView }) {
  const t = useTranslations("insights.yourMarket.employer");
  const { currency } = useFormat();

  const maxRegionOffers = Math.max(
    ...(view.demandByRegion.available && view.demandByRegion.value ? view.demandByRegion.value.map((r) => r.offers) : [1]),
    1,
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden" aria-label={t("title")}>
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{t("title")}</h2>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
        {view.profession && <p className="mt-1 text-sm font-medium text-gray-900">{view.profession}</p>}
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Hiring difficulty */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("hiringDifficulty")}</p>
          <div className="mt-2">
            <GatedStat gated={view.hiringDifficulty}>
              {() => {
                const value = view.hiringDifficulty.value!;
                return (
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${DIFFICULTY_STYLES[value.level] ?? "bg-gray-100 text-gray-700"}`}>
                      {t(`difficultyLevel.${value.level as "HARD"}`)}
                    </span>
                    {value.candidatesPerOffer != null && (
                      <p className="mt-1 text-xs text-gray-500">{value.candidatesPerOffer}/offer</p>
                    )}
                  </div>
                );
              }}
            </GatedStat>
          </div>
        </div>

        {/* Salary competitiveness */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("salaryCompetitiveness")}</p>
          <div className="mt-2">
            <GatedStat gated={view.salaryCompetitiveness}>
              {() => {
                const value = view.salaryCompetitiveness.value!;
                return (
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                        value.position === "above" ? "bg-emerald-100 text-emerald-800"
                        : value.position === "below" ? "bg-orange-100 text-orange-800"
                        : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {t(`competitiveness.${value.position as "at"}`)}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("yourMedian")}: {value.yourMedian != null ? currency(value.yourMedian) : "—"}
                      {" · "}
                      {t("marketMedian")}: {value.marketMedian != null ? currency(value.marketMedian) : "—"}
                    </p>
                  </div>
                );
              }}
            </GatedStat>
          </div>
        </div>

        {/* Candidate availability */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("candidateAvailability")}</p>
          <div className="mt-2">
            <GatedStat gated={view.candidateAvailability}>
              {() => <p className="text-xl font-bold text-gray-900">{t("candidates", { count: view.candidateAvailability.value!.count })}</p>}
            </GatedStat>
          </div>
        </div>

        {/* Competitor offer ranges */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("competitorRanges")}</p>
          <div className="mt-2">
            <GatedStat gated={view.competitorOfferRanges}>
              {() => {
                const value = view.competitorOfferRanges.value!;
                return (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {currency(value.p25)} – {currency(value.p75)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{t("employersInCohort", { count: value.employersInCohort })}</p>
                  </div>
                );
              }}
            </GatedStat>
          </div>
        </div>

        {/* Time to hire */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("timeToHire")}</p>
          <div className="mt-2">
            <GatedStat gated={view.timeToHire}>
              {() => <p className="text-xl font-bold text-gray-900">{t("medianDays", { days: view.timeToHire.value!.medianDays })}</p>}
            </GatedStat>
          </div>
        </div>

        {/* Acceptance rate */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("acceptanceRate")}</p>
          <div className="mt-2">
            <GatedStat gated={view.offerAcceptanceRate}>
              {() => <p className="text-xl font-bold text-gray-900">{view.offerAcceptanceRate.value!.ratePct}%</p>}
            </GatedStat>
          </div>
        </div>

        {/* Demand by region */}
        <div className="rounded-lg bg-gray-50 p-4 sm:col-span-2 lg:col-span-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("demandByRegion")}</p>
          <div className="mt-2">
            <GatedStat gated={view.demandByRegion}>
              {() => (
                <ul className="space-y-2">
                  {view.demandByRegion.value!.map((region) => (
                    <li key={region.regionName} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-700 font-medium">{region.regionName}</span>
                        <span className="text-gray-500">{region.offers}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.max(4, (region.offers / maxRegionOffers) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </GatedStat>
          </div>
        </div>
      </div>
    </section>
  );
}