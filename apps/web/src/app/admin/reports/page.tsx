"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Flag, AlertTriangle, CheckCircle, XCircle, User, Briefcase, MessageSquare } from "lucide-react";

interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedOfferId?: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reporter?: {
    email: string;
  };
  reportedUser?: {
    email: string;
    role: string;
  };
  reportedOffer?: {
    title: string;
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const fetchReports = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: "1",
      limit: "50",
      ...(statusFilter && { status: statusFilter }),
    });

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/reports?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolve = (status: 'RESOLVED' | 'DISMISSED') => {
    if (!selectedReport) return;
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/reports/${selectedReport.id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({
        status,
        notes: resolutionNotes,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setShowModal(false);
          fetchReports();
        } else {
          alert('Failed to resolve report');
        }
      })
      .catch(() => alert('Failed to resolve report'));
  };

  const openModal = (report: Report) => {
    setSelectedReport(report);
    setResolutionNotes("");
    setShowModal(true);
  };

  const getReportType = (report: Report) => {
    if (report.reportedOfferId) return { type: 'Offer', icon: Briefcase };
    return { type: 'User', icon: User };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_REVIEW: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      DISMISSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Reported Content</h1>
                <p className="text-sm text-gray-500">Review and moderate reported content</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Loading...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports</h3>
            <p className="text-gray-500">No reported content to review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const { type, icon: Icon } = getReportType(report);
              return (
                <div key={report.id} className="bg-white rounded-xl border shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Flag className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            Reported {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Icon className="w-4 h-4" />
                          <span>Reported {type}:</span>
                          <span className="font-medium text-gray-900">
                            {report.reportedOffer?.title || report.reportedUser?.email || report.reportedUserId}
                          </span>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2 text-sm text-red-800 font-medium mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Reason: {report.reason}</span>
                          </div>
                          {report.description && (
                            <p className="text-sm text-red-700">{report.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Reporter: {report.reporter?.email || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>Reported: {report.reportedUser?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {report.status === 'PENDING' || report.status === 'IN_REVIEW' ? (
                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => openModal(report)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        Resolve Report
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          router.push(`/admin/users/${report.reportedUserId}`);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        View User Profile
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Report {report.status.toLowerCase()} on {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Resolution Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Report</h3>
            <p className="text-sm text-gray-600 mb-4">
              Decide on the appropriate action for this report.
            </p>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handleResolve('RESOLVED')}
                className="w-full p-4 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">Take Action (Resolved)</div>
                    <div className="text-sm text-green-700">The report is valid. Suspend user, remove content, etc.</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleResolve('DISMISSED')}
                className="w-full p-4 border-2 border-gray-200 bg-gray-50 rounded-lg hover:bg-gray-100 text-left"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Dismiss Report</div>
                    <div className="text-sm text-gray-700">The report is invalid or doesn't violate policies.</div>
                  </div>
                </div>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add notes about this resolution (optional)..."
                className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
