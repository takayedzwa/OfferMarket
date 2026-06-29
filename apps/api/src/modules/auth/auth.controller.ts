import { Controller, Post, Body, BadRequestException, Get, Query, Headers, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

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
  async registerWorker(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('phone') phone?: string,
    @Request() req?: any,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const ipAddress = this.getClientIp(req);
    return this.authService.registerWorker(email, password, phone, ipAddress);
  }

  // ============================================================================
  // REGISTER ADMIN (Internal - requires admin code)
  // ============================================================================

  @Post('register/admin')
  async registerAdmin(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('adminCode') adminCode: string
  ) {
    if (!email || !password || !adminCode) {
      throw new BadRequestException('Email, password, and admin code are required');
    }

    return this.authService.registerAdmin(email, password, adminCode);
  }

  // ============================================================================
  // REGISTER SUPPORT (Admin only)
  // ============================================================================

  @Post('register/support')
  async registerSupport(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('adminUserId') adminUserId: string
  ) {
    if (!email || !password || !adminUserId) {
      throw new BadRequestException('Email, password, and admin user ID are required');
    }

    return this.authService.registerSupport(email, password, adminUserId);
  }

  // ============================================================================
  // REGISTER EMPLOYER
  // ============================================================================

  @Post('register/employer')
  async registerEmployer(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('phone') phone: string,
    @Body('company') company: { name: string; kvkNumber: string; website?: string },
    @Request() req?: any,
  ) {
    if (!email || !password || !phone || !company) {
      throw new BadRequestException('All fields are required');
    }

    const ipAddress = this.getClientIp(req);
    return this.authService.registerEmployer(email, password, phone, company, ipAddress);
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  @Post('login')
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
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    // TODO: Implement token refresh
    return { message: 'Not implemented yet' };
  }
}
