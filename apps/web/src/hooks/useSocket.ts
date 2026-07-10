"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";

// ============================================================================
// SOCKET.IO CLIENT HOOK
// ============================================================================
// Manages the WebSocket connection to the notifications gateway.
// Auto-connects when a userId is available, reconnects on auth change.
// Falls back to polling if WebSocket is unavailable.
// ============================================================================

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:3001";

interface UseSocketOptions {
  userId: string | null;
  onNotification?: (data: any) => void;
  onUnreadCount?: (data: { count: number }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket({
  userId,
  onNotification,
  onUnreadCount,
  onConnect,
  onDisconnect,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef({ onNotification, onUnreadCount, onConnect, onDisconnect });

  // Keep callbacks ref fresh without re-connecting
  useEffect(() => {
    callbacksRef.current = { onNotification, onUnreadCount, onConnect, onDisconnect };
  }, [onNotification, onUnreadCount, onConnect, onDisconnect]);

  useEffect(() => {
    // Don't connect without a userId
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Already connected with the same userId
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      callbacksRef.current.onConnect?.();
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      callbacksRef.current.onDisconnect?.();
    });

    socket.on("notification:new", (data) => {
      callbacksRef.current.onNotification?.(data);
    });

    socket.on("notification:unread_count", (data) => {
      callbacksRef.current.onUnreadCount?.(data);
    });

    socket.on("notification:connected", (data) => {
      // Connected — fetch initial unread count
      callbacksRef.current.onConnect?.();
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [userId]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  return { isConnected, disconnect };
}