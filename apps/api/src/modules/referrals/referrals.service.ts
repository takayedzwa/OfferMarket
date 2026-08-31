import { Injectable, BadRequestException, ForbiddenException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { ERROR_CODES } from '../../i18n/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import {
  REFERRAL_SETTINGS_KEY,
  ReferralProgramSettings,
  ReferralQualificationRule,
  parseReferralSettings,
} from './referral-settings';
import { RewardProviderRegistry } from './rewards/reward-provider-registry';
import { NotificationEventType } from '../notifications/notification.types';
import { UpdateReferralSettingsDto } from './dto/update-referral-settings.dto';

/**
 * Authenticated client for settings access inside service transactions — a
 * narrow structural type instead of importing PrismaClient types everywhere.
 */
type SettingsClient = Pick<Prisma.TransactionClient, 'adminSettings'>;
type TxClient = Prisma.TransactionClient;

// ============================================================================
// REFERRALS SERVICE
// ============================================================================
// Owns the referral lifecycle end-to-end:
//
//   1. CODE        — lazily assigned personal code (crypto-random 10 chars
//                    from a 32-char unambiguous alphabet; the unique
//                    constraint + P2002 retry makes assignment race-safe).
//   2. ATTRIBUTION — called inside the registration transaction. Silent by
//                    design: a referral never breaks signup; invalid codes are
//                    ignored (no code enumeration via the register endpoint).
//                    Uniqueness of `referredUserId` enforces first-attribution
//                    wins and one referral per new user.
//   3. QUALIFICATION — after the invitee verifies their email (the
//                    `email_verified` rule). Conditional PENDING->QUALIFIED
//                    update makes concurrent/repeat qualification idempotent.
//   4. REWARDS     — issueRewards() runs in one transaction and row-locks the
//                    referrer (SELECT ... FOR UPDATE) while it reconciles
//                    earned-vs-issued rewards, so concurrent qualifications
//                    cannot double-issue or lose a reward. Idempotent: the
//                    method recomputes target rewards from qualified count on
//                    every call and the (ownerId, sequenceNumber) unique index
//                    backstops the insert.
//   5. FULFILLMENT — provider-agnostic; see rewards/reward-provider.ts.
//                    'manual' (admin console confirmation) is the initial
//                    provider; no gift-card vendor is involved anywhere.
// ============================================================================

// 32 characters: no 0/O or 1/I so a shared code cannot be misread, and 32
// divides 256 so the random-index modulo below is exactly unbiased.
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFERRAL_CODE_LENGTH = 10;
const CODE_ASSIGNMENT_ATTEMPTS = 5;

