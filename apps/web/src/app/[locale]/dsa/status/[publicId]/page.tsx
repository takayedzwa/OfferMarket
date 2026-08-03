'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormat } from '@/hooks/useFormat';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Colors per status — not a translation, just Tailwind class mapping.
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  ASSESSMENT: 'bg-yellow-100 text-yellow-800',
  ACTION_TAKEN: 'bg-orange-100 text-orange-800',
  NOTIFIED: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
  ESCALATED: 'bg-red-100 text-red-800',
};

export default function ReportStatusDetailPage() {
  const params = useParams();
  const publicId = params?.publicId as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('dsa.statusDetail');
  const tEnums = useTranslations('enums');

  const { date } = useFormat();

  useEffect(() => {
    if (!publicId) return;

    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_BASE}/dsa/reports/${publicId}/status`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(t('notFoundError'));
          }
          throw new Error(t('loadError'));
        }
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('genericError'));
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [publicId, t]);

  const statusColor = report ? STATUS_COLORS[report.status] : null;

  const getStatusLabel = (status: string) => {
    try {
      return tEnums(`dsaStatus.${status}.label`);
    } catch {
      return status.replace(/_/g, ' ').toLowerCase();
    }
  };

  const getStatusDescription = (status: string) => {
    try {
      return tEnums(`dsaStatus.${status}.description`);
    } catch {
      return status.replace(/_/g, ' ').toLowerCase();
    }
  };

  const getCategoryLabel = (category: string) => {
    try {
      return tEnums(`contentReportCategory.${category}`);
    } catch {
      return category?.replace(/_/g, ' ').toLowerCase();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">{t('loading')}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
            <Link href="/dsa/status" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              {t('tryAnotherLink')}
            </Link>
          </div>
        )}

        {report && statusColor && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {t('referenceLabel')} <span className="font-mono font-bold">{report.publicId}</span>
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{t('statusHeading')}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                  {getStatusLabel(report.status)}
                </span>
              </div>

              <p className="text-sm text-gray-600">{getStatusDescription(report.status)}</p>

              <dl className="divide-y divide-gray-200">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">{t('categoryLabel')}</dt>
                  <dd className="text-sm text-gray-900">{getCategoryLabel(report.category)}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">{t('submittedLabel')}</dt>
                  <dd className="text-sm text-gray-900">
                    {date(report.createdAt, {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </dd>
                </div>
                {report.acknowledgedAt && (
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">{t('acknowledgedLabel')}</dt>
                    <dd className="text-sm text-gray-900">
                      {date(report.acknowledgedAt, {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
                {report.actionTaken && (
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">{t('actionTakenLabel')}</dt>
                    <dd className="text-sm text-gray-900">{report.actionTaken.replace(/_/g, ' ').toLowerCase()}</dd>
                  </div>
                )}
                {report.resolution && (
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">{t('resolutionLabel')}</dt>
                    <dd className="text-sm text-gray-900">{report.resolution.replace(/_/g, ' ').toLowerCase()}</dd>
                  </div>
                )}
              </dl>

              {report.status === 'RESOLVED' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>{t('complaint.label')}</strong> {t('complaint.body')}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          <Link href="/dsa/report" className="text-blue-600 hover:underline">{t('newReportLink')}</Link>
          <span className="mx-2">·</span>
          <Link href="/dsa/status" className="text-blue-600 hover:underline">{t('checkAnotherLink')}</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}