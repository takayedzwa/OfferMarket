'use client';

import { useEffect, useRef } from 'react';

/**
 * PostHogProvider
 *
 * Initializes PostHog analytics only after the user grants analytics consent.
 * Fully compliant with Telecommunicatiewet Art. 11.7a and GDPR.
 *
 * Key compliance features:
 * - PostHog is NOT loaded at all until analytics consent is granted
 * - When consent is granted, PostHog is dynamically imported and initialized
 * - When consent is withdrawn, PostHog is shut down and unloaded
 * - Listens for 'consent:change' events dispatched by CookieConsentBanner
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const posthogRef = useRef<any>(null);
  // Ref guard prevents double-init without retriggering the effect (which
  // would cause an init -> shutdown -> init loop via state in the dep array).
  const initializedRef = useRef(false);

  useEffect(() => {
    // Read env inside the effect so tests can set NEXT_PUBLIC_POSTHOG_KEY
    // per-case; in production Next.js inlines these NEXT_PUBLIC_* values at
    // build time, so this is equivalent to a module-level constant.
    const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
    const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com';

    if (!POSTHOG_KEY || typeof window === 'undefined') return;

    // Check initial consent state from localStorage
    const checkConsent = (): boolean => {
      try {
        const stored = localStorage.getItem('offermarket_cookie_consent');
        if (!stored) return false;
        const parsed = JSON.parse(stored);
        return parsed?.consent?.analytics === true;
      } catch {
        return false;
      }
    };

    const initPostHog = async () => {
      if (initializedRef.current || !POSTHOG_KEY) return;
      initializedRef.current = true;
      const posthog = (await import('posthog-js')).default;
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Consent was given, so opt in directly
        opt_out_capturing_by_default: false,
        capture_pageview: true,
        disable_session_recording: false,
      });
      posthog.capture('$pageview');
      posthogRef.current = posthog;
    };

    const shutdownPostHog = () => {
      if (posthogRef.current) {
        posthogRef.current.shutdown();
        posthogRef.current = null;
        initializedRef.current = false;
      }
    };

    // Check initial consent — only initialize if already granted
    if (checkConsent()) {
      initPostHog();
    }

    // Listen for consent changes from CookieConsentBanner
    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { analytics } = customEvent.detail || {};
      if (analytics) {
        initPostHog();
      } else {
        shutdownPostHog();
      }
    };

    // Also listen for storage changes (e.g., from other tabs)
    const handleStorageChange = () => {
      if (checkConsent()) {
        initPostHog();
      } else {
        shutdownPostHog();
      }
    };

    window.addEventListener('consent:change', handleConsentChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('consent:change', handleConsentChange);
      window.removeEventListener('storage', handleStorageChange);
      shutdownPostHog();
    };
  }, []);

  return <>{children}</>;
}