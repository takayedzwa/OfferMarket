'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
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
  const t = useTranslations('privacy.dashboard');
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
    { id: 'overview' as const, label: t('tabs.overview'), icon: '🏠' },
    { id: 'consents' as const, label: t('tabs.consents'), icon: '✅' },
    { id: 'access' as const, label: t('tabs.access'), icon: '📋' },
    { id: 'export' as const, label: t('tabs.export'), icon: '📦' },
    { id: 'restriction' as const, label: t('tabs.restriction'), icon: '🔒' },
    { id: 'automated-decision' as const, label: t('tabs.automatedDecision'), icon: '🤖' },
    { id: 'deletion' as const, label: t('tabs.deletion'), icon: '🗑️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Rights overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('rights.accessTitle')}</p>
                <p className="text-xs text-gray-500">{t('rights.accessRef')}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              {t('rights.accessBody')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗑️</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('rights.erasureTitle')}</p>
                <p className="text-xs text-gray-500">{t('rights.erasureRef')}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              {t('rights.erasureBody')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('rights.portabilityTitle')}</p>
                <p className="text-xs text-gray-500">{t('rights.portabilityRef')}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              {t('rights.portabilityBody')}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{t('rights.automatedTitle')}</p>
                <p className="text-xs text-gray-500">{t('rights.automatedRef')}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              {t('rights.automatedBody')}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('overview.dataSummaryTitle')}</h3>
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
                    <p className="text-xs text-gray-500">{t('overview.profileFields')}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {dataSummary.offers.sent + dataSummary.offers.received}
                    </p>
                    <p className="text-xs text-gray-500">{t('overview.offers')}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{dataSummary.messages.total}</p>
                    <p className="text-xs text-gray-500">{t('overview.messages')}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{dataSummary.consents.active}</p>
                    <p className="text-xs text-gray-500">{t('overview.activeConsents')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t('overview.unableToLoad')}</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('overview.quickActionsTitle')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('export')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">📦</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('overview.downloadTitle')}</p>
                    <p className="text-xs text-gray-500">{t('overview.downloadBody')}</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('consents')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">⚙️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('overview.manageTitle')}</p>
                    <p className="text-xs text-gray-500">{t('overview.manageBody')}</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('restriction')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">🔒</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('overview.restrictTitle')}</p>
                    <p className="text-xs text-gray-500">{t('overview.restrictBody')}</p>
                  </div>
                </button>
                <Link
                  href="/privacy"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('overview.policyTitle')}</p>
                    <p className="text-xs text-gray-500">{t('overview.policyBody')}</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Contact DPA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900">{t('overview.rightsTitle')}</h3>
              <p className="mt-2 text-sm text-blue-800">
                {t('overview.rightsBody')}
              </p>
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                {t('overview.apLink')}
              </a>
            </div>
          </div>
        )}

        {activeTab === 'consents' && <ConsentCard />}

        {activeTab === 'access' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('access.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('access.intro')}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {t('access.portabilityNote')}
            </p>

            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">{t('access.receiveTitle')}</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>{t('access.receive1')}</li>
                <li>{t('access.receive2')}</li>
                <li>{t('access.receive3')}</li>
                <li>{t('access.receive4')}</li>
                <li>{t('access.receive5')}</li>
                <li>{t('access.receive6')}</li>
                <li>{t('access.receive7')}</li>
                <li>{t('access.receive8')}</li>
                <li>{t('access.receive9')}</li>
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
                      alert(t('access.submitSuccess'));
                    } else {
                      alert(t('access.submitPending'));
                    }
                  } catch {
                    alert(t('access.submitError'));
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {t('access.submit')}
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('access.portabilityInstead')}
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              {t('access.responseTime')}
            </p>
          </div>
        )}

        {activeTab === 'export' && <DataExportCard />}
        {activeTab === 'restriction' && <RestrictionToggle />}
        {activeTab === 'automated-decision' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('automated.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('automated.intro')}
            </p>

            <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">{t('automated.examplesTitle')}</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>{t('automated.example1')}</li>
                <li>{t('automated.example2')}</li>
                <li>{t('automated.example3')}</li>
                <li>{t('automated.example4')}</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('automated.typeLabel')}
                </label>
                <select
                  id="decisionType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">{t('automated.typePlaceholder')}</option>
                  <option value="profile_scoring">{t('automated.typeProfileScoring')}</option>
                  <option value="offer_matching">{t('automated.typeOfferMatching')}</option>
                  <option value="trust_risk_scoring">{t('automated.typeTrustRisk')}</option>
                  <option value="account_restriction">{t('automated.typeAccountRestriction')}</option>
                  <option value="fraud_detection">{t('automated.typeFraudDetection')}</option>
                  <option value="other">{t('automated.typeOther')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('automated.reasonLabel')}
                </label>
                <textarea
                  id="decisionReason"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={t('automated.reasonPlaceholder')}
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
                  {t('automated.humanReviewLabel')}
                </label>
              </div>

              <button
                onClick={async () => {
                  const decisionType = (document.getElementById('decisionType') as HTMLSelectElement)?.value;
                  const reason = (document.getElementById('decisionReason') as HTMLTextAreaElement)?.value;
                  const requestHumanReview = (document.getElementById('requestHumanReview') as HTMLInputElement)?.checked;

                  if (!decisionType) {
                    alert(t('automated.alertTypeRequired'));
                    return;
                  }
                  if (!reason?.trim()) {
                    alert(t('automated.alertReasonRequired'));
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
                      alert(t('automated.submitSuccess', { message: data.message || t('automated.submitSuccessFallback') }));
                    } else {
                      alert(t('automated.submitError'));
                    }
                  } catch {
                    alert(t('automated.submitError'));
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {t('automated.submit')}
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              {t('automated.footer')}
            </p>
          </div>
        )}

        {activeTab === 'deletion' && <DeletionCard />}
      </div>
    </div>
  );
}