"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Calendar, Ticket, Briefcase, Building2, CheckCircle, XCircle, Clock } from "lucide-react";

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
  const userId = params.id as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "tickets">("profile");

  const fetchUser = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': localStorage.getItem('userRole') || '',
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
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': localStorage.getItem('userRole') || '',
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/support/users')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">User Profile</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === "tickets"
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Tickets ({tickets.length})
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="lg:col-span-2 space-y-6">
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
                    <User className="w-5 h-5 text-gray-400" />
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
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Worker Profile</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <div className="text-sm text-gray-500">Experience</div>
                        <div className="font-medium text-gray-900">{user.worker.experience} years</div>
                      </div>
                    )}
                    {user.worker.hourlyRate && (
                      <div>
                        <div className="text-sm text-gray-500">Hourly Rate</div>
                        <div className="font-medium text-gray-900">${user.worker.hourlyRate}/hr</div>
                      </div>
                    )}
                    {user.worker.location && (
                      <div>
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium text-gray-900">{user.worker.location}</div>
                      </div>
                    )}
                    {user.worker.availability && (
                      <div>
                        <div className="text-sm text-gray-500">Availability</div>
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
                    <h2 className="text-lg font-semibold text-gray-900">Employer Profile</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                    {user.employer.industry && (
                      <div>
                        <div className="text-sm text-gray-500">Industry</div>
                        <div className="font-medium text-gray-900">{user.employer.industry}</div>
                      </div>
                    )}
                    {user.employer.companySize && (
                      <div>
                        <div className="text-sm text-gray-500">Company Size</div>
                        <div className="font-medium text-gray-900">{user.employer.companySize}</div>
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

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Ticket Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total Tickets</span>
                    <span className="font-medium text-gray-900">{tickets.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Open</span>
                    <span className="font-medium text-blue-600">{tickets.filter(t => t.status === 'OPEN').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">In Progress</span>
                    <span className="font-medium text-yellow-600">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Resolved</span>
                    <span className="font-medium text-green-600">{tickets.filter(t => t.status === 'RESOLVED').length}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("tickets")}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                View All Tickets
              </button>
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Ticket History</h2>
            </div>
            {tickets.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p>No tickets found for this user</p>
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
                            {ticket.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Created</div>
                        <div className="font-medium text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</div>
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
