import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * MESSAGES SERVICE
 *
 * Post-acceptance communication only.
 * Workers and employers can only message AFTER offer acceptance.
 */

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

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
  // GET CONversation WITH MESSAGES
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

    // Mark messages as read
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

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 200),
        unreadCountWorker: conversation.participant1Id === recipientId ? { increment: 1 } : 0,
        unreadCountEmployer: conversation.participant2Id === recipientId ? { increment: 1 } : 0
      }
    });

    // Create notification for recipient
    await this.prisma.notification.create({
      data: {
        userId: recipientId,
        notificationType: 'message_received',
        category: 'message',
        title: 'New message',
        body: content.substring(0, 100),
        actionUrl: `/conversations/${conversationId}`,
        channelEmail: true
      }
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

    // Determine which unread count to reset
    const updateData = userId === conversation.participant1Id
      ? { unreadCountWorker: 0 }
      : { unreadCountEmployer: 0 };

    // Mark messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        recipientId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

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

    const updateData = userId === conversation.participant1Id
      ? { isArchivedWorker: true }
      : { isArchivedEmployer: true };

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });
  }
}
