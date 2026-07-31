import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { isCommonPassword } from '../auth/password-blocklist';
import * as bcrypt from 'bcrypt';

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
      // A-C3: strip credential/2FA secrets from the list response —
      // findMany with `include` returns all scalar fields by default.
      users: users.map((u: any) => {
        delete u.passwordHash;
        delete u.twoFactorSecret;
        return u;
      }),
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

    // A-C3: findUnique with `include` returns all scalar fields by default,
    // which would leak passwordHash and twoFactorSecret through the admin
    // user-detail endpoint. Strip credential/2FA secrets before returning.
    // (Prisma disallows top-level select+include together, so we scrub here.)
    delete (user as any).passwordHash;
    delete (user as any).twoFactorSecret;

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
  // STAFF CREATION (Admin console)
  // ============================================================================

  /**
   * Create an ADMIN or SUPPORT user from the admin console.
   * ADMIN-only (enforced by AdminGuard on the controller). The creator's
   * identity is taken from the verified JWT and recorded in the audit trail.
   */
  async createStaffUser(
    dto: CreateStaffUserDto,
    adminUserId: string,
  ) {
    if (dto.role !== 'ADMIN' && dto.role !== 'SUPPORT') {
      throw new BadRequestException('Role must be ADMIN or SUPPORT');
    }

    return this.prisma.$transaction(async (tx) => {
      // Confirm the caller is an admin (defense-in-depth; AdminGuard already
      // enforces this, but the service shouldn't trust the controller alone).
      const admin = await tx.user.findUnique({ where: { id: adminUserId } });
      if (!admin || admin.role !== 'ADMIN') {
        throw new BadRequestException('Only admins can create staff users');
      }

      // Email uniqueness
      const existing = await tx.user.findUnique({ where: { email: dto.email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // Reject trivially-guessable passwords that still satisfy the DTO regex
      // (e.g. "Password1"). Second line of defense after the regex.
      if (isCommonPassword(dto.password)) {
        throw new BadRequestException(
          'This password is too common and easily guessed. Please choose a stronger password.',
        );
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);

      let user;
      try {
        user = await tx.user.create({
          data: {
            email: dto.email,
            passwordHash,
            role: dto.role,
            emailVerified: true, // auto-verify staff emails
            phoneVerified: true,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone || null,
          },
        });
      } catch (error: any) {
        // DB-level @unique constraint on User.phone catches a duplicate phone
        // and rejects the create with Prisma error P2002. Map it to a clean
        // BadRequestException (mirrors registerEmployer's KvK P2002 handling).
        if (error?.code === 'P2002' && error?.meta?.target?.includes('phone')) {
          throw new BadRequestException('Phone number already in use');
        }
        throw error;
      }

      // Audit trail — the whole point vs. the unaudited /auth/register/support.
      await tx.adminAction.create({
        data: {
          adminId: adminUserId,
          action: 'STAFF_USER_CREATED',
          entityType: 'user',
          entityId: user.id,
          details: {
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
          },
        },
      });

      // Return only the public shape — never passwordHash/twoFactorSecret
      // (consistent with the A-C3 scrubbing).
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      };
    });
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

    // A-H1: only employers awaiting review can be verified. Prevent an admin
    // from re-verifying an already-verified or already-rejected employer and
    // overwriting the previous decision.
    if (employer.verificationStatus !== 'PENDING') {
      throw new BadRequestException(
        `Employer cannot be verified in status: ${employer.verificationStatus}`,
      );
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

    // A-H1: only employers awaiting review can be rejected. Prevent an admin
    // from re-rejecting an already-verified or already-rejected employer.
    if (employer.verificationStatus !== 'PENDING') {
      throw new BadRequestException(
        `Employer cannot be rejected in status: ${employer.verificationStatus}`,
      );
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
