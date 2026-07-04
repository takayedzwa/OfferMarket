"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import { billingApi } from "../../../../../lib/api";
import { Invoice, InvoiceStatus } from "../../../../../lib/types";
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle, FileText, CreditCard,
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
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Invoice not found</h2>
          <button
            onClick={() => router.push("/dashboard/employer/billing")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Billing
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
          Back to Billing
        </button>

        {/* Invoice Header */}
        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-gray-500 mt-1">Issued {formatDate(invoice.issuedAt)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Offer</p>
              <p className="font-medium text-gray-900">{invoice.offer?.jobTitle || "—"}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-gray-500">Paid On</p>
                <p className="font-medium text-green-600">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
            {invoice.paymentReference && (
              <div>
                <p className="text-gray-500">Payment Reference</p>
                <p className="font-medium text-gray-900">{invoice.paymentReference}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoice.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{formatCents(item.unitPriceCents)}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCents(item.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatCents(invoice.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">VAT ({invoice.vatRatePct}%)</span>
              <span className="text-gray-900">{formatCents(invoice.vatAmountCents)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCents(invoice.totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        {showBankTransfer && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Payment Instructions</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Please transfer <strong>{formatCents(invoice.totalCents)}</strong> to the following bank account, referencing <strong>{invoice.invoiceNumber}</strong>:
                </p>
                <div className="mt-3 bg-white rounded-lg p-4 border border-blue-200 text-sm space-y-1">
                  <p><span className="text-gray-500">Account Holder:</span> <span className="font-medium">OfferMarket B.V.</span></p>
                  <p><span className="text-gray-500">Reference:</span> <span className="font-medium">{invoice.invoiceNumber}</span></p>
                </div>
                <p className="text-blue-600 text-xs mt-2">
                  Payment is due within {formatDate(invoice.dueDate)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {invoice.notes && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}