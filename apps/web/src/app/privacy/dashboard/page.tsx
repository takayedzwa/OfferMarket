'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import ConsentCard from '@/components/privacy/DataSummaryCard';
import DataExportCard from '@/components/privacy/DataExportCard';
import DeletionCard from '@/components/privacy/DeletionCard';
import RestrictionToggle from '@/components/privacy/RestrictionToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface DataSummary {
  profile: { fields: number; lastUpdated: string };
  offers: { sent: number; received: number };
  messages: { total: number };
  consents: { total: number; active: number };
}

export default function PrivacyDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'consents' | 'access' | 'export' | 'restriction' | 'deletion' | 'automated-decision'>('overview');
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDataSummary();
    }
  }, [user]);

  const fetchDataSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/privacy/my-data`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setDataSummary({
          profile: {
            fields: Object.keys(data.profile || data.user || {}).length,
            lastUpdated: data.profile?.updatedAt || data.user?.updatedAt || new Date().toISOString(),
          },
          offers: {
            sent: data.offers?.length || 0,
            received: data.receivedOffers?.length || 0,
          },
          messages: {
            total: data.messages?.length || 0,
          },
          consents: {
            total: data.consents?.length || 0,
            active: data.consents?.filter((c: any) => c.status === 'GIVEN' && !c.withdrawnAt)?.length || 0,
          },
        });
      }
    } catch {
      // Data summary is optional
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '🏠' },
    { id: 'consents' as const, label: 'Consents', icon: '✅' },
    { id: 'access' as const, label: 'Access Request', icon: '📋' },
    { id: 'export' as const, label: 'Data Portability', icon: '📦' },
    { id: 'restriction' as const, label: 'Restriction', icon: '🔒' },
    { id: 'automated-decision' as const, label: 'Automated Decisions', icon: '🤖' },
    { id: 'deletion' as const, label: 'Delete Account', icon: '🗑️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar variant="dashboard" />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Privacy Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your personal data, consent preferences, and exercise your GDPR rights.
            Under the AVG (Algemene Verordening Gegevensbescherming), you have full control over your data.
          </p>
        </div>

        {/* Rights overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Right of Access</p>
                <p className="text-xs text-gray-500">Art. 15 AVG</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Request confirmation and a copy of all personal data we hold about you.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Right to Erasure</p>
                <p className="text-xs text-gray-500">Art. 17 AVG</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Request deletion of your personal data with a 30-day grace period.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Data Portability</p>
                <p className="text-xs text-gray-500">Art. 20 AVG</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Export your data in a machine-readable format for transfer.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Automated Decisions</p>
                <p className="text-xs text-gray-500">Art. 22 AVG</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Object to decisions made solely by automated means and request human review.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Data summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Data Summary</h3>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-3/4" />
                  ))}
                </div>
              ) : dataSummary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{dataSummary.profile.fields}</p>
                    <p className="text-xs text-gray-500">Profile Fields</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {dataSummary.offers.sent + dataSummary.offers.received}
                    </p>
                    <p className="text-xs text-gray-500">Offers</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{dataSummary.messages.total}</p>
                    <p className="text-xs text-gray-500">Messages</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{dataSummary.consents.active}</p>
                    <p className="text-xs text-gray-500">Active Consents</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Unable to load data summary.</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('export')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">📦</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Download My Data</p>
                    <p className="text-xs text-gray-500">Get a copy of all your personal data</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('consents')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">⚙️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Manage Consents</p>
                    <p className="text-xs text-gray-500">Update your consent preferences</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('restriction')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Restrict Processing</p>
                    <p className="text-xs text-gray-500">Limit how your data is processed</p>
                  </div>
                </button>
                <a
                  href="/privacy"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Privacy Policy</p>
                    <p className="text-xs text-gray-500">Read our privacy policy</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Contact DPA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900">Your rights under the AVG</h3>
              <p className="mt-2 text-sm text-blue-800">
                If you believe that the processing of your personal data infringes the AVG, you have the right
                to lodge a complaint with the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).
              </p>
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Autoriteit Persoonsgegevens →
              </a>
            </div>
          </div>
        )}

        {activeTab === 'consents' && <ConsentCard />}

        {activeTab === 'access' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Right of Access (Art. 15 AVG)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Under Article 15 of the AVG, you have the right to obtain confirmation as to whether
              personal data concerning you is being processed, and access to that data along with
              information about the purposes, categories, recipients, retention periods, and your rights.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This is different from Data Portability (Art. 20), which allows you to receive your data
              in a machine-readable format for transfer to another controller. Use this tab to submit
              a formal access request; use the &ldquo;Data Portability&rdquo; tab for data export.
            </p>

            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">What you&apos;ll receive</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Confirmation that your data is being processed</li>
                <li>A complete copy of all personal data we hold about you</li>
                <li>The purposes of processing</li>
                <li>The categories of data concerned</li>
                <li>Recipients or categories of recipients</li>
                <li>Retention periods or criteria</li>
                <li>Information about your rights (rectification, erasure, restriction, objection)</li>
                <li>Information about the source of the data (if not collected from you directly)</li>
                <li>Information about automated decision-making, including profiling</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(`${API_BASE}/privacy/request/access`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                    });
                    if (res.ok) {
                      alert('Your access request has been submitted. We will respond within 30 days as required by the AVG.');
                    } else {
                      alert('You may already have a pending access request.');
                    }
                  } catch {
                    alert('Unable to submit access request. Please try again later.');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Submit Access Request
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                I want Data Portability instead →
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              We will respond to your request within 30 days. In complex cases, this may be extended
              by a further 60 days, in which case we will inform you of the delay and the reasons.
            </p>
          </div>
        )}

        {activeTab === 'export' && <DataExportCard />}
        {activeTab === 'restriction' && <RestrictionToggle />}
        {activeTab === 'automated-decision' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Automated Decision-Making (Art. 22 AVG)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Under Article 22 of the AVG, you have the right not to be subject to a decision based
              solely on automated processing — including profiling — that produces legal effects or
              similarly significantly affects you. You can object to such decisions and request
              human review.
            </p>

            <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Examples of automated decisions</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Automated rejection of job applications or offers</li>
                <li>Algorithmic profile scoring that affects your visibility to employers</li>
                <li>Automated fraud detection that restricts your account</li>
                <li>Automated trust or risk scores that limit your access</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of automated decision *
                </label>
                <select
                  id="decisionType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select a decision type...</option>
                  <option value="profile_scoring">Profile visibility/scoring</option>
                  <option value="offer_matching">Automated offer matching/rejection</option>
                  <option value="trust_risk_scoring">Trust/risk score affecting access</option>
                  <option value="account_restriction">Automated account restriction</option>
                  <option value="fraud_detection">Automated fraud detection</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you believe this decision was made solely by automated means? *
                </label>
                <textarea
                  id="decisionReason"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Describe the decision and why you believe it was made without human intervention..."
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="requestHumanReview"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="requestHumanReview" className="text-sm text-gray-700">
                  I request human review of this decision (recommended)
                </label>
              </div>

              <button
                onClick={async () => {
                  const decisionType = (document.getElementById('decisionType') as HTMLSelectElement)?.value;
                  const reason = (document.getElementById('decisionReason') as HTMLTextAreaElement)?.value;
                  const requestHumanReview = (document.getElementById('requestHumanReview') as HTMLInputElement)?.checked;

                  if (!decisionType) {
                    alert('Please select a decision type.');
                    return;
                  }
                  if (!reason?.trim()) {
                    alert('Please describe why you believe this decision was automated.');
                    return;
                  }

                  try {
                    const token = localStorage.getItem('accessToken');
                    const res = await fetch(`${API_BASE}/privacy/request/automated-decision`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify({
                        decisionType,
                        reason: reason.trim(),
                        requestHumanReview,
                      }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      alert('Your objection to the automated decision has been submitted. ' + (data.message || 'Processing of this type of decision has been paused pending human review.'));
                    } else {
                      alert('Unable to submit your objection. Please try again later.');
                    }
                  } catch {
                    alert('Unable to submit your objection. Please try again later.');
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Submit Objection
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              When you submit this objection, your processing will be restricted until a human
              reviews the decision. You will be contacted within 30 days with the outcome of the review.
            </p>
          </div>
        )}

        {activeTab === 'deletion' && <DeletionCard />}
      </div>
    </div>
  );
}