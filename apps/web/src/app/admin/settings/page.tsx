"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Settings, DollarSign, Percent, Users, Bell, Shield, Globe } from "lucide-react";

interface PlatformSettings {
  id: string;
  key: string;
  value: any;
  category: string;
  isPublic: boolean;
  updatedAt: string;
}

interface SettingsForm {
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  defaultCurrency: string;
  taxRate: number;
  serviceFeePercent: number;
  minWithdrawalAmount: number;
  maxCreditsPurchase: number;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
  adminApprovalForEmployers: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  welcomeMessage: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
}

const defaultSettings: SettingsForm = {
  platformName: "OfferMarket",
  platformUrl: "",
  supportEmail: "support@offermarket.com",
  defaultCurrency: "USD",
  taxRate: 0,
  serviceFeePercent: 5,
  minWithdrawalAmount: 50,
  maxCreditsPurchase: 10000,
  emailVerificationRequired: true,
  phoneVerificationRequired: false,
  adminApprovalForEmployers: true,
  maintenanceMode: false,
  maintenanceMessage: "Platform is under maintenance. Please check back later.",
  welcomeMessage: "Welcome to OfferMarket - Connect with skilled workers today!",
  termsOfServiceUrl: "",
  privacyPolicyUrl: "",
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsForm>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const fetchSettings = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/settings`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const settingsMap: Record<string, any> = {};
        (data.settings || []).forEach((s: PlatformSettings) => {
          settingsMap[s.key] = s.value;
        });
        setSettings({ ...defaultSettings, ...settingsMap });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = () => {
    setSaving(true);
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    const updates = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      category: getCategoryForKey(key),
    }));

    Promise.all(
      updates.map((update) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'X-User-ID': adminUserId,
            'X-User-Role': 'ADMIN',
          },
          body: JSON.stringify(update),
        })
      )
    )
      .then(() => {
        setSaving(false);
        alert('Settings saved successfully');
      })
      .catch(() => {
        setSaving(false);
        alert('Failed to save settings');
      });
  };

  const getCategoryForKey = (key: string): string => {
    const categories: Record<string, string> = {
      platformName: 'general',
      platformUrl: 'general',
      supportEmail: 'general',
      welcomeMessage: 'general',
      termsOfServiceUrl: 'general',
      privacyPolicyUrl: 'general',
      defaultCurrency: 'financial',
      taxRate: 'financial',
      serviceFeePercent: 'financial',
      minWithdrawalAmount: 'financial',
      maxCreditsPurchase: 'financial',
      emailVerificationRequired: 'verification',
      phoneVerificationRequired: 'verification',
      adminApprovalForEmployers: 'verification',
      maintenanceMode: 'system',
      maintenanceMessage: 'system',
    };
    return categories[key] || 'general';
  };

  const updateSetting = (key: keyof SettingsForm, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

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
                <h1 className="text-lg font-semibold text-gray-900">Platform Settings</h1>
                <p className="text-sm text-gray-500">Manage platform configuration</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border shadow-sm p-4 space-y-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeTab === 'general' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">General</span>
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeTab === 'financial' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">Financial</span>
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeTab === 'verification' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Verification</span>
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeTab === 'system' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">System</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => updateSetting('platformName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform URL</label>
                  <input
                    type="url"
                    value={settings.platformUrl}
                    onChange={(e) => updateSetting('platformUrl', e.target.value)}
                    placeholder="https://offermarket.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => updateSetting('supportEmail', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                  <textarea
                    value={settings.welcomeMessage}
                    onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Service URL</label>
                  <input
                    type="url"
                    value={settings.termsOfServiceUrl}
                    onChange={(e) => updateSetting('termsOfServiceUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Policy URL</label>
                  <input
                    type="url"
                    value={settings.privacyPolicyUrl}
                    onChange={(e) => updateSetting('privacyPolicyUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Financial Settings */}
            {activeTab === 'financial' && (
              <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Financial Settings</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                  <select
                    value={settings.defaultCurrency}
                    onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (%)</label>
                  <input
                    type="number"
                    value={settings.serviceFeePercent}
                    onChange={(e) => updateSetting('serviceFeePercent', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage charged on each transaction</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Withdrawal Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={settings.minWithdrawalAmount}
                      onChange={(e) => updateSetting('minWithdrawalAmount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Credits Purchase</label>
                  <input
                    type="number"
                    value={settings.maxCreditsPurchase}
                    onChange={(e) => updateSetting('maxCreditsPurchase', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {/* Verification Settings */}
            {activeTab === 'verification' && (
              <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Verification Settings</h2>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verification Required</label>
                    <p className="text-xs text-gray-500">Require users to verify their email address</p>
                  </div>
                  <button
                    onClick={() => updateSetting('emailVerificationRequired', !settings.emailVerificationRequired)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.emailVerificationRequired ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.emailVerificationRequired ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Verification Required</label>
                    <p className="text-xs text-gray-500">Require users to verify their phone number</p>
                  </div>
                  <button
                    onClick={() => updateSetting('phoneVerificationRequired', !settings.phoneVerificationRequired)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.phoneVerificationRequired ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.phoneVerificationRequired ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Approval for Employers</label>
                    <p className="text-xs text-gray-500">Require admin approval before employers can post jobs</p>
                  </div>
                  <button
                    onClick={() => updateSetting('adminApprovalForEmployers', !settings.adminApprovalForEmployers)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.adminApprovalForEmployers ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.adminApprovalForEmployers ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maintenance Mode</label>
                    <p className="text-xs text-gray-500">Put the platform in maintenance mode</p>
                  </div>
                  <button
                    onClick={() => updateSetting('maintenanceMode', !settings.maintenanceMode)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {settings.maintenanceMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Message</label>
                    <textarea
                      value={settings.maintenanceMessage}
                      onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none h-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">Message shown to users during maintenance</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
