import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildSharedAlternates, ogImages, twitterImages } from "@/lib/metadata";
import { siteUrlForLocale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.forWorkers.meta" });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: buildSharedAlternates(locale as "en" | "nl", "/for-workers"),
    openGraph: {
      siteName: "OfferMarket",
      title,
      description,
      url: siteUrlForLocale(locale as "en" | "nl", "/for-workers"),
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

export default async function ForWorkersPage() {
  const t = await getTranslations("landing.forWorkers");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              {t("hero.eyebrow")}
            </p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              {t("hero.title")}
              <span className="text-blue-600">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=WORKER"
                className="inline-flex justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                {t("cta.primary")}
              </Link>
              <Link
                href="/for-employers"
                className="inline-flex justify-center px-8 py-3 rounded-lg border border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
              >
                {t("cta.note")}
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              {t("steps.title")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {(["step1", "step2", "step3"] as const).map((key, i) => (
                <div key={key} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-gray-900">{t(`steps.${key}.title`)}</h3>
                  <p className="mt-2 text-sm text-gray-600">{t(`steps.${key}.text`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy / control */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("privacy.title")}
            </h2>
            <ul className="space-y-3">
              {(["line1", "line2", "line3", "line4"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-1 text-blue-600" aria-hidden>✓</span>
                  {t(`privacy.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Free for tradespeople */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-gray-900">{t("free.title")}</h2>
            <p className="mt-2 text-gray-700">{t("free.text")}</p>
          </div>
        </section>

        {/* Honesty section */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg font-bold text-gray-900">{t("honesty.title")}</h2>
            <p className="mt-2 text-sm text-gray-600 max-w-3xl">{t("honesty.text")}</p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/register?role=WORKER"
              className="inline-flex justify-center px-8 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
            >
              {t("cta.primary")}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
