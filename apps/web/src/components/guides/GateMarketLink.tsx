import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { insightsApi, type MarketPublicPagePayload } from "@/lib/api";

// ============================================================================
// GATE-MARKET-LINK (T10/T12 pattern) — renders the live-data cross-link only
// when the /market gate passes; renders nothing otherwise. Crawlers never
// meet a link to a 404.
// ============================================================================

const getPage = cache(async (profession: string) => {
  try {
    const res = await insightsApi.marketPublicPage(profession);
    return res.data as MarketPublicPagePayload;
  } catch {
    return null;
  }
});

export default async function GateMarketLink({
  profession,
  locale,
}: {
  profession: string;
  locale: string;
}) {
  const page = await getPage(profession.toLowerCase());
  if (!page?.indexable) return null;

  const t = await getTranslations({ locale, namespace: "guides" });
  return (
    <aside className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="text-lg font-bold text-gray-900">{t("marketLink.title")}</h2>
      <p className="mt-1 text-sm text-gray-600">{t("marketLink.note")}</p>
      <Link
        href={`/market/${profession.toLowerCase()}`}
        className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
      >
        → {t("marketLink.cta")}
      </Link>
    </aside>
  );
}
