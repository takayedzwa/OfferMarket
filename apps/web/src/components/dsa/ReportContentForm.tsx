'use client';

import { useState } from 'react';

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

const CATEGORY_LABELS: Record<ContentReportCategory, string> = {
  ILLEGAL_CONTENT: 'Illegal content',
  FRAUD_SCAM: 'Fraud or scam',
  HARASSMENT: 'Harassment or bullying',
  HATE_SPEECH: 'Hate speech',
  COPYRIGHT_VIOLATION: 'Copyright violation',
  PRIVACY_VIOLATION: 'Privacy violation (doxxing, unauthorized data)',
  MISLEADING_INFORMATION: 'Misleading information',
  CHILD_SAFETY: 'Child safety concern',
  TERRORISM: 'Terrorism-related content',
  DRUGS_WEAPONS: 'Illegal products or services (drugs, weapons)',
  IMPERSONATION: 'Impersonation / fake identity',
  SPAM: 'Spam',
  OTHER: 'Other',
};

const TARGET_LABELS: Record<ContentReportTarget, string> = {
  USER_PROFILE: 'User profile',
  WORKER_PROFILE: 'Worker profile',
  EMPLOYER_PROFILE: 'Employer profile',
  OFFER: 'Job offer',
  CONVERSATION: 'Conversation',
  MESSAGE: 'Message',
  REVIEW: 'Review',
  OTHER: 'Other',
};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    if (!formData.explanation.trim()) {
      setErrorMessage('Please provide a detailed explanation of why this content is illegal or violates our terms.');
      setStatus('error');
      return;
    }

    if (!formData.goodFaithDeclaration) {
      setErrorMessage('You must confirm that your report is submitted in good faith.');
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
        throw new Error(data.message || 'Failed to submit report');
      }

      const data = await response.json();
      setPublicId(data.publicId);
      setStatus('success');
      onSuccess?.(data.publicId);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred. Please try again.');
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
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Report Submitted</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your report has been received and acknowledged. We will review it as soon as possible.
          </p>
          <div className="mt-4 bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-500">Reference number</p>
            <p className="text-lg font-mono font-bold text-gray-900">{publicId}</p>
            <p className="mt-1 text-xs text-gray-500">
              Save this reference to check the status of your report at{' '}
              <a href={`/dsa/status/${publicId}`} className="text-blue-600 hover:underline">
                Report Status
              </a>
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            DSA Art. 16(4): You will receive an acknowledgment without undue delay.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Report Illegal Content</h2>
        <p className="mt-1 text-sm text-gray-500">
          DSA Art. 16 — Report content you believe is illegal or violates our terms.
          You may report anonymously by providing only your email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Target Type */}
        <div>
          <label htmlFor="targetType" className="block text-sm font-medium text-gray-700">
            What are you reporting?
          </label>
          <select
            id="targetType"
            value={formData.targetType}
            onChange={(e) => setFormData({ ...formData, targetType: e.target.value as ContentReportTarget })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            disabled={!!targetType}
          >
            {Object.entries(TARGET_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Target ID (if not pre-filled) */}
        {(!targetId) && (
          <div>
            <label htmlFor="targetId" className="block text-sm font-medium text-gray-700">
              ID or reference of the content
            </label>
            <input
              id="targetId"
              type="text"
              value={formData.targetId}
              onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
              placeholder="e.g., offer ID, username"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            />
          </div>
        )}

        {/* URL */}
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URL of the content <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://offermarket.nl/..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category of illegal content
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ContentReportCategory })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            required
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Specific illegal content type */}
        {formData.category === 'ILLEGAL_CONTENT' && (
          <div>
            <label htmlFor="illegalContentType" className="block text-sm font-medium text-gray-700">
              Type of illegal content
            </label>
            <input
              id="illegalContentType"
              type="text"
              value={formData.illegalContentType}
              onChange={(e) => setFormData({ ...formData, illegalContentType: e.target.value })}
              placeholder="e.g., Dutch Criminal Code Art. 137c"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
            />
          </div>
        )}

        {/* Explanation — DSA Art. 16(3)(a) */}
        <div>
          <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
            Detailed explanation <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            DSA Art. 16(3): Please explain in detail why you believe this content is illegal.
          </p>
          <textarea
            id="explanation"
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            rows={5}
            required
            placeholder="Please describe the content you are reporting and why you believe it is illegal..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
          />
        </div>

        {/* Reporter Email — required for anonymous reports */}
        <div>
          <label htmlFor="reporterEmail" className="block text-sm font-medium text-gray-700">
            Your email address <span className="text-gray-400">(for acknowledgment)</span>
          </label>
          <input
            id="reporterEmail"
            type="email"
            value={formData.reporterEmail}
            onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
            placeholder="your@email.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Required for anonymous reports. We will send you an acknowledgment and updates.
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
            I declare that this report is submitted in good faith and that the information provided is accurate to the best of my knowledge.
            <span className="text-red-500">*</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 -mt-2 ml-6">
          DSA Art. 16(3)(d): False or malicious reports may result in reporting restrictions under DSA Art. 23.
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
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}