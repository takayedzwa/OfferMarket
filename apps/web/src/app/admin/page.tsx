"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users, Building2, CheckCircle, Settings, AlertTriangle,
  FileText, Eye, DollarSign, TrendingUp, Clock, Activity
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
    // Check if user is admin - only redirect if we have a confirmed non-admin user
    const userRole = localStorage.getItem('userRole');
    if (user && userRole && userRole !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch dashboard stats
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
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

  const navItems = [
    { href: '/admin/users', label: 'Users', icon: Users, description: 'Manage all users' },
    { href: '/admin/employers', label: 'Employers', icon: Building2, description: 'View & verify employers' },
    { href: '/admin/verifications', label: 'Verifications', icon: CheckCircle, description: 'Pending verifications', badge: stats?.pendingVerifications },
    { href: '/admin/offers', label: 'Offers', icon: FileText, description: 'Monitor all offers' },
    { href: '/admin/settings', label: 'Settings', icon: Settings, description: 'Platform settings' },
    { href: '/admin/reports', label: 'Reports', icon: AlertTriangle, description: 'Reported content' },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: Eye, description: 'View audit trail' },
  ];

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Workers', value: stats?.totalWorkers || 0, icon: Users, color: 'bg-green-500' },
    { label: 'Employers', value: stats?.totalEmployers || 0, icon: Building2, color: 'bg-purple-500' },
    { label: 'Pending Verifications', value: stats?.pendingVerifications || 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Active Offers', value: stats?.activeOffers || 0, icon: FileText, color: 'bg-indigo-500' },
    { label: 'Total Credits', value: `€${(stats?.totalCredits || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-500' },
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-xl border shadow-sm p-6 hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <item.icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
