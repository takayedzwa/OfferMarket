'use client';

import { useState, useEffect } from 'react';

type CookieCategory = 'functional' | 'analytics' | 'marketing';

interface ConsentState {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = 'offermarket_cookie_consent';
const CONSENT_VERSION = '1.0';
// Telecommunicatiewet Art. 11.7a: consent must be re-obtained after 13 months maximum
const CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    functional: true, // Always on — essential cookies
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version !== CONSENT_VERSION) {
          // Version mismatch — re-ask for consent
          setVisible(true);
        } else if (parsed.timestamp && (Date.now() - new Date(parsed.timestamp).getTime()) > CONSENT_MAX_AGE_MS) {
          // Telecommunicatiewet: consent expires after 13 months — re-ask
          localStorage.removeItem(CONSENT_KEY);
          setVisible(true);
        } else {
          setConsent(parsed.consent);
          syncConsentToApi(parsed.consent); // No previous state on initial load — only sync grants
        }
      } catch {
        setVisible(true);
      }
    }

    // Listen for 'consent:show' event from CookieSettingsButton
    const handleShowBanner = () => {
      setShowDetails(false);
      // Re-read current consent from localStorage
      const current = localStorage.getItem(CONSENT_KEY);
      if (current) {
        try {
          const parsed = JSON.parse(current);
          setConsent(parsed.consent || { functional: true, analytics: false, marketing: false });
        } catch {
          setConsent({ functional: true, analytics: false, marketing: false });
        }
      }
      setVisible(true);
    };

    window.addEventListener('consent:show', handleShowBanner);
    return () => window.removeEventListener('consent:show', handleShowBanner);
  }, []);

  const handleAcceptAll = () => {
    const previousConsent = consent;
    const allAccepted: ConsentState = {
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted, previousConsent);
  };

  const handleRejectAll = () => {
    const previousConsent = consent;
    const onlyFunctional: ConsentState = {
      functional: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(onlyFunctional, previousConsent);
  };

  const handleSavePreferences = () => {
    saveConsent(consent, consent);
  };

  const saveConsent = (state: ConsentState, previousState?: ConsentState) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      consent: state,
      timestamp: new Date().toISOString(),
    }));
    setConsent(state);
    setVisible(false);
    syncConsentToApi(state, previousState);

    // Notify PostHogProvider and other listeners of consent change
    window.dispatchEvent(new CustomEvent('consent:change', {
      detail: { analytics: state.analytics, marketing: state.marketing },
    }));
  };

  const syncConsentToApi = async (state: ConsentState, previousState?: ConsentState) => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

      // Telecommunicatiewet Art. 11.7a: consent must be logged even for
      // unauthenticated visitors. Use the anonymous endpoint when no token.
      const endpoint = token
        ? `${apiBaseUrl}/privacy/consents`
        : `${apiBaseUrl}/privacy/consents/anonymous`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Sync analytics consent — record both grants and withdrawals
      // for a complete audit trail (GDPR Art. 7(3) + Telecommunicatiewet)
      if (state.analytics) {
        await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consentType: 'COOKIE_ANALYTICS',
            legalBasis: 'CONSENT',
            version: CONSENT_VERSION,
            granted: true,
          }),
        });
      } else if (previousState?.analytics) {
        // Analytics was previously granted and now withdrawn — record withdrawal
        await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consentType: 'COOKIE_ANALYTICS',
            legalBasis: 'CONSENT',
            version: CONSENT_VERSION,
            granted: false,
          }),
        });
      }

      // Sync marketing consent — record both grants and withdrawals
      if (state.marketing) {
        await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consentType: 'COOKIE_MARKETING',
            legalBasis: 'CONSENT',
            version: CONSENT_VERSION,
            granted: true,
          }),
        });
      } else if (previousState?.marketing) {
        // Marketing was previously granted and now withdrawn — record withdrawal
        await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            consentType: 'COOKIE_MARKETING',
            legalBasis: 'CONSENT',
            version: CONSENT_VERSION,
            granted: false,
          }),
        });
      }
    } catch (error) {
      // Silently fail — consent is stored locally even if API sync fails
      console.error('Failed to sync cookie consent to API:', error);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {!showDetails ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                🍪 We value your privacy
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                We use cookies to enhance your experience. Functional cookies are essential for the site to work.
                Analytics and marketing cookies are optional and require your consent.{' '}
                <a href="/privacy" className="text-blue-600 underline hover:text-blue-800">Learn more in our Privacy Policy</a>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50"
              >
                Reject Optional
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50"
              >
                Accept All
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Customize
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              You can change your preferences at any time via Cookie Settings.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cookie Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Functional Cookies</p>
                  <p className="text-xs text-gray-500">Essential for the website to function. Cannot be disabled.</p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Analytics Cookies</p>
                  <p className="text-xs text-gray-500">Help us understand how visitors interact with our website. We use PostHog for anonymized analytics.</p>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Marketing Cookies</p>
                  <p className="text-xs text-gray-500">Used to track visitors across websites for advertising purposes.</p>
                </div>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50"
              >
                Reject Optional
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50"
              >
                Accept All
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              You can change your preferences at any time via Cookie Settings.{' '}
              <a href="/privacy" className="text-blue-600 underline hover:text-blue-800">Privacy Policy</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}