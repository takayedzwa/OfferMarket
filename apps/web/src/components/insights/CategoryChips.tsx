"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * The five content categories as browse chips + the legend sentence that
 * anchors the data-class promise ("Every number on this page carries its data
 * class"). Used on the Insights homepage and category pages.
 */
export const INSIGHT_CATEGORIES = ["SALARY", "DEMAND", "EMPLOYER", "INDUSTRY", "CAREER"] as const;

export default function CategoryChips() {
  const t = useTranslations("insights");

  return (
    <div>
      <p className="text-sm text-gray-600 mb-3">{t("dataClasses.legend")}</p>
      <div className="flex flex-wrap gap-2">
        {INSIGHT_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/insights/category/${category.toLowerCase()}`}
            className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            {t(`category.${category}`)}
          </Link>
        ))}
      </div>
    </div>
  );
}