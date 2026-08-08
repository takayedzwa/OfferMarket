"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { billingApi } from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import { Invoice, InvoiceStatus } from "@/lib/types";
import {
  CreditCard, FileText, AlertTriangle, CheckCircle, Clock, Eye,
} from "lucide-react";

const statusConfig: Record<InvoiceStatus, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  DRAFT: { color: "bg-gray-100 text-gray-800", icon: FileText },
  ISSUED: { color: "bg-blue-100 text-blue-800", icon: Clock },
  PAID: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  OVERDUE: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
  CANCELLED: { color: "bg-gray-100 text-gray-500", icon: FileText },
  REFUNDED: { color: "bg-purple-100 text-purple-800", icon: CreditCard },
};

type FilterTab = "all" | "unpaid" | "paid";

export default function EmployerBillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations("dashboard.employer.billing");
  const tEnums = useTranslations("enums");
  const { currency, date } = useFormat();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<{ unpaidCount: number; outstandingCents: number; nextDueDate: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // SECURITY: role comes from AuthContext (JWT via /auth/me), not localStorage.
    if (authLoading) return;
    const role = user?.role;
    if (role !== "EMPLOYER" && role !== "ADMIN") {
      router.push("/login");
      return;
    }

    loadData();
  }, [user, authLoading, activeTab, page]);

  async function loadData() {
    try {
      const [invoicesRes, summaryRes] = await Promise.all([
        billingApi.getMyInvoices({
          unpaidOnly: activeTab === "unpaid" ? true : undefined,
          status: activeTab === "paid" ? "PAID" : undefined,
          page,
          limit: 10,
        }),
        billingApi.getInvoiceSummary(),
      ]);

      setInvoices(invoicesRes.data.invoices || []);
      setTotalPages(invoicesRes.data.pagination?.totalPages || 1);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error("Failed to load billing data:", err);
    } finally {
      setLoading(false);
    }
  }

  const renderStatus = (status: InvoiceStatus) => {
    try {
      return tEnums(`invoiceStatus.${status}`);
    } catch {
      return status.charAt(0) + status.slice(1).toLowerCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-500 mt-1">{t("subtitle")}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/employer")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {t("backToDashboard")}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("summary.unpaid")}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.unpaidCount}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("summary.outstanding")}</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {currency(summary.outstandingCents / 100)}
              </p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("summary.nextDue")}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.nextDueDate ? date(summary.nextDueDate, { year: "numeric", month: "short", day: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "unpaid", "paid"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border"
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Invoice Table */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t("empty.title")}</h3>
            <p className="text-gray-500 mt-1">{t("empty.description")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.invoice")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.offer")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.issued")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.dueDate")}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("table.amount")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.status")}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((invoice) => {
                  const config = statusConfig[invoice.status] || statusConfig.ISSUED;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{invoice.offer?.jobTitle || "—"}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{date(invoice.issuedAt, { year: "numeric", month: "short", day: "numeric" })}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{date(invoice.dueDate, { year: "numeric", month: "short", day: "numeric" })}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{currency(invoice.totalCents / 100)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {renderStatus(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/dashboard/employer/billing/${invoice.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
            >
              {t("pagination.previous")}
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {t("pagination.pageInfo", { page, totalPages })}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
            >
              {t("pagination.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}