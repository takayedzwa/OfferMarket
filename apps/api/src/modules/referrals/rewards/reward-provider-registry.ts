// ============================================================================
// REWARD PROVIDER REGISTRY
// ============================================================================
// Maps `ReferralReward.rewardProvider` ids to implementations. A future
// gift-card vendor registers its provider here (single line) and reward rows
// created with that provider id are fulfilled by it — the referral service
// stays vendor-agnostic.

import { Injectable } from '@nestjs/common';
import { ReferralRewardProvider } from './reward-provider';
import { ManualRewardProvider } from './manual-reward-provider';

@Injectable()
export class RewardProviderRegistry {
  private readonly providers = new Map<string, ReferralRewardProvider>();

  constructor(private readonly manual: ManualRewardProvider) {
    this.register(this.manual);
  }

  register(provider: ReferralRewardProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`RewardProvider "${provider.id}" is already registered`);
    }
    this.providers.set(provider.id, provider);
  }

  /** Resolve a provider; unknown ids fall back to manual so a misconfigured
   *  setting never bricks fulfillment — an admin can still see and resolve the
   *  reward from the console. */
  resolve(providerId: string): ReferralRewardProvider {
    return this.providers.get(providerId) ?? this.manual;
  }

  /** For the admin console: which providers exist (initially just 'manual'). */
  list(): Array<{ id: string; displayName: string }> {
    return [...this.providers.values()].map(({ id, displayName }) => ({ id, displayName }));
  }
}