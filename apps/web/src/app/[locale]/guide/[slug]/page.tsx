import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GateMarketLink from "@/components/guides/GateMarketLink";
import { GUIDES, findGuide } from "@/components/guides/content";
import { buildSharedAlternates, ogImages, twitterImages } from "@/lib/metadata";
import { siteUrlForLocale } from "@/i18n/routing";
import { buildBreadcrumbJsonLd, buildDefinedTermSetJsonLd, SITE_NAME } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return { title: "Guide" };
  const isNl = locale === "nl";
  const title = `${guide.title[isNl ? "nl" : "en"]} | ${SITE_NAME}`;
  const description = guide.description[isNl ? "nl" : "en"];
  return {
    title,
    description,
    alternates: buildSharedAlternates(locale as "en" | "nl", `/guide/${slug}`),
    openGraph: {
      siteName: SITE_NAME,
      title,
      description,
      url: siteUrlForLocale(locale as "en" | "nl", `/guide/${slug}`),
      images: ogImages(),
    },
    twitter: { card: "summary_large_image", title, description, images: twitterImages() },
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  const isNl = locale === "nl";
  const localeKey = isNl ? "nl" : "en";
  const t = await getTranslations({ locale, namespace: "guides.hub" });

  const pageUrl = siteUrlForLocale(locale as "en" | "nl", `/guide/${guide.slug}`);
  const others = GUIDES.filter((g) => g.slug !== guide.slug);

  const crumbs = buildBreadcrumbJsonLd([
    { name: isNl ? "Gidsen" : "Guides", url: siteUrlForLocale(locale as "en" | "nl", "/guide") },
    { name: guide.title[localeKey], url: pageUrl },
  ]);
  const termSet = guide.definedTerms
    ? buildDefinedTermSetJsonLd(
        guide.definedTerms.map((d) => ({ name: d.name, description: d.description[localeKey] })),
        pageUrl,
      )
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      {termSet && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(termSet) }} />
      )}
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1">
          <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="mb-4 text-sm text-gray-500">
                <Link href="/guide" className="hover:text-blue-700">{isNl ? "Gidsen" : "Guides"}</Link>
                <span className="mx-2">/</span>
                <span>{guide.slug}</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {guide.title[localeKey]}
              </h1>
              <p className="mt-3 text-gray-600">{guide.description[localeKey]}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {guide.audience === "worker" ? (isNl ? "Voor vakmensen" : "For tradespeople") : isNl ? "Voor werkgevers" : "For employers"}
              </p>
            </div>
          </section>

          <article className="py-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              {guide.sections[localeKey].map((section) => (
                <section key={section.heading}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{section.heading}</h2>
                  <div className="space-y-3">
                    {section.body.map((paragraph, i) => (
                      <p key={i} className="text-gray-700 leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}

              {guide.marketLink && (
                <GateMarketLink profession={guide.marketLink.profession} locale={locale} />
              )}

              <aside className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h2 className="font-semibold text-gray-900">{isNl ? "Meer lezen" : "More reading"}</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {others.map((o) => (
                    <li key={o.slug}>
                      <Link href={`/guide/${o.slug}`} className="text-blue-700 hover:underline">
                        {o.title[localeKey]}
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/for-workers" className="text-blue-700 hover:underline">
                      {isNl ? "Anoniem verkennen op OfferMarket →" : "Explore anonymously on OfferMarket →"}
                    </Link>
                  </li>
                </ul>
              </aside>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}
