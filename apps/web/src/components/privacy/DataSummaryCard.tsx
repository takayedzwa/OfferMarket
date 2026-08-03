'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormat } from '@/hooks/useFormat';
import { useConsent, ConsentType } from '@/hooks/useConsent';

export default function DataSummaryCard() {
  const t = useTranslations('privacy.consent');
  const { date } = useFormat();
  const { consents, loading, grantConsent, withdrawConsent } = useConsent();
  // Track whether we've ever loaded successfully — only show skeleton on first load,
  // not when refreshing after a toggle (which would cause a jarring page jump)
  const hasLoaded = consents.length > 0 || !loading;

  const consentCategories = [
    { type: 'PRIVACY_POLICY', required: true },
    { type: 'TERMS_OF_SERVICE', required: true },
    { type: 'DATA_PROCESSING', required: true },
    { type: 'COOKIE_ANALYTICS', required: false },
    { type: 'COOKIE_MARKETING', required: false },
    { type: 'EMAIL_NOTIFICATIONS', required: false },
    { type: 'PROFILE_VISIBLE', required: false },
    { type: 'MARKETING', required: false },
    { type: 'SPECIAL_CATEGORY', required: false },
    { type: 'ID_VERIFICATION', required: false },
    { type: 'KVK_PROCESSING', required: false },
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
        <h3 className="text-lg font-medium text-gray-900">{t('title')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('cardSubtitle')}
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
                  <p className="text-sm font-medium text-gray-900">{t(`categories.${cat.type}.label`)}</p>
                  {cat.required && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {t('required')}
                    </span>
                  )}
                  {cat.type === 'SPECIAL_CATEGORY' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      {t('specialCategory')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{t(`categories.${cat.type}.description`)}</p>
                {record && (
                  <p className="text-xs text-gray-400 mt-1">
                    {isGranted
                      ? t('granted', { date: date(record.grantedAt) })
                      : t('withdrawn', { date: record.withdrawnAt ? date(record.withdrawnAt) : '' })}
                  </p>
                )}
              </div>
              <div className="ml-4">
                {cat.required ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t('activeRequired')}
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