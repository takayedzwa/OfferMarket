import { Controller, Get, Post, Delete, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { RetentionService } from './retention.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import {
  RecordConsentDto,
  WithdrawConsentDto,
  CreateDataSubjectRequestDto,
  CreateDataExportDto,
  CreateDataDeletionDto,
  ConfirmDataDeletionDto,
  SetProcessingRestrictionDto,
  RectificationRequestDto,
  CreateBreachNotificationDto,
  UpdateBreachNotificationDto,
  ProcessDataSubjectRequestDto,
} from './dto/privacy.dto';
import { ConsentType, ExportFormat } from '@prisma/client';

@Controller('privacy')
export class PrivacyController {
  constructor(
    private readonly privacyService: PrivacyService,
    private readonly retentionService: RetentionService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Helper: Extract the authenticated user's ID from the JWT.
   * This prevents users from accessing other users' data by passing
   * a different userId in query params — a GDPR security requirement.
   */
  private getAuthenticatedUserId(req: any): string {
    return req.user?.id || req.user?.sub || req.user?.userId;
  }

  // ============================================================================
  // CONSENT MANAGEMENT
  // ============================================================================

  @Get('consents')
  @UseGuards(JwtAuthGuard)
  async getUserConsents(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.getUserConsents(userId);
  }

  @Get('consents/status')
  @UseGuards(JwtAuthGuard)
  async getConsentStatus(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.getRequiredConsents(userId);
  }

  @Post('consents')
  @UseGuards(JwtAuthGuard)
  async recordConsent(
    @Body() dto: RecordConsentDto,
    @Request() req: any,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0];
    const userAgent = req?.headers?.['user-agent'];

    return this.privacyService.recordConsent(
      userId,
      dto.consentType,
      dto.legalBasis,
      dto.version,
      ipAddress,
      userAgent,
    );
  }

  @Delete('consents/:consentType')
  @UseGuards(JwtAuthGuard)
  async withdrawConsent(
    @Param('consentType') consentType: ConsentType,
    @Request() req: any,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.withdrawConsent(userId, consentType);
  }

  // ============================================================================
  // DATA SUBJECT RIGHTS
  // ============================================================================

  @Get('my-data')
  @UseGuards(JwtAuthGuard)
  async getMyData(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.gatherAllUserData(userId);
  }

  @Post('export')
  @UseGuards(JwtAuthGuard)
  async requestDataExport(
    @Request() req: any,
    @Body() dto?: CreateDataExportDto,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.requestDataExport(
      userId,
      dto?.format || ExportFormat.JSON,
      dto?.dataCategories,
    );
  }

  @Get('export/status')
  @UseGuards(JwtAuthGuard)
  async getExportStatus(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.getExportStatus(userId);
  }

  @Get('export/:id')
  @UseGuards(JwtAuthGuard)
  async downloadExport(@Param('id') id: string, @Request() req: any) {
    const data = await this.privacyService.processDataExport(id);
    return data;
  }

  @Post('request/access')
  @UseGuards(JwtAuthGuard)
  async requestAccess(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.requestDataExport(userId);
  }

  @Post('request/rectification')
  @UseGuards(JwtAuthGuard)
  async requestRectification(
    @Request() req: any,
    @Body() dto: RectificationRequestDto,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.requestRectification(userId, dto.field, dto.correctedValue, dto.reason);
  }

  @Post('request/erasure')
  @UseGuards(JwtAuthGuard)
  async requestErasure(
    @Request() req: any,
    @Body() dto?: CreateDataDeletionDto,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.requestDeletion(userId, dto?.reason);
  }

  @Post('request/erasure/:id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmErasure(
    @Request() req: any,
    @Param('id') requestId: string,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.confirmDeletion(userId, requestId);
  }

  @Post('request/erasure/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelErasure(
    @Request() req: any,
    @Param('id') requestId: string,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.cancelDeletion(userId, requestId);
  }

  @Post('request/restrict')
  @UseGuards(JwtAuthGuard)
  async requestRestriction(
    @Request() req: any,
    @Body() dto: SetProcessingRestrictionDto,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    const flags = await this.privacyService.setProcessingRestriction(userId, dto.restricted);
    return {
      processingRestricted: flags.processingRestricted,
      processingRestrictedAt: flags.processingRestrictedAt?.toISOString() ?? null,
    };
  }

