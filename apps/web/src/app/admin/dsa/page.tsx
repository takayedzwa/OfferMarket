"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Scale, MessageSquareWarning } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { dsaAdminApi } from "../../../lib/api";

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
  const router = useRouter();
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
      .catch((err) => setError(err?.message || "Failed to load DSA data"))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button onClick={() => router.push("/admin")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Back to Dashboard
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
                <h1 className="text-lg font-semibold text-gray-900">DSA Compliance</h1>
                <p className="text-sm text-gray-500">Content reports &amp; internal complaints</p>
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
            <h2 className="font-semibold text-gray-900">Content Reports (Art. 16)</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No content reports</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.category?.replace(/_/g, " ") || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.priority || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.targetType?.replace(/_/g, " ") || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.reporter?.email || "Anonymous"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
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
            <h2 className="font-semibold text-gray-900">Internal Complaints (Art. 20)</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complainant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No complaints</td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {c.complaintType?.replace(/_/g, " ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{c.complainant?.email || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(c.status)}`}>
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(c.submittedAt || c.createdAt || "").toLocaleString()}
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