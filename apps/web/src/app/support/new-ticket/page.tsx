"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Search, X } from "lucide-react";
import { enumsApi, supportAdminApi } from "../../../lib/api";
import Navbar from "../../../components/Navbar";
import SupportPageHeader from "../../../components/support/SupportPageHeader";

interface EnumOption {
  value: string;
  label: string;
}

interface SearchUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  status: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<EnumOption[]>([]);
  const [priorities, setPriorities] = useState<EnumOption[]>([]);
  const [formData, setFormData] = useState({
    userId: "",
    subject: "",
    description: "",
    category: "",
    priority: "MEDIUM",
  });

  // Searchable user picker state. Staff search by email/name/phone, pick a
  // user from the dropdown, and the selected user's id becomes formData.userId.
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  useEffect(() => {
    Promise.all([
      enumsApi.getTicketCategory().then((res) => setCategories(res.data)),
      enumsApi.getTicketPriority().then((res) => setPriorities(res.data)),
    ]).catch(() => {
      // Fallback enums if API is unavailable
      setCategories([
        { value: "GENERAL", label: "General Inquiry" },
        { value: "ACCOUNT", label: "Account Issue" },
        { value: "BILLING", label: "Billing / Payment" },
        { value: "TECHNICAL", label: "Technical Problem" },
        { value: "REPORT", label: "Report Content / User" },
        { value: "FEATURE", label: "Feature Request" },
        { value: "OTHER", label: "Other" },
      ]);
      setPriorities([
        { value: "LOW", label: "Low" },
        { value: "MEDIUM", label: "Medium" },
        { value: "HIGH", label: "High" },
        { value: "URGENT", label: "Urgent" },
      ]);
    });
  }, []);

  // Set default category once loaded
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData((prev) => ({ ...prev, category: categories[0].value }));
    }
  }, [categories]);

  // Debounced user search for the picker. Skips while a user is selected.
  useEffect(() => {
    if (selectedUser) return;
    const q = userQuery.trim();
    if (q.length < 2) {
      setUserResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      supportAdminApi
        .getUsers({ search: q, limit: 10 })
        .then(({ data }) => {
          setUserResults(data.users || []);
          setShowDropdown(true);
        })
        .catch(() => setUserResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery, selectedUser]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectUser = (u: SearchUser) => {
    setSelectedUser(u);
    setFormData((prev) => ({ ...prev, userId: u.id }));
    setUserQuery("");
    setUserResults([]);
    setShowDropdown(false);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setFormData((prev) => ({ ...prev, userId: "" }));
  };

  const handleSubmit = async () => {
    if (!formData.userId.trim() || !formData.subject.trim() || !formData.description.trim() || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets/on-behalf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // NestJS ValidationPipe returns message as an array; surface a clear error
        // instead of silently treating the failed response as success.
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || data.error || 'Failed to create ticket';
        throw new Error(msg);
      }

      const id = data.ticket?.id || data.id;
      if (id) {
        router.push(`/support/tickets/${id}`);
      } else {
        router.push('/support/tickets');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SupportPageHeader
          title="Create New Ticket"
          subtitle="Create a support ticket on behalf of a user"
          backHref="/support"
          backLabel="Back to support dashboard"
        />
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
          {/* User picker (search by email / name / phone, select to set userId) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User <span className="text-red-500">*</span>
            </label>
            {selectedUser ? (
              <div className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">
                    {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(" ") || selectedUser.email}
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedUser.email} • {selectedUser.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedUser}
                  className="p-1 hover:bg-gray-200 rounded-lg"
                  aria-label="Change user"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onFocus={() => userResults.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search by email, name, or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Searching...</span>
                )}
                {showDropdown && userResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                    {userResults.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectUser(u)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                            </span>
                            <span className="text-xs text-gray-500">{u.email}</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{u.role}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && !searching && userResults.length === 0 && userQuery.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">The user this ticket is for</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Brief summary of the issue"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              {priorities.map((pri) => (
                <option key={pri.value} value={pri.value}>{pri.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Detailed description of the issue or inquiry..."
              className="w-full h-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => router.push('/support')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}