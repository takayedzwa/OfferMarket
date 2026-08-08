"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { ArrowLeft, Shield, Ban, CheckCircle, Mail, Phone, Calendar, Briefcase, DollarSign, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
  const t = useTranslations("admin-detail.userDetail");
  const params = useParams();
  const router = useRouter();
  const { currency, date } = useFormat();
  const { user: currentUser, loading: authLoading } = useAuth();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [suspendReason, setSuspendReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);

  const fetchUser = () => {
    // A-L3: centralized axios client.
    adminApi
      .getUserById(userId)
      .then(({ data }) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchActions = () => {
    // A-L6: filter the audit trail to entries for this user. The endpoint
    // accepts userId (the actor/subject) for filtering.
    adminApi
      .getAuditLogs({ userId, limit: 50 })
      .then(({ data }) => {
        setActions(data.logs || data.actions || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    // A-L4: gate the admin user detail view on the ADMIN role.
    if (authLoading) return;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken || !currentUser || currentUser.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchUser();
    fetchActions();
  }, [userId, currentUser, authLoading, router]);

  const handleSuspend = () => {
    if (!suspendReason.trim()) return;
    adminApi
      .suspendUser(userId, suspendReason)
      .then(() => {
        setShowSuspendModal(false);
        fetchUser();
        fetchActions();
      })
      .catch(() => alert(t("failedSuspend")));
  };

  const handleBan = () => {
    if (!banReason.trim()) return;
    adminApi
      .banUser(userId, banReason)
      .then(() => {
        setShowBanModal(false);
        fetchUser();
        fetchActions();
      })
      .catch(() => alert(t("failedBan")));
  };

  const handleRestore = () => {
    adminApi
      .restoreUser(userId)
      .then(() => {
        fetchUser();
        fetchActions();
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("notFound")}</div>
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
                <h1 className="text-lg font-semibold text-gray-900">{t("userDetails")}</h1>
                {(user.firstName || user.lastName) ? (
                  <p className="text-sm text-gray-700">
                    {user.firstName} {user.lastName} <span className="text-gray-400">·</span> <span className="text-gray-500">{user.email}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">{user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.status === 'ACTIVE' ? (
                <>
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                  >
                    {t("suspendUser")}
                  </button>
                  <button
                    onClick={() => setShowBanModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    {t("banUser")}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  {t("restoreUser")}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("basicInformation")}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">{t("email")}</div>
                    <div className="font-medium text-gray-900">{user.email}</div>
                  </div>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">{t("phone")}</div>
                      <div className="font-medium text-gray-900">{user.phoneNumber}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">{t("role")}</div>
                    <div className="font-medium text-gray-900">{user.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : user.status === 'BANNED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t("status")}</div>
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
                    <div className="text-sm text-gray-500">{t("joined")}</div>
                    <div className="font-medium text-gray-900">{date(user.createdAt)}</div>
                  </div>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">{t("lastLogin")}</div>
                      <div className="font-medium text-gray-900">{date(user.lastLoginAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Worker Profile */}
            {user.worker && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("workerProfile")}</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">{t("fullName")}</div>
                    <div className="font-medium text-gray-900">{user.worker.fullName || t("notProvided")}</div>
                  </div>
                  {user.worker.trade && (
                    <div>
                      <div className="text-sm text-gray-500">{t("trade")}</div>
                      <div className="font-medium text-gray-900">{user.worker.trade}</div>
                    </div>
                  )}
                  {user.worker.experience && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">{t("experience")}</div>
                        <div className="font-medium text-gray-900">{t("experienceYears", { years: user.worker.experience })}</div>
                      </div>
                    </div>
                  )}
                  {user.worker.hourlyRate && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">{t("hourlyRate")}</div>
                        <div className="font-medium text-gray-900">{t("hourlyRateValue", { rate: currency(user.worker.hourlyRate) })}</div>
                      </div>
                    </div>
                  )}
                  {user.worker.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-500">{t("location")}</div>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("employerProfile")}</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">{t("companyName")}</div>
                    <div className="font-medium text-gray-900">{user.employer.companyName || t("notProvided")}</div>
                  </div>
                  {user.employer.website && (
                    <div>
                      <div className="text-sm text-gray-500">{t("website")}</div>
                      <div className="font-medium text-gray-900">{user.employer.website}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500">{t("verificationStatus")}</div>
                    <div className="font-medium text-gray-900">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.employer.isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.employer.isVerified ? t("verified") : t("notVerified")}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("adminActions")}</h2>
              {actions.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noActions")}</p>
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900">{action.action}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {date(action.createdAt)}
                      </div>
                      {action.reason && (
                        <div className="text-xs text-gray-600 mt-1">{t("reason", { reason: action.reason })}</div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("suspendUserTitle")}</h3>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder={t("suspendPlaceholder")}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSuspend}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                {t("suspend")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("banUserTitle")}</h3>
            <p className="text-sm text-gray-600 mb-4">{t("banModalBody")}</p>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t("banPlaceholder")}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleBan}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t("banUserBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}