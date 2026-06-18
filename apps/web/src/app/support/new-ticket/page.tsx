"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ticket, Send } from "lucide-react";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    subject: "",
    description: "",
    category: "GENERAL",
    priority: "MEDIUM",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.userId.trim() || !formData.subject.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const adminUserId = localStorage.getItem('userId');

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId || '',
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.ticket?.id) {
          router.push(`/support/tickets/${data.ticket.id}`);
        } else {
          alert('Ticket created successfully');
          router.push('/support/tickets');
        }
      })
      .catch(() => {
        setLoading(false);
        alert('Failed to create ticket');
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button onClick={() => router.push('/support')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Create New Ticket</h1>
              <p className="text-sm text-gray-500">Create a support ticket on behalf of a user</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              placeholder="Enter user ID (UUID)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
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
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
              <option value="GENERAL">General Inquiry</option>
              <option value="ACCOUNT">Account Issue</option>
              <option value="BILLING">Billing/Payment</option>
              <option value="TECHNICAL">Technical Problem</option>
              <option value="REPORT">Report Content/User</option>
              <option value="FEATURE">Feature Request</option>
              <option value="OTHER">Other</option>
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
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
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
