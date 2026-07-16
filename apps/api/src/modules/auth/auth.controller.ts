import { Controller, Post, Body, BadRequestException, Get, Query, Headers, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { RegisterWorkerDto, RegisterEmployerDto, RegisterAdminDto, RegisterSupportDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
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

  @Get('me')
  async getMe(@Query('userId') userId: string, @Query('userRole') userRole: string) {
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
      phone: user.phone
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
  // REGISTER ADMIN (Internal - requires admin code)
  // ============================================================================

  @Post('register/admin')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto.email, dto.password, dto.adminCode);
  }

  // ============================================================================
  // REGISTER SUPPORT (Admin only)
  // ============================================================================

  @Post('register/support')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async registerSupport(@Body() dto: RegisterSupportDto) {
    return this.authService.registerSupport(dto.email, dto.password, dto.adminUserId);
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
  // VERIFY EMAIL
  // ============================================================================

  @Post('verify-email')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async verifyEmail(
    @Body('userId') userId: string,
    @Body('code') code: string
  ) {
    return this.authService.verifyEmail(userId, code);
  }

  // ============================================================================
  // VERIFY PHONE
  // ============================================================================

  @Post('verify-phone')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async verifyPhone(
    @Body('userId') userId: string,
    @Body('phone') phone: string,
    @Body('code') code: string
  ) {
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
  // LOGOUT (revoke all refresh tokens)
  // ============================================================================

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    await this.authService.revokeAllRefreshTokens(userId);
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
