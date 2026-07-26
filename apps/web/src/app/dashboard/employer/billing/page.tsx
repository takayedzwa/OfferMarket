"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { billingApi } from "../../../../lib/api";
import { Invoice, InvoiceStatus } from "../../../../lib/types";
import {
  CreditCard, FileText, AlertTriangle, CheckCircle, Clock, Eye,
} from "lucide-react";

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
  ISSUED: { label: "Issued", color: "bg-blue-100 text-blue-800", icon: Clock },
  PAID: { label: "Paid", color: "bg-green-100 text-green-800", icon: CheckCircle },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-800", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: FileText },
  REFUNDED: { label: "Refunded", color: "bg-purple-100 text-purple-800", icon: CreditCard },
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

type FilterTab = "all" | "unpaid" | "paid";

export default function EmployerBillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
            <p className="text-gray-500 mt-1">Manage your introduction fees and invoices</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/employer")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.unpaidCount}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">Outstanding Amount</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCents(summary.outstandingCents)}
              </p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">Next Due Date</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.nextDueDate ? formatDate(summary.nextDueDate) : "—"}
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Invoice Table */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
            <p className="text-gray-500 mt-1">Invoices are created when a worker accepts your offer.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.issuedAt)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.dueDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCents(invoice.totalCents)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
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
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}