"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Ticket, Clock, AlertCircle, CheckCircle, MessageSquare,
  User, Send, MoreVertical, Shield, XCircle
} from "lucide-react";

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
  userId: string;
  message: string;
  isInternalNote: boolean;
  attachments?: string[];
  createdAt: string;
  user?: {
    email: string;
    role: string;
  };
}

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const fetchTicket = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setTicket(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchMessages = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/messages`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchTicket();
    fetchMessages();
  }, [ticketId]);

  const handleReply = () => {
    if (!replyMessage.trim()) return;
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
      body: JSON.stringify({
        message: replyMessage,
        isInternalNote,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setReplyMessage("");
          setIsInternalNote(false);
          fetchMessages();
          fetchTicket();
        } else {
          alert('Failed to send message');
        }
      })
      .catch(() => alert('Failed to send message'));
  };

  const handleStatusChange = (status: string) => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
      body: JSON.stringify({ status }),
    })
      .then((res) => {
        if (res.ok) {
          setShowStatusModal(false);
          fetchTicket();
        } else {
          alert('Failed to update status');
        }
      })
      .catch(() => alert('Failed to update status'));
  };

  const handleAssign = (supportUserId: string) => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/${ticketId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
      body: JSON.stringify({ assignedToId: supportUserId }),
    })
      .then((res) => {
        if (res.ok) {
          setShowAssignModal(false);
          fetchTicket();
        } else {
          alert('Failed to assign ticket');
        }
      })
      .catch(() => alert('Failed to assign ticket'));
  };

  const handleUnassign = () => {
    handleAssign("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Ticket not found</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/support/tickets')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900">{ticket.ticketNumber}</h1>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{ticket.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Change Status
              </button>
              <button
                onClick={() => ticket.assignedToId ? handleUnassign() : setShowAssignModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                {ticket.assignedToId ? 'Unassign' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <div className="font-medium text-gray-900">{ticket.user?.email || 'User'}</div>
                  <div className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</div>
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
                className={`bg-white rounded-xl border shadow-sm p-6 ${msg.isInternalNote ? 'border-yellow-300 bg-yellow-50' : ''}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    msg.user?.role === 'ADMIN' || msg.user?.role === 'SUPPORT'
                      ? 'bg-purple-100'
                      : 'bg-blue-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      msg.user?.role === 'ADMIN' || msg.user?.role === 'SUPPORT'
                        ? 'text-purple-600'
                        : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{msg.user?.email || 'User'}</div>
                      {msg.isInternalNote && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Internal Note
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-900 whitespace-pre-wrap">{msg.message}</p>
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
                  <div className="font-medium text-gray-900">Your Response</div>
                  <div className="text-xs text-gray-500">Reply to this ticket</div>
                </div>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response..."
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
                    Internal Note (user cannot see)
                  </span>
                </label>
                <button
                  onClick={handleReply}
                  disabled={!replyMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Response
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Ticket Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500">Category</div>
                  <div className="font-medium text-gray-900">{ticket.category}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Priority</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="font-medium text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Updated</div>
                  <div className="font-medium text-gray-900">{new Date(ticket.updatedAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Assigned To</div>
                  <div className="font-medium text-gray-900">
                    {ticket.assignedTo?.email || <span className="text-gray-400">Unassigned</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">{ticket.user?.email}</div>
                </div>
                {ticket.user?.phoneNumber && (
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-medium text-gray-900">{ticket.user.phoneNumber}</div>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/support/users/${ticket.userId}`)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-center"
                >
                  View User Profile
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Status</h3>
            <div className="space-y-2">
              {[
                { value: 'OPEN', label: 'Open', color: 'bg-blue-100 text-blue-800' },
                { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
                { value: 'PENDING_USER', label: 'Pending User', color: 'bg-purple-100 text-purple-800' },
                { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' },
                { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`w-full p-3 rounded-lg text-left font-medium ${option.color} hover:opacity-80`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Ticket</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the support user ID to assign this ticket to:</p>
            <input
              type="text"
              placeholder="Support user ID..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none mb-4"
              onChange={(e) => handleAssign(e.target.value)}
            />
            <button
              onClick={() => setShowAssignModal(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
