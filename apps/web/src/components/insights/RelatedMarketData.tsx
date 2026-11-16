import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { insightsApi, type InsightArticleDetail, type MarketPublicPagePayload } from "@/lib/api";
import { citySlugOf } from "@/lib/market";

// ============================================================================
// RELATED MARKET DATA (T12) — server component on insight article pages.
// ----------------------------------------------------------------------------
// When an article's `profession` (free text from the CMS, resolved by the
// snapshot engine's alias rules) maps to a gate-passing /market/{profession}
// page (optionally with the article's region as a gate-passing city page),
// this module renders the "related market data" cross-link. Renders NOTHING
// (and fetches nothing) unless the article declares a profession — the
// cross-link can only ever point at gate-passing URLs, so search engines
// never meet a link to a 404.
// ============================================================================

const getPage = cache(async (profession: string, citySlug?: string) => {
  try {
    const res = await insightsApi.marketPublicPage(profession, citySlug);
    return res.data as MarketPublicPagePayload;
  } catch {
    return null;
  }
});

export default async function RelatedMarketData({
  article,
  locale,
}: {
  article: InsightArticleDetail;
  locale: string;
}) {
  const profession = article.profession?.trim().toLowerCase();
  if (!profession) return null;

  const citySlug = citySlugOf(article.region?.name);
  // Both lookups resolve against the gate; neither can produce a link unless
  // the gate says INDEXABLE.
  const [profPage, cityPage] = await Promise.all([
    getPage(profession),
    citySlug ? getPage(profession, citySlug) : Promise.resolve(null),
  ]);
  if (!profPage?.indexable) return null;

  const links = [
    { href: `/market/${profession}`, label: profession },
    ...(cityPage?.indexable && citySlug
      ? [{ href: `/market/${profession}/${citySlug}`, label: citySlug }]
      : []),
  ];

  const t = await getTranslations({ locale, namespace: "market" });

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
      <h2 className="font-semibold text-gray-900">{t("related.title")}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-blue-700 hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
