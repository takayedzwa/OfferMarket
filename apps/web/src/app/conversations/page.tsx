"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";
import { conversationsApi, api } from "../../lib/api";
import { Conversation, Message } from "../../lib/types";
import {
  ArrowLeft,
  Send,
  Search,
  User,
  Building2,
  MessageSquare,
  Clock,
  Check,
  Briefcase,
} from "lucide-react";

export default function ConversationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await api.get('/conversations/me');
        setConversations(response.data);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await api.post(
        `/conversations/${selectedConversation.id}/messages`,
        { content: newMessage.trim() }
      );
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");

      // Refresh conversations to update last message
      const convsResponse = await api.get('/conversations/me');
      setConversations(convsResponse.data);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    if (userRole === "WORKER") {
      return conv.employer?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.offer?.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return (
        (conv.worker?.firstName && `${conv.worker.firstName} ${conv.worker.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conv.offer?.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  });

  const getOtherParty = (conv: Conversation) => {
    if (userRole === "WORKER") {
      return {
        name: conv.employer?.companyName || "Employer",
        icon: Building2,
      };
    }
    return {
      name: conv.worker?.firstName
        ? `${conv.worker.firstName} ${conv.worker.lastName}`
        : `Worker ${conv.worker?.publicId || "?"}`,
      icon: User,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                <div className="divide-y">
                  {filteredConversations.map((conv) => {
                    const otherParty = getOtherParty(conv);
                    const Icon = otherParty.icon;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                          selectedConversation?.id === conv.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900 truncate">
                                {otherParty.name}
                              </h3>
                              {conv.lastMessageAt && (
                                <span className="text-xs text-gray-500">
                                  {new Date(conv.lastMessageAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {conv.offer && (
                              <div className="text-xs text-gray-500 truncate mb-1">
                                <Briefcase className="w-3 h-3 inline mr-1" />
                                {conv.offer.jobTitle}
                              </div>
                            )}
                            {conv.lastMessagePreview && (
                              <p className="text-sm text-gray-600 truncate">
                                {conv.lastMessagePreview}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">
                    {userRole === "EMPLOYER"
                      ? "Start a conversation when you send an offer"
                      : "Conversations will appear here when employers contact you"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {getOtherParty(selectedConversation).icon({
                      className: "w-5 h-5 text-blue-600",
                    })}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getOtherParty(selectedConversation).name}
                    </h3>
                    {selectedConversation.offer && (
                      <p className="text-sm text-gray-500">
                        Regarding: {selectedConversation.offer.jobTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => {
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">
                    Choose from your conversations to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
