"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { insightsApi, getInsightsSessionKey } from "@/lib/api";

/**
 * Anonymous-safe analytics for Insights pages. The sessionKey is a random
 * per-browser key (never an IP or device fingerprint), so events carry no
 * personal data and the endpoint is public + throttled. Fire-and-forget:
 * analytics failures must never break the reader experience.
 *
 * Usage:
 *   useInsightsTrackView({ articleId })            // article page
 *   useInsightsTrackView({ category: 'SALARY' })   // category page
 */
export function useInsightsTrackView(options: { articleId?: string; category?: string } = {}) {
  const pathname = usePathname();
  const locale = useLocale();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const track = async (eventType: string) => {
      try {
        await insightsApi.trackEvent({
          sessionKey: getInsightsSessionKey(),
          eventType,
          articleId: options.articleId,
          path: pathname,
          locale,
        });
      } catch {
        // Analytics must never surface to the reader.
      }
    };

    void track(options.articleId ? "ARTICLE_VIEW" : "CATEGORY_VIEW");
    if (options.articleId) void track("UNIQUE_READER");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** One-shot event helper for clicks (REGISTER_CLICK etc.). */
export function trackInsightEvent(eventType: string, articleId?: string) {
  void insightsApi
    .trackEvent({ sessionKey: getInsightsSessionKey(), eventType, articleId })
    .catch(() => {});
}