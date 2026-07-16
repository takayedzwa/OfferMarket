import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, BadRequestException, DefaultValuePipe, ParseIntPipe, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { EmployersService } from './employers.service';

@Controller('employers')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProfile(@Body() createDto: any, @Request() req: any) {
    const userId = req.user.id;
    return this.employersService.createEmployerProfile(userId, createDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req: any) {
    const userId = req.user.id;
    return this.employersService.getEmployerProfile(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Body() updateDto: any, @Request() req: any) {
    const userId = req.user.id;
    return this.employersService.updateEmployerProfile(userId, updateDto);
  }

  @Get('me/verification')
  @UseGuards(JwtAuthGuard)
  async getVerificationStatus(@Request() req: any) {
    const userId = req.user.id;
    return this.employersService.getVerificationStatus(userId);
  }

  // ============================================================================
  // PUBLIC EMPLOYER REPUTATION ENDPOINTS
  // ============================================================================

  /**
   * GET /employers/:id/reputation
   * Get public reputation data for an employer
   */
  @Get(':id/reputation')
  async getEmployerReputation(@Param('id') employerId: string) {
    return this.employersService.getEmployerReputation(employerId);
  }

  /**
   * GET /employers/:id/ratings
   * Get all published ratings for an employer
   */
  @Get(':id/ratings')
  async getEmployerRatings(
    @Param('id') employerId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number
  ) {
    return this.employersService.getEmployerRatings(employerId, limit, offset);
  }
}
