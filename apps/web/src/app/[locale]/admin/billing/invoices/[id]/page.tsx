"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { billingApi } from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import { Invoice, InvoiceStatus } from "@/lib/types";
import { ArrowLeft, Check, XCircle } from "lucide-react";

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
  REFUNDED: "bg-purple-100 text-purple-800",
};

export default function AdminInvoiceDetailPage() {
  const t = useTranslations("admin-detail.invoiceDetail");
  const tEnums = useTranslations("enums");
  const router = useRouter();
  const params = useParams();
  const { currency, date } = useFormat();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");

  const statusLabel = (status: InvoiceStatus) => {
    try {
      return tEnums("invoiceStatus." + status);
    } catch {
      return status;
    }
  };

  useEffect(() => {
    if (params.id) loadInvoice();
  }, [params.id]);

  async function loadInvoice() {
    try {
      const res = await billingApi.adminGetInvoice(params.id as string);
      setInvoice(res.data);
    } catch (err) {
      console.error("Failed to load invoice:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid() {
    try {
      await billingApi.adminMarkInvoicePaid(invoice!.id, {
        paymentReference: paymentRef || undefined,
        paymentMethod: "bank_transfer",
        notes: notes || undefined,
      });
      setShowMarkPaid(false);
      loadInvoice();
    } catch (err) {
      console.error("Failed to mark as paid:", err);
    }
  }

  async function handleCancel() {
    if (!confirm(t("cancelConfirm"))) return;
    try {
      await billingApi.adminCancelInvoice(invoice!.id);
      loadInvoice();
    } catch (err) {
      console.error("Failed to cancel invoice:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{t("invoiceNotFound")}</p>
      </div>
    );
  }

  const color = statusColors[invoice.status];
  const canMarkPaid = invoice.status === "ISSUED" || invoice.status === "OVERDUE";
  const canCancel = invoice.status === "ISSUED" || invoice.status === "OVERDUE" || invoice.status === "DRAFT";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/admin/billing")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToBilling")}
        </button>

        {/* Invoice Header */}
        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-gray-500 mt-1">{t("issuedOn", { date: date(invoice.issuedAt, { year: "numeric", month: "long", day: "numeric" }) })}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                {statusLabel(invoice.status)}
              </span>
              {canMarkPaid && (
                <button
                  onClick={() => setShowMarkPaid(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  {t("markAsPaid")}
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  {t("cancel")}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{t("employer")}</p>
              <p className="font-medium text-gray-900">{invoice.employer?.companyName || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">{t("offer")}</p>
              <p className="font-medium text-gray-900">{invoice.offer?.jobTitle || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">{t("dueDate")}</p>
              <p className="font-medium text-gray-900">{date(invoice.dueDate, { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-gray-500">{t("paidOn")}</p>
                <p className="font-medium text-green-600">{date(invoice.paidAt, { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            )}
            {invoice.paymentReference && (
              <div>
                <p className="text-gray-500">{t("paymentReference")}</p>
                <p className="font-medium text-gray-900">{invoice.paymentReference}</p>
              </div>
            )}
            {invoice.paymentMethod && (
              <div>
                <p className="text-gray-500">{t("paymentMethod")}</p>
                <p className="font-medium text-gray-900 capitalize">{invoice.paymentMethod.replace("_", " ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("lineItems")}</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">{t("description")}</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">{t("qty")}</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">{t("unitPrice")}</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">{t("total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{currency(item.unitPriceCents / 100)}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">{currency(item.totalCents / 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("subtotal")}</span>
              <span className="text-gray-900">{currency(invoice.subtotalCents / 100)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("vat", { pct: invoice.vatRatePct })}</span>
              <span className="text-gray-900">{currency(invoice.vatAmountCents / 100)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>{t("totalLabel")}</span>
              <span>{currency(invoice.totalCents / 100)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-2">{t("notes")}</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Mark Paid Modal */}
      {showMarkPaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("markInvoicePaid")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("paymentRefLabel")}</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder={t("paymentRefPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("notesLabel")}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleMarkPaid} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {t("confirmPayment")}
                </button>
                <button onClick={() => setShowMarkPaid(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}