'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormat } from '@/hooks/useFormat';

/**
 * DSA Art. 16(4): Reporters must be able to track the status of their submissions.
 * This component allows users to check their report status using the public reference ID.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Colors per status/priority — not translations, just Tailwind class mappings.
const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  ASSESSMENT: 'bg-yellow-100 text-yellow-800',
  ACTION_TAKEN: 'bg-orange-100 text-orange-800',
  NOTIFIED: 'bg-purple-100 text-purple-800',
  RESOLVED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
  ESCALATED: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

interface ReportStatus {
  id: string;
  publicId: string;
  targetType: string;
  targetId: string;
  category: string;
  status: string;
  priority: string;
  explanation: string;
  createdAt: string;
  acknowledgedAt: string | null;
  resolution: string | null;
  resolutionNotes: string | null;
  actionTaken: string | null;
}

export default function ReportStatusChecker() {
  const [publicId, setPublicId] = useState('');
  const [report, setReport] = useState<ReportStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('dsa.checker');
  const tEnums = useTranslations('enums');

  const { date } = useFormat();

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicId.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch(`${API_BASE}/dsa/reports/${publicId.trim()}/status`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(t('notFoundError'));
        }
        throw new Error(t('checkError'));
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setLoading(false);
    }
  };

  const statusColor = report ? STATUS_COLORS[report.status] : null;
  const priorityColor = report ? PRIORITY_COLORS[report.priority] : null;

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
      return category.replace(/_/g, ' ').toLowerCase();
    }
  };

  const getPriorityLabel = (priority: string) => {
    try {
      return tEnums(`dsaPriority.${priority}`);
    } catch {
      return priority.replace(/_/g, ' ').toLowerCase();
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {t('description')}
      </p>

      <form onSubmit={checkStatus} className="mt-4 flex gap-2">
        <input
          type="text"
          value={publicId}
          onChange={(e) => setPublicId(e.target.value)}
          placeholder={t('placeholder')}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || !publicId.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('checking') : t('check')}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {report && statusColor && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{t('detailsHeading')}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {getStatusLabel(report.status)}
            </span>
          </div>

          <p className="text-sm text-gray-600">{getStatusDescription(report.status)}</p>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">{t('referenceLabel')}</dt>
              <dd className="text-sm font-mono text-gray-900">{report.publicId}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">{t('categoryLabel')}</dt>
              <dd className="text-sm text-gray-900">{getCategoryLabel(report.category)}</dd>
            </div>

            {priorityColor && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">{t('priorityLabel')}</dt>
                <dd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColor}`}>
                    {getPriorityLabel(report.priority)}
                  </span>
                </dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">{t('submittedLabel')}</dt>
              <dd className="text-sm text-gray-900">
                {date(report.createdAt, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>

            {report.acknowledgedAt && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">{t('acknowledgedLabel')}</dt>
                <dd className="text-sm text-gray-900">
                  {date(report.acknowledgedAt, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            )}

            {report.actionTaken && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">{t('actionLabel')}</dt>
                <dd className="text-sm text-gray-900">{report.actionTaken.replace(/_/g, ' ').toLowerCase()}</dd>
              </div>
            )}

            {report.resolution && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">{t('resolutionLabel')}</dt>
                <dd className="text-sm text-gray-900">{report.resolution.replace(/_/g, ' ').toLowerCase()}</dd>
              </div>
            )}
          </dl>

          {report.status === 'RESOLVED' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>{t('complaint.label')}</strong> {t('complaint.prefix')}
                <Link href="/dsa/complaint" className="text-blue-600 hover:underline font-medium">
                  {t('complaint.link')}
                </Link>
                {t('complaint.suffix')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}