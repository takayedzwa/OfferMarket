"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { billingApi } from "../../../../../lib/api";
import { Invoice, InvoiceStatus } from "../../../../../lib/types";
import { ArrowLeft, Check, XCircle } from "lucide-react";

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

export default function AdminInvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");

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
    if (!confirm("Are you sure you want to cancel this invoice?")) return;
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
        <p className="text-gray-600">Invoice not found</p>
      </div>
    );
  }

  const config = statusConfig[invoice.status];
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
          Back to Billing
        </button>

        {/* Invoice Header */}
        <div className="bg-white rounded-xl border shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-gray-500 mt-1">Issued {formatDate(invoice.issuedAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
              {canMarkPaid && (
                <button
                  onClick={() => setShowMarkPaid(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Mark as Paid
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Employer</p>
              <p className="font-medium text-gray-900">{invoice.employer?.companyName || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Offer</p>
              <p className="font-medium text-gray-900">{invoice.offer?.jobTitle || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
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
            {invoice.paymentMethod && (
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900 capitalize">{invoice.paymentMethod.replace("_", " ")}</p>
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

        {invoice.notes && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Mark Paid Modal */}
      {showMarkPaid && (
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleMarkPaid} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Confirm Payment
                </button>
                <button onClick={() => setShowMarkPaid(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
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