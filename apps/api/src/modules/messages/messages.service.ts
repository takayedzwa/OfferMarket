import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationEventType } from '../notifications/notification.types';

/**
 * MESSAGES SERVICE
 *
 * Post-acceptance communication only.
 * Workers and employers can only message AFTER offer acceptance.
 */

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // GET CONVERSATIONS
  // ============================================================================

  async getConversations(userId: string, userType: 'worker' | 'employer') {
    const conversations = await this.prisma.conversation.findMany({
      where: userType === 'worker'
        ? { participant1Id: userId }
        : { participant2Id: userId },
      include: {
        offer: {
          select: {
            id: true,
            jobTitle: true,
            status: true,
            publicId: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    return conversations.map(conv => ({
      id: conv.id,
      offerId: conv.offerId,
      offer: conv.offer,
      lastMessage: conv.messages[0] || null,
      unreadCount: userType === 'worker' ? conv.unreadCountWorker : conv.unreadCountEmployer,
      lastMessageAt: conv.lastMessageAt
    }));
  }

  // ============================================================================
  // GET CONVERSATION WITH MESSAGES
  // ============================================================================

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        offer: {
          select: {
            id: true,
            jobTitle: true,
            status: true,
            publicId: true,
            currentVersion: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        },
        participant1: {
          select: { id: true, email: true }
        },
        participant2: {
          select: { id: true, email: true }
        }
      }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is a participant
    if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
      throw new ForbiddenException('Not authorized to view this conversation');
    }

    // Mark messages as read (also updates conversation unread count)
    await this.markAsRead(conversationId, userId);

    return conversation;
  }

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  async sendMessage(conversationId: string, senderId: string, content: string, attachments?: any[]) {
    // Verify conversation exists and user is participant
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.participant1Id !== senderId && conversation.participant2Id !== senderId) {
      throw new ForbiddenException('Not authorized to send messages in this conversation');
    }

    // Determine recipient
    const recipientId = conversation.participant1Id === senderId
      ? conversation.participant2Id
      : conversation.participant1Id;

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        recipientId,
        content,
        attachments: attachments || [],
        messageType: 'TEXT'
      }
    });

    // Update conversation — increment ONLY the recipient's unread count.
    // SECURITY: Determine whether the recipient is a worker or employer by
    // checking their role, rather than assuming participant1=worker.
    const recipientUser = await this.prisma.user.findUnique({ where: { id: recipientId } });
    const recipientIsWorker = recipientUser?.role === 'WORKER';
    const unreadUpdate = recipientIsWorker
      ? { unreadCountWorker: { increment: 1 } }
      : { unreadCountEmployer: { increment: 1 } };

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 200),
        ...unreadUpdate,
      }
    });

    // Emit notification event for the recipient
    this.eventEmitter.emit(NotificationEventType.MESSAGE_RECEIVED, {
      recipientUserId: recipientId,
      senderId,
      conversationId,
      contentPreview: content.substring(0, 100),
      actionUrl: `/conversations/${conversationId}`,
    });

    return message;
  }

  // ============================================================================
  // MARK AS READ
  // ============================================================================

  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Determine which unread count to reset.
    // SECURITY: Resolve role from the user record instead of assuming
    // participant1=worker, so role assignment changes don't break this.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isWorker = user?.role === 'WORKER';
    const unreadReset = isWorker
      ? { unreadCountWorker: 0 }
      : { unreadCountEmployer: 0 };

    // Mark messages as read AND reset the conversation unread counter
    await Promise.all([
      this.prisma.message.updateMany({
        where: {
          conversationId,
          recipientId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: unreadReset
      })
    ]);

    return { success: true };
  }

  // ============================================================================
  // ARCHIVE CONVERSATION
  // ============================================================================

  async archiveConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // SECURITY: Resolve role from the user record instead of assuming
    // participant1=worker.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isWorker = user?.role === 'WORKER';
    const updateData = isWorker
      ? { isArchivedWorker: true }
      : { isArchivedEmployer: true };

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });
  }
}