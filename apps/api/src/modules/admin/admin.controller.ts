import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminGuard } from '../../guards/admin.guard';
import { AdminService } from './admin.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { VerifyEmployerDto, RejectEmployerDto } from './dto/verify-employer.dto';
import { CreateStaffUserDto } from './dto/create-staff-user.dto';
import { parsePage, parseLimit } from '../../common/utils/pagination';

@Controller('admin')
// E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
// not need to be paired with JwtAuthGuard — that ran JWT verification twice.
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================================================
  // DASHBOARD
  // ============================================================================

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    // A-M2: clamp page/limit to a safe range instead of bare parseInt().
    return this.adminService.getUsers(
      parsePage(page),
      parseLimit(limit),
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
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.suspendUser(id, req.user.id, reason);
  }

  @Post('users/:id/ban')
  async banUser(
    @Param('id') id: string,
    @Request() req: any,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.banUser(id, req.user.id, reason);
  }

  @Post('users/:id/restore')
  async restoreUser(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.adminService.restoreUser(id, req.user.id);
  }

  // ============================================================================
  // STAFF CREATION (Admin only — create ADMIN or SUPPORT users from console)
  // ============================================================================

  @Post('users/staff')
  async createStaffUser(
    @Body() dto: CreateStaffUserDto,
    @Request() req: any,
  ) {
    // AdminGuard (class-level) authenticates the JWT and enforces ADMIN role.
    // The creator's identity comes from req.user.id and is audit-logged.
    return this.adminService.createStaffUser(dto, req.user.id);
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
    // A-M1: delegate to the service instead of reaching into
    // adminService['prisma'] from the controller. A-M2: clamped pagination.
    return this.adminService.getEmployers(
      parsePage(page),
      parseLimit(limit),
      verificationStatus,
    );
  }

  @Get('employers/:id')
  async getEmployer(@Param('id') id: string) {
    // A-M1: no direct prisma access from the controller.
    return this.adminService.getEmployer(id);
  }

  @Get('verification-queue')
  async getVerificationQueue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getVerificationQueue(
      parsePage(page),
      parseLimit(limit),
    );
  }

  @Post('employers/:id/verify')
  async verifyEmployer(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: VerifyEmployerDto,
  ) {
    // A-H4: validate the body via a DTO class instead of reading @Body('notes')
    // directly (no validation). The VerifyEmployerDto was previously defined
    // but unused.
    return this.adminService.verifyEmployer(id, req.user.id, dto.notes);
  }

  @Post('employers/:id/reject')
  async rejectEmployer(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: RejectEmployerDto,
  ) {
    // A-H4: validate the body via a DTO class so a rejection reason is always
    // present and recorded in the audit trail.
    return this.adminService.rejectEmployer(id, req.user.id, dto.reason);
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
    @Body() dto: UpdateSettingsDto,
    @Request() req: any,
  ) {
    return this.adminService.updateSetting(dto.key, dto.value, req.user.id, dto.category);
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
      parsePage(page),
      parseLimit(limit, 50),
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
      parsePage(page),
      parseLimit(limit, 50),
    );
  }

  // ============================================================================
  // OFFERS MONITORING
  // ============================================================================

  @Get('offers')
  async getAllOffers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('workerId') workerId?: string,
    @Query('employerId') employerId?: string,
  ) {
    return this.adminService.getAllOffers(
      parsePage(page),
      parseLimit(limit),
      { status, workerId, employerId },
    );
  }

  @Get('offers/:id')
  async getOfferById(@Param('id') id: string) {
    return this.adminService.getOfferById(id);
  }
}