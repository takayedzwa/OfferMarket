"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Building2, Clock, FileText, Eye } from "lucide-react";

interface PendingVerification {
  id: string;
  userId: string;
  companyName: string;
  website?: string;
  industry?: string;
  businessLicense?: string;
  taxDocument?: string;
  additionalDocuments?: string[];
  user: {
    email: string;
    phoneNumber?: string;
    createdAt: string;
  };
}

export default function AdminVerificationsPage() {
  const router = useRouter();
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"verify" | "reject">("verify");
  const [notes, setNotes] = useState("");

  const fetchPendingVerifications = () => {
    setLoading(true);
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (!accessToken || !userId || userRole !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/verification-queue`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-User-ID': userId,
        'X-User-Role': userRole,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => {
        setPendingVerifications(data.employers || []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          console.error(err);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleAction = () => {
    if (!selectedVerification) return;
    const adminUserId = localStorage.getItem('userId');
    const accessToken = localStorage.getItem('accessToken');

    if (!adminUserId || !accessToken) {
      router.push('/login');
      return;
    }

    const endpoint = actionType === "verify" ? "verify" : "reject";
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/employers/${selectedVerification.id}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({
        reason: actionType === "reject" ? (notes || 'Rejected by admin') : undefined,
        notes: actionType === "verify" ? notes : undefined,
      }),
    })
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.ok) {
          setShowModal(false);
          fetchPendingVerifications();
        } else {
          alert(`Failed to ${actionType} employer`);
        }
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          alert(`Failed to ${actionType} employer`);
        }
      });
  };

  const openModal = (verification: PendingVerification, type: "verify" | "reject") => {
    setSelectedVerification(verification);
    setActionType(type);
    setNotes("");
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Verification Queue</h1>
                <p className="text-sm text-gray-500">{pendingVerifications.length} pending verifications</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            Loading...
          </div>
        ) : pendingVerifications.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-500">No pending verifications at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingVerifications.map((verification) => (
              <div key={verification.id} className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{verification.companyName}</h3>
                      <p className="text-sm text-gray-500">{verification.user.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {verification.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      <span className="text-gray-600">Website:</span>
                      <a href={verification.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {verification.website}
                      </a>
                    </div>
                  )}
                  {verification.industry && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      <span className="text-gray-600">Industry:</span>
                      <span className="text-gray-900">{verification.industry}</span>
                    </div>
                  )}
                  {(verification.businessLicense || verification.taxDocument || verification.additionalDocuments?.length) && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Documents:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {verification.businessLicense && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            Business License
                          </span>
                        )}
                        {verification.taxDocument && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            Tax Document
                          </span>
                        )}
                        {verification.additionalDocuments?.map((_, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            Document {i + 1}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-xs text-gray-500">
                    Registered {new Date(verification.user.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/employers/${verification.id}`)}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium flex items-center gap-1"
                      title="View full company details"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => openModal(verification, "reject")}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => openModal(verification, "verify")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Action Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === "verify" ? "Verify Employer" : "Reject Employer"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {actionType === "verify"
                ? `Confirm verification for ${selectedVerification.companyName}.`
                : `Provide a reason for rejecting ${selectedVerification.companyName}.`}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={actionType === "verify" ? "Add verification notes (optional)..." : "Enter rejection reason..."}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium ${
                  actionType === "verify"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionType === "verify" ? "Verify" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
