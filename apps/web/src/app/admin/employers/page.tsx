"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, CheckCircle, XCircle, Building2, MoreVertical } from "lucide-react";

interface Employer {
  id: string;
  userId: string;
  companyName: string;
  companyTradeName?: string;
  kvkNumber?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  verificationStatus: string;
  verifiedAt?: string;
  user: {
    email: string;
    phoneNumber?: string;
    status: string;
    createdAt: string;
  };
}

export default function AdminEmployersPage() {
  const router = useRouter();
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const getVerificationStatus = (status: string) => {
    return status === 'BASIC_VERIFIED' || status === 'FULL_VERIFIED';
  };

  const fetchEmployers = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...(search && { search }),
      ...(verificationFilter && { verificationStatus: verificationFilter }),
    });

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/employers?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployers(data.employers || []);
        setTotal(data.pagination?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEmployers();
  }, [page, verificationFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchEmployers();
  };

  const handleVerify = (employerId: string) => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/employers/${employerId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => {
        if (res.ok) {
          fetchEmployers();
        } else {
          alert('Failed to verify employer');
        }
      })
      .catch(() => alert('Failed to verify employer'));
  };

  const handleReject = (employerId: string) => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/employers/${employerId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({ reason: 'Rejected by admin' }),
    })
      .then((res) => {
        if (res.ok) {
          fetchEmployers();
        } else {
          alert('Failed to reject employer');
        }
      })
      .catch(() => alert('Failed to reject employer'));
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
                <h1 className="text-lg font-semibold text-gray-900">Employer Management</h1>
                <p className="text-sm text-gray-500">{total} employers total</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by company name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              <option value="">All Verification Status</option>
              <option value="PENDING">Pending</option>
              <option value="BASIC_VERIFIED">Verified</option>
              <option value="FULL_VERIFIED">Fully Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Employers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12 text-gray-500">
              Loading...
            </div>
          ) : employers.length === 0 ? (
            <div className="col-span-full flex items-center justify-center py-12 text-gray-500">
              No employers found
            </div>
          ) : (
            employers.map((employer) => (
              <div key={employer.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employer.companyName}</h3>
                      <p className="text-xs text-gray-500">{employer.user.email}</p>
                    </div>
                  </div>
                  {getVerificationStatus(employer.verificationStatus) ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  ) : employer.verificationStatus === 'REJECTED' ? (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Rejected
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Pending
                    </span>
                  )}
                </div>

                {employer.website && (
                  <p className="text-sm text-gray-600 mb-2 truncate">{employer.website}</p>
                )}
                {employer.industry && (
                  <p className="text-sm text-gray-600 mb-2">{employer.industry}</p>
                )}
                {employer.companySize && (
                  <p className="text-sm text-gray-600 mb-3">Size: {employer.companySize}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    Joined {new Date(employer.user.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    {!getVerificationStatus(employer.verificationStatus) && employer.verificationStatus !== 'REJECTED' && (
                      <>
                        <button
                          onClick={() => handleVerify(employer.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Verify"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(employer.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => router.push(`/admin/employers/${employer.id}`)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      title="View details"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
