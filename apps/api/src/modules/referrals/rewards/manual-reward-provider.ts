// ============================================================================
// MANUAL REWARD PROVIDER (initial implementation)
// ============================================================================
// A human fulfills the reward — admins confirm in the admin console
// (POST /admin/referrals/rewards/:id/fulfill) and reference is recorded
// (`manual:<adminUserId>`; supports the auditable "who fulfilled this and why"
// question together with the adminAction row). Fulfillment of a real gift card
// happens out of band for now; a future ReferralRewardProvider implementation
// replaces this as the automated path.

import { Injectable } from '@nestjs/common';
import {
  ReferralRewardProvider,
  RewardFulfillmentContext,
  RewardFulfillmentResult,
} from './reward-provider';

export const MANUAL_REWARD_PROVIDER_ID = 'manual';

@Injectable()
export class ManualRewardProvider implements ReferralRewardProvider {
  readonly id = MANUAL_REWARD_PROVIDER_ID;
  readonly displayName = 'Manual fulfillment';

  async fulfill(ctx: RewardFulfillmentContext): Promise<RewardFulfillmentResult> {
    // Idempotent by construction: the service layer only hands a reward to its
    // provider once (PENDING -> PROCESSING via a conditional update), and the
    // manual path is confirmed by an admin — double-issue protection lives in
    // the service's conditional status transition.
    return {
      status: 'FULFILLED',
      providerReference: ctx.actorUserId
        ? `${this.id}:${ctx.actorUserId}`
        : `${this.id}:${ctx.reward.id}`,
      providerMetadata: { fulfilledVia: 'admin_console' },
    };
  }
}