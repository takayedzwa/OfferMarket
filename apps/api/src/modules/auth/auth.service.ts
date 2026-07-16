import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

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
      // Check if email already exists
      const existingByEmail = await tx.user.findUnique({ where: { email } });
      if (existingByEmail) {
        throw new BadRequestException('Email already registered');
      }

      // Check if phone already exists (when provided)
      if (phone) {
        const existingByPhone = await tx.user.findUnique({ where: { phone } });
        if (existingByPhone) {
          throw new BadRequestException('Phone number already registered');
        }
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

      // Generate JWT
      const tokens = this.generateTokens(user.id, user.role);

      // Store refresh token for rotation tracking
      await this.storeRefreshToken(user.id, tokens.refreshToken);

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
      // Check if email already exists
      const existingByEmail = await tx.user.findUnique({ where: { email } });
      if (existingByEmail) {
        throw new BadRequestException('Email already registered');
      }

      // Check if phone already exists
      if (phone) {
        const existingByPhone = await tx.user.findUnique({ where: { phone } });
        if (existingByPhone) {
          throw new BadRequestException('Phone number already registered');
        }
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

    // Store the refresh token for rotation tracking
    await this.storeRefreshToken(user.id, tokens.refreshToken);

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
      process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })() : 'dev-secret-key-not-for-production'),
      { expiresIn: '1h', algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
      { sub: userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_REFRESH_SECRET environment variable is required in production'); })() : 'dev-refresh-secret-key-not-for-production'),
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600
    };
  }

  /**
   * Store a refresh token hash for rotation tracking.
   * Called after generating tokens on login and registration.
   */
  private async storeRefreshToken(userId: string, refreshToken: string, familyId?: string) {
    const tokenHash = this.hashToken(refreshToken);
    const fid = familyId || crypto.randomUUID();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: fid,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return fid;
  }

  // ============================================================================
  // REFRESH TOKEN (with rotation and reuse detection)
  // ============================================================================

  /**
   * Hash a refresh token for secure storage.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Exchange a valid refresh token for a new access/refresh token pair.
   *
   * Implements OWASP-recommended token rotation:
   * 1. Verify the JWT is valid and is a refresh token
   * 2. Look up the token hash in the database
   * 3. If the token has already been used (revoked), it's a reuse — revoke
   *    the entire token family (possible theft) and force re-authentication
   * 4. If the token is valid, revoke it and issue a new pair in the same family
   */
  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_REFRESH_SECRET environment variable is required in production'); })() : 'dev-refresh-secret-key-not-for-production');

    // Step 1: Verify the JWT
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, refreshSecret, { algorithms: ['HS256'] }) as any;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = payload.sub;
    const tokenHash = this.hashToken(refreshToken);

    // Step 2: Look up the token in the database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    // Step 3: Reuse detection — if the token doesn't exist in DB, it may be
    // an old token from before rotation was enabled, or it's invalid.
    // If it exists and is revoked, that's a reuse attempt (possible theft).
    if (storedToken?.isRevoked) {
      // TOKEN REUSE DETECTED: This refresh token was already used.
      // Revoke the entire token family to prevent further access.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: storedToken.familyId },
        data: { isRevoked: true },
      });

      // Report suspicious activity
      await this.trustService.reportSuspiciousActivity({
        entityType: 'USER',
        userId,
        activityType: 'REFRESH_TOKEN_REUSE',
        severity: 'HIGH',
        description: `Refresh token reuse detected for user ${userId}. All sessions revoked as precaution.`,
        ipAddress: 'system',
      });

      throw new ForbiddenException('Refresh token has been revoked. Please log in again.');
    }

    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account has been banned');
    }

    const isBlacklisted = await this.trustService.isBlacklisted('USER', user.id);
    if (isBlacklisted) {
      throw new UnauthorizedException('Account has been suspended');
    }

    // Step 4: Revoke the old token and issue a new pair in the same family
    const familyId = storedToken?.familyId || crypto.randomUUID();

    // Revoke the old token
    if (storedToken) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
    }

    // Issue new tokens
    const tokens = this.generateTokens(user.id, user.role);
    const newRefreshTokenHash = this.hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store the new refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newRefreshTokenHash,
        familyId,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Revoke all refresh tokens for a user (used on logout, password change, etc.)
   */
  async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
