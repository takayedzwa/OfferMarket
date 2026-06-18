import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto, TicketReplyDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // DASHBOARD STATISTICS
  // ============================================================================

  async getDashboardStats() {
    const [
      openTickets,
      inProgressTickets,
      resolvedToday,
      totalUsers,
      pendingEmployerVerifications,
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.user.count(),
      this.prisma.employer.count({ where: { verificationStatus: 'PENDING' } }),
    ]);

    return {
      openTickets,
      inProgressTickets,
      resolvedToday,
      totalUsers,
      pendingEmployerVerifications,
    };
  }

  // ============================================================================
  // TICKET MANAGEMENT
  // ============================================================================

  async getTickets(status?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          assignedTo: true,
          conversation: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
        assignedTo: true,
        resolver: true,
        conversation: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async createTicket(data: CreateTicketDto) {
    const year = new Date().getFullYear();
    const count = await this.prisma.supportTicket.count();
    const ticketNumber = `SUP-${year}-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: data.userId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority as any,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        status: 'OPEN',
      },
      include: {
        user: true,
      },
    });
  }

  async replyToTicket(ticketId: string, senderId: string, content: string, isInternal: boolean = false) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot reply to closed ticket');
    }

    // Create message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        content,
        isInternal,
      },
    });

    // Update ticket status if needed
    if (ticket.status === 'PENDING_USER' && !isInternal) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return { success: true };
  }

  async closeTicket(ticketId: string, resolverId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        resolvedAt: new Date(),
        resolvedById: resolverId,
      },
    });
  }

  async resolveTicket(ticketId: string, resolverId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedById: resolverId,
      },
    });
  }

  async assignTicket(ticketId: string, assignedToId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        status: 'IN_PROGRESS',
      },
    });
  }

  // ============================================================================
  // USER LOOKUP & ASSISTANCE
  // ============================================================================

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        worker: {
          include: {
            skills: { include: { skill: true } },
            certifications: true,
          },
        },
        employer: {
          include: {
            ratings: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't expose sensitive fields
    const { passwordHash, twoFactorSecret, ...safeUser } = user;
    return safeUser;
  }

  async getUserOffers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'WORKER') {
      const worker = await this.prisma.worker.findUnique({
        where: { userId },
      });

      if (!worker) {
        return { offers: [] };
      }

      const offers = await this.prisma.offer.findMany({
        where: { workerId: worker.id },
        include: {
          employer: { include: { user: true } },
          currentVersion: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return { offers };
    } else if (user.role === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({
        where: { userId },
      });

      if (!employer) {
        return { offers: [] };
      }

      const offers = await this.prisma.offer.findMany({
        where: { employerId: employer.id },
        include: {
          worker: { include: { user: true } },
          currentVersion: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return { offers };
    }

    return { offers: [] };
  }

  async getConversationById(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: true,
        participant2: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        offer: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async unblockCompany(workerId: string, employerId: string, supportUserId: string) {
    const blocked = await this.prisma.blockedCompany.findUnique({
      where: {
        workerId_employerId: {
          workerId,
          employerId,
        },
      },
    });

    if (!blocked) {
      throw new NotFoundException('Block record not found');
    }

    await this.prisma.blockedCompany.delete({
      where: {
        workerId_employerId: {
          workerId,
          employerId,
        },
      },
    });

    // Log support action
    await this.prisma.adminAction.create({
      data: {
        adminId: supportUserId,
        action: 'SUPPORT_UNBLOCK_COMPANY',
        entityType: 'blockedCompany',
        entityId: blocked.id,
        details: { workerId, employerId, reason: 'Support assisted unblock' },
      },
    });

    return { success: true, message: 'Company unblocked' };
  }

  async extendOfferExpiry(offerId: string, days: number, supportUserId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    const newExpiresAt = new Date(offer.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + days);

    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { expiresAt: newExpiresAt },
    });

    // Log support action
    await this.prisma.adminAction.create({
      data: {
        adminId: supportUserId,
        action: 'SUPPORT_EXTEND_OFFER',
        entityType: 'offer',
        entityId: offerId,
        details: { extendedByDays: days, newExpiresAt },
      },
    });

    return updated;
  }

  // ============================================================================
  // SUPPORT TICKETS FOR USER
  // ============================================================================

  async getUserTickets(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          assignedTo: true,
          conversation: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where: { userId } }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
