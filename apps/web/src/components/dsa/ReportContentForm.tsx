'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * DSA Art. 16: Notice-and-Action mechanism.
 * This form allows users (including anonymous users) to report illegal content.
 * Per DSA Art. 16(3), submissions must include:
 *   (a) a sufficiently detailed explanation of why the content is illegal
 *   (b) the URL or identification of the content
 *   (c) the reporter's contact information (or email for anonymous)
 *   (d) a good faith declaration
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type ContentReportTarget = 'USER_PROFILE' | 'WORKER_PROFILE' | 'EMPLOYER_PROFILE' | 'OFFER' | 'CONVERSATION' | 'MESSAGE' | 'REVIEW' | 'OTHER';
export type ContentReportCategory = 'ILLEGAL_CONTENT' | 'FRAUD_SCAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'COPYRIGHT_VIOLATION' | 'PRIVACY_VIOLATION' | 'MISLEADING_INFORMATION' | 'CHILD_SAFETY' | 'TERRORISM' | 'DRUGS_WEAPONS' | 'IMPERSONATION' | 'SPAM' | 'OTHER';

const CATEGORY_VALUES: ContentReportCategory[] = [
  'ILLEGAL_CONTENT', 'FRAUD_SCAM', 'HARASSMENT', 'HATE_SPEECH', 'COPYRIGHT_VIOLATION',
  'PRIVACY_VIOLATION', 'MISLEADING_INFORMATION', 'CHILD_SAFETY', 'TERRORISM',
  'DRUGS_WEAPONS', 'IMPERSONATION', 'SPAM', 'OTHER',
];

const TARGET_VALUES: ContentReportTarget[] = [
  'USER_PROFILE', 'WORKER_PROFILE', 'EMPLOYER_PROFILE', 'OFFER', 'CONVERSATION',
  'MESSAGE', 'REVIEW', 'OTHER',
];

interface ReportContentFormProps {
  /** Pre-filled target type and ID (e.g., from a "Report" button on a profile) */
  targetType?: ContentReportTarget;
  targetId?: string;
  /** URL of the reported content */
  url?: string;
  /** Whether to show as a modal or inline */
  onClose?: () => void;
  /** Callback after successful submission */
  onSuccess?: (publicId: string) => void;
}

