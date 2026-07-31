"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LifeBuoy, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { privacyAdminApi } from "../../../lib/api";

interface DataSubjectRequest {
  id: string;
  requestType: string;
  status: string;
  user?: { id: string; email: string };
  dueDate?: string;
  createdAt: string;
  adminNotes?: string;
}

interface DataBreach {
  id: string;
  title: string;
  severity: string;
  status: string;
  affectedDataCategories?: string[];
  discoveredAt: string;
}

export default function AdminPrivacyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [breaches, setBreaches] = useState<DataBreach[]>([]);
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
      privacyAdminApi.getRequests({ page: 1, limit: 20 }),
      privacyAdminApi.getBreaches({ page: 1, limit: 20 }),
    ])
      .then(([reqs, brchs]) => {
        setRequests(reqs.data.requests || []);
        setBreaches(brchs.data.breaches || []);
      })
      .catch((err) => setError(err?.message || "Failed to load privacy data"))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      CRITICAL: "bg-red-100 text-red-800",
    };
    return colors[severity] || "bg-gray-100 text-gray-800";
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
                <h1 className="text-lg font-semibold text-gray-900">GDPR / Privacy</h1>
                <p className="text-sm text-gray-500">Data subject requests &amp; breach notifications</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Data Subject Requests */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Data Subject Requests</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No data subject requests</td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.requestType.replace(/_/g, " ")}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{r.user?.email || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(r.status)}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Data Breach Notifications */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Data Breach Notifications</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {breaches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No breach notifications</td>
                </tr>
              ) : (
                breaches.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(b.severity)}`}>
                        {b.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {b.affectedDataCategories?.join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.discoveredAt).toLocaleDateString()}</td>
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