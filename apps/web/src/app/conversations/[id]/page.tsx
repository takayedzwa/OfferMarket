"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import Navbar from "../../../components/Navbar";
import NotificationBell from "../../../components/notifications/NotificationBell";
import { conversationsApi, api } from "../../../lib/api";
import { Conversation, Message } from "../../../lib/types";
import {
  ArrowLeft,
  Send,
  User,
  Building2,
  MessageSquare,
  Clock,
  Check,
  Briefcase,
} from "lucide-react";

// ============================================================================
// INDIVIDUAL CONVERSATION PAGE
// ============================================================================
// Accessible via /conversations/[id] — used by notification deep links
// Redirects to the conversations page with the conversation pre-selected.
// ============================================================================

export default function ConversationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole: string | null = user?.role ?? null;

  useEffect(() => {
    async function loadConversation() {
      // SECURITY: identity comes from AuthContext (JWT via /auth/me), not
      // localStorage. The login page stores only tokens.
      if (authLoading) return;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get(`/conversations/${conversationId}`);
        setConversation(response.data);

        // Also fetch messages
        const messagesResponse = await api.get(
          `/conversations/${conversationId}/messages`
        );
        setMessages(messagesResponse.data || []);
      } catch (err: any) {
        console.error("Failed to load conversation:", err);
        if (err.response?.status === 404 || err.response?.status === 403) {
          setError("Conversation not found or you don't have access.");
        } else {
          setError("Failed to load conversation. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (conversationId) {
      loadConversation();
    }
  }, [conversationId, router, user, authLoading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    setSending(true);
    try {
      const response = await api.post(
        `/conversations/${conversation.id}/messages`,
        { content: newMessage.trim() }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const getOtherParty = () => {
    if (!conversation) return { name: "Unknown", icon: User };

    // participant1 is the worker, participant2 is the employer
    if (userRole === "WORKER") {
      return {
        name: conversation.employer?.companyName || "Employer",
        icon: Building2,
      };
    }
    return {
      name: conversation.worker?.firstName
        ? `${conversation.worker.firstName} ${conversation.worker.lastName}`
        : `Worker`,
      icon: User,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-gray-500">Loading conversation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">{error}</p>
            <button
              onClick={() => router.push("/conversations")}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Back to conversations
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  const otherParty = getOtherParty();
  const OtherIcon = otherParty.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3">
            <button
              onClick={() => router.push("/conversations")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <OtherIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{otherParty.name}</h3>
              {conversation.offer && (
                <p className="text-sm text-gray-500">
                  Regarding: {conversation.offer.jobTitle}
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isOwn
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={`flex items-center gap-2 mt-1 text-xs ${
                        isOwn ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {new Date(msg.createdAt).toLocaleString()}
                      {isOwn && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 border-t flex items-center gap-3"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}