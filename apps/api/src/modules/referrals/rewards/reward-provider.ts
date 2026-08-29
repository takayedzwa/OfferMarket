// ============================================================================
// REWARD PROVIDER ABSTRACTION
// ============================================================================
// The referral system owns referral counting and reward *accounting* — it never
// talks to a gift-card vendor directly. Fulfillment goes through this
// interface: a `ReferralReward` row stores `rewardProvider` + `providerReference`
// + `providerMetadata`, so any future provider (gift-card API, manual
// fulfillment, points system...) plugs in by registering itself in the
// RewardProviderRegistry without schema changes.
//
// Implemented initially by ManualRewardProvider (admins fulfill rewards in the
// console). A real gift-card integration implements this interface and
// registers itself — no other part of the system changes.
//
// Lifecycle: PENDING -> PROCESSING -> FULFILLED | FAILED (retryable);
// admins can also CANCEL a pending reward. See the ReferralReward model.

export interface RewardFulfillmentContext {
  /** Authenticated actor triggering fulfillment (null = automated job). */
  actorUserId?: string | null;
  /** Provider-agnostic view of the reward to fulfill. */
  reward: {
    id: string;
    ownerId: string | null;
    rewardType: string;
    amountMinor: number;
    currency: string;
    sequenceNumber: number;
    // Opaque per-reward payload a provider may have stashed earlier (e.g. a
    // recipient email captured at creation time).
    providerMetadata: Record<string, unknown> | null;
  };
}

export interface RewardFulfillmentResult {
  /** Stable outcome the caller writes back onto the reward row. */
  status: 'FULFILLED' | 'FAILED';
  /** Provider's own reference (order id, card code id, ...) — stored verbatim. */
  providerReference?: string;
  /** Extra provider response data worth persisting (sanitized). */
  providerMetadata?: Record<string, unknown>;
  /** Short sanitized error description when status === 'FAILED'. */
  lastError?: string;
}

export interface ReferralRewardProvider {
  /** Stable identifier persisted as `ReferralReward.rewardProvider`. */
  readonly id: string;

  /** Human-readable name for the admin console. */
  readonly displayName: string;

  /**
   * Fulfill one reward. MUST be idempotent per (reward.id): the system may
   * retry after transient failures. Throw on unexpected errors to leave the
   * reward in PROCESSING for the stale-state reaper, or return FAILED for a
   * known non-retryable business outcome.
   */
  fulfill(ctx: RewardFulfillmentContext): Promise<RewardFulfillmentResult>;
}