import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UsePipes, BadRequestException } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { AnonymousProfilePipe } from './pipes/anonymous-profile.pipe';
import { CreateWorkerDto, UpdateWorkerDto, BlockCompanyDto } from './dto/worker.dto';

class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const userRole = request.headers['x-user-role'];

    if (!userId || !userRole) {
      throw new BadRequestException('User authentication required');
    }

    request.user = { id: userId, role: userRole };
    return true;
  }
}

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  // ===========================================================================
  // GET MY PROFILE (Worker's private view)
  // ===========================================================================

  /**
   * GET /workers/me
   *
   * Worker's own profile with ALL data (for editing)
   */
  @Get('me')
  @UseGuards(SimpleAuthGuard)
  async getMyProfile(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.workersService.getPrivateProfile(userId);
  }

  // ===========================================================================
  // CREATE MY PROFILE
  // ===========================================================================

  /**
   * POST /workers
   *
   * Create worker profile
   */
  @Post()
  @UseGuards(SimpleAuthGuard)
  async createProfile(
    @Body() createDto: CreateWorkerDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.workersService.createWorkerProfile(userId, createDto);
  }

  // ===========================================================================
  // UPDATE MY PROFILE
  // ===========================================================================

  /**
   * PATCH /workers/me
   *
   * Update worker profile
   */
  @Patch('me')
  @UseGuards(SimpleAuthGuard)
  async updateProfile(
    @Body() updateDto: UpdateWorkerDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.workersService.updateWorkerProfile(userId, updateDto);
  }

  // ===========================================================================
  // GET PUBLIC PROFILE (Anonymous - for employers)
  // ===========================================================================

  /**
   * GET /workers/:publicId
   *
   * CRITICAL: This returns ANONYMOUS profile only
   * - No name, email, phone
   * - Region only, not exact address
   * - Verified certifications only
   */
  @Get(':publicId')
  @UsePipes(new AnonymousProfilePipe())
  async getPublicProfile(
    @Param('publicId') publicId: string,
    @Query('employerId') employerId?: string
  ) {
    return this.workersService.getPublicProfile(publicId, employerId);
  }

  // ===========================================================================
  // BLOCK COMPANY (Worker Privacy)
  // ===========================================================================

  /**
   * POST /workers/me/block
   *
   * Block a company from viewing profile
   */
  @Post('me/block')
  @UseGuards(SimpleAuthGuard)
  async blockCompany(
    @Body() blockDto: BlockCompanyDto,
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.blockCompany(workerId, blockDto.employerId, blockDto.reason);
  }

  /**
   * DELETE /workers/me/block/:employerId
   *
   * Unblock a company
   */
  @Delete('me/block/:employerId')
  @UseGuards(SimpleAuthGuard)
  async unblockCompany(
    @Param('employerId') employerId: string,
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.unblockCompany(workerId, employerId);
  }

  /**
   * GET /workers/me/blocked
   *
   * List blocked companies
   */
  @Get('me/blocked')
  @UseGuards(SimpleAuthGuard)
  async getBlockedCompanies(@Query('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.getBlockedCompanies(workerId);
  }

  // ===========================================================================
  // UPDATE VISIBILITY
  // ===========================================================================

  /**
   * PATCH /workers/me/visibility
   *
   * Update profile visibility settings
   */
  @Patch('me/visibility')
  @UseGuards(SimpleAuthGuard)
  async updateVisibility(
    @Body('visibility') visibility: 'ALL_VERIFIED' | 'SELECTED_COMPANIES' | 'HIDDEN',
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.updateVisibility(workerId, visibility);
  }

  // ===========================================================================
  // DELETE PROFILE
  // ===========================================================================

  /**
   * DELETE /workers/me
   *
   * Soft delete worker profile
   */
  @Delete('me')
  @UseGuards(SimpleAuthGuard)
  async deleteProfile(@Query('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.deleteWorkerProfile(workerId);
  }
}
