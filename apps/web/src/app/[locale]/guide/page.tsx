import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildSharedAlternates, ogImages, twitterImages } from "@/lib/metadata";
import { siteUrlForLocale } from "@/i18n/routing";
import { GUIDES } from "@/components/guides/content";
import { SITE_NAME } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides.hub" });
  const title = `${t("title")} | ${SITE_NAME}`;
  return {
    title,
    description: t("subtitle"),
    alternates: buildSharedAlternates(locale as "en" | "nl", "/guide"),
    openGraph: {
      siteName: SITE_NAME,
      title,
      description: t("subtitle"),
      url: siteUrlForLocale(locale as "en" | "nl", "/guide"),
      images: ogImages(),
    },
    twitter: { card: "summary_large_image", title, description: t("subtitle"), images: twitterImages() },
  };
}

export default async function GuideHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides.hub" });
  const isNl = locale === "nl";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="py-14 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{t("eyebrow")}</p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">{t("title")}</h1>
            <p className="mt-3 text-gray-600 max-w-2xl">{t("subtitle")}</p>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-5 sm:grid-cols-2">
            {GUIDES.map((g) => (
              <Link
                key={g.slug}
                href={`/guide/${g.slug}`}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 hover:border-blue-300 transition-colors"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {g.audience === "worker" ? (isNl ? "Voor vakmensen" : "For tradespeople") : isNl ? "Voor werkgevers" : "For employers"}
                </p>
                <h2 className="mt-2 text-lg font-bold text-gray-900">{g.title[isNl ? "nl" : "en"]}</h2>
                <p className="mt-2 text-sm text-gray-600">{g.description[isNl ? "nl" : "en"]}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
