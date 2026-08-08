'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useFormat } from '@/hooks/useFormat';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface RestrictionStatus {
  processingRestricted: boolean;
  processingRestrictedAt: string | null;
  restrictionReason?: string;
}

export default function RestrictionToggle() {
  const t = useTranslations('privacy.restriction');
  const { date } = useFormat();
  const [status, setStatus] = useState<RestrictionStatus>({
    processingRestricted: false,
    processingRestrictedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestrictionStatus();
  }, []);

  const fetchRestrictionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/privacy/restriction-status`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      // Silently fail — restriction status may not be available for unauthenticated users
    } finally {
      setLoading(false);
    }
  };

  const setRestriction = async (restricted: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const url = restricted
        ? `${API_BASE}/privacy/request/restrict`
        : `${API_BASE}/privacy/request/restrict`;
      const method = restricted ? 'POST' : 'DELETE';
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: restricted ? JSON.stringify({ restricted: true, reason }) : undefined,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('updateError'));
      }

      const data = await response.json();
      setStatus(data);
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{t('title')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('subtitle')}
        </p>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                {t('warning')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {t('statusLabel')}
            </p>
            {status.processingRestrictedAt && (
              <p className="text-xs text-gray-500 mt-1">
                {status.processingRestricted
                  ? t('restrictedSince', { date: date(status.processingRestrictedAt) })
                  : t('noActive')}
              </p>
            )}
          </div>
          <button
            onClick={() => setRestriction(!status.processingRestricted)}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              status.processingRestricted ? 'bg-amber-500' : 'bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                status.processingRestricted ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {!status.processingRestricted && (
          <div>
            <label htmlFor="restriction-reason" className="block text-sm font-medium text-gray-700 mb-1">
              {t('reasonLabel')}
            </label>
            <textarea
              id="restriction-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              placeholder={t('reasonPlaceholder')}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}