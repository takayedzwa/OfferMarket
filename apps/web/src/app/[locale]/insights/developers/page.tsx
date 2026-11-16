import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildSharedAlternates, ogImages, twitterImages } from "@/lib/metadata";
import { siteUrlForLocale } from "@/i18n/routing";
import { SITE_NAME } from "@/lib/structured-data";

/**
 * /insights/developers (T11/D2.4): the public documentation page for the
 * aggregate market-data endpoint — the AI_SEARCH_STRATEGY minimal-public-feed
 * spec's docs surface. EN on offermarket.eu, NL on offermarket.nl (shared
 * template class). No per-worker data is documented or exposed; every number
 * the endpoint returns is a sample-gated aggregate with provenance.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isNl = locale === "nl";
  const title = isNl
    ? `Marktdata API voor developers | ${SITE_NAME}`
    : `Market data API for developers | ${SITE_NAME}`;
  const description = isNl
    ? "Vrije, gestructureerde marktcijfers (salarisverdeling, vraag) uit echte salarisoffers — met sample size en methode. Voor research, journalistiek en AI-toepassingen."
    : "Open, structured market figures (salary distribution, demand) from real salary offers — with sample size and methodology. For research, journalism and AI applications.";
  return {
    title,
    description,
    alternates: buildSharedAlternates(locale as "en" | "nl", "/insights/developers"),
    openGraph: {
      siteName: SITE_NAME,
      title,
      description,
      url: siteUrlForLocale(locale as "en" | "nl", "/insights/developers"),
      images: ogImages(),
    },
    twitter: { card: "summary_large_image", title, description, images: twitterImages() },
  };
}

function docsCopy(isNl: boolean) {
  return isNl
    ? {
        intro:
          "Dit endpoint serveert gated marktcijfers van de OfferMarket-marktplaats: een geaggregeerde salarisverdeling en vraagindicatoren per beroep (en per stad, zodra aan de drempelwaarden is voldaan). Elk veld is afkomstig uit een meting op echte, door de kandidaat geaccepteerde salarisstructuur in voorstellen — nooit van een inschatting.",
        endpointTitle: "Endpoint",
        privacyTitle: "Privacy en data",
        privacyLines: [
          "Alleen geaggregeerde, met drempels afgeschermde cijfers (sample size is onderdeel van elke waarde).",
          "Geen enkele kandidaat- of werkgebergegevens; kleine cellen worden weggefilterd vóór berekening.",
          "Bron: metingen op de marktplaats (dataklasse OFFERMARKT); uitgebreide methodebeschrijving via contact hieronder.",
        ],
        fields: [
          ["indexable", "boolean — of de bijbehorende publieke marktpagina actief is (inklikbaar)"],
          ["verdict", "string — statuscode van de gate (bv. INDEXABLE, HOLD_BELOW_THRESHOLD)"],
          ["gate.sampleSize", "getal — samplegrootte achter de laatste drempelmeting"],
          ["snapshot.data.salary", "object — geaggregeerde salarisverdeling (p25/p50/p75 in EUR) met sampleSize"],
          ["snapshot.data.provenance", "object — windowDays, methodVersion, computedAt (de herkomst)"],
        ],
        note: "Geen authenticatie nodig; geen gegarandeerde beschikbaarheid tijdens beta-periode. Cache-headers worden gezet; vertrouw op periodieke herversies in plaats van real-time.",
      }
    : {
        intro:
          "This endpoint serves gated market data from the OfferMarket marketplace: an aggregated salary distribution and demand indicators per profession (and per city, once the sample thresholds are met). Every field comes from a measurement of real, salary-structured offers — never an estimate.",
        endpointTitle: "Endpoint",
        privacyTitle: "Privacy and data",
        privacyLines: [
          "Aggregate, threshold-gated figures only (sample size ships with every value).",
          "No candidate or employer data of any kind; small cells are suppressed before computation.",
          "Source: marketplace measurements (data class OFFERMARKT); detailed methodology via the contact below.",
        ],
        fields: [
          ["indexable", "boolean — whether the matching public market page is live"],
          ["verdict", "string — the gate's status code (e.g. INDEXABLE, HOLD_BELOW_THRESHOLD)"],
          ["gate.sampleSize", "number — sample size behind the latest threshold measurement"],
          ["snapshot.data.salary", "object — aggregated salary distribution (p25/p50/p75 in EUR) with sampleSize"],
          ["snapshot.data.provenance", "object — windowDays, methodVersion, computedAt (the provenance)"],
        ],
        note: "No authentication; no availability guarantee during the beta period. Cache headers are set; rely on periodic revision rather than real-time.",
      };
}

export default async function DevelopersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isNl = locale === "nl";
  const c = docsCopy(isNl);
  const apiBase = isNl
    ? "https://api.offermarket.nl/api/v1"
    : "https://api.offermarket.eu/api/v1";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isNl ? "Open marktdata-endpoint" : "Open market data endpoint"}
            </h1>
            <p className="mt-3 text-gray-600">{c.intro}</p>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{c.endpointTitle}</h2>
              <pre className="text-sm bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto" style={{ whiteSpace: "pre-wrap" }}>
{`GET ${apiBase}/insights/market/public/{profession}
GET ${apiBase}/insights/market/public/{profession}/{citySlug}

# Current professions available at:
GET ${apiBase}/insights/professions`}
              </pre>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isNl ? "Belangrijkste velden" : "Key fields"}
              </h2>
              <ul className="text-sm text-gray-700 space-y-2">
                {c.fields.map(([name, desc]) => (
                  <li key={name} className="flex gap-2">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{name}</code>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{c.privacyTitle}</h2>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                {c.privacyLines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">{c.note}</p>
              <p className="mt-4 text-sm text-gray-700">
                {isNl
                  ? "Contact voor research/gebruik: "
                  : "Contact for research/use: "}
                <a className="text-blue-700 hover:underline" href="mailto:support@offermarket.nl">support@offermarket.nl</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
