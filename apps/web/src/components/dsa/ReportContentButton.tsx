'use client';

import { useState } from 'react';
import ReportContentForm from './ReportContentForm';

type ContentReportTarget = 'USER_PROFILE' | 'WORKER_PROFILE' | 'EMPLOYER_PROFILE' | 'OFFER' | 'CONVERSATION' | 'MESSAGE' | 'REVIEW' | 'OTHER';

/**
 * Small button component to embed on content pages (offers, profiles, etc.)
 * per DSA Art. 16(1): "easy access" requirement for illegal content reporting.
 */
interface ReportContentButtonProps {
  targetType: ContentReportTarget;
  targetId: string;
  /** URL of the content being reported */
  url?: string;
  /** Optional className for styling */
  className?: string;
  /** Show as text link instead of button */
  asLink?: boolean;
}

export default function ReportContentButton({
  targetType,
  targetId,
  url,
  className = '',
  asLink = false,
}: ReportContentButtonProps) {
  const [showForm, setShowForm] = useState(false);

  const handleClose = () => setShowForm(false);
  const handleSuccess = (publicId: string) => {
    // Auto-close after 5 seconds on success
    setTimeout(() => setShowForm(false), 5000);
  };

  return (
    <>
      {asLink ? (
        <button
          onClick={() => setShowForm(true)}
          className={`text-sm text-gray-500 hover:text-red-600 underline ${className}`}
          title="Report this content"
        >
          Report
        </button>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:text-red-600 hover:border-red-300 transition-colors ${className}`}
          title="Report this content"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          Report
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 z-10"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <ReportContentForm
              targetType={targetType}
              targetId={targetId}
              url={url}
              onClose={handleClose}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
}