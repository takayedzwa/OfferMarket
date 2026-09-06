"use client";

import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import type { InsightArticleCard } from "@/lib/api";
import DataClassBadge from "./DataClassBadge";

/**
 * One card in the Latest Insights grid. Carries the category label, the data
 * class badge and the sample size — the credibility markers travel with every
 * card, not just the article page.
 */
export default function InsightCard({ article }: { article: InsightArticleCard }) {
  const t = useTranslations("insights");
  const tCat = useTranslations("insights.category");
  const { date } = useFormat();

  return (
    <Link
      href={`/insights/${article.slug}`}
      className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          {tCat(article.category as any)}
        </span>
        <DataClassBadge dataClass={article.dataClass} />
      </div>
      <h3 className="mt-3 text-lg font-bold text-gray-900 leading-snug">{article.title}</h3>
      <p className="mt-2 text-sm text-gray-600 line-clamp-3 flex-1">{article.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-500 flex-wrap">
        {typeof article.sampleSize === "number" && article.dataClass !== "EDITORIAL" && (
          <span>
            {t("article.transparency.observations", { count: article.sampleSize })}
          </span>
        )}
        {article.publishedAt && <span>{date(article.publishedAt, { dateStyle: "medium" })}</span>}
        {typeof article.viewCount === "number" && article.viewCount > 0 && (
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {t("latest.views", { count: article.viewCount })}
          </span>
        )}
      </div>
    </Link>
  );
}