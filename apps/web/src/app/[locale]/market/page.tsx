import type { Metadata } from "next";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { insightsApi, type IndexableMarketPage } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildSelfCanonical, ogImages, twitterImages } from "@/lib/metadata";
import { siteUrlForLocale } from "@/i18n/routing";
import { SITE_NAME } from "@/lib/structured-data";

/**
 * /market hub (T10): the discovery surface listing gate-passing
 * (profession, city) pages. noindex while nothing has shipped (Δ3a row: hub
 * index is navigational; an empty hub is thin and must not enter the index).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const pages = await getIndexablePages();
  return {
    alternates: buildSelfCanonical(locale as "en" | "nl", "/market"),
    title: "Marktdata | OfferMarket",
    ...(pages.length === 0
      ? { robots: { index: false, follow: true } }
      : {}),
    openGraph: {
      siteName: SITE_NAME,
      url: siteUrlForLocale(locale as "en" | "nl", "/market"),
      images: ogImages(),
    },
    twitter: { card: "summary_large_image", images: twitterImages() },
  };
}

const getIndexablePages = cache(async () => {
  try {
    const res = await insightsApi.marketPublicIndexable();
    return (res.data ?? []) as IndexableMarketPage[];
  } catch {
    return [];
  }
});

export default async function MarketHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "market" });
  const pages = await getIndexablePages();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="py-14 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{t("hero.eyebrow")}</p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">Marktdata</h1>
            <p className="mt-3 text-gray-600 max-w-2xl">{t("hero.subtitle")}</p>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {pages.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h2 className="text-lg font-bold text-gray-900">{t("empty.title")}</h2>
                <p className="mt-1 text-sm text-gray-600">{t("empty.text")}</p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {pages.map((p) => (
                  <li key={`${p.profession}:${p.citySlug ?? ""}`} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    <Link
                      href={`/market/${p.profession}${p.citySlug ? `/${p.citySlug}` : ""}`}
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      {p.profession}
                      {p.citySlug ? ` — ${p.citySlug}` : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
