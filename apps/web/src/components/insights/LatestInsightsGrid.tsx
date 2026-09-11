"use client";

import { useTranslations } from "next-intl";
import type { InsightArticleCard } from "@/lib/api";
import InsightCard from "./InsightCard";

/**
 * Grid of the latest published insights. Empty state is honest: nothing
 * published yet — never filler cards.
 */
export default function LatestInsightsGrid({ articles, empty }: { articles: InsightArticleCard[]; empty?: string }) {
  const t = useTranslations("insights.latest");
  if (articles.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">{empty ?? t("empty")}</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <InsightCard key={article.id} article={article} />
      ))}
    </div>
  );
}