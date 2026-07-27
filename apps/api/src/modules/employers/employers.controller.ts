import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, DefaultValuePipe, ParseIntPipe, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EmployersService } from './employers.service';
import { CreateEmployerProfileDto } from './dto/create-employer-profile.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

@Controller('employers')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  async createProfile(@Body() createDto: CreateEmployerProfileDto, @Request() req: any) {
    const userId = req.user.id;
    return this.employersService.createEmployerProfile(userId, createDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  async getMyProfile(@Request() req: any) {
    const userId = req.user.id;
    return this.employersService.getEmployerProfile(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async updateProfile(@Body() updateDto: UpdateEmployerProfileDto, @Request() req: any) {
    const userId = req.user.id;
    return this.employersService.updateEmployerProfile(userId, updateDto);
  }

  @Get('me/verification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  async getVerificationStatus(@Request() req: any) {
    const userId = req.user.id;
    return this.employersService.getVerificationStatus(userId);
  }

  // ============================================================================
  // EMPLOYER REPUTATION ENDPOINTS (workers only)
  // ----------------------------------------------------------------------------
  // These were previously unauthenticated, letting anyone harvest detailed
  // reputation/ratings data for any employer by id. Restricted to
  // authenticated workers — the audience that legitimately consults employer
  // trust data when evaluating an offer. (Employers view their own data via
  // /employers/me.)
  // ============================================================================

  /**
   * GET /employers/:id/reputation
   * Get reputation data for an employer (workers only)
   */
  @Get(':id/reputation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async getEmployerReputation(@Param('id') employerId: string) {
    return this.employersService.getEmployerReputation(employerId);
  }

  /**
   * GET /employers/:id/ratings
   * Get all published ratings for an employer (workers only)
   */
  @Get(':id/ratings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async getEmployerRatings(
    @Param('id') employerId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ) {
    return this.employersService.getEmployerRatings(employerId, limit, offset);
  }
}
