"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { notificationsApi } from "../lib/api";
import { useSocket } from "./useSocket";
import type {
  Notification,
  WebSocketNotificationEvent,
  WebSocketUnreadCountEvent,
} from "../lib/types";

// ============================================================================
// NOTIFICATIONS HOOK
// ============================================================================
// Provides real-time notification state to components.
// Uses WebSocket for instant delivery and falls back to polling.
// Manages: notification list, unread count, mark-as-read, and toasts.
// ============================================================================

interface UseNotificationsOptions {
  /** User ID — if null, hook is inactive */
  userId: string | null;
  /** Polling interval in ms when WebSocket is disconnected (default: 30000) */
  pollInterval?: number;
}

export function useNotifications({
  userId,
  pollInterval = 30000,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<WebSocketNotificationEvent[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch helpers
  // ---------------------------------------------------------------------------

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await notificationsApi.getNotifications({ page: 1, limit: 20 });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, [userId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [userId]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await notificationsApi.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  const dismissToast = useCallback((notificationId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== notificationId));
  }, []);

  // ---------------------------------------------------------------------------
  // WebSocket handlers
  // ---------------------------------------------------------------------------

  const handleNewNotification = useCallback(
    (data: WebSocketNotificationEvent) => {
      // Add to notifications list
      const newNotification: Notification = {
        id: data.id,
        userId: "",
        notificationType: data.type,
        category: data.category,
        title: data.title,
        body: data.body,
        actionUrl: data.actionUrl,
        isRead: false,
        readAt: null,
        deliveredAt: null,
        channelEmail: false,
        channelPush: true,
        channelSms: false,
        createdAt: data.createdAt,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast
      setToasts((prev) => [...prev, data]);

      // Auto-dismiss toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== data.id));
      }, 5000);
    },
    []
  );

  const handleUnreadCount = useCallback((data: WebSocketUnreadCountEvent) => {
    setUnreadCount(data.count);
  }, []);

  // ---------------------------------------------------------------------------
  // WebSocket connection
  // ---------------------------------------------------------------------------

  const { isConnected } = useSocket({
    userId,
    onNotification: handleNewNotification,
    onUnreadCount: handleUnreadCount,
    onConnect: () => {
      // On connect, fetch latest state
      fetchUnreadCount();
      fetchNotifications();
    },
  });

  // ---------------------------------------------------------------------------
  // Initial load + polling fallback
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    setIsLoading(true);
    Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() => {
      setIsLoading(false);
    });

    // Set up polling as fallback (and for when WebSocket is disconnected)
    pollTimerRef.current = setInterval(() => {
      if (!isConnected) {
        fetchUnreadCount();
      }
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [userId, isConnected, pollInterval, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    toasts,
    markAsRead,
    markAllAsRead,
    dismissToast,
    refresh: fetchNotifications,
  };
}