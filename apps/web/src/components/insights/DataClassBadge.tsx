"use client";

import { useTranslations } from "next-intl";

/**
 * The four data classes (§0 of docs/insights-architecture.md) rendered as a
 * colored badge — the core credibility device of Insights: every number on
 * every page is visually tagged with where it came from.
 */
const CLASS_STYLES: Record<string, string> = {
  OFFERMARKT: "bg-blue-100 text-blue-800 border-blue-200",
  OFFICIAL: "bg-emerald-100 text-emerald-800 border-emerald-200",
  THIRD_PARTY: "bg-amber-100 text-amber-800 border-amber-200",
  EDITORIAL: "bg-purple-100 text-purple-800 border-purple-200",
};

const DOT_COLORS: Record<string, string> = {
  OFFERMARKT: "bg-blue-500",
  OFFICIAL: "bg-emerald-500",
  THIRD_PARTY: "bg-amber-500",
  EDITORIAL: "bg-purple-500",
};

export function DataClassBadge({ dataClass, className = "" }: { dataClass: string; className?: string }) {
  const t = useTranslations("insights.dataClasses");
  const style = CLASS_STYLES[dataClass] ?? "bg-gray-100 text-gray-800 border-gray-200";
  const dot = DOT_COLORS[dataClass] ?? "bg-gray-500";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden />
      {t(dataClass as any)}
    </span>
  );
}

export default DataClassBadge;