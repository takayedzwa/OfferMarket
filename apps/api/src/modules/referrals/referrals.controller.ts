import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ReferralsService } from './referrals.service';
import { frontendBaseUrl } from '../../common/utils/frontend-base-url';
import { parsePage, parseLimit } from '../../common/utils/pagination';

/**
 * User-facing referral endpoints. Authorization model:
 *   - every route operates on req.user.id only; ids are never accepted from the
 *     client, so referral ownership can never be manipulated from outside.
 *   - all progress/reward math happens server-side (see ReferralsService) — the
 *     frontend only renders what it is told.
 */
@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /** Dashboard data: code, shareable link, progress, next reward, history. */
  @Get('me')
  async getMyReferralInfo(@Request() req: any): Promise<any> {
    return this.referralsService.getReferralDashboard(req.user.id, frontendBaseUrl());
  }

  /** Referred users with qualification status (paginated). */
  @Get('me/referrals')
  async getMyReferrals(@Request() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.referralsService.listMyReferrals(req.user.id, parsePage(page), parseLimit(limit, 50));
  }

  /** Reward history (paginated, newest milestone first). */
  @Get('me/rewards')
  async getMyRewards(@Request() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.referralsService.listMyRewards(req.user.id, parsePage(page), parseLimit(limit, 50));
  }
}