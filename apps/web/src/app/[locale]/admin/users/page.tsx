"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { ArrowLeft, Search, Shield, Ban, CheckCircle, XCircle, MoreVertical, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  worker?: any;
  employer?: any;
}

export default function AdminUsersPage() {
  const t = useTranslations("admin-list.users");
  const router = useRouter();
  const { date } = useFormat();
  const { user: currentUser, loading: authLoading } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add Staff User modal state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<"ADMIN" | "SUPPORT">("SUPPORT");
  const [staffFirstName, setStaffFirstName] = useState("");
  const [staffLastName, setStaffLastName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffError, setStaffError] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    // A-L3: use the centralized axios client instead of raw fetch() — the
    // JWT header and 401/refresh handling live in the api instance.
    adminApi
      .getUsers({
        page,
        limit: 20,
        ...(search ? { search } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      .then(({ data }) => {
        setUsers(data.users || []);
        setTotal(data.pagination?.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // A-L4: gate the admin users view on the ADMIN role. Wait for auth to
    // resolve, then redirect non-admins (and unauthenticated users) away
    // rather than relying on a backend 401 to hide the data.
    if (authLoading) return;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken || !currentUser || currentUser.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, [page, roleFilter, statusFilter, currentUser, authLoading, router]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const openStaffModal = () => {
    setStaffEmail("");
    setStaffPassword("");
    setStaffRole("SUPPORT");
    setStaffFirstName("");
    setStaffLastName("");
    setStaffPhone("");
    setStaffError("");
    setShowStaffModal(true);
  };

  const handleCreateStaff = async () => {
    setStaffError("");
    if (!staffEmail.trim() || !staffPassword || !staffFirstName.trim() || !staffLastName.trim()) return;
    setStaffSubmitting(true);
    try {
      await adminApi.createStaffUser({
        email: staffEmail.trim(),
        password: staffPassword,
        role: staffRole,
        firstName: staffFirstName.trim(),
        lastName: staffLastName.trim(),
        ...(staffPhone.trim() ? { phone: staffPhone.trim() } : {}),
      });
      setShowStaffModal(false);
      fetchUsers();
    } catch (err: any) {
      // Backend returns a user-friendly message (e.g. "Email already
      // registered", "password too common", "Phone number already in use").
      // Fall back to a generic error.
      setStaffError(err?.response?.data?.message || t("staffErrorFallback"));
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleAction = (user: User, action: string) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    // A-L3: route through the centralized adminApi helpers.
    const request =
      action === 'suspend'
        ? adminApi.suspendUser(user.id, 'Admin action')
        : action === 'ban'
          ? adminApi.banUser(user.id, 'Admin action')
          : adminApi.restoreUser(user.id);

    request
      .then(() => fetchUsers())
      .catch(() => alert(t("actionFailed")));
  };

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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      SUPPORT: 'bg-blue-100 text-blue-800',
      WORKER: 'bg-green-100 text-green-800',
      EMPLOYER: 'bg-orange-100 text-orange-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
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
                <h1 className="text-lg font-semibold text-gray-900">{t("title")}</h1>
                <p className="text-sm text-gray-500">{t("totalUsers", { total })}</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={openStaffModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
                {t("addStaffUser")}
              </button>
            )}
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
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              <option value="">{t("filter.allRoles")}</option>
              <option value="WORKER">{t("filter.WORKER")}</option>
              <option value="EMPLOYER">{t("filter.EMPLOYER")}</option>
              <option value="ADMIN">{t("filter.ADMIN")}</option>
              <option value="SUPPORT">{t("filter.SUPPORT")}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              <option value="">{t("filter.allStatuses")}</option>
              <option value="ACTIVE">{t("filter.ACTIVE")}</option>
              <option value="SUSPENDED">{t("filter.SUSPENDED")}</option>
              <option value="BANNED">{t("filter.BANNED")}</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t("search")}
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.user")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.role")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.status")}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.joined")}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t("loading")}</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t("empty")}</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        {(user.firstName || user.lastName) && (
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                        )}
                        <div className={`${(user.firstName || user.lastName) ? "text-xs" : "text-sm font-medium"} text-gray-700`}>{user.email}</div>
                        <div className="text-xs text-gray-500">{t("idPrefix", { id: user.id.slice(0, 8) })}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {date(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => handleAction(user, 'suspend')}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                              title={t("action.suspend")}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(user, 'ban')}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title={t("action.ban")}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                          <button
                            onClick={() => handleAction(user, 'restore')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title={t("action.restore")}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title={t("action.viewDetails")}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("previous")}
          </button>
          <span className="text-sm text-gray-600">{t("page", { page })}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("next")}
          </button>
        </div>
      </main>

      {/* Add Staff User modal (ADMIN only) */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t("staffModal.title")}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {t("staffModal.body")}
            </p>

            {staffError && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {staffError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("staffModal.firstName")}</label>
                  <input
                    type="text"
                    value={staffFirstName}
                    onChange={(e) => setStaffFirstName(e.target.value)}
                    placeholder={t("staffModal.placeholderFirstName")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("staffModal.lastName")}</label>
                  <input
                    type="text"
                    value={staffLastName}
                    onChange={(e) => setStaffLastName(e.target.value)}
                    placeholder={t("staffModal.placeholderLastName")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("staffModal.email")}</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder={t("staffModal.placeholderEmail")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("staffModal.phoneOptional")}</label>
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder={t("staffModal.placeholderPhone")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("staffModal.password")}</label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder={t("staffModal.placeholderPassword")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("staffModal.role")}</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as "ADMIN" | "SUPPORT")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="SUPPORT">{t("staffModal.roleSupport")}</option>
                  <option value="ADMIN">{t("staffModal.roleAdmin")}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStaffModal(false)}
                disabled={staffSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t("staffModal.cancel")}
              </button>
              <button
                onClick={handleCreateStaff}
                disabled={staffSubmitting || !staffEmail.trim() || !staffPassword || !staffFirstName.trim() || !staffLastName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {staffSubmitting ? t("staffModal.creating") : t("staffModal.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}