'use client';

import { useState, useEffect, useCallback } from 'react';

export type ConsentType =
  | 'PRIVACY_POLICY'
  | 'TERMS_OF_SERVICE'
  | 'COOKIE_ANALYTICS'
  | 'COOKIE_MARKETING'
  | 'DATA_PROCESSING'
  | 'SPECIAL_CATEGORY'
  | 'EMAIL_NOTIFICATIONS'
  | 'PROFILE_VISIBLE'
  | 'MARKETING'
  | 'ID_VERIFICATION'
  | 'KVK_PROCESSING';

interface ConsentRecord {
  id: string;
  consentType: ConsentType;
  granted: boolean;
  status: string;
  version: string;
  legalBasis: string;
  grantedAt: string;
  withdrawnAt?: string | null;
  expiresAt?: string | null;
  ipAddress?: string;
}

interface ConsentState {
  consents: ConsentRecord[];
  loading: boolean;
  error: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useConsent() {
  const [state, setState] = useState<ConsentState>({
    consents: [],
    loading: true,
    error: null,
  });

  const fetchConsents = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setState({ consents: [], loading: false, error: null });
        return;
      }

      const response = await fetch(`${API_BASE}/privacy/consents`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch consents');
      }

      const data = await response.json();
      // API returns a flat array of consent records
      const consents = Array.isArray(data) ? data : [];
      setState({ consents, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const grantConsent = useCallback(async (consentType: ConsentType, legalBasis: string = 'CONSENT') => {
    try {
      const response = await fetch(`${API_BASE}/privacy/consents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          consentType,
          legalBasis,
          version: '1.0',
          granted: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to grant consent');
      }

      await fetchConsents(); // Refresh state
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to grant consent',
      }));
      return false;
    }
  }, [fetchConsents]);

  const withdrawConsent = useCallback(async (consentType: ConsentType) => {
    try {
      const response = await fetch(`${API_BASE}/privacy/consents/${consentType}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to withdraw consent');
      }

      await fetchConsents(); // Refresh state
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to withdraw consent',
      }));
      return false;
    }
  }, [fetchConsents]);

  const hasConsent = useCallback((consentType: ConsentType): boolean => {
    const record = state.consents.find(
      c => c.consentType === consentType && c.granted && !c.withdrawnAt
    );
    return !!record;
  }, [state.consents]);

  const getConsent = useCallback((consentType: ConsentType): ConsentRecord | undefined => {
    return state.consents.find(
      c => c.consentType === consentType && c.granted && !c.withdrawnAt
    );
  }, [state.consents]);

  return {
    consents: state.consents,
    loading: state.loading,
    error: state.error,
    grantConsent,
    withdrawConsent,
    hasConsent,
    getConsent,
    refresh: fetchConsents,
  };
}

// Cookie consent hook (local storage based, works without auth)
export function useCookieConsent() {
  const CONSENT_KEY = 'offermarket_cookie_consent';
  // Telecommunicatiewet Art. 11.7a: consent must be re-obtained after 13 months maximum
  const CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;

  const [cookieConsent, setCookieConsent] = useState<{
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp?: string;
    version?: string;
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if consent has expired (Telecommunicatiewet 13-month max)
        if (parsed.timestamp && (Date.now() - new Date(parsed.timestamp).getTime()) > CONSENT_MAX_AGE_MS) {
          localStorage.removeItem(CONSENT_KEY);
          return;
        }
        setCookieConsent(parsed.consent || parsed);
      } catch {
        // Invalid stored consent
      }
    }
  }, []);

  const saveCookieConsent = useCallback((
    analytics: boolean,
    marketing: boolean,
  ) => {
    const consent = {
      functional: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ consent, version: '1.0', timestamp: consent.timestamp }));
    setCookieConsent(consent);
  }, []);

  const hasAnalyticsConsent = cookieConsent?.analytics ?? false;
  const hasMarketingConsent = cookieConsent?.marketing ?? false;
  const hasGivenConsent = cookieConsent !== null;

  return {
    cookieConsent,
    hasAnalyticsConsent,
    hasMarketingConsent,
    hasGivenConsent,
    saveCookieConsent,
  };
}