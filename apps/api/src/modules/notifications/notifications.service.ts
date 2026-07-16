import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  NotificationEventType,
  OfferReceivedPayload,
  OfferAcceptedPayload,
  OfferAcceptedConfirmationPayload,
  OfferRejectedPayload,
  OfferCounteredPayload,
  OfferWithdrawnPayload,
  OfferExpiringPayload,
  MessageReceivedPayload,
  InvoiceCreatedPayload,
  InvoiceOverduePayload,
  BreachNotificationPayload,
} from './notification.types';

// ============================================================================
// NOTIFICATIONS SERVICE
// ============================================================================
// Central service for creating and delivering notifications.
// Listens to domain events emitted by other services and handles:
//   1. Persisting to the Notification table
//   2. Pushing via WebSocket in real-time
//   3. Marking channel delivery status
// ============================================================================

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly gateway: NotificationsGateway,
  ) {
    this.registerEventListeners();
  }

  // ============================================================================
  // EVENT REGISTRATION
  // ============================================================================

  private registerEventListeners() {
    this.eventEmitter.on(NotificationEventType.OFFER_RECEIVED, this.handleOfferReceived.bind(this));
    this.eventEmitter.on(NotificationEventType.OFFER_ACCEPTED, this.handleOfferAccepted.bind(this));
    this.eventEmitter.on(NotificationEventType.OFFER_ACCEPTED_CONFIRMATION, this.handleOfferAcceptedConfirmation.bind(this));
    this.eventEmitter.on(NotificationEventType.OFFER_REJECTED, this.handleOfferRejected.bind(this));
    this.eventEmitter.on(NotificationEventType.OFFER_COUNTERED, this.handleOfferCountered.bind(this));
    this.eventEmitter.on(NotificationEventType.OFFER_WITHDRAWN, this.handleOfferWithdrawn.bind(this));
    this.eventEmitter.on(NotificationEventType.OFFER_EXPIRING, this.handleOfferExpiring.bind(this));
    this.eventEmitter.on(NotificationEventType.MESSAGE_RECEIVED, this.handleMessageReceived.bind(this));
    this.eventEmitter.on(NotificationEventType.INVOICE_CREATED, this.handleInvoiceCreated.bind(this));
    this.eventEmitter.on(NotificationEventType.INVOICE_OVERDUE, this.handleInvoiceOverdue.bind(this));
    this.eventEmitter.on(NotificationEventType.BREACH_NOTIFICATION, this.handleBreachNotification.bind(this));
  }

  // ============================================================================
  // OFFER EVENT HANDLERS
  // ============================================================================

  private async handleOfferReceived(payload: OfferReceivedPayload) {
    await this.createAndDeliver({
      userId: payload.workerUserId,
      notificationType: 'offer_received',
      category: 'offer',
      title: 'New offer received!',
      body: `${payload.employerCompanyName} has sent you an offer for ${payload.jobTitle}`,
      actionUrl: `/offers/${payload.offerId}`,
      channelEmail: true,
      channelPush: true,
    });
  }

  private async handleOfferAccepted(payload: OfferAcceptedPayload) {
    await this.createAndDeliver({
      userId: payload.employerUserId,
      notificationType: 'offer_accepted',
      category: 'offer',
      title: '🎉 Offer Accepted!',
      body: `${payload.workerIdentity.fullName} has accepted your offer for ${payload.jobTitle}. You can now contact them directly.`,
      actionUrl: `/conversations/${payload.conversationId}`,
      channelEmail: true,
      channelSms: true,
    });
  }

  private async handleOfferAcceptedConfirmation(payload: OfferAcceptedConfirmationPayload) {
    await this.createAndDeliver({
      userId: payload.workerUserId,
      notificationType: 'offer_accepted_confirmation',
      category: 'offer',
      title: 'Offer Accepted',
      body: `Your identity has been shared with ${payload.employerCompanyName}. You can now message them directly.`,
      actionUrl: `/conversations/${payload.conversationId}`,
      channelEmail: true,
    });
  }

  private async handleOfferRejected(payload: OfferRejectedPayload) {
    await this.createAndDeliver({
      userId: payload.employerUserId,
      notificationType: 'offer_rejected',
      category: 'offer',
      title: 'Offer Declined',
      body: payload.reason || 'The candidate has declined your offer.',
      actionUrl: `/offers/${payload.offerId}`,
      channelEmail: true,
    });
  }

  private async handleOfferCountered(payload: OfferCounteredPayload) {
    await this.createAndDeliver({
      userId: payload.employerUserId,
      notificationType: 'offer_countered',
      category: 'offer',
      title: 'Counter-Offer Received',
      body: `The candidate has submitted a counter-offer for ${payload.jobTitle}`,
      actionUrl: `/offers/${payload.counterOfferId}`,
      channelEmail: true,
    });
  }

  private async handleOfferWithdrawn(payload: OfferWithdrawnPayload) {
    await this.createAndDeliver({
      userId: payload.workerUserId,
      notificationType: 'offer_withdrawn',
      category: 'offer',
      title: 'Offer Withdrawn',
      body: payload.reason || 'The employer has withdrawn this offer.',
      actionUrl: `/offers/${payload.offerId}`,
      channelEmail: true,
    });
  }

  private async handleOfferExpiring(payload: OfferExpiringPayload) {
    await this.createAndDeliver({
      userId: payload.recipientUserId,
      notificationType: 'offer_expiring',
      category: 'offer',
      title: 'Offer Expiring Soon',
      body: `An offer for ${payload.jobTitle} expires in less than 3 days. Review it before it expires.`,
      actionUrl: `/offers/${payload.offerId}`,
      channelEmail: true,
      channelPush: true,
    });
  }

  // ============================================================================
  // MESSAGE EVENT HANDLERS
  // ============================================================================

  private async handleMessageReceived(payload: MessageReceivedPayload) {
    await this.createAndDeliver({
      userId: payload.recipientUserId,
      notificationType: 'message_received',
      category: 'message',
      title: 'New message',
      body: payload.contentPreview.substring(0, 100),
      actionUrl: `/conversations/${payload.conversationId}`,
      channelEmail: true,
    });
  }

  // ============================================================================
  // BILLING EVENT HANDLERS
  // ============================================================================

  private async handleInvoiceCreated(payload: InvoiceCreatedPayload) {
    await this.createAndDeliver({
      userId: payload.recipientUserId,
      notificationType: 'invoice_created',
      category: 'billing',
      title: 'Invoice Created',
      body: `A new invoice (${payload.invoiceNumber}) for €${(payload.totalCents / 100).toFixed(2)} has been created.`,
      actionUrl: `/dashboard/employer/billing`,
      channelEmail: true,
    });
  }

  private async handleInvoiceOverdue(payload: InvoiceOverduePayload) {
    await this.createAndDeliver({
      userId: payload.recipientUserId,
      notificationType: 'invoice_overdue',
      category: 'billing',
      title: 'Invoice Overdue',
      body: `Invoice ${payload.invoiceNumber} is ${payload.daysOverdue} days overdue.`,
      actionUrl: `/dashboard/employer/billing`,
      channelEmail: true,
      channelPush: true,
    });
  }

  // ============================================================================
  // CORE: CREATE, PUSH, AND DELIVER
  // ============================================================================

  /**
   * Create a notification in the DB and push it via WebSocket in real-time.
   * This is the single entry point for all notification delivery.
   */
  private async createAndDeliver(data: {
    userId: string;
    notificationType: string;
    category: string;
    title: string;
    body: string;
    actionUrl: string;
    channelEmail: boolean;
    channelPush?: boolean;
    channelSms?: boolean;
  }) {
    try {
      // 1. Persist to DB
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          notificationType: data.notificationType,
          category: data.category,
          title: data.title,
          body: data.body,
          actionUrl: data.actionUrl,
          channelEmail: data.channelEmail,
          channelPush: data.channelPush ?? false,
          channelSms: data.channelSms ?? false,
        },
      });

      // 2. Push via WebSocket to connected clients
      this.gateway.pushToUser(data.userId, {
        id: notification.id,
        type: notification.notificationType,
        category: notification.category,
        title: notification.title,
        body: notification.body,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt.toISOString(),
      });

      // 3. TODO: Queue email/push delivery (future phases)
      // if (data.channelEmail) { await this.emailQueue.add(...) }
      // if (data.channelPush) { await this.pushQueue.add(...) }

      return notification;
    } catch (error) {
      this.logger.error(`Failed to create/deliver notification: ${error.message}`, error.stack);
      // Don't throw — notification failure should not break the primary operation
      return null;
    }
  }

  // ============================================================================
  // REST API HELPERS
  // ============================================================================

  /**
   * Get notifications for a user, with pagination and optional unread filter.
   */
  async getNotifications(userId: string, options?: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return null;
    }

    if (notification.userId !== userId) {
      return null;
    }

    if (notification.isRead) {
      return notification;
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Push updated unread count to user via WebSocket
    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.pushUnreadCount(userId, unreadCount);

    return updated;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Push updated unread count (should be 0) via WebSocket
    this.gateway.pushUnreadCount(userId, 0);

    return { updated: result.count };
  }

  /**
   * Delete old notifications (for cleanup).
   */
  async deleteOldNotifications(olderThanDays: number = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        isRead: true,
      },
    });

    this.logger.log(`Deleted ${result.count} old notifications (older than ${olderThanDays} days)`);
    return result;
  }

  // ============================================================================
  // BREACH NOTIFICATION HANDLER
  // ============================================================================

  private async handleBreachNotification(payload: BreachNotificationPayload) {
    await this.createAndDeliver({
      userId: payload.recipientUserId,
      notificationType: NotificationEventType.BREACH_NOTIFICATION,
      category: 'privacy',
      title: `Data Breach Notification: ${payload.breachTitle}`,
      body: `A data breach has been reported: "${payload.breachTitle}". Severity: ${payload.severity}. Please check the privacy dashboard for details.`,
      actionUrl: `/privacy/dashboard`,
      channelEmail: true,
      channelPush: true,
      channelSms: false,
    });
  }
}