import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteUrlForLocale } from "@/i18n/routing";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildSharedAlternates, ogImages, twitterImages } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing.meta" });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: buildSharedAlternates(locale as "en" | "nl", "/pricing"),
    openGraph: {
      siteName: "OfferMarket",
      title,
      description,
      url: siteUrlForLocale(locale as "en" | "nl", "/pricing"),
      locale: locale === "nl" ? "nl_NL" : "en_GB",
      images: ogImages(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: twitterImages(),
    },
  };
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero + price */}
        <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              {t("hero.title")}{" "}
              <span className="text-blue-600">{t("hero.highlight")}</span>{" "}
              {t("hero.titleSuffix")}
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>

        {/* Included */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("included.title")}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["item1", "item2", "item3", "item4"] as const).map((key) => (
                <li
                  key={key}
                  className="flex items-start gap-3 bg-gray-50 rounded-lg p-4 text-gray-700 text-sm"
                >
                  <span className="mt-0.5 text-blue-600" aria-hidden>
                    ✓
                  </span>
                  {t(`included.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("compare.title")}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t("compare.subtitle")}
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm bg-white rounded-lg shadow-sm border border-gray-200">
                <tbody>
                  {(["row1", "row2", "row3", "row4"] as const).map((key) => (
                    <tr
                      key={key}
                      className={
                        key === "row4"
                          ? "border-t border-gray-200 bg-blue-50"
                          : "border-t border-gray-200"
                      }
                    >
                      <td className="px-4 py-4 font-medium text-gray-900">
                        {t(`compare.${key}.label`)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {t(`compare.${key}.price`)}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {t(`compare.${key}.note`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why employers like it */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("guarantee.title")}
            </h2>
            <ul className="space-y-3 text-gray-700">
              {(["line1", "line2", "line3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 text-blue-600" aria-hidden>
                    •
                  </span>
                  {t(`guarantee.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=employer"
                className="inline-flex justify-center px-8 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
              >
                {t("cta.primary")}
              </Link>
              <Link
                href="/for-employers"
                className="inline-flex justify-center px-8 py-3 rounded-lg border border-white/60 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                {t("cta.secondary")}
              </Link>
            </div>
            <p className="mt-4 text-sm text-blue-100">
              {t("cta.candidateNote")}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
