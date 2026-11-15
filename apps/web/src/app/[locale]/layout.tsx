import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, siteUrlForLocale } from "@/i18n/routing";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/structured-data";
import "../globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import CookieConsentBanner from "@/components/consent/CookieConsentBanner";
import CookieSettingsButton from "@/components/consent/CookieSettingsButton";
import PostHogProvider from "@/components/analytics/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pre-render every supported locale at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common.site" });
  return {
    title: t("title"),
    description: t("description"),
    // Per-domain URL base (T1/T2): locale authority maps to its domain
    // statically — keeps per-locale prerendering intact (no request-time API).
    metadataBase: new URL(siteUrlForLocale(locale as "en" | "nl")),
    // og:image / twitter:image themselves are injected site-wide by the
    // opengraph-image file convention (see app/opengraph-image.tsx).
    openGraph: { siteName: "OfferMarket" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Reject unknown locales with the Next.js 404 page.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for the active locale.
  setRequestLocale(locale);

  // Load the message catalog for this locale (used by client components via the
  // provider, and by server components via `getTranslations`).
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* Site-wide structured data (T6): Organization + WebSite. No
            SearchAction (retired rich result), no Persona/JobPosting — the
            rationale lives in lib/structured-data.ts. Locale-anchored URLs. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildOrganizationJsonLd(locale as "en" | "nl")),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildWebSiteJsonLd(locale as "en" | "nl")),
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <PostHogProvider>
              {children}
            </PostHogProvider>
          </AuthProvider>
          <CookieConsentBanner />
          <CookieSettingsButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}