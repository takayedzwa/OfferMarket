import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // DASHBOARD STATISTICS
  // ============================================================================

  async getDashboardStats() {
    const [
      totalUsers,
      totalWorkers,
      totalEmployers,
      pendingVerifications,
      activeOffers,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'WORKER' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYER' } }),
      this.prisma.employer.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.offer.count({ where: { status: { in: ['SUBMITTED', 'VIEWED', 'SHORTLISTED'] } } }),
      this.prisma.employer.aggregate({
        _sum: { creditBalance: true }
      }),
    ]);

    return {
      totalUsers,
      totalWorkers,
      totalEmployers,
      pendingVerifications,
      activeOffers,
      totalCredits: totalRevenue._sum.creditBalance || 0,
    };
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async getUsers(page: number = 1, limit: number = 20, filters?: any) {
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
        include: {
          worker: true,
          employer: true,
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

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        worker: {
          include: {
            skills: { include: { skill: true } },
            certifications: true,
            offersReceived: {
              include: { employer: true },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        employer: {
          include: {
            offersSent: {
              include: { worker: true },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            ratings: true,
          },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async suspendUser(userId: string, adminUserId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot suspend admin users');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'USER_SUSPENDED',
        entityType: 'user',
        entityId: userId,
        details: { reason, userEmail: user.email },
      },
    });

    return { success: true, message: 'User suspended' };
  }

  async banUser(userId: string, adminUserId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot ban admin users');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'USER_BANNED',
        entityType: 'user',
        entityId: userId,
        details: { reason, userEmail: user.email },
      },
    });

    return { success: true, message: 'User banned' };
  }

  async restoreUser(userId: string, adminUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'USER_RESTORED',
        entityType: 'user',
        entityId: userId,
        details: { userEmail: user.email },
      },
    });

    return { success: true, message: 'User restored' };
  }

  // ============================================================================
  // EMPLOYER VERIFICATION
  // ============================================================================

  async getVerificationQueue(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [employers, total] = await Promise.all([
      this.prisma.employer.findMany({
        where: { verificationStatus: 'PENDING' },
        skip,
        take: limit,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.employer.count({ where: { verificationStatus: 'PENDING' } }),
    ]);

    return {
      employers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyEmployer(employerId: string, adminUserId: string, notes?: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        verificationStatus: 'BASIC_VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
      },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'EMPLOYER_VERIFIED',
        entityType: 'employer',
        entityId: employerId,
        details: { notes, companyName: employer.companyName },
      },
    });

    return { success: true, message: 'Employer verified' };
  }

  async rejectEmployer(employerId: string, adminUserId: string, reason: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    await this.prisma.employer.update({
      where: { id: employerId },
      data: {
        verificationStatus: 'REJECTED',
      },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'EMPLOYER_REJECTED',
        entityType: 'employer',
        entityId: employerId,
        details: { reason, companyName: employer.companyName },
      },
    });

    return { success: true, message: 'Employer verification rejected' };
  }

  // ============================================================================
  // PLATFORM SETTINGS
  // ============================================================================

  async getSettings(category?: string) {
    const where: any = {};
    if (category) {
      where.category = category;
    }

    const settings = await this.prisma.adminSettings.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  }

  async updateSetting(key: string, value: any, adminUserId: string, category?: string) {
    const setting = await this.prisma.adminSettings.upsert({
      where: { key },
      create: {
        key,
        value,
        category: category || 'general',
        updatedBy: adminUserId,
      },
      update: {
        value,
        category: category || 'general',
        updatedBy: adminUserId,
      },
    });

    // Log admin action
    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'SETTINGS_UPDATED',
        entityType: 'settings',
        entityId: setting.id,
        details: { key, value },
      },
    });

    return setting;
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  async getAuditLogs(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.dateFrom) {
      where.occurredAt = { gte: new Date(filters.dateFrom) };
    }

    if (filters?.dateTo) {
      where.occurredAt = { ...where.occurredAt, lte: new Date(filters.dateTo) };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminActions(adminId?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (adminId) {
      where.adminId = adminId;
    }

    const [actions, total] = await Promise.all([
      this.prisma.adminAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.adminAction.count({ where }),
    ]);

    return {
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================================
  // OFFERS MONITORING
  // ============================================================================

  async getAllOffers(page: number = 1, limit: number = 20, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.workerId) {
      where.workerId = filters.workerId;
    }

    if (filters?.employerId) {
      where.employerId = filters.employerId;
    }

    const [offers, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        skip,
        take: limit,
        include: {
          worker: { include: { user: true } },
          employer: { include: { user: true } },
          currentVersion: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.offer.count({ where }),
    ]);

    return {
      offers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOfferById(id: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: {
        employer: {
          include: {
            user: true,
          },
        },
        worker: { include: { user: true } },
        currentVersion: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }
}
