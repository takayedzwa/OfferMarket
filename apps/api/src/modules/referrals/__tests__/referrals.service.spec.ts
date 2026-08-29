import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReferralsService } from '../referrals.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DEFAULT_REFERRAL_SETTINGS,
  ReferralProgramSettings,
  parseReferralSettings,
} from '../referral-settings';
import { RewardProviderRegistry } from '../rewards/reward-provider-registry';
import { ManualRewardProvider } from '../rewards/manual-reward-provider';
import { NotificationEventType } from '../../../modules/notifications/notification.types';

/**
 * Referral settings stored in the AdminSettings row (what findUnique returns).
 */
function settingsRow(overrides: Partial<ReferralProgramSettings> = {}) {
  return { key: 'referral_program', value: { ...DEFAULT_REFERRAL_SETTINGS, ...overrides } };
}

/**
 * Referral quota state. Drives the mock counts issueRewards() sees.
 */
interface QuotaState {
  qualified: number; // tx.referral.count → QUALIFIED referrals owned by referrer
  rewardsAllTime: number; // tx.referralReward.count → all rows (incl. CANCELLED)
  rewardsActive: number; // tx.referralReward.count → rows excluding CANCELLED
}

/**
 * Transaction delegate used by issueRewards()/updateSettings(). Each test
 * builds exactly one, then inspects the calls after the fact.
 */
