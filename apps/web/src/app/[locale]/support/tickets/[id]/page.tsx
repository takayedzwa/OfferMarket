"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import {
  Ticket, Clock, AlertCircle, CheckCircle, MessageSquare,
  User, Send, MoreVertical, Shield, XCircle, Search
} from "lucide-react";
import { supportAdminApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import SupportPageHeader from "@/components/support/SupportPageHeader";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  assignedToId?: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    phoneNumber?: string;
  };
  assignedTo?: {
    email: string;
  };
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    role: string;
  };
}

const DATETIME_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("support.ticketDetail");
  const tCommon = useTranslations("support.common");
  const tEnums = useTranslations("enums");
  const { date } = useFormat();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignResults, setAssignResults] = useState<Array<{ id: string; email: string; role: string }>>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return null;
    }
    return { 'Authorization': `Bearer ${token}` };
  };

  const handleUnauthorized = (res: Response) => {
    if (res.status === 401) {
      localStorage.removeItem('accessToken');
      setError(t("sessionExpired"));
      return true;
    }
    return false;
  };

  const fetchTicket = () => {
    const headers = authHeaders();
    if (!headers) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}`, { headers })
      .then((res) => {
        if (handleUnauthorized(res)) return;
        return res.json();
      })
      .then((data) => {
        if (data) setTicket(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchMessages = () => {
    const headers = authHeaders();
    if (!headers) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/messages`, { headers })
      .then((res) => {
        if (handleUnauthorized(res)) return null;
        if (!res.ok) return { messages: [] };
        return res.json();
      })
      .then((data) => {
        if (data) setMessages(data.messages || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTicket();
    fetchMessages();
  }, [ticketId]);

  const handleReply = () => {
    if (!replyMessage.trim()) return;
    const headers = authHeaders();
    if (!headers) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: replyMessage,
        isInternal: isInternalNote,
      }),
    })
      .then((res) => {
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          setReplyMessage("");
          setIsInternalNote(false);
          fetchMessages();
          fetchTicket();
        } else {
          res.json().then((data) => alert(data.message || t("failedToSend")));
        }
      })
      .catch(() => alert(t("failedToSend")));
  };

  const handleStatusChange = (status: string) => {
    const headers = authHeaders();
    if (!headers) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, expectedUpdatedAt: ticket?.updatedAt }),
    })
      .then((res) => {
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          setShowStatusModal(false);
          fetchTicket();
        } else {
          res.json().then((data) => alert(data.message || t("failedStatus")));
        }
      })
      .catch(() => alert(t("failedStatus")));
  };

  const searchAssignees = () => {
    if (!assignSearch.trim()) return;
    setAssignLoading(true);
    setAssignError("");
    // A-L3: previously the assign modal asked for a raw UUID and fired a PATCH
    // on every keystroke. Now staff search by email/name and pick from a list
    // of real support/admin agents, and assignment only happens on click.
    supportAdminApi
      .getUsers({ search: assignSearch.trim(), limit: 50 })
      .then(({ data }) => {
        // Tickets can only be assigned to ADMIN/SUPPORT (enforced server-side
        // by S-H1), so filter the results client-side to assignable staff.
        const staff = (data.users || []).filter(
          (u: { role: string }) => u.role === 'ADMIN' || u.role === 'SUPPORT',
        );
        setAssignResults(staff);
        setAssignLoading(false);
      })
      .catch(() => {
        setAssignResults([]);
        setAssignError(t("failedSearchUsers"));
        setAssignLoading(false);
      });
  };

  const handleAssign = (supportUserId: string) => {
    const headers = authHeaders();
    if (!headers) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId: supportUserId }),
    })
      .then((res) => {
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          setShowAssignModal(false);
          setAssignSearch("");
          setAssignResults([]);
          fetchTicket();
        } else {
          alert(t("failedAssign"));
        }
      })
      .catch(() => alert(t("failedAssign")));
  };

  const handleUnassign = () => {
    const headers = authHeaders();
    if (!headers) return;

    // A-L4: clear the assignment via the dedicated DELETE endpoint instead of
    // sending { assignedToId: "" } through /assign (which 400s after S-H1 and
    // would store an empty string instead of NULL).
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/assign`, {
      method: 'DELETE',
      headers,
    })
      .then((res) => {
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          fetchTicket();
        } else {
          alert(t("failedUnassign"));
        }
      })
      .catch(() => alert(t("failedUnassign")));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push('/login')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {t("goToLogin")}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("ticketNotFound")}</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      PENDING_USER: 'bg-purple-100 text-purple-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    try {
      return tCommon(`statusLabels.${status}`);
    } catch {
      return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    try {
      return tEnums(`dsaPriority.${priority}`);
    } catch {
      return priority;
    }
  };

  const getCategoryLabel = (category: string) => {
    try {
      return tCommon(`categoryLabels.${category}`);
    } catch {
      return category;
    }
  };

  const statusOptions = [
    { value: 'OPEN', color: 'bg-blue-100 text-blue-800' },
    { value: 'IN_PROGRESS', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'PENDING_USER', color: 'bg-purple-100 text-purple-800' },
    { value: 'RESOLVED', color: 'bg-green-100 text-green-800' },
    { value: 'CLOSED', color: 'bg-gray-100 text-gray-800' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SupportPageHeader
          title={
            <span className="flex items-center gap-2">
              {ticket.ticketNumber}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                {getPriorityLabel(ticket.priority)}
              </span>
            </span>
          }
          subtitle={ticket.subject}
          backHref="/support/tickets"
          backLabel={t("backLabel")}
          actions={
            <>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                {t("changeStatus")}
              </button>
              <button
                onClick={() => ticket.assignedToId ? handleUnassign() : setShowAssignModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {ticket.assignedToId ? t("unassign") : t("assign")}
              </button>
            </>
          }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation */}
          <div className="lg:col-span-2 space-y-4">
            {/* Original Ticket */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{ticket.user?.email || tCommon("user")}</div>
                  <div className="text-xs text-gray-500">{date(ticket.createdAt, DATETIME_OPTIONS)}</div>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl border shadow-sm p-6 ${msg.isInternal ? 'border-yellow-300 bg-yellow-50' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPPORT'
                      ? 'bg-purple-100'
                      : 'bg-blue-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPPORT'
                        ? 'text-purple-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{msg.sender?.email || tCommon("user")}</div>
                      {msg.isInternal && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {t("internalNote")}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{date(msg.createdAt, DATETIME_OPTIONS)}</div>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Reply Box */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{t("yourResponse")}</div>
                  <div className="text-xs text-gray-500">{t("replyToTicket")}</div>
                </div>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={t("replyPlaceholder")}
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none mb-4"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {t("internalNoteHint")}
                  </span>
                </label>
                <button
                  onClick={handleReply}
                  disabled={!replyMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {t("sendResponse")}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t("ticketInfo")}</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500">{t("category")}</div>
                  <div className="font-medium text-gray-900">{getCategoryLabel(ticket.category)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t("status")}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t("priority")}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t("created")}</div>
                  <div className="font-medium text-gray-900">{date(ticket.createdAt, DATETIME_OPTIONS)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t("updated")}</div>
                  <div className="font-medium text-gray-900">{date(ticket.updatedAt, DATETIME_OPTIONS)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t("assignedTo")}</div>
                  <div className="font-medium text-gray-900">
                    {ticket.assignedTo?.email || <span className="text-gray-400">{tCommon("unassigned")}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{t("userInfo")}</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500">{t("email")}</div>
                  <div className="font-medium text-gray-900">{ticket.user?.email}</div>
                </div>
                {ticket.user?.phoneNumber && (
                  <div>
                    <div className="text-xs text-gray-500">{t("phone")}</div>
                    <div className="font-medium text-gray-900">{ticket.user.phoneNumber}</div>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/support/users/${ticket.userId}`)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-center"
                >
                  {t("viewUserProfile")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("statusModalTitle")}</h3>
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`w-full p-3 rounded-lg text-left font-medium ${option.color} hover:opacity-80`}
                >
                  {getStatusLabel(option.value)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("assignModal.title")}</h3>
            <p className="text-sm text-gray-600 mb-4">{t("assignModal.description")}</p>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') searchAssignees(); }}
                  placeholder={t("assignModal.searchPlaceholder")}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={searchAssignees}
                disabled={assignLoading || !assignSearch.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {assignLoading ? tCommon("searching") : t("assignModal.search")}
              </button>
            </div>

            {assignError && (
              <p className="text-sm text-red-600 mb-3">{assignError}</p>
            )}

            {assignResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y mb-4 max-h-64 overflow-y-auto">
                {assignResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssign(user.id)}
                    className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{user.email}</div>
                        <div className="text-xs text-gray-500">{user.role}</div>
                      </div>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">{t("assign")}</span>
                  </button>
                ))}
              </div>
            )}

            {assignResults.length === 0 && !assignLoading && !assignError && assignSearch.trim() && (
              <p className="text-sm text-gray-500 mb-4">{t("assignModal.noAgents")}</p>
            )}

            <button
              onClick={() => {
                setShowAssignModal(false);
                setAssignSearch("");
                setAssignResults([]);
                setAssignError("");
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}