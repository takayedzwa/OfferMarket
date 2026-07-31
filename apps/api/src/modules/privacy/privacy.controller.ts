import { Controller, Get, Post, Delete, Patch, Body, Param, Query, Request, UseGuards, Res, NotFoundException } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PrivacyService } from './privacy.service';
import { RetentionService } from './retention.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import { SkipProcessingRestrictionCheck } from '../../decorators/skip-processing-restriction.decorator';
import { BreachStatus } from '@prisma/client';
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
  AutomatedDecisionObjectionDto,
} from './dto/privacy.dto';
import { ConsentType, ExportFormat } from '@prisma/client';
import { parsePage, parseLimit } from '../../common/utils/pagination';

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

  /**
   * Anonymous consent recording — no authentication required.
   *
   * Telecommunicatiewet Art. 11.7a requires that consent be logged even for
   * unauthenticated visitors. This endpoint records consent using IP address
   * and user-agent as the audit trail, since no userId is available.
   */
  @Post('consents/anonymous')
  async recordAnonymousConsent(
    @Body() dto: RecordConsentDto,
    @Request() req: any,
  ) {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0];
    const userAgent = req?.headers?.['user-agent'];

    // SECURITY/FIX: Anonymous cookie consent has no User. Pass null so the
    // Consent row is stored with a NULL user reference. Previously this passed
    // the literal string 'anonymous', which violated the Consent.userId
    // foreign key to User.id (Prisma P2003) and returned HTTP 500.
    return this.privacyService.recordConsent(
      null,
      dto.consentType,
      dto.legalBasis,
      dto.version,
      ipAddress,
      userAgent,
    );
  }

  @Delete('consents/:consentType')
  @UseGuards(JwtAuthGuard)
  @SkipProcessingRestrictionCheck()
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
  @SkipProcessingRestrictionCheck()
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
  @SkipProcessingRestrictionCheck()
  async downloadExport(
    @Param('id') id: string,
    @Query('format') format: ExportFormat,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    const exportData = await this.privacyService.getExportData(id, userId, format || ExportFormat.JSON);

    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
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
  @SkipProcessingRestrictionCheck()
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
  @SkipProcessingRestrictionCheck()
  async requestRestriction(
    @Request() req: any,
    @Body() dto: SetProcessingRestrictionDto,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    const flags = await this.privacyService.setProcessingRestriction(userId, dto.restricted, dto.reason);
    return {
      processingRestricted: flags.processingRestricted,
      processingRestrictedAt: flags.processingRestrictedAt?.toISOString() ?? null,
    };
  }

  @Delete('request/restrict')
  @UseGuards(JwtAuthGuard)
  @SkipProcessingRestrictionCheck()
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
  @SkipProcessingRestrictionCheck()
  async requestObject(
    @Request() req: any,
    @Body() body: { processingType: string; reason?: string },
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.objectToProcessing(userId, body.processingType, body.reason);
  }

  // ============================================================================
  // RIGHT REGARDING AUTOMATED DECISION-MAKING (Article 22)
  // ============================================================================

  @Post('request/automated-decision')
  @UseGuards(JwtAuthGuard)
  @SkipProcessingRestrictionCheck()
  async objectToAutomatedDecision(
    @Request() req: any,
    @Body() dto: AutomatedDecisionObjectionDto,
  ) {
    const userId = this.getAuthenticatedUserId(req);
    return this.privacyService.objectToAutomatedDecision(
      userId,
      dto.decisionType,
      dto.reason,
      dto.requestHumanReview ?? true,
    );
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
  // DATA BREACH NOTIFICATIONS (GDPR Art. 34)
  // ============================================================================

  /**
   * User-facing endpoint to check if they have been affected by a data breach
   * that has been notified to affected data subjects.
   * Only returns breaches that have been marked as NOTIFIED_USERS.
   */
  @Get('breach-notifications')
  @UseGuards(JwtAuthGuard)
  async getUserBreachNotifications(@Request() req: any) {
    const userId = this.getAuthenticatedUserId(req);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Return breaches that have been notified to users, limited to relevant info
    const breaches = await this.prisma.dataBreach.findMany({
      where: {
        status: BreachStatus.NOTIFIED_USERS,
      },
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        affectedDataCategories: true,
        discoveredAt: true,
        remediationSteps: true,
      },
      orderBy: { discoveredAt: 'desc' },
      take: 10,
    });

    return breaches.map(b => ({
      ...b,
      discoveredAt: b.discoveredAt.toISOString(),
    }));
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
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getAllRequests(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('requestType') requestType?: string,
    @Query('userId') userId?: string,
  ) {
    // A-M2: clamp page/limit instead of bare parseInt().
    return this.privacyService.getAllRequests(
      parsePage(page),
      parseLimit(limit),
      { status, requestType, userId },
    );
  }

  @Patch('admin/requests/:id')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async processRequest(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: ProcessDataSubjectRequestDto,
  ) {
    const adminId = this.getAuthenticatedUserId(req);
    return this.privacyService.processRequest(id, adminId, dto);
  }

  @Post('admin/requests/:id/execute-rectification')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async executeRectification(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const adminId = this.getAuthenticatedUserId(req);
    return this.privacyService.executeRectification(id, adminId);
  }

  @Get('admin/breaches')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getBreaches(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.privacyService.getBreaches(parsePage(page), parseLimit(limit));
  }

  @Post('admin/breaches')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
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
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async updateBreach(
    @Param('id') id: string,
    @Body() dto: UpdateBreachNotificationDto,
  ) {
    return this.privacyService.updateBreach(id, dto);
  }

  @Get('admin/retention-policies')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getRetentionPolicies() {
    return this.privacyService.getRetentionPolicies();
  }

  // ============================================================================
  // DATA PROCESSING AGREEMENTS (GDPR Article 28) — Admin
  // ============================================================================

  @Get('admin/processing-agreements')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getProcessingAgreements(@Query('active') active?: string) {
    return this.privacyService.getProcessingAgreements(active !== 'false');
  }

  @Post('admin/processing-agreements')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async createProcessingAgreement(@Body() body: {
    processorName: string;
    processorType: string;
    agreementUrl?: string;
    agreementDate: string;
    expiryDate?: string;
    dataCategories: string[];
  }) {
    return this.privacyService.createProcessingAgreement({
      processorName: body.processorName,
      processorType: body.processorType,
      agreementUrl: body.agreementUrl,
      agreementDate: new Date(body.agreementDate),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      dataCategories: body.dataCategories,
    });
  }

  @Patch('admin/processing-agreements/:id')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async updateProcessingAgreement(
    @Param('id') id: string,
    @Body() body: {
      processorName?: string;
      processorType?: string;
      agreementUrl?: string;
      agreementDate?: string;
      expiryDate?: string;
      dataCategories?: string[];
      isActive?: boolean;
    },
    @Request() req: any,
  ) {
    const adminId = this.getAuthenticatedUserId(req);
    return this.privacyService.updateProcessingAgreement(id, {
      ...body,
      agreementDate: body.agreementDate ? new Date(body.agreementDate) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    });
  }

  @Delete('admin/processing-agreements/:id')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async deactivateProcessingAgreement(@Param('id') id: string) {
    return this.privacyService.deactivateProcessingAgreement(id);
  }

  @Get('admin/processing-activities')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getProcessingActivities() {
    return this.privacyService.getProcessingActivities();
  }

  @Get('admin/ropa')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async getRopa() {
    const [activities, policies] = await Promise.all([
      this.privacyService.getProcessingActivities(),
      this.privacyService.getRetentionPolicies(),
    ]);
    return { processingActivities: activities, retentionPolicies: policies };
  }

  @Post('admin/seed')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async seedGdprData() {
    await this.privacyService.seedRetentionPolicies();
    await this.privacyService.seedProcessingActivities();
    return { success: true, message: 'GDPR data seeded successfully' };
  }

  @Post('admin/retention/run')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
  async runRetentionTasks() {
    const results = await this.retentionService.runAllRetentionTasks();
    return { success: true, results };
  }

  @Get('admin/retention/status')
  @SkipThrottle()
  // E-L1: AdminGuard extends AuthGuard('jwt') and self-authenticates, so it does
  // not need to be paired with JwtAuthGuard — that ran JWT verification twice.
  @UseGuards(AdminGuard)
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