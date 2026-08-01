"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { enumsApi } from "../../../lib/api";

interface EnumOption {
  value: string;
  label: string;
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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