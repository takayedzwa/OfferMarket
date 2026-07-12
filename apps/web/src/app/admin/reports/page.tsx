"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Flag, AlertTriangle, CheckCircle, XCircle,
  Eye, Shield, ChevronRight, Clock, User, Briefcase,
  MessageSquare, ShieldAlert, FileText, ExternalLink,
} from "lucide-react";

/**
 * DSA Art. 16/17/18: Admin content moderation dashboard.
 * Provides notice-and-action workflow including assessment, action,
 * statement of reasons, and escalation to authorities.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type ContentReportStatus = 'RECEIVED' | 'ASSESSMENT' | 'ACTION_TAKEN' | 'NOTIFIED' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
type ContentReportCategory = 'ILLEGAL_CONTENT' | 'FRAUD_SCAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'COPYRIGHT_VIOLATION' | 'PRIVACY_VIOLATION' | 'MISLEADING_INFORMATION' | 'CHILD_SAFETY' | 'TERRORISM' | 'DRUGS_WEAPONS' | 'IMPERSONATION' | 'SPAM' | 'OTHER';
type ContentReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type ContentReportAction = 'CONTENT_REMOVED' | 'CONTENT_HIDDEN' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_BANNED' | 'WARNING_ISSUED' | 'NO_ACTION' | 'ESCALATED_TO_AUTHORITIES' | 'REFERRED_TO_OUT_OF_COURT';
type ContentReportAssessment = 'ILLEGAL_CONTENT_FOUND' | 'VIOLATES_TERMS' | 'NOT_VIOLATION' | 'UNCLEAR_NEEDS_REVIEW';

interface ContentReport {
  id: string;
  publicId: string;
  reporterId?: string;
  reporterEmail?: string;
  targetType: string;
  targetId: string;
  targetUrl?: string;
  category: ContentReportCategory;
  illegalContentType?: string;
  explanation: string;
  goodFaithDeclaration: boolean;
  status: ContentReportStatus;
  priority: ContentReportPriority;
  assessmentResult?: ContentReportAssessment;
  assessmentNotes?: string;
  actionTaken?: ContentReportAction;
  actionDetails?: Record<string, any>;
  resolution?: string;
  resolutionNotes?: string;
  referredToAuthorities?: boolean;
  automatedMeans?: boolean;
  createdAt: string;
  acknowledgedAt?: string;
  assessedAt?: string;
  actionTakenAt?: string;
  resolvedAt?: string;
  reporter?: { id: string; email: string; role: string };
  assignedTo?: { id: string; email: string };
  statementOfReasons?: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  RECEIVED: { label: 'Received', color: 'bg-blue-100 text-blue-800', icon: Clock },
  ASSESSMENT: { label: 'Under Assessment', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  ACTION_TAKEN: { label: 'Action Taken', color: 'bg-orange-100 text-orange-800', icon: Shield },
  NOTIFIED: { label: 'Notified', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  DISMISSED: { label: 'Dismissed', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  ESCALATED: { label: 'Escalated', color: 'bg-red-100 text-red-800', icon: ShieldAlert },
};

const CATEGORY_LABELS: Record<string, string> = {
  ILLEGAL_CONTENT: 'Illegal content',
  FRAUD_SCAM: 'Fraud / Scam',
  HARASSMENT: 'Harassment',
  HATE_SPEECH: 'Hate speech',
  COPYRIGHT_VIOLATION: 'Copyright violation',
  PRIVACY_VIOLATION: 'Privacy violation',
  MISLEADING_INFORMATION: 'Misleading information',
  CHILD_SAFETY: '⚠️ Child safety',
  TERRORISM: '⚠️ Terrorism',
  DRUGS_WEAPONS: 'Drugs / Weapons',
  IMPERSONATION: 'Impersonation',
  SPAM: 'Spam',
  OTHER: 'Other',
};

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showSorModal, setShowSorModal] = useState(false);

  // Action form state
  const [actionTaken, setActionTaken] = useState<ContentReportAction>('CONTENT_REMOVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<ContentReportAssessment>('VIOLATES_TERMS');
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Statement of reasons form state
  const [restrictionType, setRestrictionType] = useState('REMOVAL');
  const [sorReasons, setSorReasons] = useState('');
  const [sorExplanation, setSorExplanation] = useState('');
  const [sorLegalBasis, setSorLegalBasis] = useState('');
  const [sorSubmitting, setSorSubmitting] = useState(false);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const res = await fetch(`${API_BASE}/dsa/admin/reports?${params}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.reports || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, categoryFilter]);

  const assessReport = async () => {
    if (!selectedReport) return;
    setActionSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/dsa/admin/reports/${selectedReport.id}/assess`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assessmentResult, assessmentNotes }),
      });
      if (!res.ok) throw new Error('Failed to assess report');
      setShowActionModal(false);
      fetchReports(pagination.page);
      loadReportDetail(selectedReport.id);
    } catch (err) {
      alert('Failed to assess report: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionSubmitting(false);
    }
  };

  const takeAction = async () => {
    if (!selectedReport) return;
    setActionSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/dsa/admin/reports/${selectedReport.id}/action`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ actionTaken }),
      });
      if (!res.ok) throw new Error('Failed to take action');
      setShowActionModal(false);
      fetchReports(pagination.page);
      loadReportDetail(selectedReport.id);
    } catch (err) {
      alert('Failed to take action: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionSubmitting(false);
    }
  };

  const resolveReport = async () => {
    if (!selectedReport) return;
    setActionSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/dsa/admin/reports/${selectedReport.id}/resolve`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          resolution: resolutionNotes.includes('dismiss') ? 'REPORT_DISMISSED' : 'CONTENT_TAKEN_DOWN',
          resolutionNotes,
        }),
      });
      if (!res.ok) throw new Error('Failed to resolve report');
      setShowActionModal(false);
      fetchReports(pagination.page);
      loadReportDetail(selectedReport.id);
    } catch (err) {
      alert('Failed to resolve report: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionSubmitting(false);
    }
  };

  const escalateToAuthorities = async () => {
    if (!selectedReport) return;
    setActionSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/dsa/admin/reports/${selectedReport.id}/escalate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          authorityReferralNotes: 'Escalated due to suspected criminal activity (DSA Art. 18)',
        }),
      });
      if (!res.ok) throw new Error('Failed to escalate');
      alert('Report escalated to authorities (DSA Art. 18)');
      fetchReports(pagination.page);
      loadReportDetail(selectedReport.id);
    } catch (err) {
      alert('Failed to escalate: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActionSubmitting(false);
    }
  };

  const submitStatementOfReasons = async () => {
    if (!selectedReport) return;
    setSorSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/dsa/admin/reports/${selectedReport.id}/statement-of-reasons`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          restrictionType,
          reasons: sorReasons.split(',').map((r: string) => r.trim()).filter(Boolean),
          detailedExplanation: sorExplanation,
          decisionSource: 'OWN_INVESTIGATION',
          legalBasis: sorLegalBasis || undefined,
          territorialScope: 'NL',
          automatedMeans: false,
        }),
      });
      if (!res.ok) throw new Error('Failed to create statement of reasons');
      alert('Statement of reasons created (DSA Art. 17)');
      setShowSorModal(false);
      loadReportDetail(selectedReport.id);
    } catch (err) {
      alert('Failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSorSubmitting(false);
    }
  };

  const loadReportDetail = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/dsa/admin/reports/${id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data);
      }
    } catch {}
  };

  const openDetail = (report: ContentReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800 animate-pulse',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
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
                <h1 className="text-lg font-semibold text-gray-900">Content Moderation</h1>
                <p className="text-sm text-gray-500">DSA Art. 16 — Notice-and-Action Mechanism</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {pagination.total} report{pagination.total !== 1 ? 's' : ''}
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
            >
              <option value="">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="ASSESSMENT">Under Assessment</option>
              <option value="ACTION_TAKEN">Action Taken</option>
              <option value="NOTIFIED">Notified</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
              <option value="ESCALATED">Escalated</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
            >
              <option value="">All Categories</option>
              <option value="FRAUD_SCAM">Fraud / Scam</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="HATE_SPEECH">Hate speech</option>
              <option value="CHILD_SAFETY">Child safety</option>
              <option value="TERRORISM">Terrorism</option>
              <option value="PRIVACY_VIOLATION">Privacy violation</option>
              <option value="COPYRIGHT_VIOLATION">Copyright</option>
              <option value="MISLEADING_INFORMATION">Misleading info</option>
              <option value="IMPERSONATION">Impersonation</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports</h3>
            <p className="text-gray-500">No content reports matching your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.RECEIVED;
              const StatusIcon = statusCfg.icon;
              return (
                <div key={report.id} className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openDetail(report)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(report.priority)}`}>
                        {report.priority}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{report.publicId}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Flag className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {CATEGORY_LABELS[report.category] || report.category}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{report.explanation}</p>
                      {report.illegalContentType && (
                        <p className="text-xs text-red-600 mt-1">{report.illegalContentType}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Target: {report.targetType.replace(/_/g, ' ')}</span>
                        {report.acknowledgedAt && <span className="text-green-600">✓ Acknowledged</span>}
                        {report.referredToAuthorities && <span className="text-red-600">⚠ Referred to authorities</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => fetchReports(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchReports(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
                <p className="text-sm text-gray-500 font-mono">{selectedReport.publicId}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status & Priority */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${STATUS_CONFIG[selectedReport.status]?.color || 'bg-gray-100'}`}>
                  {STATUS_CONFIG[selectedReport.status]?.label || selectedReport.status}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(selectedReport.priority)}`}>
                  Priority: {selectedReport.priority}
                </span>
              </div>

              {/* Report Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Report Details</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Category</dt>
                    <dd className="font-medium text-gray-900">{CATEGORY_LABELS[selectedReport.category] || selectedReport.category}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Target</dt>
                    <dd className="font-medium text-gray-900">{selectedReport.targetType.replace(/_/g, ' ')} ({selectedReport.targetId})</dd>
                  </div>
                  {selectedReport.targetUrl && (
                    <div className="col-span-2">
                      <dt className="text-gray-500">URL</dt>
                      <dd>
                        <a href={selectedReport.targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {selectedReport.targetUrl} <ExternalLink className="w-3 h-3" />
                        </a>
                      </dd>
                    </div>
                  )}
                  {selectedReport.illegalContentType && (
                    <div className="col-span-2">
                      <dt className="text-gray-500">Type of illegal content</dt>
                      <dd className="font-medium text-red-700">{selectedReport.illegalContentType}</dd>
                    </div>
                  )}
                  <div className="col-span-2">
                    <dt className="text-gray-500">Explanation</dt>
                    <dd className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedReport.explanation}</dd>
                  </div>
                  {selectedReport.goodFaithDeclaration && (
                    <div className="col-span-2">
                      <dt className="text-gray-500">Good faith declaration</dt>
                      <dd className="text-green-700">✓ Submitted in good faith</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Timeline</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Submitted</dt>
                    <dd className="text-gray-900">{new Date(selectedReport.createdAt).toLocaleString('nl-NL')}</dd>
                  </div>
                  {selectedReport.acknowledgedAt && (
                    <div>
                      <dt className="text-gray-500">Acknowledged</dt>
                      <dd className="text-green-700">{new Date(selectedReport.acknowledgedAt).toLocaleString('nl-NL')}</dd>
                    </div>
                  )}
                  {selectedReport.assessedAt && (
                    <div>
                      <dt className="text-gray-500">Assessed</dt>
                      <dd className="text-gray-900">{new Date(selectedReport.assessedAt).toLocaleString('nl-NL')}</dd>
                    </div>
                  )}
                  {selectedReport.actionTakenAt && (
                    <div>
                      <dt className="text-gray-500">Action taken at</dt>
                      <dd className="text-gray-900">{new Date(selectedReport.actionTakenAt).toLocaleString('nl-NL')}</dd>
                    </div>
                  )}
                  {selectedReport.resolvedAt && (
                    <div>
                      <dt className="text-gray-500">Resolved at</dt>
                      <dd className="text-gray-900">{new Date(selectedReport.resolvedAt).toLocaleString('nl-NL')}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Assessment Result (if assessed) */}
              {selectedReport.assessmentResult && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Assessment</h3>
                  <p className="text-sm text-yellow-700">
                    <strong>{selectedReport.assessmentResult.replace(/_/g, ' ')}</strong>
                    {selectedReport.assessmentNotes && `: ${selectedReport.assessmentNotes}`}
                  </p>
                </div>
              )}

              {/* Action taken */}
              {selectedReport.actionTaken && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Action Taken</h3>
                  <p className="text-sm text-blue-700">{selectedReport.actionTaken.replace(/_/g, ' ')}</p>
                  {selectedReport.actionDetails && (
                    <pre className="mt-2 text-xs text-blue-600 bg-blue-100 rounded p-2 overflow-auto">
                      {JSON.stringify(selectedReport.actionDetails, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            {(selectedReport.status === 'RECEIVED' || selectedReport.status === 'ASSESSMENT') && (
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowActionModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Assess Report
                </button>
                <button
                  onClick={() => {
                    setActionTaken('CONTENT_REMOVED');
                    setShowDetailModal(false);
                    setShowActionModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Take Action
                </button>
                <button
                  onClick={escalateToAuthorities}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                >
                  <ShieldAlert className="w-4 h-4 inline mr-1" />
                  Escalate to Authorities (Art. 18)
                </button>
              </div>
            )}

            {selectedReport.status === 'ACTION_TAKEN' && !selectedReport.statementOfReasons && (
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowSorModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  Create Statement of Reasons (Art. 17)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment / Action Modal */}
      {showActionModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedReport.status === 'RECEIVED' ? 'Assess Report' : 'Take Action'}
            </h3>

            {selectedReport.status === 'RECEIVED' ? (
              <>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                    <select
                      value={assessmentResult}
                      onChange={(e) => setAssessmentResult(e.target.value as ContentReportAssessment)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="ILLEGAL_CONTENT_FOUND">Illegal content found</option>
                      <option value="VIOLATES_TERMS">Violates terms of service</option>
                      <option value="NOT_VIOLATION">No violation found</option>
                      <option value="UNCLEAR_NEEDS_REVIEW">Unclear — needs further review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={assessmentNotes}
                      onChange={(e) => setAssessmentNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
                      placeholder="Assessment notes..."
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={assessReport} disabled={actionSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                    {actionSubmitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                  <button onClick={() => setShowActionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                    <select
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value as ContentReportAction)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="CONTENT_REMOVED">Remove content</option>
                      <option value="CONTENT_HIDDEN">Hide content (visibility limit)</option>
                      <option value="ACCOUNT_SUSPENDED">Suspend account</option>
                      <option value="ACCOUNT_BANNED">Ban account</option>
                      <option value="WARNING_ISSUED">Issue warning</option>
                      <option value="NO_ACTION">No action</option>
                      <option value="ESCALATED_TO_AUTHORITIES">Escalate to authorities</option>
                      <option value="REFERRED_TO_OUT_OF_COURT">Refer to out-of-court dispute</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
                      placeholder="Resolution notes..."
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={resolveReport} disabled={actionSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                    {actionSubmitting ? 'Submitting...' : 'Resolve Report'}
                  </button>
                  <button onClick={() => setShowActionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Statement of Reasons Modal — DSA Art. 17 */}
      {showSorModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Statement of Reasons
                <span className="block text-xs font-normal text-gray-500">DSA Art. 17</span>
              </h3>
              <button onClick={() => setShowSorModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              DSA Art. 17 requires that the affected user receives a clear statement explaining
              why their content was restricted, including the type of restriction, facts and
              circumstances, source of decision, and redress options.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restriction type</label>
                <select value={restrictionType} onChange={(e) => setRestrictionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="REMOVAL">Removal</option>
                  <option value="VISIBILITY_LIMIT">Visibility limitation</option>
                  <option value="GEO_BLOCKING">Geo-blocking</option>
                  <option value="AGE_RESTRICTION">Age restriction</option>
                  <option value="ACCOUNT_SUSPENSION">Account suspension</option>
                  <option value="ACCOUNT_TERMINATION">Account termination</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reasons (comma-separated)</label>
                <input
                  value={sorReasons}
                  onChange={(e) => setSorReasons(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="illegal_content, terms_violation, hate_speech"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed explanation</label>
                <textarea
                  value={sorExplanation}
                  onChange={(e) => setSorExplanation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
                  placeholder="Explain why the content was restricted, including the facts and circumstances..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal basis (optional)</label>
                <input
                  value={sorLegalBasis}
                  onChange={(e) => setSorLegalBasis(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., Wetboek van Strafrecht Art. 137c"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={submitStatementOfReasons} disabled={sorSubmitting}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50">
                {sorSubmitting ? 'Creating...' : 'Create Statement of Reasons'}
              </button>
              <button onClick={() => setShowSorModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}