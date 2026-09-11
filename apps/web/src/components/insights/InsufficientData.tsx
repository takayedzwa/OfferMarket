"use client";

import { useTranslations } from "next-intl";

/**
 * The honest empty state. Insights never shows a number the sample cannot
 * support — where a statistic would appear, this renders instead. The sample
 * count (when known) tells the reader why the gate exists.
 */
export default function InsufficientData({ sampleSize }: { sampleSize?: number }) {
  const t = useTranslations("insights.insufficient");
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
      <p className="text-sm font-medium text-gray-700">{t("title")}</p>
      <p className="mt-1 text-xs text-gray-500">{t("body")}</p>
      {typeof sampleSize === "number" && (
        <p className="mt-2 text-xs text-gray-400">{t("sample", { count: sampleSize })}</p>
      )}
    </div>
  );
}