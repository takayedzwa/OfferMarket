"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { ArrowLeft, Scale, MessageSquareWarning } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { dsaAdminApi } from "@/lib/api";

interface ContentReport {
  id: string;
  publicId?: string;
  status: string;
  category?: string;
  priority?: string;
  targetType?: string;
  reporter?: { id: string; email: string };
  createdAt: string;
  description?: string;
}

interface DsaComplaint {
  id: string;
  complaintType?: string;
  status: string;
  complainant?: { id: string; email: string };
  submittedAt?: string;
  createdAt?: string;
  description?: string;
}

export default function AdminDsaPage() {
  const t = useTranslations("admin-list.dsa");
  const tEnums = useTranslations("enums");
  const router = useRouter();
  const { date } = useFormat();
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [complaints, setComplaints] = useState<DsaComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || !user || user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    Promise.all([
      dsaAdminApi.getReports({ page: 1, limit: 20 }),
      dsaAdminApi.getComplaints({ page: 1, limit: 20 }),
    ])
      .then(([r, c]) => {
        setReports(r.data.reports || []);
        setComplaints(c.data.complaints || []);
      })
      .catch((err) => setError(err?.message || t("errorFallback")))
      .finally(() => setLoading(false));
  }, [user, authLoading, router, t]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800",
      ASSESSMENT: "bg-yellow-100 text-yellow-800",
      ACTION_TAKEN: "bg-orange-100 text-orange-800",
      RESOLVED: "bg-green-100 text-green-800",
      DISMISSED: "bg-gray-100 text-gray-800",
      ESCALATED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      UPHELD: "bg-red-100 text-red-800",
      REJECTED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const statusLabel = (status: string) => {
    try {
      return tEnums("dsaStatus." + status + ".label");
    } catch {
      return status.replace(/_/g, " ");
    }
  };

  const categoryLabel = (category?: string) => {
    if (!category) return t("dash");
    try {
      return tEnums("contentReportCategory." + category);
    } catch {
      return category.replace(/_/g, " ");
    }
  };

  const priorityLabel = (priority?: string) => {
    if (!priority) return t("dash");
    try {
      return tEnums("dsaPriority." + priority);
    } catch {
      return priority;
    }
  };

  const targetLabel = (targetType?: string) => {
    if (!targetType) return t("dash");
    try {
      return tEnums("contentReportTarget." + targetType);
    } catch {
      return targetType.replace(/_/g, " ");
    }
  };

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
                <p className="text-sm text-gray-500">{t("subtitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Content Reports */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <Scale className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">{t("contentReportsTitle")}</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.status")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.category")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.priority")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.target")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.reporter")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.created")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">{t("emptyReports")}</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{categoryLabel(r.category)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{priorityLabel(r.priority)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{targetLabel(r.targetType)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.reporter?.email || t("anonymous")}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{date(r.createdAt, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Complaints */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">{t("complaintsTitle")}</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.type")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.complainant")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.status")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.submitted")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">{t("emptyComplaints")}</td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {c.complaintType?.replace(/_/g, " ") || t("dash")}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{c.complainant?.email || t("dash")}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {date(c.submittedAt || c.createdAt || "", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
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