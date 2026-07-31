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
import { Throttle } from '@nestjs/throttler';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  SubmitEmployerVerificationDto,
  SubmitEmployerDocumentDto,
  ReviewEmployerVerificationDto,
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
  // A-C1: employer verification status is internal trust data — restrict to
  // staff roles rather than leaving it open to any authenticated user, which
  // allowed IDOR enumeration of any employer's verification state.
  @Roles('ADMIN', 'SUPPORT')
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
  // FRAUD PREVENTION ENDPOINTS
  // ============================================================================

  /**
   * POST /trust/suspicious-activity
   * Report suspicious activity
   */
  // A-C1: reporting suspicious activity feeds the internal fraud-detection
  // system. Leaving it open to any authenticated user allowed reconnaissance
  // and poisoning of fraud signals — restrict to staff roles.
  @Roles('ADMIN', 'SUPPORT')
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
  @Throttle({ short: { ttl: 60000, limit: 20 } })
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
  @Throttle({ short: { ttl: 60000, limit: 20 } })
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
  @Throttle({ short: { ttl: 60000, limit: 20 } })
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
  // E-L2: diagnostic/admin endpoint — restrict to staff roles rather than
  // leaving it open to any authenticated user.
  @Roles('ADMIN', 'SUPPORT')
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
  // E-L2: reputation recalculation is an admin/diagnostic operation — restrict
  // to staff roles rather than leaving it open to any authenticated user.
  @Roles('ADMIN', 'SUPPORT')
  @Post('reputation/calculate')
  async calculateReputationScore(@Body() dto: CalculateReputationScoreDto) {
    return this.trustService.calculateReputationScore(dto);
  }

  /**
   * GET /trust/reputation/employer/:employerId
   * Get employer reputation score
   */
  // A-C1: reputation scoring is an internal trust signal — restrict to staff
  // roles rather than exposing any entity's reputation to any user.
  @Roles('ADMIN', 'SUPPORT')
  @Get('reputation/employer/:employerId')
  async getEmployerReputation(@Param('employerId') employerId: string) {
    return this.trustService.calculateReputationScore({ employerId });
  }

  /**
   * GET /trust/reputation/worker/:workerId
   * Get worker reputation score
   */
  // A-C1: worker reputation is an internal trust signal — restrict to staff
  // roles rather than exposing any worker's reputation to any user.
  @Roles('ADMIN', 'SUPPORT')
  @Get('reputation/worker/:workerId')
  async getWorkerReputation(@Param('workerId') workerId: string) {
    return this.trustService.calculateReputationScore({ workerId });
  }

  /**
   * GET /trust/score/:entityType/:entityId
   * Get trust score for entity
   */
  // A-C1: trust scores are internal fraud-detection signals — restrict to
  // staff roles rather than leaving them open to any authenticated user.
  @Roles('ADMIN', 'SUPPORT')
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
  // E-L2: automated-detection endpoints are diagnostic/admin operations —
  // restrict to staff roles.
  @Roles('ADMIN', 'SUPPORT')
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
  @Roles('ADMIN', 'SUPPORT')
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
