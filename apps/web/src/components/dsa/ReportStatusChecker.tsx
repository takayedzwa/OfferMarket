'use client';

import { useState } from 'react';

/**
 * DSA Art. 16(4): Reporters must be able to track the status of their submissions.
 * This component allows users to check their report status using the public reference ID.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const STATUS_LABELS: Record<string, { label: string; color: string; description: string }> = {
  RECEIVED: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-800',
    description: 'Your report has been received and is awaiting review.',
  },
  ASSESSMENT: {
    label: 'Under Assessment',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Your report is being assessed by our team.',
  },
  ACTION_TAKEN: {
    label: 'Action Taken',
    color: 'bg-orange-100 text-orange-800',
    description: 'Action has been taken on the reported content.',
  },
  NOTIFIED: {
    label: 'Notified',
    color: 'bg-purple-100 text-purple-800',
    description: 'The affected user has been notified.',
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800',
    description: 'Your report has been resolved.',
  },
  DISMISSED: {
    label: 'Dismissed',
    color: 'bg-gray-100 text-gray-800',
    description: 'Your report was dismissed after review.',
  },
  ESCALATED: {
    label: 'Escalated',
    color: 'bg-red-100 text-red-800',
    description: 'This report has been escalated to the relevant authorities.',
  },
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
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
          throw new Error('Report not found. Please check the reference number and try again.');
        }
        throw new Error('Failed to check report status. Please try again later.');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = report ? STATUS_LABELS[report.status] : null;
  const priorityInfo = report ? PRIORITY_LABELS[report.priority] : null;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900">Check Report Status</h2>
      <p className="mt-1 text-sm text-gray-500">
        Enter the reference number you received when submitting your report.
      </p>

      <form onSubmit={checkStatus} className="mt-4 flex gap-2">
        <input
          type="text"
          value={publicId}
          onChange={(e) => setPublicId(e.target.value)}
          placeholder="e.g., RPT-ABC123"
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || !publicId.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {report && statusInfo && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Report Details</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <p className="text-sm text-gray-600">{statusInfo.description}</p>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Reference</dt>
              <dd className="text-sm font-mono text-gray-900">{report.publicId}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="text-sm text-gray-900">{report.category.replace(/_/g, ' ')}</dd>
            </div>

            {priorityInfo && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityInfo.color}`}>
                    {priorityInfo.label}
                  </span>
                </dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Submitted</dt>
              <dd className="text-sm text-gray-900">
                {new Date(report.createdAt).toLocaleDateString('nl-NL', {
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
                <dt className="text-sm font-medium text-gray-500">Acknowledged</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(report.acknowledgedAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            )}

            {report.actionTaken && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Action</dt>
                <dd className="text-sm text-gray-900">{report.actionTaken.replace(/_/g, ' ').toLowerCase()}</dd>
              </div>
            )}

            {report.resolution && (
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Resolution</dt>
                <dd className="text-sm text-gray-900">{report.resolution.replace(/_/g, ' ').toLowerCase()}</dd>
              </div>
            )}
          </dl>

          {report.status === 'RESOLVED' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Complaint options:</strong> If you disagree with this resolution, you can submit a complaint
                through our{' '}
                <a href="/dsa/complaint" className="text-blue-600 hover:underline font-medium">
                  internal complaint-handling system
                </a>
                {' '}within 6 months (DSA Art. 20).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}