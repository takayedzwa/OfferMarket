import { Controller, Post, Body, BadRequestException, Get, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import { AuthService } from './auth.service';
import { RegisterWorkerDto, RegisterEmployerDto, RegisterAdminDto, RegisterSupportDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
// SECURITY (CSRF assessment): authentication is bearer-token based — the
// frontend stores the JWT in localStorage and sends it via the Authorization
// header (see apps/web lib/api.ts). The API never sets or reads auth cookies
// (no res.cookie / cookie-parser / req.cookies anywhere in src/). CSRF attacks
// exploit browsers automatically attaching cookies to cross-site requests;
// since no auth credential is transmitted that way, CSRF protection is not
// applicable here. If cookie-based sessions are ever introduced, SameSite +
// double-submit CSRF tokens must be added at that point.
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Extract IP address from request
   */
  private getClientIp(req: any): string | undefined {
    return req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.headers?.['x-real-ip'];
  }

  /**
   * Extract User-Agent from request
   */
  private getUserAgent(req: any): string | undefined {
    return req?.headers?.['user-agent'];
  }

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================
  // SECURITY: This endpoint now requires JWT authentication. The userId and
  // userRole are extracted from the verified JWT token, preventing IDOR where
  // any authenticated user could retrieve any other user's profile data.
  // ============================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const userId = req.user.id;
    const user = await this.authService.getUserById(userId);
    if (!user) {
      return { error: 'User not found' };
    }
    return {
      id: user.id,
      role: user.role,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }

  // ============================================================================
  // REGISTER WORKER
  // ============================================================================

  @Post('register/worker')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async registerWorker(@Body() dto: RegisterWorkerDto, @Request() req?: any) {
    const ipAddress = this.getClientIp(req);
    return this.authService.registerWorker(dto.email, dto.password, dto.phone, ipAddress);
  }

  // ============================================================================
  // REGISTER ADMIN (Bootstrap only — not for UI use)
  // ============================================================================
  // SECURITY: This endpoint is intentionally unauthenticated and gated only by
  // the ADMIN_REGISTRATION_CODE env secret. It exists to seed the FIRST admin
  // before any admin exists to authenticate. Do NOT call this from the admin
  // console — that would require shipping the secret to the browser. Once an
  // admin exists, additional ADMIN/SUPPORT users are created via the
  // admin-guarded, audit-logged POST /admin/users/staff endpoint instead.

  @Post('register/admin')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto.email, dto.password, dto.adminCode);
  }

  // ============================================================================
  // REGISTER SUPPORT (Admin only)
  // ============================================================================
  // SECURITY: This endpoint now requires an authenticated ADMIN JWT. The
  // admin's identity is taken from the verified token (req.user.id) rather
  // than the request body, preventing IDOR where anyone who knew an admin's
  // user ID could create a SUPPORT account. AdminGuard both authenticates the
  // JWT and enforces the ADMIN role.
  // ============================================================================

  @Post('register/support')
  @UseGuards(AdminGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async registerSupport(@Body() dto: RegisterSupportDto, @Request() req: any) {
    return this.authService.registerSupport(dto.email, dto.password, req.user.id);
  }

  // ============================================================================
  // REGISTER EMPLOYER
  // ============================================================================

  @Post('register/employer')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async registerEmployer(@Body() dto: RegisterEmployerDto, @Request() req?: any) {
    const ipAddress = this.getClientIp(req);
    return this.authService.registerEmployer(dto.email, dto.password, dto.phone, dto.company, ipAddress);
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  @Post('login')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Request() req?: any,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const ipAddress = this.getClientIp(req);
    const userAgent = this.getUserAgent(req);
    return this.authService.login(email, password, ipAddress, userAgent);
  }

  // ============================================================================
  // SEND VERIFICATION CODE
  // SECURITY: Authenticated users request a code for their own email/phone.
  // The code is stored as a SHA-256 hash and delivered via the MailService
  // (email side channel). The raw code is NEVER returned in the API response —
  // in dev/test it is retrievable from the MailService in-memory outbox.
  // ============================================================================

  @Post('send-verification-code')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async sendVerificationCode(
    @Request() req: any,
    @Body('type') type: 'EMAIL' | 'PHONE',
  ) {
    const userId = req.user.id;
    return this.authService.sendVerificationCode(userId, type || 'EMAIL');
  }

  // ============================================================================
  // VERIFY EMAIL
  // SECURITY: userId is now extracted from the JWT token instead of the request
  // body, preventing IDOR attacks where any authenticated user could verify
  // another user's email. The verification code is also validated against a
  // stored hash rather than being blindly accepted.
  // ============================================================================

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async verifyEmail(
    @Request() req: any,
    @Body('code') code: string
  ) {
    const userId = req.user.id;
    return this.authService.verifyEmail(userId, code);
  }

  // ============================================================================
  // VERIFY PHONE
  // SECURITY: Same as verify-email — userId comes from JWT, code is validated.
  // ============================================================================

  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async verifyPhone(
    @Request() req: any,
    @Body('phone') phone: string,
    @Body('code') code: string
  ) {
    const userId = req.user.id;
    return this.authService.verifyPhone(userId, phone, code);
  }

  // ============================================================================
  // REFRESH TOKEN
  // ============================================================================

  @Post('refresh')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.refreshToken(refreshToken);
  }

  // ============================================================================
  // LOGOUT (revoke refresh tokens + blacklist access token)
  // SECURITY: Both refresh tokens and the current access token are revoked.
  // Previously, only refresh tokens were revoked, leaving access tokens
  // valid for up to 1 hour after logout.
  // ============================================================================

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    const jti = req.user?.jti;

    // Revoke all refresh tokens
    await this.authService.revokeAllRefreshTokens(userId);

    // Blacklist the current access token so it can't be reused
    if (jti) {
      await this.authService.blacklistAccessToken(userId, jti);
    }

    return { message: 'Logged out successfully' };
  }

  // ============================================================================
  // FORGOT PASSWORD
  // ============================================================================

  @Post('forgot-password')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================

  @Post('reset-password')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
