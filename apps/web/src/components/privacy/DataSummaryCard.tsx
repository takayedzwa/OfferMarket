'use client';

import { useState } from 'react';
import { useConsent, ConsentType } from '@/hooks/useConsent';

export default function DataSummaryCard() {
  const { consents, loading, grantConsent, withdrawConsent } = useConsent();
  // Track whether we've ever loaded successfully — only show skeleton on first load,
  // not when refreshing after a toggle (which would cause a jarring page jump)
  const hasLoaded = consents.length > 0 || !loading;

  const consentCategories = [
    { type: 'PRIVACY_POLICY', label: 'Privacy Policy', description: 'Processing of your personal data under our privacy policy', required: true },
    { type: 'TERMS_OF_SERVICE', label: 'Terms of Service', description: 'Acceptance of our terms of service for platform usage', required: true },
    { type: 'DATA_PROCESSING', label: 'Data Processing', description: 'Processing your data to provide OfferMarket services', required: true },
    { type: 'COOKIE_ANALYTICS', label: 'Analytics Cookies', description: 'Anonymized analytics to improve our platform (PostHog)', required: false },
    { type: 'COOKIE_MARKETING', label: 'Marketing Cookies', description: 'Targeted advertising and marketing communications', required: false },
    { type: 'EMAIL_NOTIFICATIONS', label: 'Email Notifications', description: 'Service-related emails about offers and messages', required: false },
    { type: 'PROFILE_VISIBLE', label: 'Profile Visibility', description: 'Allow employers to discover your anonymous profile', required: false },
    { type: 'MARKETING', label: 'Marketing Communications', description: 'Promotional emails about new features and updates', required: false },
    { type: 'SPECIAL_CATEGORY', label: 'Work Authorization', description: 'Processing of your work authorization status (immigration data) — special category under GDPR Article 9', required: false },
    { type: 'ID_VERIFICATION', label: 'ID Verification', description: 'Processing of identity verification documents', required: false },
    { type: 'KVK_PROCESSING', label: 'KvK Verification', description: 'Processing of Chamber of Commerce registration data', required: false },
  ] as const;

  if (loading && !hasLoaded) {
    return (
      <div className="bg-white shadow rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Consent Management</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your consent preferences. Required consents cannot be withdrawn while your account is active.
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {consentCategories.map(cat => {
          const record = consents.find(c => c.consentType === cat.type);
          const isGranted = record?.granted && !record?.withdrawnAt;

          return (
            <div key={cat.type} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                  {cat.required && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Required
                    </span>
                  )}
                  {cat.type === 'SPECIAL_CATEGORY' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      Special Category
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>
                {record && (
                  <p className="text-xs text-gray-400 mt-1">
                    {isGranted ? `Granted ${new Date(record.grantedAt).toLocaleDateString('nl-NL')}` : `Withdrawn ${record.withdrawnAt ? new Date(record.withdrawnAt).toLocaleDateString('nl-NL') : ''}`}
                  </p>
                )}
              </div>
              <div className="ml-4">
                {cat.required ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active (Required)
                  </span>
                ) : (
                  <ConsentToggle type={cat.type} granted={!!isGranted} onGrant={grantConsent} onWithdraw={withdrawConsent} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Map consent types to their appropriate legal basis
const CONSENT_LEGAL_BASIS: Record<string, string> = {
  PRIVACY_POLICY: 'CONSENT',
  TERMS_OF_SERVICE: 'CONSENT',
  DATA_PROCESSING: 'CONSENT',
  COOKIE_ANALYTICS: 'CONSENT',
  COOKIE_MARKETING: 'CONSENT',
  EMAIL_NOTIFICATIONS: 'CONSENT',
  PROFILE_VISIBLE: 'CONSENT',
  MARKETING: 'CONSENT',
  SPECIAL_CATEGORY: 'EXPLICIT_CONSENT',
  ID_VERIFICATION: 'LEGAL_OBLIGATION',
  KVK_PROCESSING: 'LEGAL_OBLIGATION',
};

function ConsentToggle({ type, granted, onGrant, onWithdraw }: { type: string; granted: boolean; onGrant: (type: ConsentType, legalBasis?: string) => Promise<boolean>; onWithdraw: (type: ConsentType) => Promise<boolean> }) {
  const [loading, setLoading] = useState(false);
  // Optimistic UI: show the expected state immediately while the API call is in flight
  const [optimisticGranted, setOptimisticGranted] = useState<boolean | null>(null);
  const displayGranted = optimisticGranted !== null ? optimisticGranted : granted;

  const handleToggle = async () => {
    setLoading(true);
    setOptimisticGranted(!granted);
    try {
      if (granted) {
        await onWithdraw(type as ConsentType);
      } else {
        await onGrant(type as ConsentType, CONSENT_LEGAL_BASIS[type] || 'CONSENT');
      }
    } catch {
      // Revert optimistic update on error
      setOptimisticGranted(null);
    } finally {
      setLoading(false);
      setOptimisticGranted(null);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        displayGranted ? 'bg-blue-600' : 'bg-gray-200'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          displayGranted ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}