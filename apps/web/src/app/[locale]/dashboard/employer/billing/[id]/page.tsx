"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { billingApi } from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import { Invoice, InvoiceStatus } from "@/lib/types";
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle, FileText, CreditCard,
} from "lucide-react";

const statusConfig: Record<InvoiceStatus, { color: string }> = {
  DRAFT: { color: "bg-gray-100 text-gray-800" },
  ISSUED: { color: "bg-blue-100 text-blue-800" },
  PAID: { color: "bg-green-100 text-green-800" },
  OVERDUE: { color: "bg-red-100 text-red-800" },
  CANCELLED: { color: "bg-gray-100 text-gray-500" },
  REFUNDED: { color: "bg-purple-100 text-purple-800" },
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const t = useTranslations("dashboard.employer.invoiceDetail");
  const tEnums = useTranslations("enums");
  const { currency, date } = useFormat();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  async function loadInvoice() {
    try {
      const res = await billingApi.getInvoice(params.id as string);
      setInvoice(res.data);
    } catch (err) {
      console.error("Failed to load invoice:", err);
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{t("notFound")}</h2>
          <button
            onClick={() => router.push("/dashboard/employer/billing")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("backToBilling")}
          </button>
        </div>
      </div>
    );
  }

  const config = statusConfig[invoice.status];
  const isIssued = invoice.status === "ISSUED";
  const isOverdue = invoice.status === "OVERDUE";
  const showBankTransfer = isIssued || isOverdue;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/dashboard/employer/billing")}
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
              {renderStatus(invoice.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">{t("dueDate")}</p>
              <p className="font-medium text-gray-900">{date(invoice.dueDate, { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div>
              <p className="text-gray-500">{t("offer")}</p>
              <p className="font-medium text-gray-900">{invoice.offer?.jobTitle || "—"}</p>
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
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("lineItems.title")}</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">{t("lineItems.description")}</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">{t("lineItems.qty")}</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">{t("lineItems.unitPrice")}</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">{t("lineItems.total")}</th>
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
              <span className="text-gray-600">{t("vat", { rate: invoice.vatRatePct })}</span>
              <span className="text-gray-900">{currency(invoice.vatAmountCents / 100)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>{t("total")}</span>
              <span>{currency(invoice.totalCents / 100)}</span>
            </div>
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        {showBankTransfer && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">{t("payment.title")}</h3>
                <p className="text-blue-700 text-sm mt-1">
                  {t("payment.instructions", { amount: currency(invoice.totalCents / 100), invoiceNumber: invoice.invoiceNumber })}
                </p>
                <div className="mt-3 bg-white rounded-lg p-4 border border-blue-200 text-sm space-y-1">
                  <p><span className="text-gray-500">{t("payment.accountHolder")}</span> <span className="font-medium">{t("payment.accountHolderValue")}</span></p>
                  <p><span className="text-gray-500">{t("payment.reference")}</span> <span className="font-medium">{invoice.invoiceNumber}</span></p>
                </div>
                <p className="text-blue-600 text-xs mt-2">
                  {t("payment.dueWithin", { date: date(invoice.dueDate, { year: "numeric", month: "long", day: "numeric" }) })}
                </p>
              </div>
            </div>
          </div>
        )}

        {invoice.notes && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mt-6">
            <h3 className="font-medium text-gray-900 mb-2">{t("notes")}</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}