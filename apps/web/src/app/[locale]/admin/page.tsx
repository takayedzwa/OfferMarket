"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import {
  Users, Building2, Settings, AlertTriangle,
  FileText, Eye, DollarSign, Clock, Activity,
  UserCheck, CreditCard, ShieldAlert, LifeBuoy, Scale, ShieldCheck
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalWorkers: number;
  totalEmployers: number;
  pendingVerifications: number;
  activeOffers: number;
  totalCredits: number;
}

export default function AdminDashboard() {
  const t = useTranslations("admin.home");
  const router = useRouter();
  const { currency } = useFormat();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // SECURITY (A-L4): role comes from AuthContext (JWT via /auth/me), not
    // localStorage. Wait for auth to resolve, then require both a token and
    // the ADMIN role before calling the admin-only endpoint; non-admins are
    // redirected rather than relying on a backend 401.
    if (authLoading) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken || !user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    // A-L3: use the centralized axios client (handles auth header + 401
    // refresh) instead of a raw fetch() with manual header plumbing.
    adminApi
      .getDashboardStats()
      .then(({ data }) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || t("fetchError"));
        setLoading(false);
      });
  }, [user, authLoading, router, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {t("goBack")}
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: t("stat.totalUsers"), value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500', href: '/admin/users' },
    { label: t("stat.workers"), value: stats?.totalWorkers || 0, icon: UserCheck, color: 'bg-green-500', href: '/admin/users' },
    { label: t("stat.employers"), value: stats?.totalEmployers || 0, icon: Building2, color: 'bg-purple-500', href: '/admin/employers' },
    { label: t("stat.pendingVerifications"), value: stats?.pendingVerifications || 0, icon: Clock, color: 'bg-yellow-500', href: '/admin/verifications' },
    { label: t("stat.activeOffers"), value: stats?.activeOffers || 0, icon: FileText, color: 'bg-indigo-500', href: '/admin/offers' },
    { label: t("stat.totalCredits"), value: currency(stats?.totalCredits || 0), icon: DollarSign, color: 'bg-emerald-500', href: '/admin/settings' },
  ];

  const quickActions = [
    { label: t("action.billing.label"), icon: CreditCard, href: '/admin/billing', description: t("action.billing.desc") },
    { label: t("action.settings.label"), icon: Settings, href: '/admin/settings', description: t("action.settings.desc") },
    { label: t("action.reports.label"), icon: AlertTriangle, href: '/admin/reports', description: t("action.reports.desc") },
    { label: t("action.auditLogs.label"), icon: Eye, href: '/admin/audit-logs', description: t("action.auditLogs.desc") },
    { label: t("action.trust.label"), icon: ShieldAlert, href: '/admin/trust', description: t("action.trust.desc") },
    { label: t("action.privacy.label"), icon: ShieldCheck, href: '/admin/privacy', description: t("action.privacy.desc") },
    { label: t("action.dsa.label"), icon: Scale, href: '/admin/dsa', description: t("action.dsa.desc") },
    { label: t("action.support.label"), icon: LifeBuoy, href: '/admin/support', description: t("action.support.desc") },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{t("header.title")}</h1>
                  <p className="text-xs text-gray-500">{t("header.subtitle")}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t("header.exit")}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid — clickable cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <button
              key={stat.label}
              onClick={() => router.push(stat.href)}
              className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <action.icon className="w-6 h-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{action.label}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}