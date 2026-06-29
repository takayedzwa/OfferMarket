import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private trustService: TrustService,
  ) {}

  // ============================================================================
  // REGISTER WORKER
  // ============================================================================

  async registerWorker(email: string, password: string, phone?: string, ipAddress?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // TRUST LAYER: Check for rapid account creation
      if (ipAddress) {
        const rapidCreation = await this.trustService.detectRapidAccountCreation(ipAddress, 60);
        if (rapidCreation.isSuspicious) {
          await this.trustService.reportSuspiciousActivity({
            entityType: 'USER',
            activityType: 'RAPID_ACCOUNT_CREATION',
            severity: 'HIGH',
            description: `Rapid account creation detected from IP ${ipAddress}`,
            ipAddress,
          });
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'WORKER',
          phone,
          emailVerified: false,
          phoneVerified: false,
          lastLoginIp: ipAddress,
        }
      });

      // TRUST LAYER: Initialize worker verification record
      // We'll create the worker first, then initialize verification
      await tx.$executeRaw`
        INSERT INTO "WorkerVerification" (id, "workerId", "verificationLevel", "riskLevel", "riskScore", "backgroundCheckStatus", "referenceCheckStatus", "createdAt", "updatedAt")
        SELECT
          gen_random_uuid(),
          id,
          'NONE',
          'UNKNOWN',
          50,
          'NOT_STARTED',
          'NOT_STARTED',
          NOW(),
          NOW()
        FROM "Worker"
        WHERE "userId" = ${user.id}
        ON CONFLICT ("workerId") DO NOTHING
      `;

      // Generate JWT
      const tokens = this.generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        tokens
      };
    });
  }

  // ============================================================================
  // REGISTER ADMIN (Internal use only - seed initial admin)
  // ============================================================================

  async registerAdmin(
    email: string,
    password: string,
    adminCode: string // Secret code to prevent unauthorized admin creation
  ) {
    // Verify admin code (should be set via environment variable)
    const validAdminCode = process.env.ADMIN_REGISTRATION_CODE;
    if (!validAdminCode || adminCode !== validAdminCode) {
      throw new BadRequestException('Invalid admin registration code');
    }

    return this.prisma.$transaction(async (tx) => {
      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create admin user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          emailVerified: true, // Auto-verify admin emails
          phoneVerified: true
        }
      });

      // Generate JWT
      const tokens = this.generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        tokens
      };
    });
  }

  // ============================================================================
  // REGISTER SUPPORT (Admin only)
  // ============================================================================

  async registerSupport(
    email: string,
    password: string,
    adminUserId: string // ID of admin creating the support user
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Verify admin is creating this user
      const admin = await tx.user.findUnique({
        where: { id: adminUserId }
      });

      if (!admin || admin.role !== 'ADMIN') {
        throw new BadRequestException('Only admins can create support users');
      }

      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create support user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'SUPPORT',
          emailVerified: true, // Auto-verify support emails
          phoneVerified: true
        }
      });

      // Generate JWT
      const tokens = this.generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        tokens
      };
    });
  }

  // ============================================================================
  // REGISTER EMPLOYER
  // ============================================================================

  async registerEmployer(
    email: string,
    password: string,
    phone: string,
    company: {
      name: string;
      kvkNumber: string;
      website?: string;
    },
    ipAddress?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // Check if KvK already exists
      const existingEmployer = await tx.employer.findUnique({
        where: { kvkNumber: company.kvkNumber }
      });
      if (existingEmployer) {
        throw new BadRequestException('Company with this KvK number already exists');
      }

      // TRUST LAYER: Check for rapid account creation
      if (ipAddress) {
        const rapidCreation = await this.trustService.detectRapidAccountCreation(ipAddress, 60);
        if (rapidCreation.isSuspicious) {
          await this.trustService.reportSuspiciousActivity({
            entityType: 'USER',
            activityType: 'RAPID_ACCOUNT_CREATION',
            severity: 'HIGH',
            description: `Rapid account creation detected from IP ${ipAddress}`,
            ipAddress,
          });
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'EMPLOYER',
          phone,
          emailVerified: false,
          phoneVerified: false,
          lastLoginIp: ipAddress,
        }
      });

      // Create employer profile
      const employer = await tx.employer.create({
        data: {
          userId: user.id,
          companyName: company.name,
          kvkNumber: company.kvkNumber,
          website: company.website,
          verificationStatus: 'PENDING',
          registeredAddress: { street: '', city: '', postalCode: '', country: 'NL' }
        }
      });

      // TRUST LAYER: Initialize employer verification record
      await tx.employerVerification.create({
        data: {
          employerId: employer.id,
          verificationLevel: 'NONE',
          riskLevel: 'UNKNOWN',
          riskScore: 50,
          kvkVerified: false,
          vatVerified: false,
          companyVerified: false,
          documentVerified: false,
        }
      });

      // Generate JWT
      const tokens = this.generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        tokens
      };
    });
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account has been banned');
    }

    // TRUST LAYER: Check if user is blacklisted
    const isBlacklisted = await this.trustService.isBlacklisted('USER', user.id);
    if (isBlacklisted) {
      throw new UnauthorizedException('Account has been suspended');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      // TRUST LAYER: Report failed login attempt
      await this.trustService.reportSuspiciousActivity({
        entityType: 'USER',
        userId: user.id,
        activityType: 'MULTIPLE_FAILED_LOGINS',
        severity: 'LOW',
        description: `Failed login attempt for user ${email}`,
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // TRUST LAYER: Check for suspicious login patterns
    let riskScore = 0;
    if (ipAddress) {
      const suspiciousLoginCheck = await this.trustService.checkSuspiciousLogin(user.id, ipAddress, userAgent);
      riskScore = suspiciousLoginCheck.riskScore || 0;
      if (suspiciousLoginCheck.isSuspicious) {
        await this.trustService.reportSuspiciousActivity({
          entityType: 'USER',
          userId: user.id,
          activityType: 'UNUSUAL_LOGIN_LOCATION',
          severity: 'MEDIUM',
          description: `Suspicious login detected from IP ${ipAddress}`,
          ipAddress,
          userAgent,
        });
      }
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      }
    });

    const tokens = this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      tokens,
      trustContext: {
        isBlacklisted: false,
        riskLevel: riskScore,
      }
    };
  }

  // ============================================================================
  // VERIFY EMAIL
  // ============================================================================

  async verifyEmail(userId: string, code: string) {
    // In production, verify the code properly
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });

    return { success: true };
  }

  // ============================================================================
  // VERIFY PHONE
  // ============================================================================

  async verifyPhone(userId: string, phone: string, code: string) {
    // In production, verify the SMS code properly
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        phoneVerified: true
      }
    });

    return { success: true };
  }

  // ============================================================================
  // GET USER BY ID
  // ============================================================================

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId }
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { sub: userId, role },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600
    };
  }
}
