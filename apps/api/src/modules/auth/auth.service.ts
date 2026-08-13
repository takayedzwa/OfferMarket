import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_CODES } from '../../i18n/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { TrustService } from '../trust/trust.service';
import { MailService } from '../mail/mail.service';
import { isCommonPassword } from './password-blocklist';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private trustService: TrustService,
    private mailService: MailService,
  ) {}

  // ============================================================================
  // REGISTER WORKER
  // ============================================================================

  async registerWorker(email: string, password: string, phone?: string, ipAddress?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Check if email already exists
      const existingByEmail = await tx.user.findUnique({ where: { email } });
      if (existingByEmail) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED, message: 'Email already registered' });
      }

      // Check if phone already exists (when provided)
      if (phone) {
        const existingByPhone = await tx.user.findUnique({ where: { phone } });
        if (existingByPhone) {
          throw new BadRequestException({ code: ERROR_CODES.AUTH_PHONE_ALREADY_REGISTERED, message: 'Phone number already registered' });
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

      // Reject trivially-guessable passwords that still satisfy the DTO regex
      // (e.g. "Password1"). The regex is the first line of defense; this is the
      // second. Checked inside the transaction so it short-circuits before any
      // account record is created.
      if (isCommonPassword(password)) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_PASSWORD_TOO_COMMON, message: 'This password is too common and easily guessed. Please choose a stronger password.' });
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

      // Store refresh token for rotation tracking. Must run on `tx` (not
      // this.prisma) so the FK to the just-created — and still uncommitted —
      // user row resolves on the same connection; otherwise the insert hits a
      // foreign-key violation and rolls the whole registration back.
      await this.storeRefreshToken(user.id, tokens.refreshToken, undefined, tx);

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
      throw new BadRequestException({ code: ERROR_CODES.AUTH_INVALID_ADMIN_CODE, message: 'Invalid admin registration code' });
    }

    return this.prisma.$transaction(async (tx) => {
      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED, message: 'Email already registered' });
      }

      // Reject trivially-guessable passwords that still satisfy the DTO regex
      // (e.g. "Password1"). The regex is the first line of defense; this is the
      // second. Checked inside the transaction so it short-circuits before any
      // account record is created.
      if (isCommonPassword(password)) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_PASSWORD_TOO_COMMON, message: 'This password is too common and easily guessed. Please choose a stronger password.' });
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
        throw new BadRequestException({ code: ERROR_CODES.AUTH_ADMIN_ONLY_CREATE_SUPPORT, message: 'Only admins can create support users' });
      }

      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED, message: 'Email already registered' });
      }

      // Reject trivially-guessable passwords that still satisfy the DTO regex
      // (e.g. "Password1"). The regex is the first line of defense; this is the
      // second. Checked inside the transaction so it short-circuits before any
      // account record is created.
      if (isCommonPassword(password)) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_PASSWORD_TOO_COMMON, message: 'This password is too common and easily guessed. Please choose a stronger password.' });
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
    try {
      return await this.prisma.$transaction(async (tx) => {
      // Check if email already exists
      const existingByEmail = await tx.user.findUnique({ where: { email } });
      if (existingByEmail) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED, message: 'Email already registered' });
      }

      // Check if phone already exists
      if (phone) {
        const existingByPhone = await tx.user.findUnique({ where: { phone } });
        if (existingByPhone) {
          throw new BadRequestException({ code: ERROR_CODES.AUTH_PHONE_ALREADY_REGISTERED, message: 'Phone number already registered' });
        }
      }

      // Check if KvK already exists
      const existingEmployer = await tx.employer.findUnique({
        where: { kvkNumber: company.kvkNumber }
      });
      if (existingEmployer) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_KVK_ALREADY_EXISTS, message: 'Company with this KvK number already exists' });
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

      // Reject trivially-guessable passwords that still satisfy the DTO regex
      // (e.g. "Password1"). The regex is the first line of defense; this is the
      // second. Checked inside the transaction so it short-circuits before any
      // account record is created.
      if (isCommonPassword(password)) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_PASSWORD_TOO_COMMON, message: 'This password is too common and easily guessed. Please choose a stronger password.' });
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
    } catch (error: any) {
      // Race condition: two concurrent registrations with the same KvK number
      // both pass the findUnique uniqueness check before either commits. The
      // DB-level @unique constraint on Employer.kvkNumber catches the duplicate
      // and rejects the second create with Prisma error P2002. Map it to a
      // clean 400 instead of surfacing as an unhandled 500.
      if (error?.code === 'P2002' && error?.meta?.target?.includes('kvkNumber')) {
        throw new BadRequestException({ code: ERROR_CODES.AUTH_KVK_ALREADY_EXISTS, message: 'Company with this KvK number already exists' });
      }
      throw error;
    }
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, message: 'Invalid credentials' });
    }

    if (user.deletedAt) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_ACCOUNT_DELETED, message: 'Account has been deleted' });
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_ACCOUNT_BANNED, message: 'Account has been banned' });
    }

    // TRUST LAYER: Check if user is blacklisted
    const isBlacklisted = await this.trustService.isBlacklisted('USER', user.id);
    if (isBlacklisted) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_ACCOUNT_SUSPENDED, message: 'Account has been suspended' });
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
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, message: 'Invalid credentials' });
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

  async sendVerificationCode(userId: string, type: 'EMAIL' | 'PHONE'): Promise<{ message: string }> {
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

    // Deliver the code via a side channel (email now; SMS is a future hook).
    // SECURITY: the raw code is NEVER returned in the API response — it was
    // previously, which let anyone who could call the endpoint read another
    // user's verification code. In dev/test the MailService captures the code
    // in its in-memory outbox for retrieval; in production this is the swap
    // point for a real email/SMS provider.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, preferredLocale: true },
    });
    if (user) {
      const to = type === 'EMAIL' ? user.email : user.phone;
      if (to) {
        this.mailService.sendVerificationCode(to, rawCode, type, user.preferredLocale);
      }
    }

    return { message: `Verification code sent for ${type.toLowerCase()} verification.` };
  }

  // ============================================================================
  // VERIFY EMAIL
  // SECURITY: The verification code is now validated against a stored hash.
  // Previously this method accepted any code and immediately set emailVerified
  // to true — a bypass that let anyone verify any email without proof.
  // ============================================================================

  async verifyEmail(userId: string, code: string) {
    if (!code) {
      throw new BadRequestException({ code: ERROR_CODES.AUTH_VERIFICATION_CODE_REQUIRED, message: 'Verification code is required' });
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
      throw new BadRequestException({ code: ERROR_CODES.AUTH_VERIFICATION_CODE_NONE, message: 'No valid verification code found. Please request a new one.' });
    }

    // Validate the code using constant-time comparison. crypto.timingSafeEqual
    // throws if the buffers differ in length, so guard against a missing or
    // malformed stored hash first (which is still an invalid-code outcome).
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (
      typeof verification.codeHash !== 'string' ||
      codeHash.length !== verification.codeHash.length ||
      !crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(verification.codeHash))
    ) {
      throw new BadRequestException({ code: ERROR_CODES.AUTH_VERIFICATION_CODE_INVALID, message: 'Invalid verification code' });
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
      throw new BadRequestException({ code: ERROR_CODES.AUTH_VERIFICATION_CODE_REQUIRED, message: 'Verification code is required' });
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
      throw new BadRequestException({ code: ERROR_CODES.AUTH_VERIFICATION_CODE_NONE, message: 'No valid verification code found. Please request a new one.' });
    }

    // Validate the code using constant-time comparison (see verifyEmail).
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    if (
      typeof verification.codeHash !== 'string' ||
      codeHash.length !== verification.codeHash.length ||
      !crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(verification.codeHash))
    ) {
      throw new BadRequestException({ code: ERROR_CODES.AUTH_VERIFICATION_CODE_INVALID, message: 'Invalid verification code' });
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

  /**
   * Update the authenticated user's preferred UI/email locale (i18n).
   * Persisted so server-side email rendering (nestjs-i18n) and future sessions
   * use the user's chosen language. The frontend also reads this via /auth/me
   * to initialize its locale cookie.
   */
  async updatePreferredLocale(userId: string, preferredLocale: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferredLocale },
      select: { id: true, preferredLocale: true },
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
      // A unique jti makes every refresh token (and therefore its stored
      // tokenHash) unique even when two tokens are issued for the same user
      // within the same second. Without it, jwt.sign is deterministic per
      // (payload, secret, second), so a register-then-login in the same second
      // produced an identical token and violated the tokenHash unique
      // constraint on the second insert.
      { expiresIn: '7d', algorithm: 'HS256', jwtid: crypto.randomUUID() }
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
  private async storeRefreshToken(
    userId: string,
    refreshToken: string,
    familyId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const tokenHash = this.hashToken(refreshToken);
    const fid = familyId || crypto.randomUUID();
    const client = tx ?? this.prisma;
    await client.refreshToken.create({
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
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_REFRESH_TOKEN_REQUIRED, message: 'Refresh token is required' });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_REFRESH_SECRET environment variable is required in production'); })() : 'dev-refresh-secret-key-not-for-production');

    // Step 1: Verify the JWT
    let payload: any;
    try {
      payload = jwt.verify(refreshToken, refreshSecret, { algorithms: ['HS256'] }) as any;
    } catch (error) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID, message: 'Invalid or expired refresh token' });
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_TOKEN_TYPE_INVALID, message: 'Invalid token type' });
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

      throw new ForbiddenException({ code: ERROR_CODES.AUTH_REFRESH_TOKEN_REVOKED, message: 'Refresh token has been revoked. Please log in again.' });
    }

    // SECURITY (E-M2): A refresh token that verifies cryptographically but is NOT
    // tracked in the DB must not be honored. Previously, a null storedToken fell
    // through to "issue a new pair", which let an unknown/untracked token (a
    // forged token, a token from before rotation tracking, or one whose row was
    // deleted on logout/password change) be replayed into a fresh session. Only
    // tokens whose hash is present and active may rotate. Anything else forces a
    // clean re-login.
    if (!storedToken) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID, message: 'Invalid or expired refresh token' });
    }

    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_USER_NOT_FOUND, message: 'User not found' });
    }

    if (user.deletedAt) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_ACCOUNT_DELETED, message: 'Account has been deleted' });
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_ACCOUNT_BANNED, message: 'Account has been banned' });
    }

    const isBlacklisted = await this.trustService.isBlacklisted('USER', user.id);
    if (isBlacklisted) {
      throw new UnauthorizedException({ code: ERROR_CODES.AUTH_ACCOUNT_SUSPENDED, message: 'Account has been suspended' });
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
   * SECURITY: The raw token is never returned in the API response. It is
   * delivered via the MailService (email side channel). In dev/test the
   * MailService captures the reset link in its in-memory outbox for
   * retrieval; in production it is the swap point for a real provider.
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

    // Deliver the reset link via email (side channel). The raw token is never
    // returned in the API response. In dev/test the MailService captures the
    // link in its in-memory outbox for retrieval; in production this is the
    // swap point for a real email provider (AWS SES / SendGrid / SMTP).
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    this.mailService.sendPasswordReset(user.email, resetUrl, user.preferredLocale);

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
      throw new BadRequestException({ code: ERROR_CODES.AUTH_RESET_TOKEN_INVALID, message: 'Invalid or expired reset token' });
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Clean up expired token
      await this.prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new BadRequestException({ code: ERROR_CODES.AUTH_RESET_TOKEN_EXPIRED, message: 'Reset token has expired. Please request a new one.' });
    }

    // Check if token has already been used (one-time use)
    if (resetToken.usedAt) {
      throw new BadRequestException({ code: ERROR_CODES.AUTH_RESET_TOKEN_USED, message: 'Reset token has already been used. Please request a new one.' });
    }

    // Reject trivially-guessable new passwords (same blocklist as registration).
    if (isCommonPassword(newPassword)) {
      throw new BadRequestException({ code: ERROR_CODES.AUTH_PASSWORD_TOO_COMMON, message: 'This password is too common and easily guessed. Please choose a stronger password.' });
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
