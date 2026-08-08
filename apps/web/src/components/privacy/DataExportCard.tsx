'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function DataExportCard() {
  const t = useTranslations('privacy.exportCard');
  const [exportStatus, setExportStatus] = useState<'idle' | 'requesting' | 'processing' | 'ready' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestExport = async () => {
    setExportStatus('requesting');
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/privacy/export`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ format: 'JSON' }),
      });

      if (!response.ok) {
        const data = await response.json();
        // If there's already a pending export, show a user-friendly message
        if (response.status === 400 && data.message?.includes('pending')) {
          throw new Error(t('pendingError'));
        }
        throw new Error(data.message || t('requestError'));
      }

      setExportStatus('processing');
      pollExportStatus();
    } catch (err) {
      setExportStatus('error');
      setError(err instanceof Error ? err.message : t('genericError'));
    }
  };

  const pollExportStatus = async () => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/privacy/export/status`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) throw new Error(t('statusCheckError'));
        const data = await response.json();

        // API returns an array of export requests — check the most recent one
        const exports = Array.isArray(data) ? data : [];
        const latest = exports[0];

        if (!latest) {
          // No export found, reset to idle
          setExportStatus('idle');
          return;
        }

        if (latest.status === 'COMPLETED') {
          setExportStatus('ready');
          setDownloadUrl(`${API_BASE}/privacy/export/${latest.id}`);
          return;
        }

        if (latest.status === 'FAILED') {
          setExportStatus('error');
          setError(t('exportFailed'));
          return;
        }

        if (latest.status === 'PENDING' || latest.status === 'PROCESSING') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          } else {
            setExportStatus('error');
            setError(t('exportTimeout'));
          }
          return;
        }

        // EXPPIRED or other status
        setExportStatus('error');
        setError(t('exportExpired'));
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setExportStatus('error');
          setError(t('statusCheckError'));
        }
      }
    };

    poll();
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{t('title')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('subtitle')}
        </p>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  {t('infoBody')}
                </p>
              </div>
            </div>
          </div>

          {exportStatus === 'idle' && (
            <button
              onClick={requestExport}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('requestBtn')}
            </button>
          )}

          {exportStatus === 'requesting' && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-sm text-gray-600">{t('requesting')}</p>
            </div>
          )}

          {exportStatus === 'processing' && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-sm text-gray-600">{t('processing')}</p>
            </div>
          )}

          {exportStatus === 'ready' && (
            <div className="text-center py-4">
              <svg className="h-12 w-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900">{t('ready')}</p>
              <a
                href={downloadUrl || '#'}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                {t('downloadBtn')}
              </a>
              <p className="mt-2 text-xs text-gray-500">{t('downloadHint')}</p>
            </div>
          )}

          {exportStatus === 'error' && (
            <div className="text-center py-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-700">{error || t('errorFallback')}</p>
              </div>
              <button
                onClick={requestExport}
                className="mt-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('tryAgain')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}