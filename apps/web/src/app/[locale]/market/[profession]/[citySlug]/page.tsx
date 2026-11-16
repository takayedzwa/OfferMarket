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
  buildBreadcrumbJsonLd,
  SITE_NAME,
} from "@/lib/structured-data";

/**
 * /market/{profession}/{citySlug} (T10). Gate-driven like the profession
 * page: 404 unless BOTH the city gate passes (sampleSize ≥30, sign-off,
 * distinct source) — never a noindex shell (Δ4). The city-unique editorial
 * block comes from the sign-off registry content (city-editorial.ts; the
 * briefs in docs/growth/content/market-city-template-spec.md are the source).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; profession: string; citySlug: string }>;
}): Promise<Metadata> {
  const { locale, profession, citySlug } = await params;
  const slug = profession.toLowerCase();
  const city = citySlug.toLowerCase();
  return {
    alternates: buildSelfCanonical(locale as "en" | "nl", `/market/${slug}/${city}`),
    title: `Uurloon elektricien in ${city} — live data | ${SITE_NAME}`,
    openGraph: {
      siteName: SITE_NAME,
      url: siteUrlForLocale(locale as "en" | "nl", `/market/${slug}/${city}`),
      images: ogImages(),
    },
    twitter: { card: "summary_large_image", images: twitterImages() },
  };
}

const getMarketCityPage = cache(async (profession: string, citySlug: string) => {
  try {
    const res = await insightsApi.marketPublicPage(profession, citySlug);
    return res.data as MarketPublicPagePayload;
  } catch {
    return null;
  }
});

export default async function MarketCityPage({
  params,
}: {
  params: Promise<{ locale: string; profession: string; citySlug: string }>;
}) {
  const { locale, profession: rawProfession, citySlug: rawCity } = await params;
  const slug = rawProfession.toLowerCase();
  const city = rawCity.toLowerCase();
  const page = await getMarketCityPage(slug, city);

  if (!page || !page.indexable) notFound();

  const t = await getTranslations({ locale, namespace: "market" });
  const sampleSize = page.gate.sampleSize ?? 0;
  const cityName = page.region?.name ?? city;
  const pageUrl = siteUrlForLocale(locale as "en" | "nl", `/market/${slug}/${city}`);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Market", url: siteUrlForLocale(locale as "en" | "nl", "/market") },
    { name: city, url: siteUrlForLocale(locale as "en" | "nl", `/market/${slug}`) },
    { name: `${cityName} — ${slug}`, url: pageUrl },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1">
          <section className="py-14 bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{t("hero.eyebrow")}</p>
              <h1 className="mt-2 text-4xl font-bold text-gray-900">
                {/* m-N3 rule: city + vacature tails answered in body/meta, never URL/H1 */}
                {t("hero.title")} — {cityName}
              </h1>
              <p className="mt-3 text-gray-600 max-w-2xl">{t("hero.subtitle")}</p>
            </div>
          </section>

          <section className="py-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <article>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("modules.salaryTitle")}</h2>
                <p className="text-gray-600 bg-gray-50 rounded-xl p-4">{t("modules.noData")}</p>
                {sampleSize > 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    {t("modules.provenance", {
                      window: "–",
                      samples: sampleSize,
                      method: "–",
                    })}
                  </p>
                )}
              </article>

              <article className="rounded-xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-xl font-bold text-gray-900">{t("cta.workerTitle")}</h2>
                <p className="mt-1 text-sm text-gray-600">{t("cta.workerNote")}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/register?role=WORKER" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    {t("cta.primary")}
                  </Link>
                  <Link href={`/market/${slug}`} className="border border-blue-300 text-blue-700 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    ← {slug}
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
