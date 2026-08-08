"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { User, Mail, Phone, Calendar, Ticket, Briefcase, Building2, CheckCircle, XCircle, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import SupportPageHeader from "@/components/support/SupportPageHeader";

interface UserProfile {
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

interface UserTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function SupportUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("support.userDetail");
  const tCommon = useTranslations("support.common");
  const tEnums = useTranslations("enums");
  const { currency, date } = useFormat();
  const userId = params.id as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "tickets">("profile");

  const fetchUser = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchTickets = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/users/${userId}/tickets`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTickets(data.tickets || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUser();
    fetchTickets();
  }, [userId]);

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
        <div className="text-gray-500">{t("userNotFound")}</div>
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

  const getTicketStatusColor = (status: string) => {
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

  const getUserStatusLabel = (status: string) => {
    try {
      return tCommon(`userStatusLabels.${status}`);
    } catch {
      return status;
    }
  };

  const getTicketStatusLabel = (status: string) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SupportPageHeader
          title={t("title")}
          subtitle={user.email}
          backHref="/support/users"
          backLabel={t("backLabel")}
        />
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "profile"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t("tabProfile")}
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "tickets"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t("tabTickets", { count: tickets.length })}
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("basicInfo")}</h2>
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
                    <User className="w-5 h-5 text-gray-400" />
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
                          {getUserStatusLabel(user.status)}
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
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">{t("workerProfile")}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <div className="text-sm text-gray-500">{t("experience")}</div>
                        <div className="font-medium text-gray-900">{t("experienceYears", { count: user.worker.experience })}</div>
                      </div>
                    )}
                    {user.worker.hourlyRate && (
                      <div>
                        <div className="text-sm text-gray-500">{t("hourlyRate")}</div>
                        <div className="font-medium text-gray-900">{currency(Number(user.worker.hourlyRate))} {t("perHour")}</div>
                      </div>
                    )}
                    {user.worker.location && (
                      <div>
                        <div className="text-sm text-gray-500">{t("location")}</div>
                        <div className="font-medium text-gray-900">{user.worker.location}</div>
                      </div>
                    )}
                    {user.worker.availability && (
                      <div>
                        <div className="text-sm text-gray-500">{t("availability")}</div>
                        <div className="font-medium text-gray-900">{user.worker.availability}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Employer Profile */}
              {user.employer && (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-6 h-6 text-orange-600" />
                    <h2 className="text-lg font-semibold text-gray-900">{t("employerProfile")}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                    {user.employer.industry && (
                      <div>
                        <div className="text-sm text-gray-500">{t("industry")}</div>
                        <div className="font-medium text-gray-900">{user.employer.industry}</div>
                      </div>
                    )}
                    {user.employer.companySize && (
                      <div>
                        <div className="text-sm text-gray-500">{t("companySize")}</div>
                        <div className="font-medium text-gray-900">{user.employer.companySize}</div>
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

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">{t("ticketSummary")}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{t("totalTickets")}</span>
                    <span className="font-medium text-gray-900">{tickets.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{t("open")}</span>
                    <span className="font-medium text-blue-600">{tickets.filter(tk => tk.status === 'OPEN').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{t("inProgress")}</span>
                    <span className="font-medium text-yellow-600">{tickets.filter(tk => tk.status === 'IN_PROGRESS').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{t("resolved")}</span>
                    <span className="font-medium text-green-600">{tickets.filter(tk => tk.status === 'RESOLVED').length}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("tickets")}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                {t("viewAllTickets")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{t("ticketHistory")}</h2>
            </div>
            {tickets.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p>{t("noTickets")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/support/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-600">{ticket.ticketNumber}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTicketStatusColor(ticket.status)}`}>
                            {getTicketStatusLabel(ticket.status)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {getPriorityLabel(ticket.priority)}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{t("created")}</div>
                        <div className="font-medium text-gray-900">{date(ticket.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}