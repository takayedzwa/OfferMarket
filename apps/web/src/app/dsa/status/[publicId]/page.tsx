'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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

export default function ReportStatusDetailPage() {
  const params = useParams();
  const publicId = params?.publicId as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;

    const fetchReport = async () => {
      try {
        const response = await fetch(`${API_BASE}/dsa/reports/${publicId}/status`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Report not found. Please check the reference number.');
          }
          throw new Error('Failed to load report status.');
        }
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [publicId]);

  const statusInfo = report ? STATUS_LABELS[report.status] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading report status...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
            <a href="/dsa/status" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              ← Try another reference number
            </a>
          </div>
        )}

        {report && statusInfo && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Report Status</h1>
              <p className="mt-1 text-sm text-gray-500">
                Reference: <span className="font-mono font-bold">{report.publicId}</span>
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Status</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              <p className="text-sm text-gray-600">{statusInfo.description}</p>

              <dl className="divide-y divide-gray-200">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900">{report.category?.replace(/_/g, ' ')}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(report.createdAt).toLocaleDateString('nl-NL', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </dd>
                </div>
                {report.acknowledgedAt && (
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Acknowledged</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(report.acknowledgedAt).toLocaleDateString('nl-NL', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
                {report.actionTaken && (
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Action taken</dt>
                    <dd className="text-sm text-gray-900">{report.actionTaken.replace(/_/g, ' ').toLowerCase()}</dd>
                  </div>
                )}
                {report.resolution && (
                  <div className="py-3 flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Resolution</dt>
                    <dd className="text-sm text-gray-900">{report.resolution.replace(/_/g, ' ').toLowerCase()}</dd>
                  </div>
                )}
              </dl>

              {report.status === 'RESOLVED' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Complaint options:</strong> If you disagree with this resolution, you can
                    submit a complaint through our internal complaint-handling system within 6 months (DSA Art. 20).
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8 text-center text-xs text-gray-500">
          <a href="/dsa/report" className="text-blue-600 hover:underline">Submit a new report →</a>
          <span className="mx-2">·</span>
          <a href="/dsa/status" className="text-blue-600 hover:underline">Check another report →</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}