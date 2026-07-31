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
      creditSum,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'WORKER' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYER' } }),
      this.prisma.employer.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.offer.count({ where: { status: { in: ['SUBMITTED', 'VIEWED', 'SHORTLISTED'] } } }),
      // A-L2: this aggregates employer.creditBalance — outstanding platform
      // credits, NOT revenue. The variable was misleadingly named
      // `totalRevenue`; renamed so the dashboard's "Total Credits" card isn't
      // confused with revenue.
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
      totalCredits: creditSum._sum.creditBalance || 0,
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

    // A-L1: suspendUser/banUser block ADMIN targets. restoreUser was the only
    // one of the three status-changing actions that didn't, so an admin
    // account could be "restored" through this path. Mirror the other two:
    // admin status is only ever changed via direct DB intervention, never
    // through these admin endpoints. (In practice this never fires because
    // admins can't be suspended/banned to begin with.)
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot restore admin users');
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

  async getEmployers(
    page: number = 1,
    limit: number = 20,
    verificationStatus?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    const [employers, total] = await Promise.all([
      this.prisma.employer.findMany({
        where,
        skip: skip * limit,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employer.count({ where }),
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

  async getEmployer(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        user: true,
        offersSent: {
          include: { worker: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        ratings: true,
      },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }
    return employer;
  }

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
    // Read the employer first so we can report a precise error and include
    // companyName/previousStatus in the audit trail. This read is for metadata
    // only — the authoritative state transition is the atomic updateMany
    // below, which closes the race where two admins concurrently verify the
    // same employer (both read PENDING, both update).
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      select: { id: true, companyName: true, verificationStatus: true },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    // Atomic, idempotent transition: only update rows still in PENDING. If
    // another request already moved the employer out of PENDING, count === 0
    // and we report the current status instead of silently overwriting it.
    const result = await this.prisma.employer.updateMany({
      where: { id: employerId, verificationStatus: 'PENDING' },
      data: {
        verificationStatus: 'BASIC_VERIFIED',
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        `Employer cannot be verified in status: ${employer.verificationStatus}`,
      );
    }

    // Log admin action with the previous status so the transition is explicit.
    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'EMPLOYER_VERIFIED',
        entityType: 'employer',
        entityId: employerId,
        details: {
          notes,
          companyName: employer.companyName,
          previousStatus: employer.verificationStatus,
          newStatus: 'BASIC_VERIFIED',
        },
      },
    });

    return { success: true, message: 'Employer verified' };
  }

  async rejectEmployer(employerId: string, adminUserId: string, reason: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      select: { id: true, companyName: true, verificationStatus: true },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    // Atomic, idempotent transition — see verifyEmployer for rationale.
    const result = await this.prisma.employer.updateMany({
      where: { id: employerId, verificationStatus: 'PENDING' },
      data: {
        verificationStatus: 'REJECTED',
      },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        `Employer cannot be rejected in status: ${employer.verificationStatus}`,
      );
    }

    await this.prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: 'EMPLOYER_REJECTED',
        entityType: 'employer',
        entityId: employerId,
        details: {
          reason,
          companyName: employer.companyName,
          previousStatus: employer.verificationStatus,
          newStatus: 'REJECTED',
        },
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
    // Mass-assignment guard: AdminSettings is a generic key/value store, so we
    // can't enumerate every legal key, but we can reject keys that don't match
    // the documented snake_case identifier format. This stops an admin from
    // injecting arbitrary/collision-prone keys (e.g. keys with spaces, dots, or
    // reserved system prefixes) while still allowing new legitimate settings.
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(key)) {
      throw new BadRequestException(
        'Setting key must be 1-64 chars, lowercase snake_case (letters, digits, underscore), starting with a letter.',
      );
    }

    // A-M6: capture the previous value before upserting so the audit trail
    // records what actually changed. Without this the log only held the new
    // value, making it impossible to determine the prior setting.
    const existing = await this.prisma.adminSettings.findUnique({ where: { key } });
    const oldValue = existing ? existing.value : null;

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
        details: { key, oldValue, newValue: value },
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

    // A-L6: allow filtering by the admin who performed the action. AuditLog
    // rows record the actor (an admin, when the entry is an admin action) in
    // `userId`, so an adminId filter maps to the same column. The dedicated
    // AdminAction table (queried by getAdminActions) also carries adminId;
    // this filter exposes it on the audit-log query too.
    if (filters?.adminId) {
      where.userId = filters.adminId;
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
