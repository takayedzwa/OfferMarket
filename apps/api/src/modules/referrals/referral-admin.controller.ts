import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../../guards/admin.guard';
import { ReferralsService } from './referrals.service';
import { ReferralActionDto, UpdateReferralSettingsDto } from './dto/update-referral-settings.dto';
import { parsePage, parseLimit } from '../../common/utils/pagination';

/**
 * Admin referral-program management. All routes require AdminGuard (self-
 * authenticating JWT + ADMIN check); ordinary users hit 403s here. State-
 * changing actions are additionally audited to adminAction — see the service.
 */
@Controller('admin/referrals')
@UseGuards(AdminGuard)
@Throttle({ short: { ttl: 60000, limit: 60 } })
export class ReferralAdminController {
  constructor(private readonly referralsService: ReferralsService) {}

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  @Get('settings')
  async getSettings() {
    const settings = await this.referralsService.getReferralSettings();
    return { settings, fulfillmentProviders: this.referralsService.listFulfillmentProviders() };
  }

  @Patch('settings')
  async updateSettings(@Body() dto: UpdateReferralSettingsDto, @Request() req: any) {
    return this.referralsService.updateSettings(dto, req.user.id);
  }

  // ============================================================================
  // REFERRALS
  // ============================================================================

  @Get()
  async listReferrals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('referrerId') referrerId?: string,
  ) {
    return this.referralsService.adminListReferrals(parsePage(page), parseLimit(limit, 50), { status, referrerId });
  }

  /** Void a referral attributed/qualified in error (fraud, abuse, mistake). */
  @Post(':id/invalidate')
  async invalidateReferral(@Param('id') id: string, @Request() req: any, @Body() dto: ReferralActionDto) {
    return this.referralsService.invalidateReferral(id, req.user.id, dto.reason ?? '');
  }

  // ============================================================================
  // REWARDS
  // ============================================================================

  @Get('rewards')
  async listRewards(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.referralsService.adminListRewards(parsePage(page), parseLimit(limit, 50), { status, ownerId });
  }

  /** Confirm manual fulfillment (or re-try a FAILED reward) by hand. */
  @Post('rewards/:id/fulfill')
  async fulfillReward(@Param('id') id: string, @Request() req: any) {
    return this.referralsService.fulfillReward(id, req.user.id);
  }

  /** Void a PENDING/FAILED reward (e.g. proven fraud) — FULFILLED is final. */
  @Post('rewards/:id/cancel')
  async cancelReward(@Param('id') id: string, @Request() req: any, @Body() dto: ReferralActionDto) {
    return this.referralsService.cancelReward(id, req.user.id, dto.reason ?? '');
  }
}