export default function ReportContentForm({
  targetType,
  targetId,
  url,
  onClose,
  onSuccess,
}: ReportContentFormProps) {
  const [formData, setFormData] = useState({
    targetType: targetType || 'OTHER' as ContentReportTarget,
    targetId: targetId || '',
    url: url || '',
    category: 'OTHER' as ContentReportCategory,
    illegalContentType: '',
    explanation: '',
    reporterEmail: '',
    goodFaithDeclaration: false,
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);

  const t = useTranslations('dsa.form');
  const tEnums = useTranslations('enums');

  const getCategoryLabel = (category: ContentReportCategory) => {
    try {
      return tEnums(`contentReportCategory.${category}`);
    } catch {
      return category.replace(/_/g, ' ').toLowerCase();
    }
  };

  const getTargetLabel = (target: ContentReportTarget) => {
    try {
      return tEnums(`contentReportTarget.${target}`);
    } catch {
      return target.replace(/_/g, ' ').toLowerCase();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    if (!formData.explanation.trim()) {
      setErrorMessage(t('validation.explanationRequired'));
      setStatus('error');
      return;
    }

    if (!formData.goodFaithDeclaration) {
      setErrorMessage(t('validation.goodFaithRequired'));
      setStatus('error');
      return;
    }

    try {
      // Get auth token if available (anonymous reports are allowed)
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(`${API_BASE}/dsa/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetType: formData.targetType,
          targetId: formData.targetId || undefined,
          url: formData.url || undefined,
          category: formData.category,
          illegalContentType: formData.illegalContentType || undefined,
          explanation: formData.explanation,
          goodFaithDeclaration: formData.goodFaithDeclaration,
          reporterEmail: formData.reporterEmail || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('submitError'));
      }

      const data = await response.json();
      setPublicId(data.publicId);
      setStatus('success');
      onSuccess?.(data.publicId);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : t('genericError'));
    }
  };

  if (status === 'success' && publicId) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">{t('submittedTitle')}</h3>
          <p className="mt-2 text-sm text-gray-600">
            {t('submittedBody')}
          </p>
          <div className="mt-4 bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-500">{t('referenceLabel')}</p>
            <p className="text-lg font-mono font-bold text-gray-900">{publicId}</p>
            <p className="mt-1 text-xs text-gray-500">
              {t('saveReference')}{' '}
              <Link href={`/dsa/status/${publicId}`} className="text-blue-600 hover:underline">
                {t('reportStatusLink')}
              </Link>
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            {t('acknowledgmentNote')}
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {t('close')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('intro')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Target Type */}
        <div>
          <label htmlFor="targetType" className="block text-sm font-medium text-gray-700">
            {t('targetLabel')}
          </label>
          <select
            id="targetType"
            value={formData.targetType}
            onChange={(e) => setFormData({ ...formData, targetType: e.target.value as ContentReportTarget })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            disabled={!!targetType}
          >
            {TARGET_VALUES.map((value) => (
              <option key={value} value={value}>{getTargetLabel(value)}</option>
            ))}
          </select>
        </div>

        {/* Target ID (if not pre-filled) */}
        {(!targetId) && (
          <div>
            <label htmlFor="targetId" className="block text-sm font-medium text-gray-700">
              {t('targetIdLabel')}
            </label>
            <input
              id="targetId"
              type="text"
              value={formData.targetId}
              onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
              placeholder={t('targetIdPlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            />
          </div>
        )}

        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            {t('urlLabel')} <span className="text-gray-400">{t('optional')}</span>
          </label>
          <input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder={t('urlPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            {t('categoryLabel')}
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ContentReportCategory })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            required
          >
            {CATEGORY_VALUES.map((value) => (
              <option key={value} value={value}>{getCategoryLabel(value)}</option>
            ))}
          </select>
        </div>

        {/* Specific illegal content type */}
        {formData.category === 'ILLEGAL_CONTENT' && (
          <div>
            <label htmlFor="illegalContentType" className="block text-sm font-medium text-gray-700">
              {t('illegalTypeLabel')}
            </label>
            <input
              id="illegalContentType"
              type="text"
              value={formData.illegalContentType}
              onChange={(e) => setFormData({ ...formData, illegalContentType: e.target.value })}
              placeholder={t('illegalTypePlaceholder')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            />
          </div>
        )}

        {/* Explanation — DSA Art. 16(3)(a) */}
        <div>
          <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
            {t('explanationLabel')} <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {t('explanationHint')}
          </p>
          <textarea
            id="explanation"
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={5}
            required
            placeholder={t('explanationPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
          />
        </div>

        {/* Reporter Email — required for anonymous reports */}
        <div>
          <label htmlFor="reporterEmail" className="block text-sm font-medium text-gray-700">
            {t('emailLabel')} <span className="text-gray-400">{t('emailHint')}</span>
          </label>
          <input
            id="reporterEmail"
            type="email"
            value={formData.reporterEmail}
            onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
            placeholder={t('emailPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('emailNote')}
          </p>
        </div>

        {/* Good faith declaration — DSA Art. 16(3)(d) */}
        <div className="flex items-start">
          <input
            id="goodFaith"
            type="checkbox"
            checked={formData.goodFaithDeclaration}
            onChange={(e) => setFormData({ ...formData, goodFaithDeclaration: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            required
          />
          <label htmlFor="goodFaith" className="ml-2 block text-sm text-gray-700">
            {t('goodFaithLabel')}
            <span className="text-red-500">*</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 -mt-2 ml-6">
          {t('goodFaithNote')}
        </p>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {t('cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? t('submitting') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  );
}