  @Delete('request/restrict')
  @UseGuards(JwtAuthGuard)
  async removeRestriction(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    const flags = await this.privacyService.setProcessingRestriction(userId, false);
    return {
      processingRestricted: flags.processingRestricted,
      processingRestrictedAt: flags.processingRestrictedAt?.toISOString() ?? null,
    };
  }

  @Post('request/portability')
  @UseGuards(JwtAuthGuard)
  async requestPortability(
    @Request() req: any,
    @Query('format') format?: ExportFormat,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.requestPortability(userId, format);
  }

  @Post('request/object')
  @UseGuards(JwtAuthGuard)
  async requestObject(
    @Request() req: any,
    @Body() body: { processingType: string; reason?: string },
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.objectToProcessing(userId, body.processingType, body.reason);
  }

  @Get('requests')
  @UseGuards(JwtAuthGuard)
  async getUserRequests(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.getUserRequests(userId);
  }

  // ============================================================================
  // PRIVACY POLICY & TERMS
  // ============================================================================

  @Get('privacy-policy')
  async getPrivacyPolicy(@Query('version') version?: string) {
    return this.privacyService.getPrivacyPolicy(version);
  }

  @Get('terms-of-service')
  async getTermsOfService(@Query('version') version?: string) {
    return this.privacyService.getTermsOfService(version);
  }

  // ============================================================================
  // PROCESSING RESTRICTION CHECK
  // ============================================================================

  @Get('restriction-status')
  @UseGuards(JwtAuthGuard)
  async getRestrictionStatus(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    const flags = await this.privacyService.getUserGdprFlags(userId);
    return {
      processingRestricted: flags?.processingRestricted || false,
      processingRestrictedAt: flags?.processingRestrictedAt?.toISOString() ?? null,
    };
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  @Get('admin/requests')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('requestType') requestType?: string,
    @Query('userId') userId?: string,
  ) {
    return this.privacyService.getAllRequests(
      parseInt(page, 10),
      parseInt(limit, 10),
      { status, requestType, userId },
    );
  }

  @Patch('admin/requests/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async processRequest(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ProcessDataSubjectRequestDto,
  ) {
    const adminId = this.getAuthenticatedUserId(req);
    return this.privacyService.processRequest(id, adminId, dto);
  }

  @Get('admin/breaches')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getBreaches(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.privacyService.getBreaches(parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('admin/breaches')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reportBreach(
    @Body() dto: CreateBreachNotificationDto,
    @Request() req: any,
  ) {
    const adminId = this.getAuthenticatedUserId(req);
    return this.privacyService.reportBreach({
      title: dto.title,
      description: dto.description,
      severity: dto.severity as any,
      affectedDataCategories: dto.affectedDataCategories,
      rootCause: dto.rootCause,
      remediationSteps: dto.remediationSteps,
      createdById: adminId,
    });
  }

  @Patch('admin/breaches/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateBreach(
    @Param('id') id: string,
    @Body() dto: UpdateBreachNotificationDto,
  ) {
    return this.privacyService.updateBreach(id, dto);
  }

  @Get('admin/retention-policies')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getRetentionPolicies() {
    return this.privacyService.getRetentionPolicies();
  }

  @Get('admin/processing-activities')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getProcessingActivities() {
    return this.privacyService.getProcessingActivities();
  }

  @Get('admin/ropa')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getRopa() {
    const [activities, policies] = await Promise.all([
      this.privacyService.getProcessingActivities(),
      this.privacyService.getRetentionPolicies(),
    ]);
    return { processingActivities: activities, retentionPolicies: policies };
  }

  @Post('admin/seed')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async seedGdprData() {
    await this.privacyService.seedRetentionPolicies();
    await this.privacyService.seedProcessingActivities();
    return { success: true, message: 'GDPR data seeded successfully' };
  }

  @Post('admin/retention/run')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async runRetentionTasks() {
    const results = await this.retentionService.runAllRetentionTasks();
    return { success: true, results };
  }

  @Get('admin/retention/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getRetentionStatus() {
    const pendingDeletions = await this.prisma.dataDeletionRequest.count({
      where: { status: 'CONFIRMED' },
    });
    const pendingExports = await this.prisma.dataExportRequest.count({
      where: { status: 'PROCESSING' },
    });
    const totalPolicies = await this.prisma.dataRetentionPolicy.count();
    return { pendingDeletions, pendingExports, totalPolicies: totalPolicies };
  }
}