import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Headers, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

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

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  @Get('dashboard-stats')
  @UseGuards(SimpleAuthGuard)
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  @Get('users')
  @UseGuards(AdminGuard)
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { role, status, search },
    );
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users/:id/suspend')
  async suspendUser(
    @Param('id') id: string,
    @Headers('x-user-id') adminUserId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendUser(id, adminUserId, reason);
  }

  @Post('users/:id/ban')
  async banUser(
    @Param('id') id: string,
    @Headers('x-user-id') adminUserId: string,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.banUser(id, adminUserId, reason);
  }

  @Post('users/:id/restore')
  async restoreUser(
    @Param('id') id: string,
    @Headers('x-user-id') adminUserId: string,
  ) {
    return this.adminService.restoreUser(id, adminUserId);
  }

  // ============================================================================
  // EMPLOYER VERIFICATION
  // ============================================================================

  @Get('employers')
  async getEmployers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('verificationStatus') verificationStatus?: string,
  ) {
    const skip = (page ? parseInt(page) : 1) - 1;
    const take = limit ? parseInt(limit) : 20;

    const where: any = {};
    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    const [employers, total] = await Promise.all([
      this.adminService['prisma'].employer.findMany({
        where,
        skip: skip * take,
        take,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.adminService['prisma'].employer.count({ where }),
    ]);

    return {
      employers,
      pagination: {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        total,
        totalPages: Math.ceil(total / (limit ? parseInt(limit) : 20)),
      },
    };
  }

  @Get('employers/:id')
  async getEmployer(@Param('id') id: string) {
    return this.adminService['prisma'].employer.findUnique({
      where: { id },
      include: {
        user: true,
        offersSent: {
          include: { worker: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        ratings: true,
      },
    });
  }

  @Get('verification-queue')
  async getVerificationQueue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getVerificationQueue(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('employers/:id/verify')
  async verifyEmployer(
    @Param('id') id: string,
    @Headers('x-user-id') adminUserId: string,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.verifyEmployer(id, adminUserId, notes);
  }

  @Post('employers/:id/reject')
  async rejectEmployer(
    @Param('id') id: string,
    @Headers('x-user-id') adminUserId: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectEmployer(id, adminUserId, reason);
  }

  // ============================================================================
  // PLATFORM SETTINGS
  // ============================================================================

  @Get('settings')
  async getSettings(@Query('category') category?: string) {
    return this.adminService.getSettings(category);
  }

  @Patch('settings')
  async updateSetting(
    @Body('key') key: string,
    @Body('value') value: any,
    @Headers('x-user-id') adminUserId: string,
    @Body('category') category?: string,
  ) {
    return this.adminService.updateSetting(key, value, adminUserId, category);
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getAuditLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      { userId, action, entityType, dateFrom, dateTo },
    );
  }

  @Get('admin-actions')
  async getAdminActions(
    @Query('adminId') adminId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAdminActions(
      adminId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  // ============================================================================
  // OFFERS MONITORING
  // ============================================================================

  @Get('offers')
  @UseGuards(SimpleAuthGuard)
  async getAllOffers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('workerId') workerId?: string,
    @Query('employerId') employerId?: string,
  ) {
    return this.adminService.getAllOffers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { status, workerId, employerId },
    );
  }

  @Get('offers/:id')
  @UseGuards(SimpleAuthGuard)
  async getOfferById(@Param('id') id: string) {
    return this.adminService.getOfferById(id);
  }
}
