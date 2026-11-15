import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { insightsApi, type MarketPublicPagePayload } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildSelfCanonical, ogImages, twitterImages } from "@/lib/metadata";
import { siteUrlForLocale } from "@/i18n/routing";
import {
  buildOccupationJsonLd,
  buildDatasetJsonLd,
  SITE_NAME,
  buildBreadcrumbJsonLd,
} from "@/lib/structured-data";

/**
 * /market/{profession} (T10). NL-market content per Δ5: self-canonical only,
 * NO hreflang (no honest EN twin at launch). Gate-driven (T11): this route
 * 404s unless the profession-level gate is indexable — sampleSize ≥30 with
 * hysteresis. Unknown professions (no snapshot at all) hold no data → 404.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; profession: string }>;
}): Promise<Metadata> {
  const { locale, profession } = await params;
  const slug = profession.toLowerCase();
  return {
    alternates: buildSelfCanonical(locale as "en" | "nl", `/market/${slug}`),
    title: "Wat verdient een elektricien? | OfferMarket",
    openGraph: {
      siteName: SITE_NAME,
      url: siteUrlForLocale(locale as "en" | "nl", `/market/${slug}`),
      images: ogImages(),
    },
    twitter: { card: "summary_large_image", images: twitterImages() },
  };
}

const getMarketPage = cache(async (profession: string) => {
  try {
    const res = await insightsApi.marketPublicPage(profession);
    return res.data as MarketPublicPagePayload;
  } catch {
    return null;
  }
});

const PROFESSION_DISPLAY_NAME: Record<string, string> = {
  elektricien: "Elektricien",
  elektromonteur: "Elektricien",
};

export default async function MarketProfessionPage({
  params,
}: {
  params: Promise<{ locale: string; profession: string }>;
}) {
  const { locale, profession: rawProfession } = await params;
  const slug = rawProfession.toLowerCase();
  const page = await getMarketPage(slug);

  // Gate closed (no data / below threshold / exited) → 404, per Δ4 doctrine:
  // no noindex shells, every crawlable URL is a real page.
  if (!page || !page.indexable) notFound();

  const t = await getTranslations({ locale, namespace: "market" });
  const displayName = PROFESSION_DISPLAY_NAME[slug] ?? slug;
  const snapshotData = page.snapshot?.data;
  const salary = snapshotData?.salary ?? {};
  const demand = snapshotData?.demand ?? {};
  const provenance = (page.snapshot?.data?.provenance ?? {}) as {
    windowDays?: number;
    computedAt?: string;
    methodVersion?: string;
  };
  const sampleSize = salary.sampleSize ?? page.gate.sampleSize ?? 0;

  const pageUrl = siteUrlForLocale(locale as "en" | "nl", `/market/${slug}`);
  const jsonLd = buildOccupationJsonLd({
    professionName: displayName,
    salary: salary as never,
    pageUrl,
  });
  const datasetLd = buildDatasetJsonLd({
    datasetName: `${SITE_NAME} marktdataset elektricien`,
    description:
      locale === "nl"
        ? "Gated marktcijfers (salaris p25/p50/p75, vraag) berekend uit echte gestructureerde salarisoffers op de OfferMarket-marktplaats."
        : "Gated market figures (salary p25/p50/p75, demand) computed from real structured salary offers on the OfferMarket marketplace.",
    endpointUrl: `${new URL(pageUrl).origin.replace("offermarket.eu", "api.offermarket.eu")}/api/v1/insights/market/public/${slug}`,
  });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Market", url: siteUrlForLocale(locale as "en" | "nl", "/market") },
    { name: displayName, url: pageUrl },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1">
          <section className="py-14 bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{t("hero.eyebrow")}</p>
              <h1 className="mt-2 text-4xl font-bold text-gray-900">{t("hero.title")}</h1>
              <p className="mt-3 text-gray-600 max-w-2xl">{t("hero.subtitle")}</p>
            </div>
          </section>

          <section className="py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <article>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("definition.title")}</h2>
                <p className="text-gray-700">{t("definition.text")}</p>
              </article>

              <article>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("modules.salaryTitle")}</h2>
                {salary.available && salary.value ? (
                  <div className="grid grid-cols-3 gap-4">
                    {(
                      [
                        ["p25", salary.value.p25],
                        ["p50", salary.value.p50],
                        ["p75", salary.value.p75],
                      ] as const
                    ).map(([key, val]) => (
                      <div key={key} className={`rounded-xl border p-4 ${key === "p50" ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                        <p className="text-xs text-gray-500">{t(`modules.${key}`)}</p>
                        <p className="text-2xl font-bold text-gray-900">€{val ?? "–"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{t("modules.noData")}</p>
                )}
                {sampleSize > 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    {t("modules.provenance", {
                      window: provenance?.windowDays ?? "–",
                      samples: sampleSize,
                      method: provenance?.methodVersion ?? "–",
                    })}
                  </p>
                )}
              </article>

              <article>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("modules.demandTitle")}</h2>
                {demand.available && demand.value ? (
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-gray-900">{demand.value.offers}</div>
                    <div className="text-sm text-gray-600">20+ gebundelde open vraag</div>
                  </div>
                ) : (
                  <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{t("modules.noData")}</p>
                )}
              </article>

              <article className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-xl font-bold text-gray-900">{t("cta.workerTitle")}</h2>
                <p className="mt-1 text-sm text-gray-600">{t("cta.workerNote")}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/register?role=WORKER" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    {t("cta.primary")}
                  </Link>
                  <Link href="/for-employers" className="border border-blue-300 text-blue-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    {t("cta.employerLink")}
                  </Link>
                </div>
              </article>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
