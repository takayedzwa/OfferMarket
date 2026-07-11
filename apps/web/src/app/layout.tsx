import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import CookieConsentBanner from "../components/consent/CookieConsentBanner";
import CookieSettingsButton from "../components/consent/CookieSettingsButton";
import PostHogProvider from "../components/analytics/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OfferMarket - Reverse Talent Marketplace",
  description: "Anonymous worker profiles meet structured employer offers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </AuthProvider>
        <CookieConsentBanner />
        <CookieSettingsButton />
      </body>
    </html>
  );
}