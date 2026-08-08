"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { ArrowLeft, ShieldAlert, Activity, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trustApi } from "@/lib/api";

interface SuspiciousActivity {
  id: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  activityType: string;
  severity: string;
  riskScore?: number;
  description: string;
  status: string;
  isFalsePositive?: boolean;
  createdAt: string;
}

interface SuspiciousDashboard {
  totalActivities: number;
  newActivities: number;
  confirmedFraud: number;
  falsePositives: number;
  recentActivities: SuspiciousActivity[];
  fraudIndicators: any[];
  blacklistCount: number;
}

export default function AdminTrustPage() {
  const t = useTranslations("admin-list.trust");
  const router = useRouter();
  const { date } = useFormat();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<SuspiciousDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // A-L4: gate admin views on the ADMIN role.
    if (authLoading) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || !user || user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    // A-L3: centralized client (ADMIN/SUPPORT endpoint on the server).
    trustApi
      .getSuspiciousActivities()
      .then(({ data }) => setData(data))
      .catch((err) => setError(err?.message || t("errorFallback")))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, t]);

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      CRITICAL: "bg-red-100 text-red-800",
    };
    return colors[severity] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800",
      UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-red-100 text-red-800",
      RESOLVED: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const stats = [
    { label: t("stat.totalActivities"), value: data?.totalActivities ?? 0, icon: Activity, color: "bg-blue-500" },
    { label: t("stat.new"), value: data?.newActivities ?? 0, icon: ShieldAlert, color: "bg-yellow-500" },
    { label: t("stat.confirmedFraud"), value: data?.confirmedFraud ?? 0, icon: XCircle, color: "bg-red-500" },
    { label: t("stat.falsePositives"), value: data?.falsePositives ?? 0, icon: CheckCircle, color: "bg-gray-400" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button onClick={() => router.push("/admin")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            {t("backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push("/admin")} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{t("title")}</h1>
                <p className="text-sm text-gray-500">{t("blacklistCount", { count: data?.blacklistCount ?? 0 })}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
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

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">{t("recentTitle")}</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.activity")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.entity")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.severity")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.status")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.risk")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.detected")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(!data?.recentActivities || data.recentActivities.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">{t("empty")}</td>
                </tr>
              ) : (
                data.recentActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{a.activityType.replace(/_/g, " ")}</div>
                      <div className="text-xs text-gray-500">{a.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {a.entityType ? `${a.entityType}${a.entityId ? `: ${a.entityId.slice(0, 8)}…` : ""}` : t("dash")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(a.severity)}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(a.status)}`}>
                        {a.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{a.riskScore ?? t("dash")}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{date(a.createdAt, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}