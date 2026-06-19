"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Shield, Ban, CheckCircle, Mail, Phone, Calendar, Briefcase, DollarSign, MapPin } from "lucide-react";

interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  worker?: any;
  employer?: any;
}

interface AdminAction {
  id: string;
  action: string;
  targetUserId: string;
  reason?: string;
  details?: any;
  createdAt: string;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [suspendReason, setSuspendReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  const fetchUser = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchActions = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/audit-logs?targetUserId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setActions(data.actions || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUser();
    fetchActions();
  }, [userId]);

  const handleSuspend = () => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId || !suspendReason.trim()) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({ reason: suspendReason }),
    })
      .then((res) => {
        if (res.ok) {
          setShowSuspendModal(false);
          fetchUser();
          fetchActions();
        } else {
          alert('Failed to suspend user');
        }
      })
      .catch(() => alert('Failed to suspend user'));
  };

  const handleBan = () => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId || !banReason.trim()) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({ reason: banReason }),
    })
      .then((res) => {
        if (res.ok) {
          setShowBanModal(false);
          fetchUser();
          fetchActions();
        } else {
          alert('Failed to ban user');
        }
      })
      .catch(() => alert('Failed to ban user'));
  };

  const handleRestore = () => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/users/${userId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({ reason: 'Restored by admin' }),
    })
      .then((res) => {
        if (res.ok) {
          fetchUser();
          fetchActions();
        }
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">User not found</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      BANNED: 'bg-red-100 text-red-800',
      PENDING_VERIFICATION: 'bg-gray-100 text-gray-800',
      DELETED: 'bg-gray-100 text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/admin/users')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">User Details</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.status === 'ACTIVE' ? (
                <>
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                  >
                    Suspend User
                  </button>
                  <button
                    onClick={() => setShowBanModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Ban User
                  </button>
                </>
              ) : (
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Restore User
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-gray-900">{user.email}</div>
                  </div>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium text-gray-900">{user.phoneNumber}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Role</div>
                    <div className="font-medium text-gray-900">{user.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : user.status === 'BANNED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="font-medium text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Joined</div>
                    <div className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Last Login</div>
                      <div className="font-medium text-gray-900">{new Date(user.lastLoginAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Worker Profile */}
            {user.worker && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Worker Profile</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Full Name</div>
                    <div className="font-medium text-gray-900">{user.worker.fullName || 'Not provided'}</div>
                  </div>
                  {user.worker.trade && (
                    <div>
                      <div className="text-sm text-gray-500">Trade</div>
                      <div className="font-medium text-gray-900">{user.worker.trade}</div>
                    </div>
                  )}
                  {user.worker.experience && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Experience</div>
                        <div className="font-medium text-gray-900">{user.worker.experience} years</div>
                      </div>
                    </div>
                  )}
                  {user.worker.hourlyRate && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Hourly Rate</div>
                        <div className="font-medium text-gray-900">${user.worker.hourlyRate}/hr</div>
                      </div>
                    </div>
                  )}
                  {user.worker.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium text-gray-900">{user.worker.location}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Employer Profile */}
            {user.employer && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Employer Profile</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Company Name</div>
                    <div className="font-medium text-gray-900">{user.employer.companyName || 'Not provided'}</div>
                  </div>
                  {user.employer.website && (
                    <div>
                      <div className="text-sm text-gray-500">Website</div>
                      <div className="font-medium text-gray-900">{user.employer.website}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">Verification Status</div>
                    <div className="font-medium text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.employer.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.employer.isVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
              {actions.length === 0 ? (
                <p className="text-sm text-gray-500">No admin actions recorded</p>
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">{action.action}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(action.createdAt).toLocaleString()}
                      </div>
                      {action.reason && (
                        <div className="text-xs text-gray-600 mt-1">Reason: {action.reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspend User</h3>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter reason for suspension..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ban User</h3>
            <p className="text-sm text-gray-600 mb-4">This action is permanent and will permanently disable this user account.</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter reason for ban..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
