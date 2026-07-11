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
  const [activeTab, setActiveTab] = useState<'overview' | 'consents' | 'export' | 'deletion' | 'restriction'>('overview');
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
    { id: 'export' as const, label: 'Export Data', icon: '📦' },
    { id: 'restriction' as const, label: 'Restriction', icon: '🔒' },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Right of Access</p>
                <p className="text-xs text-gray-500">Art. 15 AVG</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              Request a copy of all personal data we hold about you.
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
              Export your data in a machine-readable format.
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
        {activeTab === 'export' && <DataExportCard />}
        {activeTab === 'restriction' && <RestrictionToggle />}
        {activeTab === 'deletion' && <DeletionCard />}
      </div>
    </div>
  );
}