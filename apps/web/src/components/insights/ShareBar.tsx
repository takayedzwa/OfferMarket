"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link2, Share2 } from "lucide-react";
import { insightsApi, getInsightsSessionKey } from "@/lib/api";

/**
 * LinkedIn / Facebook / WhatsApp share rail. URL-encoded share-intent links —
 * no third-party SDK, no tracking script. The social preview image is the
 * article's generated opengraph-image. Each share click feeds the article's
 * shareCount via the anonymous analytics endpoint.
 */
export default function ShareBar({ url, title, articleId }: { url: string; title: string; articleId: string }) {
  const t = useTranslations("insights.article.share");
  const [copied, setCopied] = useState(false);

  const trackShare = () => {
    void insightsApi.trackEvent({ sessionKey: getInsightsSessionKey(), articleId, eventType: "SHARE" }).catch(() => {});
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    {
      label: t("linkedin"),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: t("facebook"),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: t("whatsapp"),
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — silently keep the buttons usable.
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Share2 className="w-4 h-4 text-gray-500" />
        {t("title")}
      </h3>
      <div className="mt-2 flex flex-col gap-2">
        {targets.map((target) => (
          <a
            key={target.href}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackShare}
            data-share-network={target.label}
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {target.label}
          </a>
        ))}
        <button
          type="button"
          onClick={copy}
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left flex items-center gap-2"
        >
          <Link2 className="w-4 h-4 text-gray-500" />
          {copied ? t("copied") : t("copyLink")}
        </button>
      </div>
    </div>
  );
}