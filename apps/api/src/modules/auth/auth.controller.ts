import { Controller, Post, Body, BadRequestException, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================

  @Get('me')
  async getMe(@Query('userId') userId: string, @Query('userRole') userRole: string) {
    return {
      id: userId,
      role: userRole,
      email: 'user@example.com'
    };
  }

  // ============================================================================
  // REGISTER WORKER
  // ============================================================================

  @Post('register/worker')
  async registerWorker(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('phone') phone?: string
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    return this.authService.registerWorker(email, password, phone);
  }

  // ============================================================================
  // REGISTER EMPLOYER
  // ============================================================================

  @Post('register/employer')
  async registerEmployer(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('phone') phone: string,
    @Body('company') company: { name: string; kvkNumber: string; website?: string }
  ) {
    if (!email || !password || !phone || !company) {
      throw new BadRequestException('All fields are required');
    }

    return this.authService.registerEmployer(email, password, phone, company);
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    return this.authService.login(email, password);
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
