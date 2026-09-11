"use client";

import { useTranslations } from "next-intl";
import { ShieldQuestion, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { MarketValueIndicator, MarketValueComponent } from "@/lib/api";
import InsufficientData from "./InsufficientData";

/**
 * Explainable market-value card (P5). The score is a transparent points
 * rubric (max 100): EXPERIENCE 25 · SKILLS 25 · DEMAND 20 · CERTIFICATIONS 15
 * · COMPARABLE_OFFERS 15. The API returns every component's points, raw
 * inputs and an explanation key + params — the UI renders exactly those, so
 * the user can always answer "why is this my score". No hidden model, no
 * black box: insufficient data scores 0 and says so.
 */

const COMPONENT_ORDER: MarketValueComponent["key"][] = [
  "EXPERIENCE",
  "SKILLS",
  "CERTIFICATIONS",
  "DEMAND",
  "COMPARABLE_OFFERS",
];

/** Component key → i18n subkey for the row labels. */
const COMPONENT_KEYS: Record<MarketValueComponent["key"], string> = {
  EXPERIENCE: "experience",
  SKILLS: "skills",
  CERTIFICATIONS: "certifications",
  DEMAND: "demand",
  COMPARABLE_OFFERS: "comparableOffers",
};

/**
 * The API's explanationKey is namespaced 'MARKET_VALUE.<KEY>' (snake case).
 * Map it onto this card's i18n keys by camel-casing the suffix:
 * EXPERIENCE_BAND → experienceBand, DEMAND_VERY_HIGH → demandVeryHigh, etc.
 */
function localizeExplanation(component: MarketValueComponent): string {
  const raw = component.explanationKey.replace("MARKET_VALUE.", "").toLowerCase();
  return raw.replace(/_+(\w)/g, (_, c: string) => c.toUpperCase());
}

export default function MarketValueCard({ marketValue }: { marketValue: MarketValueIndicator }) {
  const t = useTranslations("insights.marketValue");
  const [expanded, setExpanded] = useState(false);

  const sorted = [...marketValue.components].sort(
    (a, b) => COMPONENT_ORDER.indexOf(a.key) - COMPONENT_ORDER.indexOf(b.key),
  );
  const pct = marketValue.maxScore > 0 ? (marketValue.scorePct / marketValue.maxScore) * 100 : 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6" aria-label={t("title")}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldQuestion className="w-5 h-5 text-blue-600" />
            {t("title")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900" data-testid="market-value-score">
            {marketValue.scorePct}
            <span className="text-base font-medium text-gray-500">/{marketValue.maxScore}</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>

      <ul className="mt-4 space-y-2">
        {sorted.map((component) => (
          <li key={component.key} className="text-sm text-gray-700 flex items-center justify-between gap-3">
            <span>{t(`components.${COMPONENT_KEYS[component.key]}`)}</span>
            <span className="font-semibold tabular-nums" data-testid={`market-value-${component.key.toLowerCase()}`}>
              {component.points}/{component.maxPoints}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
        aria-expanded={expanded}
      >
        {t("howItWorks")}
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-3">
          {sorted.map((component) => (
            <p key={component.key} className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">
                {t(`components.${COMPONENT_KEYS[component.key]}`)}:
              </span>{" "}
              {t(localizeExplanation(component), component.explanationParams)}
            </p>
          ))}
          {/* Salary percentile: only with a real comparable-offer sample. */}
          {marketValue.salaryPercentile.available && marketValue.salaryPercentile.value ? (
            <p className="text-sm text-gray-600">
              {t("salaryPercentile", { percentile: marketValue.salaryPercentile.value.percentile })}
              <span className="ml-1 text-xs text-gray-500">({marketValue.salaryPercentile.sampleSize})</span>
            </p>
          ) : (
            <div className="max-w-md">
              <InsufficientData sampleSize={marketValue.salaryPercentile.sampleSize} />
            </div>
          )}
          <p className="text-xs text-gray-400">{t("noBlackBox")}</p>
        </div>
      )}
    </section>
  );
}