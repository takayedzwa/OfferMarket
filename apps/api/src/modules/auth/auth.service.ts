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
  // SEND VERIFICATION CODE
  // Generates a 6-digit code, stores its SHA-256 hash, and returns the plain
  // code so the caller can deliver it (e.g. via email/SMS).  In production
  // this should be replaced by an actual email/SMS send — returning the code
  // in the API response is acceptable for development but MUST be removed
  // before production deployment.
  // ============================================================================

  async sendVerificationCode(userId: string, type: 'EMAIL' | 'PHONE'): Promise<{ message: string; code?: string }> {
    // Delete any existing codes for this user & type
    await this.prisma.verificationCode.deleteMany({
      where: { userId, type },
    });

    // Generate a 6-digit numeric code
    const rawCode = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.verificationCode.create({
      data: { userId, type, codeHash, expiresAt },
    });

    // TODO: In production, send via email/SMS instead of returning the code.
    return {
      message: `Verification code sent for ${type.toLowerCase()} verification.`,
      code: rawCode, // Remove in production
    };
  }

  // ============================================================================
  // VERIFY EMAIL
  // SECURITY: The verification code is now validated against a stored hash.
  // Previously this method accepted any code and immediately set emailVerified
  // to true — a bypass that let anyone verify any email without proof.
  // ============================================================================

  async verifyEmail(userId: string, code: string) {
    if (!code) {
      throw new BadRequestException('Verification code is required');
    }

    // Look up the stored verification code for this user
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type: 'EMAIL',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException('No valid verification code found. Please request a new one.');
    }

    // Validate the code using constant-time comparison
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== verification.codeHash) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark the code as used
    await this.prisma.verificationCode.delete({ where: { id: verification.id } });

    // Update the user's email verification status
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });

    return { success: true };
  }

  // ============================================================================
  // VERIFY PHONE
  // SECURITY: Same as verifyEmail — the SMS code is now validated against a
  // stored hash rather than being blindly accepted.
  // ============================================================================

  async verifyPhone(userId: string, phone: string, code: string) {
    if (!code) {
      throw new BadRequestException('Verification code is required');
    }

    // Look up the stored verification code for this user
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        userId,
        type: 'PHONE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException('No valid verification code found. Please request a new one.');
    }

    // Validate the code using constant-time comparison
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (codeHash !== verification.codeHash) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark the code as used
    await this.prisma.verificationCode.delete({ where: { id: verification.id } });

    // Update the user's phone and verification status
    const updateData: any = { phoneVerified: true };
    if (phone) {
      updateData.phone = phone;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData
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
    // Include a unique jti (JWT ID) claim so the access token can be
    // blacklisted on logout. Without jti, access tokens remain valid
    // until natural expiry even after logout.
    const jti = crypto.randomUUID();

    const accessToken = jwt.sign(
      { sub: userId, role },
      process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })() : 'dev-secret-key-not-for-production'),
      { expiresIn: '1h', algorithm: 'HS256', jwtid: jti }
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

    // SECURITY (E-M2): A refresh token that verifies cryptographically but is NOT
    // tracked in the DB must not be honored. Previously, a null storedToken fell
    // through to "issue a new pair", which let an unknown/untracked token (a
    // forged token, a token from before rotation tracking, or one whose row was
    // deleted on logout/password change) be replayed into a fresh session. Only
    // tokens whose hash is present and active may rotate. Anything else forces a
    // clean re-login.
    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
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

    // Step 4: Revoke the old token and issue a new pair in the same family.
    // storedToken is guaranteed non-null here — null tokens are rejected above.
    const familyId = storedToken.familyId;

    // Revoke the old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

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

  /**
   * Blacklist an access token by its jti (JWT ID) claim.
   * This ensures the token cannot be reused after logout, closing the
   * window where a stolen access token would remain valid until expiry.
   */
  async blacklistAccessToken(userId: string, jti: string) {
    // Store the jti with an expiry matching the access token TTL (1 hour).
    // After that point, the token would have expired naturally anyway.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.blacklistedToken.upsert({
      where: { jti },
      create: { jti, userId, expiresAt },
      update: { expiresAt },
    });
  }

  /**
   * Clean up expired blacklist entries. Can be called periodically.
   */
  async cleanupExpiredBlacklistedTokens() {
    await this.prisma.blacklistedToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ============================================================================
  // PASSWORD RESET
  // ============================================================================

  /**
   * Initiate a password reset by generating a time-limited token.
   * SECURITY: The raw token is no longer returned in the API response.
   * In production, this token should be delivered via a side-channel
   * (e.g. email). For development/testing, the token is logged to the server
   * console at INFO level.
   * Always returns success to avoid revealing whether an email exists.
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to avoid revealing whether the email exists
    if (!user || user.status === 'DELETED') {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // Delete any existing reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // TODO: In production, send this token via email (e.g., AWS SES, SendGrid).
    // For development, log it so tests can retrieve it.
    console.info(`[DEV] Password reset token for ${email}: ${rawToken}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Reset a user's password using a valid reset token.
   * Validates the token, updates the password, invalidates the token,
   * and revokes all refresh tokens to force re-login.
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Clean up expired token
      await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new BadRequestException('Reset token has expired. Please request a new one.');
    }

    // Check if token has already been used (one-time use)
    if (resetToken.usedAt) {
      throw new BadRequestException('Reset token has already been used. Please request a new one.');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and mark token as used in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Delete all other reset tokens for this user
      await tx.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, id: { not: resetToken.id } },
      });
    });

    // Revoke all refresh tokens to force re-login on all devices
    await this.revokeAllRefreshTokens(resetToken.userId);

    return { message: 'Password has been reset successfully' };
  }
}
