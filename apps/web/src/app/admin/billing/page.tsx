"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { billingApi } from "../../../lib/api";
import { Invoice, InvoiceStatus, BillingStats, BillingSettings } from "../../../lib/types";
import {
  CreditCard, AlertTriangle, CheckCircle, Clock, Eye, Check, XCircle,
  DollarSign, TrendingUp, Settings, FileText,
} from "lucide-react";

const statusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  ISSUED: { label: "Issued", color: "bg-blue-100 text-blue-800" },
  PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
  REFUNDED: { label: "Refunded", color: "bg-purple-100 text-purple-800" },
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

type Tab = "invoices" | "settings";

export default function AdminBillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("invoices");
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Mark paid modal state
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [markPaidNotes, setMarkPaidNotes] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || userRole !== "ADMIN") {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, statusFilter, page]);

  async function loadData() {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        billingApi.adminGetStats(),
        billingApi.adminGetInvoices({ status: statusFilter || undefined, page, limit: 10 }),
      ]);
      setStats(statsRes.data);
      setInvoices(invoicesRes.data.invoices || []);
      setTotalPages(invoicesRes.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load billing data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSettings() {
    try {
      const res = await billingApi.adminGetSettings();
      setSettings(res.data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }

  async function handleMarkPaid() {
    if (!markingPaid) return;
    try {
      await billingApi.adminMarkInvoicePaid(markingPaid, {
        paymentReference: paymentRef || undefined,
        paymentMethod: "bank_transfer",
        notes: markPaidNotes || undefined,
      });
      setMarkingPaid(null);
      setPaymentRef("");
      setMarkPaidNotes("");
      loadData();
    } catch (err) {
      console.error("Failed to mark invoice as paid:", err);
    }
  }

  async function handleCancelInvoice(invoiceId: string) {
    if (!confirm("Are you sure you want to cancel this invoice?")) return;
    try {
      await billingApi.adminCancelInvoice(invoiceId);
      loadData();
    } catch (err) {
      console.error("Failed to cancel invoice:", err);
    }
  }

  async function handleSaveSettings() {
    if (!settings) return;
    try {
      for (const [key, value] of Object.entries(settings)) {
        await billingApi.adminUpdateSetting(key, value);
      }
      alert("Settings saved successfully");
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  async function handleCheckOverdue() {
    try {
      const res = await billingApi.adminCheckOverdue();
      alert(`${res.data.overdueCount} invoices marked as overdue`);
      loadData();
    } catch (err) {
      console.error("Failed to check overdue:", err);
    }
  }

  useEffect(() => {
    if (activeTab === "settings") {
      loadSettings();
    }
  }, [activeTab]);

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
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">Billing Management</h1>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Admin Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCents(stats.totalRevenueCents)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCents(stats.totalPaidCents)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{formatCents(stats.totalOutstandingCents)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.totalOverdueInvoices}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "invoices" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            Invoices
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "settings" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1" />
            Settings
          </button>
        </div>

        {activeTab === "invoices" && (
          <>
            {/* Filters & Actions */}
            <div className="flex items-center justify-between mb-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="ISSUED">Issued</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <button
                onClick={handleCheckOverdue}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
              >
                Check Overdue
              </button>
            </div>

            {/* Invoice Table */}
            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
              </div>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issued</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => {
                      const config = statusConfig[invoice.status] || statusConfig.ISSUED;
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{invoice.employer?.companyName || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{invoice.offer?.jobTitle || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.issuedAt)}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCents(invoice.totalCents)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                              {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/admin/billing/invoices/${invoice.id}`)}
                                className="text-blue-600 hover:text-blue-800"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(invoice.status === "ISSUED" || invoice.status === "OVERDUE") && (
                                <>
                                  <button
                                    onClick={() => setMarkingPaid(invoice.id)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Mark as Paid"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelInvoice(invoice.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
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
                <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "settings" && settings && (
          <div className="bg-white rounded-xl border shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Billing Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Introduction Fee (€)</label>
                <input
                  type="number"
                  value={(settings.introduction_fee_cents / 100).toFixed(2)}
                  onChange={(e) => setSettings({ ...settings, introduction_fee_cents: Math.round(parseFloat(e.target.value) * 100) })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                <input
                  type="number"
                  value={settings.vat_rate_pct}
                  onChange={(e) => setSettings({ ...settings, vat_rate_pct: parseInt(e.target.value) || 0 })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
                <input
                  type="number"
                  value={settings.invoice_payment_terms_days}
                  onChange={(e) => setSettings({ ...settings, invoice_payment_terms_days: parseInt(e.target.value) || 14 })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account IBAN</label>
                <input
                  type="text"
                  value={settings.invoice_bank_account_iban}
                  onChange={(e) => setSettings({ ...settings, invoice_bank_account_iban: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-64"
                  placeholder="NL00BANK0000000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Name</label>
                <input
                  type="text"
                  value={settings.invoice_bank_account_name}
                  onChange={(e) => setSettings({ ...settings, invoice_bank_account_name: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={settings.invoice_prefix}
                  onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mark Paid Modal */}
      {markingPaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark Invoice as Paid</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference (optional)</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="Bank transfer reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={markPaidNotes}
                  onChange={(e) => setMarkPaidNotes(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleMarkPaid}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirm Payment
                </button>
                <button
                  onClick={() => { setMarkingPaid(null); setPaymentRef(""); setMarkPaidNotes(""); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}