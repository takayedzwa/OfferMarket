"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users, Building2, Settings, AlertTriangle,
  FileText, Eye, DollarSign, Clock, Activity,
  UserCheck, CreditCard
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
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      router.push('/login');
      return;
    }

    // Fetch dashboard stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          setError(err.message);
        }
        setLoading(false);
      });
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500', href: '/admin/users' },
    { label: 'Workers', value: stats?.totalWorkers || 0, icon: UserCheck, color: 'bg-green-500', href: '/admin/users' },
    { label: 'Employers', value: stats?.totalEmployers || 0, icon: Building2, color: 'bg-purple-500', href: '/admin/employers' },
    { label: 'Pending Verifications', value: stats?.pendingVerifications || 0, icon: Clock, color: 'bg-yellow-500', href: '/admin/verifications' },
    { label: 'Active Offers', value: stats?.activeOffers || 0, icon: FileText, color: 'bg-indigo-500', href: '/admin/offers' },
    { label: 'Total Credits', value: `€${(stats?.totalCredits || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500', href: '/admin/settings' },
  ];

  const quickActions = [
    { label: 'Billing', icon: CreditCard, href: '/admin/billing', description: 'Manage invoices & settings' },
    { label: 'Settings', icon: Settings, href: '/admin/settings', description: 'Platform settings' },
    { label: 'Reports', icon: AlertTriangle, href: '/admin/reports', description: 'Reported content' },
    { label: 'Audit Logs', icon: Eye, href: '/admin/audit-logs', description: 'View audit trail' },
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
                  <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Platform Management</p>
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
                Exit Admin
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