function makeTx(overrides?: {
  settings?: Partial<ReferralProgramSettings>;
  quota?: QuotaState;
  createError?: { code: string };
}) {
  const { settings, quota, createError } = overrides ?? {};
  return {
    $queryRaw: jest.fn().mockResolvedValue([]),
    adminSettings: {
      findUnique: jest.fn().mockResolvedValue(settingsRow(settings ?? {})),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    },
    referral: {
      count: jest.fn().mockResolvedValue(quota?.qualified ?? 0),
      create: jest.fn().mockResolvedValue({ id: 'rf-new' }),
    },
    referralReward: {
      // Selects between all-time and active counts based on the where clause —
      // issueRewards issues both in a Promise.all keyed by the status filter.
      count: jest.fn((args: any) =>
        Promise.resolve(args?.where?.status ? (quota?.rewardsActive ?? 0) : (quota?.rewardsAllTime ?? 0)),
      ),
      create: createError
        ? jest.fn(() => Promise.reject(Object.assign(new Error('unique violation'), createError)))
        : jest.fn(({ data }: any) => Promise.resolve({ id: `reward-${data.sequenceNumber}`, ...data })),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    adminAction: { create: jest.fn().mockResolvedValue({}) },
    user: { findUnique: jest.fn() },
  } as any;
}

/**
 * MockPrismaService for the referral flows. `$transaction` hands the callback a
 * fresh tx each call — the test captures them via `this.txs`.
 */
class MockPrismaService {
  txs: any[] = [];
  makeTx: (overrides?: any) => any;

  adminSettings = { findUnique: jest.fn(), upsert: jest.fn() };
  user = { findUnique: jest.fn(), update: jest.fn() };
  referral = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
  referralReward = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  auditLog = { create: jest.fn() };
  adminAction = { create: jest.fn() };

  $transaction = jest.fn(async (fn: (tx: any) => Promise<any>) => {
    const tx = this.makeTx();
    this.txs.push(tx);
    return fn(tx);
  });
}

describe('ReferralsService', () => {
  let service: ReferralsService;
  let prisma: MockPrismaService;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    prisma = new MockPrismaService();
    prisma.makeTx = (overrides = {}) => makeTx(overrides);
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        // Real registry + manual provider: fulfillment logic runs end-to-end.
        ManualRewardProvider,
        RewardProviderRegistry,
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Referral code
  // =========================================================================
  describe('getOrCreateReferralCode', () => {
    it('returns the existing code without assigning a new one', async () => {
      prisma.user.findUnique.mockResolvedValue({ referralCode: 'ABCD234567', deletedAt: null });
      await expect(service.getOrCreateReferralCode('u1')).resolves.toBe('ABCD234567');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('assigns a new unambiguous 10-char code on first use', async () => {
      prisma.user.findUnique.mockResolvedValue({ referralCode: null, deletedAt: null });
      prisma.user.update.mockResolvedValue({ referralCode: 'XYZ2345678' });
      await expect(service.getOrCreateReferralCode('u1')).resolves.toBe('XYZ2345678');
      const code = prisma.user.update.mock.calls[0][0].data.referralCode;
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{10}$/); // no 0/O/1/I
    });

    it('retries with a fresh code when assignment races into P2002', async () => {
      prisma.user.findUnique.mockResolvedValue({ referralCode: null, deletedAt: null });
      prisma.user.update
        .mockRejectedValueOnce(Object.assign(new Error('dup'), { code: 'P2002' }))
        .mockResolvedValueOnce({ referralCode: 'SECOND2345' });
      await expect(service.getOrCreateReferralCode('u1')).resolves.toBe('SECOND2345');
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
    });

    it('gives up with an internal error after repeated collisions', async () => {
      prisma.user.findUnique.mockResolvedValue({ referralCode: null, deletedAt: null });
      prisma.user.update.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }));
      await expect(service.getOrCreateReferralCode('u1')).rejects.toThrow('Could not allocate a referral code');
      expect(prisma.user.update).toHaveBeenCalledTimes(5);
    });

    it('throws NotFound for unknown users and Forbidden for deleted accounts', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getOrCreateReferralCode('ghost')).rejects.toThrow(NotFoundException);
      prisma.user.findUnique.mockResolvedValue({ referralCode: null, deletedAt: new Date() });
      await expect(service.getOrCreateReferralCode('deleted')).rejects.toThrow('not available');
    });
  });

  // =========================================================================
  // Attribution (runs inside the registration transaction)
  // =========================================================================
  describe('attributeReferral', () => {
    it('creates a referral for a valid code owned by an ACTIVE user', async () => {
      const tx = makeTx();
      tx.adminSettings.findUnique.mockResolvedValue(settingsRow());
      tx.user.findUnique.mockResolvedValue({ id: 'referrer-1', status: 'ACTIVE', deletedAt: null });
      tx.referral.create.mockResolvedValue({ id: 'r1' });

      await service.attributeReferral(tx as any, 'invitee-1', ' CODE234567 ', '203.0.113.5');

      expect(tx.referral.create).toHaveBeenCalledWith({
        data: {
          referrerId: 'referrer-1',
          referredUserId: 'invitee-1',
          referralCode: 'CODE234567', // normalized: trimmed + uppercase
          attributedIp: '203.0.113.5',
        },
      });
    });

    it('silently skips an empty/missing code', async () => {
      const tx = makeTx();
      await service.attributeReferral(tx as any, 'invitee-1');
      await service.attributeReferral(tx as any, 'invitee-1', '   ');
      expect(tx.referral.create).not.toHaveBeenCalled();
      expect(tx.adminSettings.findUnique).not.toHaveBeenCalled();
    });

    it('silently skips when the program is disabled', async () => {
      const tx = makeTx({ settings: { enabled: false } });
      await service.attributeReferral(tx as any, 'invitee-1', 'CODE234567');
      expect(tx.user.findUnique).not.toHaveBeenCalled();
      expect(tx.referral.create).not.toHaveBeenCalled();
    });

    it('silently skips an unknown code and a non-ACTIVE/deleted referrer', async () => {
      const tx = makeTx();
      tx.adminSettings.findUnique.mockResolvedValue(settingsRow());
      tx.user.findUnique.mockResolvedValue(null); // unknown code
      await service.attributeReferral(tx as any, 'invitee-1', 'UNKNOWN111');
      expect(tx.referral.create).not.toHaveBeenCalled();

      tx.user.findUnique.mockResolvedValue({ id: 'referrer-1', status: 'BANNED', deletedAt: null });
      await service.attributeReferral(tx as any, 'invitee-1', 'CODE234567');
      expect(tx.referral.create).not.toHaveBeenCalled();
    });

    it('rejects self-referral', async () => {
      const tx = makeTx();
      tx.adminSettings.findUnique.mockResolvedValue(settingsRow());
      tx.user.findUnique.mockResolvedValue({ id: 'invitee-1', status: 'ACTIVE', deletedAt: null });
      await service.attributeReferral(tx as any, 'invitee-1', 'CODE234567');
      expect(tx.referral.create).not.toHaveBeenCalled();
    });

    it('treats a duplicate attribution (P2002) as first-attribution-wins', async () => {
      const tx = makeTx();
      tx.adminSettings.findUnique.mockResolvedValue(settingsRow());
      tx.user.findUnique.mockResolvedValue({ id: 'referrer-1', status: 'ACTIVE', deletedAt: null });
      tx.referral.create.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }));
      // Must not throw — attribution of the losing request is simply skipped.
      await expect(service.attributeReferral(tx as any, 'invitee-1', 'CODE234567')).resolves.toBeUndefined();
    });

    it('also swallows unexpected DB errors — attribution never breaks signup', async () => {
      const tx = makeTx();
      tx.adminSettings.findUnique.mockResolvedValue(settingsRow());
      tx.user.findUnique.mockRejectedValue(new Error('connection reset'));
      await expect(service.attributeReferral(tx as any, 'invitee-1', 'CODE234567')).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // Qualification — the email_verified rule
  // =========================================================================
  describe('recordQualification', () => {
    function setupQualification(opts: {
      emailVerified?: boolean;
      transitionCount?: number; // updateMany result (1 = the referral flipped)
      referralReferrer?: string | null;
    }) {
      prisma.adminSettings.findUnique.mockResolvedValue(settingsRow());
      prisma.user.findUnique.mockResolvedValue({ emailVerified: !!opts.emailVerified, firstName: 'Sam' });
      prisma.referral.updateMany.mockResolvedValue({ count: opts.transitionCount ?? 1 });
      prisma.referral.findUnique.mockResolvedValue(
        opts.referralReferrer === undefined ? { referrerId: 'referrer-1' } : { referrerId: opts.referralReferrer },
      );
      prisma.$transaction.mockImplementation(async (fn: any) => fn(makeTx({ quota: { qualified: 0, rewardsAllTime: 0, rewardsActive: 0 } })));
    }

    it('does not count an invitee whose email is not verified', async () => {
      setupQualification({ emailVerified: false });
      await service.recordQualification('invitee-1');
      expect(prisma.referral.updateMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('fires only once per referral (PENDING→QUALIFIED updated 0 rows on repeats)', async () => {
      setupQualification({ emailVerified: true, transitionCount: 0 });
      await service.recordQualification('invitee-1');
      expect(prisma.referral.updateMany).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled(); // no reward reconciliation
    });

    it('manager: qualified invitee flips the referral and emits the event', async () => {
      setupQualification({ emailVerified: true });
      await service.recordQualification('invitee-1');
      expect(prisma.referral.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { referredUserId: 'invitee-1', status: 'PENDING' } }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.REFERRAL_QUALIFIED,
        expect.objectContaining({ referrerUserId: 'referrer-1', inviteeFirstName: 'Sam' }),
      );
    });

    it('never throws even when the reward reconciliation explodes', async () => {
      setupQualification({ emailVerified: true });
      prisma.$transaction.mockRejectedValue(new Error('deadlock'));
      await expect(service.recordQualification('invitee-1')).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // Reward threshold math (the configurable core)
  // =========================================================================
  describe('reward issuance thresholds (threshold = 5, recurring)', () => {
    /**
     * Runs one qualification for `qualified` successful referrals where
     * `alreadyIssued` rewards already exist in the ledger, and returns the
     * rows the engine tried to create.
     */
    async function issueFor(qualified: number, alreadyIssued: number, settings?: Partial<ReferralProgramSettings>) {
      prisma.adminSettings.findUnique.mockResolvedValue(settingsRow(settings));
      prisma.user.findUnique.mockResolvedValue({ emailVerified: true, firstName: 'Sam' });
      prisma.referral.updateMany.mockResolvedValue({ count: 1 });
      prisma.referral.findUnique.mockResolvedValue({ referrerId: 'referrer-1' });
      prisma.makeTx = () =>
        makeTx({ settings, quota: { qualified, rewardsAllTime: alreadyIssued, rewardsActive: alreadyIssued } });
      await service.recordQualification('invitee-1');
      const tx = prisma.txs[0];
      return {
        created: tx.referralReward.create.mock.calls.map((c: any) => c[0].data),
        sequences: tx.referralReward.create.mock.calls.map((c: any) => c[0].data.sequenceNumber),
        audits: tx.auditLog.create.mock.calls.length,
      };
    }

    it('issues 0 rewards at 4 successful referrals (below threshold)', async () => {
      const { created } = await issueFor(4, 0);
      expect(created).toHaveLength(0);
    });

    it('issues 1 reward at the 5-referral threshold', async () => {
      const { created, sequences, audits } = await issueFor(5, 0);
      expect(created).toHaveLength(1);
      expect(sequences).toEqual([1]);
      expect(created[0]).toMatchObject({
        rewardType: 'gift_card',
        amountMinor: 2500,
        currency: 'EUR',
        thresholdSnapshot: 5,
      });
      expect(audits).toBe(1); // one REFERRAL_REWARD_ISSUED audit row
    });

    it('issues no new reward between milestones (9 referrals, 1 issued)', async () => {
      const { created } = await issueFor(9, 1);
      expect(created).toHaveLength(0);
    });

    it('issues the 2nd reward at 10 referrals', async () => {
      const { sequences } = await issueFor(10, 1);
      expect(sequences).toEqual([2]);
    });

    it('issues the 3rd reward at 15 referrals', async () => {
      const { sequences } = await issueFor(15, 2);
      expect(sequences).toEqual([3]);
    });

    it('issues 3 rewards at once when qualification runs after a self-heal gap (15, 0 issued)', async () => {
      // Catch-up reconciliation: target 3, none issued yet → mint all 3 now.
      const { sequences } = await issueFor(15, 0);
      expect(sequences).toEqual([1, 2, 3]);
    });

    it('never re-issues: running at target with all rewards in the ledger mints nothing', async () => {
      const result = await issueFor(10, 2); // target 2, 2 already issued → nothing owed
      expect(result.created).toHaveLength(0);
      expect(result.audits).toBe(0);
    });

    it('sequences continue past CANCELLED rewards (cancelled milestone not re-issued)', async () => {
      // 1 active + 1 cancelled row all-time → next sequence is 3, not a
      // replacement of #2.
      prisma.adminSettings.findUnique.mockResolvedValue(settingsRow());
      prisma.user.findUnique.mockResolvedValue({ emailVerified: true, firstName: 'Sam' });
      prisma.referral.updateMany.mockResolvedValue({ count: 1 });
      prisma.referral.findUnique.mockResolvedValue({ referrerId: 'referrer-1' });
      const quota = { qualified: 5, rewardsAllTime: 2, rewardsActive: 0 };
      prisma.makeTx = () => makeTx({ quota });
      await service.recordQualification('invitee-1');
      const tx = prisma.txs[0];
      expect(tx.referralReward.create.mock.calls[0][0].data.sequenceNumber).toBe(3);
    });

    it('does not count referrals qualified before the reward engine (one-time mode)', async () => {
      // recurringRewards=false: 7 qualified, 1 already issued → no second reward.
      const { created } = await issueFor(7, 1, { recurringRewards: false });
      expect(created).toHaveLength(0);
    });

    it('issues exactly one reward (one-time mode) even with far more referrals', async () => {
      const { sequences } = await issueFor(15, 0, { recurringRewards: false });
      expect(sequences).toEqual([1]);
    });
  });

  // =========================================================================
  // Configuration changes (no code deployment involved)
  // =========================================================================
  describe('configuration changes drive the math', () => {
    async function qualifyWith(settings: Partial<ReferralProgramSettings>, qualified: number) {
      prisma.adminSettings.findUnique.mockResolvedValue(settingsRow(settings));
      prisma.user.findUnique.mockResolvedValue({ emailVerified: true, firstName: 'Sam' });
      prisma.referral.updateMany.mockResolvedValue({ count: 1 });
      prisma.referral.findUnique.mockResolvedValue({ referrerId: 'referrer-1' });
      prisma.makeTx = () => makeTx({ settings, quota: { qualified, rewardsAllTime: 0, rewardsActive: 0 } });
      await service.recordQualification('invitee-1');
      return prisma.txs[0];
    }

    it('a threshold change to 10 means 5 qualified referrals issue nothing', async () => {
      const tx = await qualifyWith({ threshold: 10 }, 5);
      expect(tx.referralReward.create).not.toHaveBeenCalled();
    });

    it('raising the threshold to 50 means even 10 qualified referrals issue nothing', async () => {
      const tx = await qualifyWith({ threshold: 50 }, 10);
      expect(tx.referralReward.create).not.toHaveBeenCalled();
    });

    it('disabling rewards stops issuance while referrals keep being tracked', async () => {
      const tx = await qualifyWith({ rewardsEnabled: false }, 20);
      expect(tx.referral.count).not.toHaveBeenCalled(); // reconciliation never ran
    });

    it('new settings (amount + currency) snapshot into new rewards', async () => {
      const tx = await qualifyWith({ threshold: 2, rewardAmountMinor: 9900, rewardCurrency: 'USD' }, 4);
      const created = tx.referralReward.create.mock.calls.map((c: any) => c[0].data);
      expect(created).toHaveLength(2); // 4 qualified / 2 per reward → rewards #1..#2
      expect(created[0]).toMatchObject({ amountMinor: 9900, currency: 'USD', thresholdSnapshot: 2 });
      expect(created.map((r: any) => r.sequenceNumber)).toEqual([1, 2]);
    });

    it('updateSettings merges a partial patch over stored config and audits it', async () => {
      prisma.makeTx = () => {
        const tx = makeTx();
        tx.adminSettings.findUnique
          .mockResolvedValueOnce(settingsRow()) // read for merge
          .mockResolvedValueOnce(settingsRow()); // (merge is internal)
        return tx;
      };
      await service.updateSettings({ threshold: 7 }, 'admin-1');

      const upsert = prisma.txs[0].adminSettings.upsert;
      expect(upsert).toHaveBeenCalledTimes(1);
      const value = upsert.mock.calls[0][0].update.value;
      expect(value.threshold).toBe(7);
      expect(value.rewardAmountMinor).toBe(2500); // untouched field survives
      expect(prisma.txs[0].adminAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'REFERRAL_SETTINGS_UPDATED', actorId: 'admin-1' }),
        }),
      );
    });
  });

  // =========================================================================
  // Manual fulfillment
  // =========================================================================
  describe('fulfillReward', () => {
    const reward = {
      id: 'rw-1', ownerId: 'owner-1', status: 'PENDING', rewardProvider: 'manual',
      rewardType: 'gift_card', amountMinor: 2500, currency: 'EUR', sequenceNumber: 1,
      fulfilledAt: null, providerMetadata: null,
    };

    it('fulfills a PENDING reward through the manual provider with an audit trail', async () => {
      prisma.referralReward.findUnique.mockResolvedValue(reward);
      prisma.referralReward.updateMany.mockResolvedValue({ count: 1 }); // claim wins
      prisma.referralReward.findUniqueOrThrow.mockResolvedValue(reward);

      const result = await service.fulfillReward('rw-1', 'admin-1');

      // PENDING → PROCESSING claim, then FULFILLED with provider reference
      expect(prisma.referralReward.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rw-1', status: { in: ['PENDING', 'FAILED'] } } }),
      );
      expect(prisma.referralReward.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FULFILLED', providerReference: 'manual:admin-1' }),
        }),
      );
      expect(prisma.adminAction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'REFERRAL_REWARD_FULFILLED' }) }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.REFERRAL_REWARD_FULFILLED,
        expect.objectContaining({ ownerUserId: 'owner-1' }),
      );
      expect(result.status).toBe('PENDING'); // returned the read snapshot — fine
    });

    it('refuses to fulfill an unknown, FULFILLED, CANCELLED or PROCESSING reward', async () => {
      prisma.referralReward.findUnique.mockResolvedValue(null);
      await expect(service.fulfillReward('nope', 'admin-1')).rejects.toThrow(NotFoundException);

      for (const status of ['FULFILLED', 'CANCELLED', 'PROCESSING']) {
        prisma.referralReward.findUnique.mockResolvedValue({ ...reward, status });
        await expect(service.fulfillReward('rw-1', 'admin-1')).rejects.toThrow(BadRequestException);
      }
      // Nothing was claimed for any of these
      expect(prisma.referralReward.updateMany).not.toHaveBeenCalled();
    });

    it('is idempotent: a lost claim (concurrent fulfiller) fails the call gracefully', async () => {
      prisma.referralReward.findUnique.mockResolvedValue(reward);
      prisma.referralReward.updateMany.mockResolvedValue({ count: 0 }); // lost the claim
      await expect(service.fulfillReward('rw-1', 'admin-1')).rejects.toThrow('Reward fulfillment failed');
      expect(prisma.referralReward.update).not.toHaveBeenCalled();
    });

    it('scopes every mutation to the reward id — no cross-owner writes', async () => {
      prisma.referralReward.findUnique.mockResolvedValue(reward);
      prisma.referralReward.updateMany.mockResolvedValue({ count: 1 });
      prisma.referralReward.findUniqueOrThrow.mockResolvedValue(reward);
      await service.fulfillReward('rw-1', 'admin-1');
      const where = prisma.referralReward.updateMany.mock.calls[0][0].where;
      expect(where).toEqual({ id: 'rw-1', status: { in: ['PENDING', 'FAILED'] } });
    });
  });

  describe('cancelReward', () => {
    const reward = {
      id: 'rw-2', ownerId: 'owner-1', status: 'PENDING', amountMinor: 2500,
      currency: 'EUR', rewardProvider: 'manual',
    };

    it('cancels a PENDING reward with the reason preserved in lastError + audit', async () => {
      prisma.referralReward.findUnique.mockResolvedValue(reward);
      prisma.referralReward.updateMany.mockResolvedValue({ count: 1 });
      prisma.referralReward.findUniqueOrThrow.mockResolvedValue({ ...reward, status: 'CANCELLED' });

      await service.cancelReward('rw-2', 'admin-1', 'duplicate account fraud');

      expect(prisma.referralReward.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rw-2', status: { in: ['PENDING', 'FAILED', 'PROCESSING'] } },
          data: expect.objectContaining({ status: 'CANCELLED', lastError: expect.stringContaining('duplicate account fraud') }),
        }),
      );
      expect(prisma.adminAction.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'REFERRAL_REWARD_CANCELLED' }) }),
      );
    });

    it('refuses to cancel a FULFILLED reward', async () => {
      prisma.referralReward.findUnique.mockResolvedValue({ ...reward, status: 'FULFILLED' });
      await expect(service.cancelReward('rw-2', 'admin-1', 'oops')).rejects.toThrow(BadRequestException);
      expect(prisma.referralReward.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('invalidateReferral', () => {
    const referral = { id: 'rf-1', status: 'QUALIFIED', referrerId: 'ref-1', referredUserId: 'inv-1' };

    it('invalidates a referral and records the admin action', async () => {
      prisma.referral.findUnique.mockResolvedValue(referral);
      prisma.referral.updateMany.mockResolvedValue({ count: 1 });
      prisma.referral.findUniqueOrThrow.mockResolvedValue({ ...referral, status: 'INVALIDATED' });

      await service.invalidateReferral('rf-1', 'admin-1', 'fraud');

      expect(prisma.referral.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rf-1', status: { not: 'INVALIDATED' } },
          data: expect.objectContaining({ status: 'INVALIDATED' }),
        }),
      );
      expect(prisma.adminAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'REFERRAL_INVALIDATED', details: expect.objectContaining({ previousStatus: 'QUALIFIED' }) }),
        }),
      );
    });

    it('rejects unknown and already-invalidated referrals', async () => {
      prisma.referral.findUnique.mockResolvedValue(null);
      await expect(service.invalidateReferral('nope', 'admin-1', 'x')).rejects.toThrow(NotFoundException);

      prisma.referral.findUnique.mockResolvedValue({ ...referral, status: 'INVALIDATED' });
      await expect(service.invalidateReferral('rf-1', 'admin-1', 'x')).rejects.toThrow(BadRequestException);
      expect(prisma.referral.updateMany).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Dashboard math
  // =========================================================================
  describe('getReferralDashboard', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({ referralCode: 'MYCODE1234', deletedAt: null });
      prisma.adminSettings.findUnique.mockResolvedValue(settingsRow());
      prisma.referral.count.mockResolvedValue(7); // PENDING/QUALIFIED/INVALIDATED — return value shared
      prisma.referralReward.findMany.mockResolvedValue([]);
      prisma.referralReward.count.mockResolvedValue(1);
    });

    it('derives progress from qualified referrals and builds the share link', async () => {
      const dashboard = await service.getReferralDashboard('user-1', 'https://offermarket.eu');
      expect(dashboard.referralLink).toBe('https://offermarket.eu/register?ref=MYCODE1234');
      expect(dashboard.config).toMatchObject({ threshold: 5, rewardAmountMinor: 2500, rewardCurrency: 'EUR' });
      expect(dashboard.progress.remaining).toBe(3); // 7 qualified → next milestone at 10
    });

    it('reports no pending milestone when rewards are disabled', async () => {
      prisma.adminSettings.findUnique.mockResolvedValue(settingsRow({ rewardsEnabled: false }));
      const dashboard = await service.getReferralDashboard('user-1', 'https://offermarket.eu');
      expect(dashboard.progress.nextMilestoneAt).toBeNull();
      expect(dashboard.progress.remaining).toBeNull();
    });
  });
});

// =========================================================================
// Settings parser hardening (bad JSON degrades to defaults, never crashes)
// =========================================================================
describe('parseReferralSettings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(parseReferralSettings(undefined)).toMatchObject({
      threshold: 5, rewardAmountMinor: 2500, rewardCurrency: 'EUR', recurringRewards: true,
    });
  });

  it('clamps impossible values instead of throwing', () => {
    const parsed = parseReferralSettings({ threshold: 0, rewardAmountMinor: -5, rewardCurrency: 'eur' });
    expect(parsed.threshold).toBeGreaterThanOrEqual(1);
    expect(parsed.rewardAmountMinor).toBeGreaterThanOrEqual(1);
  });
});