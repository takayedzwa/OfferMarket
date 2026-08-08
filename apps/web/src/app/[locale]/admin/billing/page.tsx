"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { billingApi } from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import { Invoice, InvoiceStatus, BillingStats, BillingSettings } from "@/lib/types";
import {
  CreditCard, AlertTriangle, CheckCircle, Clock, Eye, Check, XCircle,
  DollarSign, TrendingUp, Settings, FileText,
} from "lucide-react";

const statusConfig: Record<InvoiceStatus, { color: string }> = {
  DRAFT: { color: "bg-gray-100 text-gray-800" },
  ISSUED: { color: "bg-blue-100 text-blue-800" },
  PAID: { color: "bg-green-100 text-green-800" },
  OVERDUE: { color: "bg-red-100 text-red-800" },
  CANCELLED: { color: "bg-gray-100 text-gray-500" },
  REFUNDED: { color: "bg-purple-100 text-purple-800" },
};

type Tab = "invoices" | "settings";

export default function AdminBillingPage() {
  const t = useTranslations("admin-list.billing");
  const tEnums = useTranslations("enums");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currency, date } = useFormat();
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

  const invoiceStatusLabel = (status: InvoiceStatus) => {
    try {
      return tEnums("invoiceStatus." + status);
    } catch {
      return status.replace(/_/g, " ");
    }
  };

  useEffect(() => {
    // SECURITY: role comes from AuthContext (JWT via /auth/me), not localStorage.
    if (authLoading) return;
    if (user?.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, authLoading, statusFilter, page]);

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
    if (!confirm(t("confirmCancel"))) return;
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
      alert(t("settingsSaved"));
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  async function handleCheckOverdue() {
    try {
      const res = await billingApi.adminCheckOverdue();
      alert(t("overdueCount", { count: res.data.overdueCount }));
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
          <p className="mt-4 text-gray-600">{t("loading")}</p>
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
              <h1 className="text-lg font-semibold text-gray-900">{t("title")}</h1>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {t("backToAdmin")}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("stat.totalRevenue")}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{currency(stats.totalRevenueCents / 100)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("stat.paid")}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{currency(stats.totalPaidCents / 100)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("stat.outstanding")}</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{currency(stats.totalOutstandingCents / 100)}</p>
            </div>
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <p className="text-sm text-gray-600">{t("stat.overdue")}</p>
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
            {t("tab.invoices")}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "settings" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1" />
            {t("tab.settings")}
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
                <option value="">{t("filter.allStatuses")}</option>
                <option value="ISSUED">{t("filter.ISSUED")}</option>
                <option value="PAID">{t("filter.PAID")}</option>
                <option value="OVERDUE">{t("filter.OVERDUE")}</option>
                <option value="CANCELLED">{t("filter.CANCELLED")}</option>
              </select>
              <button
                onClick={handleCheckOverdue}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
              >
                {t("checkOverdue")}
              </button>
            </div>

            {/* Invoice Table */}
            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">{t("emptyInvoices")}</h3>
              </div>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.invoice")}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.employer")}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.offer")}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.issued")}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("table.total")}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("table.status")}</th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t("table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => {
                      const config = statusConfig[invoice.status] || statusConfig.ISSUED;
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{invoice.employer?.companyName || t("dash")}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{invoice.offer?.jobTitle || t("dash")}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{date(invoice.issuedAt, { year: "numeric", month: "short", day: "numeric" })}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{currency(invoice.totalCents / 100)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                              {invoiceStatusLabel(invoice.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/admin/billing/invoices/${invoice.id}`)}
                                className="text-blue-600 hover:text-blue-800"
                                title={t("action.view")}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {(invoice.status === "ISSUED" || invoice.status === "OVERDUE") && (
                                <>
                                  <button
                                    onClick={() => setMarkingPaid(invoice.id)}
                                    className="text-green-600 hover:text-green-800"
                                    title={t("action.markPaid")}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelInvoice(invoice.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title={t("action.cancel")}
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
                  {t("previous")}
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">{t("pageOf", { page, total: totalPages })}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
                >
                  {t("next")}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "settings" && settings && (
          <div className="bg-white rounded-xl border shadow-sm p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("settingsTitle")}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.introductionFee")}</label>
                <input
                  type="number"
                  value={(settings.introduction_fee_cents / 100).toFixed(2)}
                  onChange={(e) => setSettings({ ...settings, introduction_fee_cents: Math.round(parseFloat(e.target.value) * 100) })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.vatRate")}</label>
                <input
                  type="number"
                  value={settings.vat_rate_pct}
                  onChange={(e) => setSettings({ ...settings, vat_rate_pct: parseInt(e.target.value) || 0 })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.paymentTerms")}</label>
                <input
                  type="number"
                  value={settings.invoice_payment_terms_days}
                  onChange={(e) => setSettings({ ...settings, invoice_payment_terms_days: parseInt(e.target.value) || 14 })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.bankAccountIban")}</label>
                <input
                  type="text"
                  value={settings.invoice_bank_account_iban}
                  onChange={(e) => setSettings({ ...settings, invoice_bank_account_iban: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-64"
                  placeholder={t("settings.placeholderIban")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.bankAccountName")}</label>
                <input
                  type="text"
                  value={settings.invoice_bank_account_name}
                  onChange={(e) => setSettings({ ...settings, invoice_bank_account_name: e.target.value })}
                  className="border rounded-lg px-3 py-2 w-64"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("settings.invoicePrefix")}</label>
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
                {t("saveSettings")}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mark Paid Modal */}
      {markingPaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("markPaidModal.title")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("markPaidModal.paymentRef")}</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder={t("markPaidModal.paymentRefPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("markPaidModal.notes")}</label>
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
                  {t("markPaidModal.confirm")}
                </button>
                <button
                  onClick={() => { setMarkingPaid(null); setPaymentRef(""); setMarkPaidNotes(""); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {t("markPaidModal.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}