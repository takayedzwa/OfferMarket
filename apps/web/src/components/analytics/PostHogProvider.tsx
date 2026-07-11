'use client';

import { useEffect } from 'react';

/**
 * PostHogProvider
 *
 * Initializes PostHog analytics with consent gating per Telecommunicatiewet Art. 11.7a.
 *
 * Key compliance features:
 * - PostHog starts in an opted-out state (`opt_out_capturing_by_default: true`)
 * - No tracking happens until the user explicitly grants analytics consent
 * - When consent is granted (via CookieConsentBanner), PostHog is opted in
 * - When consent is withdrawn, PostHog is opted out
 *
 * The CookieConsentBanner component calls `posthog.opt_in_capturing()` /
 * `posthog.opt_out_capturing()` based on user preference, which works with
 * this provider's initialization.
 *
 * If NEXT_PUBLIC_POSTHOG_KEY is not set, PostHog is not initialized at all.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey || typeof window === 'undefined') return;

    // Dynamically import PostHog only when the key is configured
    import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(posthogKey, {
          api_host: posthogHost || 'https://eu.posthog.com',
          // CRITICAL: Start opted out — no tracking until user gives consent
          opt_out_capturing_by_default: true,
          persistence: 'localStorage',
          disable_session_recording: true, // Enable only after explicit consent
          capture_pageview: false, // We'll enable after consent
          autocapture: false, // Disable auto-capture until consent
        });

        // Check if user has already granted analytics consent
        // If so, opt in immediately
        try {
          const stored = localStorage.getItem('offermarket_cookie_consent');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.consent?.analytics) {
              posthog.opt_in_capturing();
              posthog.capture_pageview();
            }
          }
        } catch {
          // If we can't read consent, stay opted out
        }
      })
      .catch(() => {
        // PostHog failed to load — analytics silently disabled
      });
  }, []);

  return <>{children}</>;
}