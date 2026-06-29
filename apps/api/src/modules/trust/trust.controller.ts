import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Request,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  SubmitEmployerVerificationDto,
  SubmitEmployerDocumentDto,
  ReviewEmployerVerificationDto,
  SubmitWorkerVerificationDto,
  SubmitWorkerDocumentDto,
  SubmitBackgroundCheckDto,
  SubmitReferenceCheckDto,
  ReviewWorkerVerificationDto,
  InitiateIdentityCheckDto,
  SubmitIdentityCheckResultDto,
} from './dto/verification.dto';
import {
  ReportSuspiciousActivityDto,
  ReviewSuspiciousActivityDto,
  CreateFraudIndicatorDto,
  UpdateFraudIndicatorDto,
  DuplicateAccountMatchDto,
  ReviewDuplicateAccountDto,
  AddToBlacklistDto,
  ReviewBlacklistEntryDto,
} from './dto/fraud.dto';
import { CalculateReputationScoreDto } from './dto/reputation.dto';

@Controller('trust')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrustController {
  constructor(private trustService: TrustService) {}

  // ============================================================================
  // EMPLOYER VERIFICATION ENDPOINTS
  // ============================================================================

  /**
   * GET /trust/employers/:employerId/verification
   * Get employer verification status
   */
  @Get('employers/:employerId/verification')
  async getEmployerVerification(@Param('employerId') employerId: string) {
    return this.trustService.getEmployerVerification(employerId);
  }

  /**
   * POST /trust/employers/:employerId/verification
   * Submit employer verification data
   */
  @Post('employers/:employerId/verification')
  async submitEmployerVerification(
    @Param('employerId') employerId: string,
    @Body() dto: SubmitEmployerVerificationDto,
    @Request() req: any,
  ) {
    return this.trustService.submitEmployerVerification(employerId, dto);
  }

  /**
   * POST /trust/employers/:employerId/documents
   * Submit employer verification document
   */
  @Post('employers/:employerId/documents')
  async submitEmployerDocument(
    @Param('employerId') employerId: string,
    @Body() dto: SubmitEmployerDocumentDto,
    @Request() req: any,
  ) {
    return this.trustService.submitEmployerDocument(
      employerId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * POST /trust/employers/:employerId/review
   * Review employer verification (admin only)
   */
  @Post('employers/:employerId/review')
  @Roles('ADMIN')
  async reviewEmployerVerification(
    @Param('employerId') employerId: string,
    @Body() dto: ReviewEmployerVerificationDto,
    @Request() req: any,
  ) {
    return this.trustService.reviewEmployerVerification(
      employerId,
      dto,
      req.user?.userId,
    );
  }

  // ============================================================================
  // WORKER VERIFICATION ENDPOINTS
  // ============================================================================

  /**
   * GET /trust/workers/:workerId/verification
   * Get worker verification status
   */
  @Get('workers/:workerId/verification')
  async getWorkerVerification(@Param('workerId') workerId: string) {
    return this.trustService.getWorkerVerification(workerId);
  }

  /**
   * POST /trust/workers/:workerId/verification
   * Submit worker verification data
   */
  @Post('workers/:workerId/verification')
  async submitWorkerVerification(
    @Param('workerId') workerId: string,
    @Body() dto: SubmitWorkerVerificationDto,
    @Request() req: any,
  ) {
    return this.trustService.submitWorkerVerification(
      workerId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * POST /trust/workers/:workerId/documents
   * Submit worker verification document
   */
  @Post('workers/:workerId/documents')
  async submitWorkerDocument(
    @Param('workerId') workerId: string,
    @Body() dto: SubmitWorkerDocumentDto,
    @Request() req: any,
  ) {
    return this.trustService.submitWorkerDocument(
      workerId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * POST /trust/workers/:workerId/identity-check
   * Initiate identity check
   */
  @Post('workers/:workerId/identity-check')
  async initiateIdentityCheck(
    @Param('workerId') workerId: string,
    @Body() dto: InitiateIdentityCheckDto,
    @Request() req: any,
  ) {
    return this.trustService.initiateIdentityCheck(
      workerId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * PUT /trust/identity-checks/:checkId/result
   * Submit identity check result
   */
  @Put('identity-checks/:checkId/result')
  async submitIdentityCheckResult(
    @Param('checkId') checkId: string,
    @Param('workerId') workerId: string,
    @Body() dto: SubmitIdentityCheckResultDto,
  ) {
    return this.trustService.submitIdentityCheckResult(workerId, checkId, dto);
  }

  /**
   * POST /trust/workers/:workerId/background-check
   * Submit background check
   */
  @Post('workers/:workerId/background-check')
  async submitBackgroundCheck(
    @Param('workerId') workerId: string,
    @Body() dto: SubmitBackgroundCheckDto,
    @Request() req: any,
  ) {
    return this.trustService.submitBackgroundCheck(
      workerId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * PUT /trust/workers/:workerId/background-check/complete
   * Complete background check (admin only)
   */
  @Put('workers/:workerId/background-check/complete')
  @Roles('ADMIN')
  async completeBackgroundCheck(
    @Param('workerId') workerId: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.trustService.completeBackgroundCheck(
      workerId,
      status as any,
      req.user?.userId,
    );
  }

  /**
   * POST /trust/workers/:workerId/reference-check
   * Submit reference check
   */
  @Post('workers/:workerId/reference-check')
  async submitReferenceCheck(
    @Param('workerId') workerId: string,
    @Body() dto: SubmitReferenceCheckDto,
    @Request() req: any,
  ) {
    return this.trustService.submitReferenceCheck(
      workerId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * PUT /trust/workers/:workerId/reference-check/complete
   * Complete reference check (admin only)
   */
  @Put('workers/:workerId/reference-check/complete')
  @Roles('ADMIN')
  async completeReferenceCheck(
    @Param('workerId') workerId: string,
    @Body('status') status: string,
    @Request() req: any,
  ) {
    return this.trustService.completeReferenceCheck(
      workerId,
      status as any,
      req.user?.userId,
    );
  }

  /**
   * POST /trust/workers/:workerId/review
   * Review worker verification (admin only)
   */
  @Post('workers/:workerId/review')
  @Roles('ADMIN')
  async reviewWorkerVerification(
    @Param('workerId') workerId: string,
    @Body() dto: ReviewWorkerVerificationDto,
    @Request() req: any,
  ) {
    return this.trustService.reviewWorkerVerification(
      workerId,
      dto,
      req.user?.userId,
    );
  }

  // ============================================================================
  // FRAUD PREVENTION ENDPOINTS
  // ============================================================================

  /**
   * POST /trust/suspicious-activity
   * Report suspicious activity
   */
  @Post('suspicious-activity')
  async reportSuspiciousActivity(
    @Body() dto: ReportSuspiciousActivityDto,
    @Request() req: any,
  ) {
    return this.trustService.reportSuspiciousActivity(
      dto,
      req.user?.userId,
    );
  }

  /**
   * GET /trust/suspicious-activity
   * Get suspicious activities dashboard
   */
  @Get('suspicious-activity')
  @Roles('ADMIN', 'SUPPORT')
  async getSuspiciousActivitiesDashboard() {
    return this.trustService.getSuspiciousActivitiesDashboard();
  }

  /**
   * PUT /trust/suspicious-activity/:activityId/review
   * Review suspicious activity (admin only)
   */
  @Put('suspicious-activity/:activityId/review')
  @Roles('ADMIN', 'SUPPORT')
  async reviewSuspiciousActivity(
    @Param('activityId') activityId: string,
    @Body() dto: ReviewSuspiciousActivityDto,
    @Request() req: any,
  ) {
    return this.trustService.reviewSuspiciousActivity(
      activityId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * POST /trust/fraud-indicators
   * Create fraud indicator
   */
  @Post('fraud-indicators')
  @Roles('ADMIN', 'SUPPORT')
  async createFraudIndicator(
    @Body() dto: CreateFraudIndicatorDto,
    @Request() req: any,
  ) {
    return this.trustService.createFraudIndicator(dto, req.user?.userId);
  }

  /**
   * PUT /trust/fraud-indicators/:indicatorId
   * Update fraud indicator
   */
  @Put('fraud-indicators/:indicatorId')
  @Roles('ADMIN', 'SUPPORT')
  async updateFraudIndicator(
    @Param('indicatorId') indicatorId: string,
    @Body() dto: UpdateFraudIndicatorDto,
    @Request() req: any,
  ) {
    return this.trustService.updateFraudIndicator(
      indicatorId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * GET /trust/fraud-indicators/:entityType/:entityId
   * Get fraud indicators for entity
   */
  @Get('fraud-indicators/:entityType/:entityId')
  @Roles('ADMIN', 'SUPPORT')
  async getFraudIndicators(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.trustService.getFraudIndicators(entityType, entityId);
  }

  // ============================================================================
  // DUPLICATE ACCOUNT PREVENTION ENDPOINTS
  // ============================================================================

  /**
   * GET /trust/duplicates/check/:userId
   * Check for duplicate accounts
   */
  @Get('duplicates/check/:userId')
  @Roles('ADMIN', 'SUPPORT')
  async checkForDuplicates(@Param('userId') userId: string) {
    return this.trustService.checkForDuplicates(userId);
  }

  /**
   * POST /trust/duplicates
   * Record duplicate account match
   */
  @Post('duplicates')
  @Roles('ADMIN', 'SUPPORT')
  async recordDuplicateMatch(@Body() dto: DuplicateAccountMatchDto) {
    return this.trustService.recordDuplicateMatch(dto);
  }

  /**
   * PUT /trust/duplicates/:primaryUserId/:suspectedUserId/review
   * Review duplicate account
   */
  @Put('duplicates/:primaryUserId/:suspectedUserId/review')
  @Roles('ADMIN')
  async reviewDuplicateAccount(
    @Param('primaryUserId') primaryUserId: string,
    @Param('suspectedUserId') suspectedUserId: string,
    @Body() dto: ReviewDuplicateAccountDto,
    @Request() req: any,
  ) {
    return this.trustService.reviewDuplicateAccount(
      primaryUserId,
      suspectedUserId,
      dto,
      req.user?.userId,
    );
  }

  // ============================================================================
  // BLACKLIST ENDPOINTS
  // ============================================================================

  /**
   * POST /trust/blacklist
   * Add entity to blacklist
   */
  @Post('blacklist')
  @Roles('ADMIN')
  async addToBlacklist(@Body() dto: AddToBlacklistDto, @Request() req: any) {
    return this.trustService.addToBlacklist(dto, req.user?.userId);
  }

  /**
   * PUT /trust/blacklist/:entityType/:entityId/review
   * Review blacklist entry
   */
  @Put('blacklist/:entityType/:entityId/review')
  @Roles('ADMIN')
  async reviewBlacklistEntry(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() dto: ReviewBlacklistEntryDto,
    @Request() req: any,
  ) {
    return this.trustService.reviewBlacklistEntry(
      entityType,
      entityId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * GET /trust/blacklist/check/:entityType/:entityId
   * Check if entity is blacklisted
   */
  @Get('blacklist/check/:entityType/:entityId')
  async isBlacklisted(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const isBlacklisted = await this.trustService.isBlacklisted(
      entityType,
      entityId,
    );
    return { entityType, entityId, isBlacklisted };
  }

  // ============================================================================
  // REPUTATION SCORING ENDPOINTS
  // ============================================================================

  /**
   * POST /trust/reputation/calculate
   * Calculate reputation score
   */
  @Post('reputation/calculate')
  async calculateReputationScore(@Body() dto: CalculateReputationScoreDto) {
    return this.trustService.calculateReputationScore(dto);
  }

  /**
   * GET /trust/reputation/employer/:employerId
   * Get employer reputation score
   */
  @Get('reputation/employer/:employerId')
  async getEmployerReputation(@Param('employerId') employerId: string) {
    return this.trustService.calculateReputationScore({ employerId });
  }

  /**
   * GET /trust/reputation/worker/:workerId
   * Get worker reputation score
   */
  @Get('reputation/worker/:workerId')
  async getWorkerReputation(@Param('workerId') workerId: string) {
    return this.trustService.calculateReputationScore({ workerId });
  }

  /**
   * GET /trust/score/:entityType/:entityId
   * Get trust score for entity
   */
  @Get('score/:entityType/:entityId')
  async getTrustScore(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.trustService.getTrustScore(entityType, entityId);
  }

  // ============================================================================
  // AUTOMATED DETECTION ENDPOINTS
  // ============================================================================

  /**
   * POST /trust/detect/suspicious-login
   * Check for suspicious login
   */
  @Post('detect/suspicious-login')
  async checkSuspiciousLogin(
    @Body('userId') userId: string,
    @Body('ipAddress') ipAddress: string,
    @Body('userAgent') userAgent?: string,
  ) {
    return this.trustService.checkSuspiciousLogin(userId, ipAddress, userAgent);
  }

  /**
   * POST /trust/detect/rapid-account-creation
   * Detect rapid account creation
   */
  @Post('detect/rapid-account-creation')
  async detectRapidAccountCreation(
    @Body('ipAddress') ipAddress: string,
    @Body('timeWindowMinutes') timeWindowMinutes?: number,
  ) {
    return this.trustService.detectRapidAccountCreation(
      ipAddress,
      timeWindowMinutes,
    );
  }
}
