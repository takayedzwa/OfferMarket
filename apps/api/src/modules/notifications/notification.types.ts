// ============================================================================
// NOTIFICATION EVENT TYPES
// ============================================================================
// Strongly-typed event payloads for the notification system.
// Services emit these events; NotificationsService listens and handles delivery.

export enum NotificationEventType {
  // Offer lifecycle
  OFFER_RECEIVED = 'offer.received',
  OFFER_ACCEPTED = 'offer.accepted',
  OFFER_ACCEPTED_CONFIRMATION = 'offer.accepted.confirmation',
  OFFER_REJECTED = 'offer.rejected',
  OFFER_COUNTERED = 'offer.countered',
  OFFER_WITHDRAWN = 'offer.withdrawn',
  OFFER_EXPIRING = 'offer.expiring',

  // Messages
  MESSAGE_RECEIVED = 'message.received',

  // Billing
  INVOICE_CREATED = 'invoice.created',
  INVOICE_OVERDUE = 'invoice.overdue',

  // GDPR / Privacy
  BREACH_NOTIFICATION = 'breach.notification',
}

// ============================================================================
// Base payload
// ============================================================================

export interface BaseNotificationPayload {
  /** The user who should receive the notification */
  recipientUserId: string;
  /** Deep link to the relevant resource */
  actionUrl: string;
}

// ============================================================================
// Offer event payloads
// ============================================================================

export interface OfferReceivedPayload extends BaseNotificationPayload {
  workerUserId: string;
  employerCompanyName: string;
  jobTitle: string;
  offerId: string;
}

export interface OfferAcceptedPayload extends BaseNotificationPayload {
  employerUserId: string;
  workerUserId: string;
  workerIdentity: {
    fullName: string;
    email: string;
    phone: string;
  };
  jobTitle: string;
  offerId: string;
  conversationId: string;
}

export interface OfferAcceptedConfirmationPayload extends BaseNotificationPayload {
  workerUserId: string;
  employerCompanyName: string;
  jobTitle: string;
  offerId: string;
  conversationId: string;
}

export interface OfferRejectedPayload extends BaseNotificationPayload {
  employerUserId: string;
  reason?: string;
  jobTitle: string;
  offerId: string;
}

export interface OfferCounteredPayload extends BaseNotificationPayload {
  employerUserId: string;
  jobTitle: string;
  /** The (single) offer that was countered — counters are versioned on the same offer. */
  offerId: string;
}

export interface OfferWithdrawnPayload extends BaseNotificationPayload {
  workerUserId: string;
  reason?: string;
  jobTitle: string;
  offerId: string;
}

export interface OfferExpiringPayload extends BaseNotificationPayload {
  recipientUserId: string;
  jobTitle: string;
  offerId: string;
  expiresAt: Date;
}

// ============================================================================
// Message event payloads
// ============================================================================

export interface MessageReceivedPayload extends BaseNotificationPayload {
  recipientUserId: string;
  senderId: string;
  conversationId: string;
  contentPreview: string;
}

// ============================================================================
// Billing event payloads
// ============================================================================

export interface InvoiceCreatedPayload extends BaseNotificationPayload {
  recipientUserId: string;
  employerCompanyName: string;
  invoiceNumber: string;
  totalCents: number;
  dueDate: Date;
}

export interface InvoiceOverduePayload extends BaseNotificationPayload {
  recipientUserId: string;
  invoiceNumber: string;
  totalCents: number;
  daysOverdue: number;
}

// ============================================================================
// Breach notification payloads
// ============================================================================

export interface BreachNotificationPayload extends BaseNotificationPayload {
  recipientUserId: string;
  breachId: string;
  breachTitle: string;
  severity: string;
}

// ============================================================================
// Notification DB record type (matches Prisma model)
// ============================================================================

export interface NotificationResponse {
  id: string;
  userId: string;
  notificationType: string;
  category: string | null;
  title: string;
  body: string;
  actionUrl: string | null;
  actionData: any;
  channelEmail: boolean;
  channelPush: boolean;
  channelSms: boolean;
  isRead: boolean;
  readAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}