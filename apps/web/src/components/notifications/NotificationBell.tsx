"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useFormat } from "../../hooks/useFormat";
import type { Notification, WebSocketNotificationEvent } from "../../lib/types";

// ============================================================================
// NOTIFICATION BELL COMPONENT
// ============================================================================
// Renders a bell icon with unread badge in the navbar.
// Dropdown shows recent notifications with mark-as-read actions.
//
// i18n: title/body are rendered client-side from `notificationType` + the
// `actionData` interpolation params pushed by the backend (Notification.
// actionData), so a notification displays in the VIEWER's current locale —
// not the locale it was created in. The English `title`/`body` stored on the
// row are kept as a fallback for older notifications that have no actionData
// and for any catalog key that fails to resolve.
// ============================================================================

interface NotificationBellProps {
  userId: string | null;
}

/** Minimal shape shared by persisted notifications and live toast events. */
interface LocalizableNotification {
  type: string;
  title: string;
  body: string;
  actionData?: Record<string, unknown> | null;
}

function getCategoryIcon(category: string | null) {
  switch (category) {
    case "offer":
      return "💼";
    case "message":
      return "💬";
    case "billing":
      return "💳";
    default:
      return "🔔";
  }
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const t = useTranslations("notifications");
  const { date: formatDate } = useFormat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    toasts,
    dismissToast,
  } = useNotifications({ userId });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  // -------------------------------------------------------------------------
  // Localized rendering helpers
  // -------------------------------------------------------------------------

  /**
   * Resolve the localized title for a notification. Falls back to the English
   * `title` stored on the row if the catalog key is missing or fails to render
   * (e.g. an old notification with no actionData for a templated message).
   */
  const renderTitle = (n: LocalizableNotification): string => {
    const params = (n.actionData ?? {}) as Record<string, unknown>;
    try {
      // support_offer_extended has distinct templates depending on whether a
      // job title is present (actionData.jobTitle is "" when absent).
      if (n.type === "support_offer_extended" && params.jobTitle) {
        return t("support_offer_extended.title_with_job", params as Record<string, string | number | Date>);
      }
      return t(`${n.type}.title`, params as Record<string, string | number | Date>);
    } catch {
      return n.title;
    }
  };

  /**
   * Resolve the localized body. offer_rejected / offer_withdrawn carry a
   * free-form user `reason` — when present it is shown verbatim (it is
   * user-generated, not translatable); otherwise the translated default
   * sentence is used. support_offer_extended again has job/no-job variants.
   */
  const renderBody = (n: LocalizableNotification): string => {
    const params = (n.actionData ?? {}) as Record<string, unknown>;
    try {
      if (
        (n.type === "offer_rejected" || n.type === "offer_withdrawn") &&
        typeof params.reason === "string" &&
        params.reason
      ) {
        return params.reason;
      }
      if (n.type === "support_offer_extended" && params.jobTitle) {
        return t("support_offer_extended.body_with_job", params as Record<string, string | number | Date>);
      }
      return t(`${n.type}.body`, params as Record<string, string | number | Date>);
    } catch {
      return n.body;
    }
  };

  /** Relative "time ago" label, localized via the notifications catalog. */
  const getTimeAgo = (dateStr: string): string => {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("timeAgo.justNow");
    if (diffMins < 60) return t("timeAgo.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("timeAgo.hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("timeAgo.daysAgo", { count: diffDays });
    // Older than a week: show the absolute date in the active locale.
    return formatDate(d, { day: "numeric", month: "short" });
  };

  const ariaLabel =
    unreadCount > 0
      ? t("ui.ariaLabelUnread", { count: unreadCount })
      : t("ui.ariaLabel");

  return (
    <>
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast: WebSocketNotificationEvent) => (
          <div
            key={toast.id}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-slide-in-right flex items-start gap-3"
          >
            <span className="text-lg flex-shrink-0">
              {getCategoryIcon(toast.category)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {renderTitle({
                  type: toast.type,
                  title: toast.title,
                  body: toast.body,
                  actionData: toast.actionData,
                })}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {renderBody({
                  type: toast.type,
                  title: toast.title,
                  body: toast.body,
                  actionData: toast.actionData,
                })}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Bell icon with badge */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={ariaLabel}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{t("ui.title")}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t("ui.markAllRead")}
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1">
              {isLoading && notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  {t("ui.loading")}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  {t("ui.empty")}
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                      !notification.isRead ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getCategoryIcon(notification.category)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm ${
                              !notification.isRead
                                ? "font-semibold text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {renderTitle({
                              type: notification.notificationType,
                              title: notification.title,
                              body: notification.body,
                              actionData: notification.actionData,
                            })}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {renderBody({
                            type: notification.notificationType,
                            title: notification.title,
                            body: notification.body,
                            actionData: notification.actionData,
                          })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}