/** Formats integer minor units for human-readable fallback copy (display only). */
function formatMinor(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amountMinor / 100);
}

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private rewardProviderRegistry: RewardProviderRegistry,
  ) {}

  // ============================================================================
  // SETTINGS
  // ============================================================================

  async getReferralSettings(tx?: SettingsClient): Promise<ReferralProgramSettings> {
    const client = (tx ?? this.prisma) as SettingsClient;
    const row = await client.adminSettings.findUnique({ where: { key: REFERRAL_SETTINGS_KEY } });
    return parseReferralSettings(row?.value);
  }

  /**
   * Admin-only partial update: merges validated fields over the stored config
   * so a partial PATCH can never wipe unset fields. Audited via adminAction.
   */
  async updateSettings(dto: UpdateReferralSettingsDto, adminUserId: string): Promise<ReferralProgramSettings> {
    return this.prisma.$transaction(async (tx) => {
      const previous = await this.getReferralSettings(tx);

      const next: ReferralProgramSettings = {
        enabled: dto.enabled ?? previous.enabled,
        rewardsEnabled: dto.rewardsEnabled ?? previous.rewardsEnabled,
        recurringRewards: dto.recurringRewards ?? previous.recurringRewards,
        threshold: dto.threshold ?? previous.threshold,
        rewardType: dto.rewardType ?? previous.rewardType,
        rewardAmountMinor: dto.rewardAmountMinor ?? previous.rewardAmountMinor,
        rewardCurrency: dto.rewardCurrency ?? previous.rewardCurrency,
        // class-validator's `@IsIn` doesn't narrow the type; the DTO already
        // validated membership against REFERRAL_QUALIFICATION_RULES.
        rule: (dto.qualificationRule as ReferralQualificationRule) ?? previous.rule,
      };

      if (next.enabled && !next.recurringRewards && next.threshold < 1) {
        throw new BadRequestException({
          code: ERROR_CODES.REFERRAL_SETTINGS_INVALID,
          message: 'Threshold must be at least 1',
        });
      }

      const setting = await tx.adminSettings.upsert({
        where: { key: REFERRAL_SETTINGS_KEY },
        create: {
          key: REFERRAL_SETTINGS_KEY,
          category: 'referral',
          value: next as unknown as Prisma.InputJsonValue,
          updatedBy: adminUserId,
        },
        update: {
          value: next as unknown as Prisma.InputJsonValue,
          updatedBy: adminUserId,
        },
      });

      await tx.adminAction.create({
        data: {
          actorId: adminUserId,
          action: 'REFERRAL_SETTINGS_UPDATED',
          entityType: 'settings',
          entityId: setting.id,
          details: { previous, next } as unknown as Prisma.InputJsonValue,
        },
      });

      return next;
    });
  }

  /** Admin console helper: reward fulfillment providers available to issue against. */
  listFulfillmentProviders() {
    return this.rewardProviderRegistry.list();
  }

  // ============================================================================
  // REFERRAL CODE
  // ============================================================================

  /**
   * Generate one unambiguous referral code. With a 32-char alphabet and 10
   * characters the space is ~1.1e15 — collisions are handled by the retry loop
   * in getOrCreateReferralCode, guesses are impractical, and no internal id is
   * exposed.
   */
  private generateReferralCode(): string {
    const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
    let code = '';
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      code += REFERRAL_CODE_ALPHABET[bytes[i] % REFERRAL_CODE_ALPHABET.length];
    }
    return code;
  }

  /**
   * Return the user's personal referral code, assigning one lazily on first
   * use. A P2002 on the unique index means another request just claimed the
   * code we generated — regenerate and retry.
   */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, deletedAt: true },
    });
    if (!user) {
      throw new NotFoundException({ code: ERROR_CODES.AUTH_USER_NOT_FOUND, message: 'User not found' });
    }
    if (user.deletedAt) {
      throw new ForbiddenException({ code: ERROR_CODES.AUTH_ACCOUNT_DELETED, message: 'Account not available' });
    }
    if (user.referralCode) {
      return user.referralCode;
    }

    for (let attempt = 0; attempt < CODE_ASSIGNMENT_ATTEMPTS; attempt++) {
      try {
        const updated = await this.prisma.user.update({
          where: { id: userId },
          data: { referralCode: this.generateReferralCode() },
          select: { referralCode: true },
        });
        return updated.referralCode as string;
      } catch (error: any) {
        if (error?.code === 'P2002') continue;
        throw error;
      }
    }
    throw new InternalServerErrorException({
      code: ERROR_CODES.ERROR_INTERNAL,
      message: 'Could not allocate a referral code, please try again',
    });
  }

  // ============================================================================
  // ATTRIBUTION (registration time)
  // ============================================================================

  /**
   * Attribute a new user to a referrer. Called INSIDE the registration
   * transaction with the tx client.
   *
   * Silent by design — every failure path just skips attribution so a referral
   * can never break or reject a signup:
   *   - program disabled or falsy/unknown code -> skip
   *   - code points at a banned/deleted/nonexistent user -> skip
   *   - self-referral (the signed-up account itself) -> skip
   *   - invitee already attributed (e.g. re-registration) -> skip (P2002)
   * The unique constraint on referredUserId is the concurrency backstop for
   * "first valid attribution wins".
   */
  async attributeReferral(
    tx: TxClient,
    inviteeUserId: string,
    referralCode?: string | null,
    ipAddress?: string,
  ): Promise<void> {
    try {
      const code = (referralCode ?? '').trim().toUpperCase();
      if (!code) return;

      const settings = await this.getReferralSettings(tx);
      if (!settings.enabled) return;

      const referrer = await tx.user.findUnique({
        where: { referralCode: code },
        select: { id: true, status: true, deletedAt: true },
      });
      if (!referrer || referrer.deletedAt || referrer.status !== 'ACTIVE') return;

      // Self-referral guard: the referrer code owner must not be the account
      // being created.
      if (referrer.id === inviteeUserId) return;

      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: inviteeUserId,
          referralCode: code,
          attributedIp: ipAddress ?? null,
        },
      });
      // Referred user already has a referral (unique on referredUserId): the
      // first attribution stands — nothing to do.
    } catch (error: any) {
      if (error?.code === 'P2002') return;
      this.logger.error(
        `Referral attribution failed for invitee ${inviteeUserId}: ${error?.message}`,
        error?.stack,
      );
      // Re-throw P2002-style races are handled above; unexpected DB errors are
      // logged and swallowed here — attribution is best-effort and must never
      // break or reject a signup.
    }
  }

  // ============================================================================
  // QUALIFICATION (the only implemented rule: invitee email verification)
  // ============================================================================

  /**
   * Mark the referral for a freshly-verified invitee as QUALIFIED and run the
   * reward reconciliation. Best-effort: never throws into the caller
   * (auth.service verify flows) — a notification/reward hiccup must not fail
   * email verification. Eligibility is re-derived server-side from the user
   * row; the caller is trusted for nothing but the id.
   */
  async recordQualification(inviteeUserId: string): Promise<void> {
    try {
      const settings = await this.getReferralSettings();
      if (settings.rule !== 'email_verified') {
        // A rule stored in settings that this build does not implement — skip
        // loudly in logs instead of silently counting unqualified referrals.
        this.logger.warn(`Unknown referral qualification rule "${settings.rule}" — skipping qualification`);
        return;
      }

      // Authoritative eligibility check (server-side, never caller-supplied).
      const invitee = await this.prisma.user.findUnique({
        where: { id: inviteeUserId },
        select: { emailVerified: true, firstName: true },
      });
      if (!invitee?.emailVerified) return;

      // Idempotent PENDING -> QUALIFIED transition: a duplicate verification
      // or a race between the code and magic-link endpoints updates 0 rows.
      const updated = await this.prisma.referral.updateMany({
        where: { referredUserId: inviteeUserId, status: 'PENDING' },
        data: { status: 'QUALIFIED', qualifiedAt: new Date() },
      });
      if (updated.count !== 1) return;

      const referral = await this.prisma.referral.findUnique({
        where: { referredUserId: inviteeUserId },
        select: { referrerId: true },
      });
      if (!referral?.referrerId) return;

      await this.issueRewards(referral.referrerId);

      this.eventEmitter.emit(NotificationEventType.REFERRAL_QUALIFIED, {
        referrerUserId: referral.referrerId,
        actionUrl: '/referrals',
        inviteeFirstName: invitee.firstName,
      });
    } catch (error) {
      this.logger.error(`Referral qualification failed for ${inviteeUserId}: ${error instanceof Error ? error.message : error}`);
    }
  }

  // ============================================================================
  // REWARD ENGINE (threshold + idempotent issuance)
  // ============================================================================

  /**
   * Reconcile rewards owed to `ownerId` after a qualification. Row-locks the
   * owner for the whole calculation — concurrent qualifications serialize on
   * the lock; the (ownerId, sequenceNumber) unique index is the final backstop
   * (a losing concurrent insert hits P2002 and is discarded).
   *
   * Reward rows are the immutable ledger: what was earned, when, at which
   * threshold. CANCELLED rewards block their sequence number from re-issuing
   * (count of ALL rows seeds the sequence) so admins can void a reward without
   * the engine silently minting a replacement at the same milestone.
   */
  private async issueRewards(ownerId: string): Promise<void> {
    const created: Array<{
      id: string; sequenceNumber: number; amountMinor: number;
      currency: string; rewardType: string; thresholdSnapshot: number;
    }> = [];
    try {
      await this.prisma.$transaction(async (tx) => {
        // Mutex: lock the owner's row for the duration of the reconciliation.
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${ownerId} FOR UPDATE`;

        const settings = await this.getReferralSettings(tx);
        if (!settings.rewardsEnabled) return;

        const qualified = await tx.referral.count({
          where: { referrerId: ownerId, status: 'QUALIFIED' },
        });

        const target = settings.recurringRewards
          ? Math.floor(qualified / settings.threshold)
          : qualified >= settings.threshold
            ? 1
            : 0;
        if (target <= 0) return;

        const [issuedAllTime, issuedActive] = await Promise.all([
          tx.referralReward.count({ where: { ownerId } }),
          tx.referralReward.count({ where: { ownerId, status: { not: 'CANCELLED' } } }),
        ]);

        const needed = target - issuedActive;
        for (let i = 0; i < needed; i++) {
          const sequenceNumber = issuedAllTime + 1 + i;
          try {
            const reward = await tx.referralReward.create({
              data: {
                ownerId,
                sequenceNumber,
                rewardType: settings.rewardType,
                amountMinor: settings.rewardAmountMinor,
                currency: settings.rewardCurrency,
                thresholdSnapshot: settings.threshold,
              },
              select: {
                id: true, sequenceNumber: true, amountMinor: true,
                currency: true, rewardType: true, thresholdSnapshot: true,
              },
            });
            created.push(reward);

            await tx.auditLog.create({
              data: {
                userId: ownerId,
                action: 'REFERRAL_REWARD_ISSUED',
                entityType: 'referral_reward',
                entityId: reward.id,
                changes: {
                  sequenceNumber: reward.sequenceNumber,
                  qualifiedReferrals: qualified,
                  threshold: settings.threshold,
                  rewardType: settings.rewardType,
                  amountMinor: settings.rewardAmountMinor,
                  currency: settings.rewardCurrency,
                },
              },
            });
          } catch (error: any) {
            if (error?.code === 'P2002') {
              // A concurrent reconciliation already issued this milestone — the
              // correct idempotent outcome.
              continue;
            }
            throw error;
          }
        }
      });
    } catch (error) {
      // Never break the qualification flow: the next qualification re-runs this
      // reconciliation (target - issued) and self-heals any missed issuance.
      this.logger.error(`Reward issuance failed for ${ownerId}: ${error instanceof Error ? error.message : error}`);
      return;
    }

    // Notify the referrer about each new reward (out of the reward tx — the
    // notification side never rolls issuance back either).
    for (const reward of created) {
      this.eventEmitter.emit(NotificationEventType.REFERRAL_REWARD_EARNED, {
        ownerUserId: ownerId,
        actionUrl: '/referrals',
        amountMinor: reward.amountMinor,
        currency: reward.currency,
        rewardType: reward.rewardType,
        sequenceNumber: reward.sequenceNumber,
        threshold: reward.thresholdSnapshot,
      });
    }
  }

  /**
   * Fulfill PENDING rewards via their provider. NOT wired to the manual
   * provider automatically — manual rewards wait for admin confirmation in the
   * console. This is the entry point a future automated provider job calls;
   * the PENDING->PROCESSING claim is a conditional update so retries can never
   * double-issue.
   */
  async processPendingRewards(limit = 50): Promise<number> {
    const rewards = await this.prisma.referralReward.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true },
    });

    let fulfilled = 0;
    for (const { id } of rewards) {
      if (await this.attemptFulfillment(id, null)) {
        fulfilled++;
      }
    }
    return fulfilled;
  }

  /**
   * Admin-triggered (or automated) fulfillment of one reward. Returns the
   * updated reward. Safe to retry: only the PENDING->PROCESSING winner ever
   * talks to the provider; FAILED rewards can be re-attempted.
   */
  private async attemptFulfillment(rewardId: string, actorUserId: string | null) {
    // Conditional claim: only PENDING (or FAILED, on admin retry) rewards are
    // handed to a provider — concurrent callers can't both claim.
    const claimed = await this.prisma.referralReward.updateMany({
      where: { id: rewardId, status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'PROCESSING' },
    });
    if (claimed.count !== 1) return false;

    const reward = await this.prisma.referralReward.findUniqueOrThrow({ where: { id: rewardId } });
    const provider = this.rewardProviderRegistry.resolve(reward.rewardProvider);

    try {
      const result = await provider.fulfill({
        actorUserId,
        reward: {
          id: reward.id,
          ownerId: reward.ownerId,
          rewardType: reward.rewardType,
          amountMinor: reward.amountMinor,
          currency: reward.currency,
          sequenceNumber: reward.sequenceNumber,
          providerMetadata: (reward.providerMetadata as Record<string, unknown> | null) ?? null,
        },
      });

      if (result.status === 'FULFILLED') {
        await this.prisma.referralReward.update({
          where: { id: rewardId },
          data: {
            status: 'FULFILLED',
            fulfilledAt: new Date(),
            providerReference: result.providerReference ?? null,
            providerMetadata: (result.providerMetadata ?? undefined) as Prisma.InputJsonValue | undefined,
            lastError: null,
          },
        });
      } else {
        await this.prisma.referralReward.update({
          where: { id: rewardId },
          data: {
            status: 'FAILED',
            lastError: result.lastError ?? 'Provider reported failure',
            ...(result.providerMetadata ? { providerMetadata: result.providerMetadata as Prisma.InputJsonValue } : {}),
          },
        });
        return false;
      }

      if (result.status === 'FULFILLED' && reward.ownerId) {
        this.eventEmitter.emit(NotificationEventType.REFERRAL_REWARD_FULFILLED, {
          ownerUserId: reward.ownerId,
          actionUrl: '/referrals',
          amountMinor: reward.amountMinor,
          currency: reward.currency,
          rewardType: reward.rewardType,
        });
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Reward fulfillment failed for ${rewardId}: ${message}`);
      await this.prisma.referralReward.updateMany({
        where: { id: rewardId, status: 'PROCESSING' },
        data: { status: 'FAILED', lastError: message.slice(0, 500) },
      });
      return false;
    }
  }

  /** Admin console action: confirm manual fulfillment (or retry a FAILED). */
  async fulfillReward(rewardId: string, adminUserId: string) {
    const reward = await this.prisma.referralReward.findUnique({ where: { id: rewardId } });
    if (!reward) {
      throw new NotFoundException({ code: ERROR_CODES.REFERRAL_REWARD_NOT_FOUND, message: 'Reward not found' });
    }
    if (reward.status === 'FULFILLED') {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_REWARD_ALREADY_FULFILLED, message: 'Reward is already fulfilled' });
    }
    if (reward.status === 'CANCELLED') {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_REWARD_ALREADY_CANCELLED, message: 'Reward is cancelled and can no longer be fulfilled' });
    }
    if (reward.status === 'PROCESSING') {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_REWARD_ALREADY_PROCESSING, message: 'Reward is currently being processed' });
    }

    const ok = await this.attemptFulfillment(rewardId, adminUserId);
    if (!ok) {
      throw new InternalServerErrorException({
        code: ERROR_CODES.ERROR_INTERNAL,
        message: 'Reward fulfillment failed — see the reward status for details',
      });
    }

    await this.prisma.adminAction.create({
      data: {
        actorId: adminUserId,
        action: 'REFERRAL_REWARD_FULFILLED',
        entityType: 'referral_reward',
        entityId: rewardId,
        details: {
          ownerId: reward.ownerId,
          amountMinor: reward.amountMinor,
          currency: reward.currency,
          provider: reward.rewardProvider,
        },
      },
    });

    return this.prisma.referralReward.findUniqueOrThrow({ where: { id: rewardId } });
  }

  /** Admin console action: void a PENDING/FAILED reward (e.g. proven fraud). */
  async cancelReward(rewardId: string, adminUserId: string, reason: string) {
    const reward = await this.prisma.referralReward.findUnique({ where: { id: rewardId } });
    if (!reward) {
      throw new NotFoundException({ code: ERROR_CODES.REFERRAL_REWARD_NOT_FOUND, message: 'Reward not found' });
    }
    if (reward.status === 'FULFILLED') {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_REWARD_ALREADY_FULFILLED, message: 'A fulfilled reward cannot be cancelled' });
    }
    if (reward.status === 'CANCELLED') {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_REWARD_ALREADY_CANCELLED, message: 'Reward is already cancelled' });
    }

    const cancelled = await this.prisma.referralReward.updateMany({
      where: { id: rewardId, status: { in: ['PENDING', 'FAILED', 'PROCESSING'] } },
      data: {
        status: 'CANCELLED',
        lastError: reason ? `Cancelled by admin: ${reason}`.slice(0, 500) : 'Cancelled by admin',
      },
    });
    if (cancelled.count !== 1) {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_REWARD_ALREADY_PROCESSING, message: 'Reward is currently being processed' });
    }

    await this.prisma.adminAction.create({
      data: {
        actorId: adminUserId,
        action: 'REFERRAL_REWARD_CANCELLED',
        entityType: 'referral_reward',
        entityId: rewardId,
        details: { reason, ownerId: reward.ownerId, amountMinor: reward.amountMinor, currency: reward.currency },
      },
    });

    return this.prisma.referralReward.findUniqueOrThrow({ where: { id: rewardId } });
  }

  // ============================================================================
  // USER DASHBOARD QUERIES
  // ============================================================================

  /**
   * Everything the user dashboard needs, in one call. All progress math is
   * derived server-side from the immutable referral/reward rows — the client
   * never tells the backend what it has earned.
   */
  async getReferralDashboard(userId: string, frontendBaseUrl: string) {
    const referralCode = await this.getOrCreateReferralCode(userId);

    const settings = await this.getReferralSettings();

    const [pending, qualified, invalidated, rewards, rewardsIssued] = await Promise.all([
      this.prisma.referral.count({ where: { referrerId: userId, status: 'PENDING' } }),
      this.prisma.referral.count({ where: { referrerId: userId, status: 'QUALIFIED' } }),
      this.prisma.referral.count({ where: { referrerId: userId, status: 'INVALIDATED' } }),
      this.prisma.referralReward.findMany({
        where: { ownerId: userId },
        orderBy: { sequenceNumber: 'asc' },
        select: {
          id: true, sequenceNumber: true, rewardType: true, amountMinor: true,
          currency: true, status: true, createdAt: true, fulfilledAt: true,
        },
      }),
      this.prisma.referralReward.count({ where: { ownerId: userId, status: { not: 'CANCELLED' } } }),
    ]);

    // Progress toward the next milestone, recomputed from authoritative counts.
    const threshold = settings.threshold;
    let nextMilestoneAt: number | null = null;
    if (settings.rewardsEnabled) {
      if (settings.recurringRewards) {
        nextMilestoneAt = (Math.floor(qualified / threshold) + 1) * threshold;
      } else if (qualified < threshold && rewardsIssued < 1) {
        nextMilestoneAt = threshold;
      }
    }
    const remaining = nextMilestoneAt === null ? null : Math.max(0, nextMilestoneAt - qualified);

    return {
      programEnabled: settings.enabled,
      rewardsEnabled: settings.rewardsEnabled,
      referralCode,
      referralLink: `${frontendBaseUrl}/register?ref=${referralCode}`,
      config: {
        threshold,
        rewardType: settings.rewardType,
        rewardAmountMinor: settings.rewardAmountMinor,
        rewardCurrency: settings.rewardCurrency,
        recurringRewards: settings.recurringRewards,
      },
      stats: { pending, qualified, invalidated, rewardsIssued },
      progress: { successfulReferrals: qualified, nextMilestoneAt, remaining },
      rewards,
    };
  }

  async listMyReferrals(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReferralWhereInput = { referrerId: userId };

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        orderBy: { attributedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, status: true, attributedAt: true, qualifiedAt: true,
          referredUser: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.referral.count({ where }),
    ]);

    return {
      referrals: referrals.map((r) => ({
        status: r.status,
        attributedAt: r.attributedAt,
        qualifiedAt: r.qualifiedAt,
        referredUser: r.referredUser,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async listMyRewards(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReferralRewardWhereInput = { ownerId: userId };

    const [rewards, total] = await Promise.all([
      this.prisma.referralReward.findMany({
        where,
        orderBy: { sequenceNumber: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, sequenceNumber: true, rewardType: true, amountMinor: true,
          currency: true, status: true, createdAt: true, fulfilledAt: true,
        },
      }),
      this.prisma.referralReward.count({ where }),
    ]);

    return { rewards, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ============================================================================
  // ADMIN QUERIES
  // ============================================================================

  async adminListReferrals(page: number, limit: number, filters?: { status?: string; referrerId?: string }) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReferralWhereInput = {};
    if (filters?.status && ['PENDING', 'QUALIFIED', 'INVALIDATED'].includes(filters.status)) {
      where.status = filters.status as any;
    }
    if (filters?.referrerId) {
      where.referrerId = filters.referrerId;
    }

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        orderBy: { attributedAt: 'desc' },
        skip,
        take: limit,
        include: {
          referrer: { select: { id: true, email: true, firstName: true, lastName: true } },
          referredUser: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.referral.count({ where }),
    ]);

    return { referrals, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminListRewards(page: number, limit: number, filters?: { status?: string; ownerId?: string }) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReferralRewardWhereInput = {};
    if (filters?.status && ['PENDING', 'PROCESSING', 'FULFILLED', 'FAILED', 'CANCELLED'].includes(filters.status)) {
      where.status = filters.status as any;
    }
    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }

    const [rewards, total] = await Promise.all([
      this.prisma.referralReward.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.referralReward.count({ where }),
    ]);

    return { rewards, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Admin console action: void a referral that was attributed or qualified in
   * error (fraud investigation etc.). Rewards ALREADY issued are not clawed
   * back automatically — an admin cancels them separately if needed, so reward
   * history is never silently rewritten.
   */
  async invalidateReferral(referralId: string, adminUserId: string, reason: string) {
    const referral = await this.prisma.referral.findUnique({ where: { id: referralId } });
    if (!referral) {
      throw new NotFoundException({ code: ERROR_CODES.REFERRAL_NOT_FOUND, message: 'Referral not found' });
    }
    if (referral.status === 'INVALIDATED') {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_ALREADY_INVALIDATED, message: 'Referral is already invalidated' });
    }

    const invalidated = await this.prisma.referral.updateMany({
      where: { id: referralId, status: { not: 'INVALIDATED' } },
      data: {
        status: 'INVALIDATED',
        invalidatedAt: new Date(),
        invalidatedReason: reason || 'Invalidated by admin',
      },
    });
    if (invalidated.count !== 1) {
      throw new BadRequestException({ code: ERROR_CODES.REFERRAL_ALREADY_INVALIDATED, message: 'Referral is already invalidated' });
    }

    await this.prisma.adminAction.create({
      data: {
        actorId: adminUserId,
        action: 'REFERRAL_INVALIDATED',
        entityType: 'referral',
        entityId: referralId,
        details: {
          reason,
          referrerId: referral.referrerId,
          referredUserId: referral.referredUserId,
          previousStatus: referral.status,
        },
      },
    });

    return this.prisma.referral.findUniqueOrThrow({ where: { id: referralId } });
  }
}