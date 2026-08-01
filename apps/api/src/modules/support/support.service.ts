import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto, CreateTicketOnBehalfDto, TicketReplyDto } from './dto/create-ticket.dto';
import { NotificationEventType } from '../notifications/notification.types';

// A-M: allowed ticket status transitions. CLOSED is terminal — nothing can
// reopen a closed ticket. RESOLVED may be reopened to IN_PROGRESS (e.g. the
// user reports the issue is not actually fixed) or closed, but not bounced
// back to OPEN/PENDING_USER directly. Self-transitions are not permitted via
// updateTicketStatus; use resolveTicket/closeTicket for idempotent targeting.
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['OPEN', 'PENDING_USER', 'RESOLVED', 'CLOSED'],
  PENDING_USER: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [],
};

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ============================================================================
  // DASHBOARD STATISTICS
  // ============================================================================

  async getDashboardStats() {
    // A-M: the support dashboard (/support/page.tsx) expects totalTickets,
    // pendingUserTickets, resolvedTickets and closedTickets, while the admin
    // support page (/admin/support/page.tsx) expects resolvedToday, totalUsers
    // and pendingEmployerVerifications. Return a superset so both pages render
    // correct data instead of zeroed tiles.
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      pendingUserTickets,
      resolvedTickets,
      closedTickets,
      resolvedToday,
      totalUsers,
      pendingEmployerVerifications,
    ] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { status: 'PENDING_USER' } }),
      this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      this.prisma.supportTicket.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: startOfToday },
        },
      }),
      this.prisma.user.count(),
      this.prisma.employer.count({ where: { verificationStatus: 'PENDING' } }),
    ]);

    return {
      // Fields consumed by /support/page.tsx
      totalTickets,
      openTickets,
      inProgressTickets,
      pendingUserTickets,
      resolvedTickets,
      closedTickets,
      // Fields consumed by /admin/support/page.tsx
      resolvedToday,
      totalUsers,
      pendingEmployerVerifications,
    };
  }

  // ============================================================================
  // TICKET MANAGEMENT
  // ============================================================================

  async getTickets(
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string; priority?: string; category?: string; search?: string },
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    if (filters?.category) {
      where.category = filters.category;
    }
    // A-M: the support tickets page sends search/priority/category filters;
    // previously only status was honored and the rest silently dropped, so
    // the priority and category dropdowns did nothing. search matches the
    // ticket number, subject, description, or the owning user's email.
    if (filters?.search) {
      where.OR = [
        { ticketNumber: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
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
          include: {
            sender: {
              select: { id: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  /**
   * Create a ticket on behalf of a specific user. Used by ADMIN/SUPPORT staff
   * via the SupportGuard-protected endpoint. Validates that the target user
   * exists so staff get a clear 404 instead of a FK-constraint 500.
   */
  async createTicketOnBehalf(data: CreateTicketOnBehalfDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.createTicket(data);
  }

  async createTicket(data: CreateTicketDto & { userId: string }) {
    const year = new Date().getFullYear();

    // A-M8: previously the ticket number was `count + 1` computed outside any
    // transaction. Two concurrent requests could read the same count and both
    // produce the same SUP-YYYY-NNNNNN, colliding on the @unique ticketNumber.
    // Now the count + create run inside a transaction, and on a P2002
    // collision we recompute and retry so concurrent creations get distinct
    // numbers instead of one failing.
    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const count = await tx.supportTicket.count();
          const ticketNumber = `SUP-${year}-${String(count + 1).padStart(6, '0')}`;
          return tx.supportTicket.create({
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
        });
      } catch (error: any) {
        if (
          attempt < MAX_ATTEMPTS - 1 &&
          error?.code === 'P2002' &&
          error?.meta?.target?.includes('ticketNumber')
        ) {
          // Collision — another concurrent creation grabbed this number.
          // Recompute from the latest count and retry.
          continue;
        }
        throw error;
      }
    }
    // Should be unreachable given the retry above, but keep a clear message
    // rather than returning undefined.
    throw new BadRequestException('Failed to allocate a unique ticket number');
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

    // A-M: RESOLVED means the issue is finished. A staff reply to a resolved
    // ticket is not allowed — reopen it to IN_PROGRESS (via the status
    // endpoint) first. This keeps resolvedAt/resolvedById stable and avoids
    // silently re-activating a ticket through the reply path.
    if (ticket.status === 'RESOLVED') {
      throw new BadRequestException('Cannot reply to a resolved ticket — reopen it first');
    }

    // Create message
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        content,
        isInternal,
      },
      include: {
        sender: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    // Update ticket status if needed
    if (ticket.status === 'PENDING_USER' && !isInternal) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return message;
  }

  async getTicketMessages(ticketId: string, page: number = 1, limit: number = 50) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.ticketMessage.findMany({
        where: { ticketId },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.ticketMessage.count({ where: { ticketId } }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTicketStatus(ticketId: string, status: string, resolverId: string, expectedUpdatedAt?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // EC1: optimistic concurrency — if the caller supplies the updatedAt they
    // last read, reject when the row has changed underneath them (another agent
    // updated the same ticket). Prevents silent overwrites when two agents edit
    // concurrently.
    this.assertNotStale(ticket, expectedUpdatedAt);

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // A-M: enforce the transition map. CLOSED is terminal, and arbitrary
    // backward jumps (e.g. CLOSED -> OPEN) are rejected. Previously any
    // valid->valid transition was allowed, which let a closed ticket be
    // reopened and let resolvedAt/resolvedById be overwritten.
    const allowed = ALLOWED_STATUS_TRANSITIONS[ticket.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition ticket from ${ticket.status} to ${status}`,
      );
    }

    const updateData: any = { status };
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = resolverId;
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: true,
        assignedTo: true,
      },
    });

    // G4: notify the ticket owner that their ticket's status changed.
    this.emitTicketStatusNotification(ticket.userId, ticket.ticketNumber, ticket.subject, status, ticketId);
    return updated;
  }

  /**
   * G4: emit a SUPPORT_TICKET_UPDATED event so NotificationsService can inform
   * the ticket owner when support changes the status (incl. resolve/close).
   */
  private emitTicketStatusNotification(
    recipientUserId: string,
    ticketNumber: string,
    subject: string,
    newStatus: string,
    ticketId: string,
  ) {
    this.eventEmitter.emit(NotificationEventType.SUPPORT_TICKET_UPDATED, {
      recipientUserId,
      ticketId,
      ticketNumber,
      subject,
      newStatus,
      actionUrl: `/support/tickets/${ticketId}`,
    });
  }

  async closeTicket(ticketId: string, resolverId: string, expectedUpdatedAt?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // EC1: optimistic concurrency check.
    this.assertNotStale(ticket, expectedUpdatedAt);

    // A-M: idempotent — closing an already-closed ticket is a no-op that
    // returns the current record instead of overwriting resolvedAt/resolvedById
    // (which previously stamped a new timestamp/actor on every re-close).
    if (ticket.status === 'CLOSED') {
      return ticket;
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'CLOSED',
        resolvedAt: new Date(),
        resolvedById: resolverId,
      },
    });

    this.emitTicketStatusNotification(ticket.userId, ticket.ticketNumber, ticket.subject, 'CLOSED', ticketId);
    return updated;
  }

  async resolveTicket(ticketId: string, resolverId: string, expectedUpdatedAt?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // EC1: optimistic concurrency check.
    this.assertNotStale(ticket, expectedUpdatedAt);

    // A-M: idempotent — resolving an already-resolved ticket is a no-op.
    // Resolving a CLOSED ticket is rejected: CLOSED is terminal and resolving
    // it would be a backward transition that also overwrites the close record.
    if (ticket.status === 'RESOLVED') {
      return ticket;
    }
    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot resolve a closed ticket');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedById: resolverId,
      },
    });

    this.emitTicketStatusNotification(ticket.userId, ticket.ticketNumber, ticket.subject, 'RESOLVED', ticketId);
    return updated;
  }

  async assignTicket(ticketId: string, assignedToId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // A-M: validate the assignee. Previously any string was accepted — a
    // non-existent id surfaced as a raw Prisma FK 500, and a WORKER id would
    // silently create a broken assignment to someone with no support access.
    // Require an existing user with an ADMIN or SUPPORT role.
    const assignee = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, role: true, status: true },
    });
    if (!assignee) {
      throw new NotFoundException('Assignee user not found');
    }
    if (!['ADMIN', 'SUPPORT'].includes(assignee.role)) {
      throw new BadRequestException('Tickets can only be assigned to ADMIN or SUPPORT users');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        status: 'IN_PROGRESS',
      },
    });
  }

  async unassignTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // A-L4: previously the frontend "unassign" action sent { assignedToId: "" }
    // through the assign endpoint, which (after S-H1 validation) 400s, and
    // even before that would have stored an empty string instead of NULL —
    // breaking the FK and any "assignedTo IS NULL" queries. Clear the relation
    // properly by setting it to null.
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId: null },
    });
  }

  // ============================================================================
  // USER LOOKUP & ASSISTANCE
  // ============================================================================

  /**
   * Search/list users (Admin/Support only). Mirrors AdminService.getUsers but
   * uses `select` for GDPR data minimization — support staff picking a user for
   * a ticket only need contact/identity context, never credentials or
   * lastLoginIp. `search` matches an exact id OR email/phone contains
   * (case-insensitive); `contains` is invalid on the UUID id field so id is
   * matched by equality only.
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters?: { role?: string; status?: string; search?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.search) {
      where.OR = [
        { id: filters.search },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string, supportUserId: string) {
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

    // G3: audit which support agent accessed which user's profile and when.
    await this.auditSupportAccess(supportUserId, 'SUPPORT_VIEW_USER', 'user', userId);

    // GDPR data minimization (proportionality): SUPPORT staff see only what
    // they need to handle a support ticket — contact details, role, status,
    // and the worker/employer context. Strip credentials (passwordHash,
    // twoFactorSecret) and the user's last-login IP (sensitive PII that belongs
    // to the trust/admin investigation path, not routine support). Admins get a
    // fuller view via the admin endpoints; support gets this minimized one.
    const { passwordHash, twoFactorSecret, lastLoginIp, ...safeUser } = user;
    return safeUser;
  }

  async getUserOffers(userId: string, supportUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // G3: audit support access to a user's offers.
    await this.auditSupportAccess(supportUserId, 'SUPPORT_VIEW_USER_OFFERS', 'user', userId);

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

  async getConversationById(conversationId: string, supportUserId: string) {
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

    // A-M: audit trail. Reading a user's private conversation history is a
    // sensitive support action; unblockCompany and extendOfferExpiry already
    // log to adminAction, but conversation views did not — leaving no record of
    // which agent accessed which conversation and when. Record it now.
    await this.prisma.adminAction.create({
      data: {
        actorId: supportUserId,
        action: 'SUPPORT_VIEW_CONVERSATION',
        entityType: 'conversation',
        entityId: conversationId,
        details: {
          participant1Id: conversation.participant1Id,
          participant2Id: conversation.participant2Id,
        },
      },
    });

    return conversation;
  }

  async unblockCompany(workerId: string, employerId: string, supportUserId: string) {
    // EC3: distinguish a missing block from a non-existent worker/employer so
    // the error message tells the agent which is wrong, instead of a generic
    // "Block record not found" for all three cases.
    const [worker, employer, blocked] = await Promise.all([
      this.prisma.worker.findUnique({ where: { id: workerId }, select: { id: true, userId: true } }),
      this.prisma.employer.findUnique({ where: { id: employerId }, select: { id: true, userId: true } }),
      this.prisma.blockedCompany.findUnique({
        where: {
          workerId_employerId: {
            workerId,
            employerId,
          },
        },
      }),
    ]);

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }
    if (!blocked) {
      throw new NotFoundException('No block record found between this worker and employer');
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
        actorId: supportUserId,
        action: 'SUPPORT_UNBLOCK_COMPANY',
        entityType: 'blockedCompany',
        entityId: blocked.id,
        details: { workerId, employerId, reason: 'Support assisted unblock' },
      },
    });

    // G4: notify both parties that the company block was removed by support.
    const unblockPayload = {
      workerId,
      employerId,
      actionUrl: `/messages`,
    };
    this.eventEmitter.emit(NotificationEventType.SUPPORT_COMPANY_UNBLOCKED, {
      ...unblockPayload,
      recipientUserId: worker.userId,
    });
    this.eventEmitter.emit(NotificationEventType.SUPPORT_COMPANY_UNBLOCKED, {
      ...unblockPayload,
      recipientUserId: employer.userId,
    });

    return { success: true, message: 'Company unblocked' };
  }

  async extendOfferExpiry(offerId: string, days: number, supportUserId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        worker: { select: { userId: true } },
        employer: { select: { userId: true } },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // A-M3: defense-in-depth — the DTO already enforces a positive integer,
    // but the service must not trust its caller. Reject non-positive or
    // non-integer values so a negative can never shorten (or zero out) the
    // expiry.
    if (!Number.isInteger(days) || days < 1) {
      throw new BadRequestException('days must be a positive whole number');
    }

    // R5: cap the extension so a support agent can't effectively make an offer
    // never expire (e.g. 999999 days). 365 is a generous upper bound for a
    // support-assisted extension.
    const MAX_EXTEND_DAYS = 365;
    if (days > MAX_EXTEND_DAYS) {
      throw new BadRequestException(`days must not exceed ${MAX_EXTEND_DAYS}`);
    }

    // EC4: base the extension on the later of the current expiry and "now", so
    // an already-expired offer lands days-from-now instead of still being in
    // the past (adding 1 day to a 3-day-old expiry would otherwise stay stale).
    const base = offer.expiresAt > new Date() ? new Date(offer.expiresAt) : new Date();
    const newExpiresAt = new Date(base);
    newExpiresAt.setDate(newExpiresAt.getDate() + days);

    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { expiresAt: newExpiresAt },
    });

    // Log support action
    await this.prisma.adminAction.create({
      data: {
        actorId: supportUserId,
        action: 'SUPPORT_EXTEND_OFFER',
        entityType: 'offer',
        entityId: offerId,
        details: { extendedByDays: days, newExpiresAt },
      },
    });

    // G4: notify both the worker and the employer that the offer expiry was
    // extended by support.
    const extendPayload = {
      offerId,
      newExpiresAt: newExpiresAt.toISOString(),
      actionUrl: `/offers`,
    };
    if (offer.worker?.userId) {
      this.eventEmitter.emit(NotificationEventType.SUPPORT_OFFER_EXTENDED, {
        ...extendPayload,
        recipientUserId: offer.worker.userId,
      });
    }
    if (offer.employer?.userId) {
      this.eventEmitter.emit(NotificationEventType.SUPPORT_OFFER_EXTENDED, {
        ...extendPayload,
        recipientUserId: offer.employer.userId,
      });
    }

    return updated;
  }

  // ============================================================================
  // SUPPORT TICKETS FOR USER
  // ============================================================================

  async getUserTickets(
    userId: string,
    page: number = 1,
    limit: number = 20,
    supportUserId?: string,
  ) {
    const skip = (page - 1) * limit;

    // G3: audit when a support agent views another user's tickets. The
    // user-facing my-tickets path calls this without supportUserId, so a user
    // viewing their own tickets is not audited as a support access.
    if (supportUserId) {
      await this.auditSupportAccess(
        supportUserId,
        'SUPPORT_VIEW_USER_TICKETS',
        'user',
        userId,
      );
    }

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

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  /**
   * EC1: optimistic concurrency guard. If the caller passed the `updatedAt`
   * they last read, throw a 409 Conflict when the ticket has since changed,
   * so two agents editing the same ticket concurrently don't silently
   * overwrite each other. Tolerates minor timestamp format differences by
   * comparing millisecond epoch values.
   */
  private assertNotStale(ticket: { updatedAt: Date }, expectedUpdatedAt?: string) {
    if (!expectedUpdatedAt) return;
    const expected = new Date(expectedUpdatedAt).getTime();
    if (Number.isFinite(expected) && expected !== ticket.updatedAt.getTime()) {
      throw new ConflictException(
        'This ticket was modified by another agent. Please reload and try again.',
      );
    }
  }

  /**
   * G3: write an AdminAction audit row recording that a support agent accessed
   * a user's data (profile, offers, tickets, conversations). Gives a GDPR-
   * compliant trail of who accessed what and when.
   */
  private async auditSupportAccess(
    supportUserId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: any,
  ) {
    await this.prisma.adminAction.create({
      data: {
        actorId: supportUserId,
        action,
        entityType,
        entityId,
        details,
      },
    });
  }
}
