import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  backoffNextAttempt,
  DEFAULT_MAX_ATTEMPTS,
  EmailOutboxService,
  EnqueueEmailInput,
  OutboxStatus,
} from '../dispatcher/email-outbox.service';
import { normalizeEmail } from '../email-message';

/**
 * Mock PrismaService for the outbox. `claimNextBatch` uses `$queryRaw`, so the
 * mock returns whatever the test sets up. The state-transition methods
 * (markSent/markFailed/scheduleRetry/requeueStaleSending) use the `emailOutbox`
 * model delegate, mocked individually.
 */
class MockPrismaService {
  emailOutbox = {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  };
  $queryRaw = jest.fn();
}

describe('EmailOutboxService', () => {
  let service: EmailOutboxService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = new MockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailOutboxService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(EmailOutboxService);
  });

  afterEach(() => jest.clearAllMocks());

  const enqueueInput: EnqueueEmailInput = {
    toEmail: 'Jane@Example.com',
    notificationId: 'notif-1',
    userId: 'user-1',
    emailType: 'notification',
    category: 'notification',
    locale: 'nl',
  };

  describe('enqueue', () => {
    it('normalizes the recipient and writes a pending row via the shared client', async () => {
      prisma.emailOutbox.create.mockResolvedValue({ id: 'outbox-1' });

      await service.enqueue(enqueueInput);

      expect(prisma.emailOutbox.create).toHaveBeenCalledWith({
        data: {
          toEmail: 'jane@example.com',
          notificationId: 'notif-1',
          userId: 'user-1',
          emailType: 'notification',
          category: 'notification',
          locale: 'nl',
          status: OutboxStatus.PENDING,
          maxAttempts: DEFAULT_MAX_ATTEMPTS,
        },
      });
    });

    it('uses the injected transaction client when provided (atomic with caller)', async () => {
      const txEmailOutbox = { create: jest.fn().mockResolvedValue({ id: 'outbox-tx' }) };
      const tx = { emailOutbox: txEmailOutbox } as any;

      await service.enqueue(enqueueInput, tx);

      expect(txEmailOutbox.create).toHaveBeenCalledTimes(1);
      expect(prisma.emailOutbox.create).not.toHaveBeenCalled();
    });

    it('defaults locale to en and nulls optional relations when omitted', async () => {
      prisma.emailOutbox.create.mockResolvedValue({ id: 'outbox-2' });
      await service.enqueue({ toEmail: 'a@b.test', emailType: 'password_reset', category: 'authentication' });

      const call = prisma.emailOutbox.create.mock.calls[0][0].data;
      expect(call.locale).toBe('en');
      expect(call.notificationId).toBeNull();
      expect(call.userId).toBeNull();
    });
  });

  describe('claimNextBatch', () => {
    it('runs the SKIP LOCKED update query and returns the claimed rows', async () => {
      const claimed = [{ id: 'outbox-1', status: 'sending' }];
      prisma.$queryRaw.mockResolvedValue(claimed);

      const result = await service.claimNextBatch(25);

      expect(result).toEqual(claimed);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('returns an empty array when nothing is due', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      const result = await service.claimNextBatch(25);
      expect(result).toEqual([]);
    });
  });

  describe('markSent', () => {
    it('flips the row to sent, sets sentAt, and clears the lock', async () => {
      prisma.emailOutbox.update.mockResolvedValue({});
      await service.markSent('outbox-1', '<brevo-id>');

      const args = prisma.emailOutbox.update.mock.calls[0][0];
      expect(args.where).toEqual({ id: 'outbox-1' });
      expect(args.data.status).toBe(OutboxStatus.SENT);
      expect(args.data.providerMessageId).toBe('<brevo-id>');
      expect(args.data.lockedAt).toBeNull();
      expect(args.data.lastError).toBeNull();
      expect(args.data.sentAt).toBeInstanceOf(Date);
    });

    it('stores a null providerMessageId when the provider returned none', async () => {
      prisma.emailOutbox.update.mockResolvedValue({});
      await service.markSent('outbox-1', '');
      expect(prisma.emailOutbox.update.mock.calls[0][0].data.providerMessageId).toBeNull();
    });
  });

  describe('markFailed', () => {
    it('marks the row failed with a sanitized error and releases the lock', async () => {
      prisma.emailOutbox.update.mockResolvedValue({});
      await service.markFailed('outbox-1', new Error('invalid recipient\n<secret>'));

      const args = prisma.emailOutbox.update.mock.calls[0][0];
      expect(args.data.status).toBe(OutboxStatus.FAILED);
      expect(args.data.lockedAt).toBeNull();
      // Newlines stripped, recipient data preserved-but-sanized is the transport's
      // job; here we only guarantee no control chars.
      expect(args.data.lastError).not.toContain('\n');
    });
  });

  describe('scheduleRetry', () => {
    it('increments attempts, requeues with backoff, and stays pending under the cap', async () => {
      prisma.emailOutbox.findUnique.mockResolvedValue({ attempts: 1, maxAttempts: 8 });
      prisma.emailOutbox.update.mockResolvedValue({});

      await service.scheduleRetry('outbox-1', new Error('timeout'));

      const args = prisma.emailOutbox.update.mock.calls[0][0];
      expect(args.data.status).toBe(OutboxStatus.PENDING);
      expect(args.data.attempts).toBe(2);
      expect(args.data.nextAttemptAt).toBeInstanceOf(Date);
      expect(args.data.lockedAt).toBeNull();
      // 30s * 2^(2-1) = 60s after now (within a tolerance window).
      const expectedMin = Date.now() + 60_000 - 500;
      const expectedMax = Date.now() + 60_000 + 500;
      expect(args.data.nextAttemptAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(args.data.nextAttemptAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('marks the row FAILED once attempts reach maxAttempts', async () => {
      prisma.emailOutbox.findUnique.mockResolvedValue({ attempts: 7, maxAttempts: 8 });
      prisma.emailOutbox.update.mockResolvedValue({});

      await service.scheduleRetry('outbox-1', new Error('boom'));

      const args = prisma.emailOutbox.update.mock.calls[0][0];
      expect(args.data.status).toBe(OutboxStatus.FAILED);
      expect(args.data.attempts).toBe(8);
      expect(args.data.nextAttemptAt).toBeUndefined();
    });

    it('is a no-op when the row no longer exists', async () => {
      prisma.emailOutbox.findUnique.mockResolvedValue(null);
      await expect(service.scheduleRetry('gone', new Error('x'))).resolves.toBeUndefined();
      expect(prisma.emailOutbox.update).not.toHaveBeenCalled();
    });
  });

  describe('markSuppressed', () => {
    it('marks the row suppressed and records the reason', async () => {
      prisma.emailOutbox.update.mockResolvedValue({});
      await service.markSuppressed('outbox-1', 'hard_bounce');
      const args = prisma.emailOutbox.update.mock.calls[0][0];
      expect(args.data.status).toBe(OutboxStatus.SUPPRESSED);
      expect(args.data.lastError).toBe('hard_bounce');
      expect(args.data.lockedAt).toBeNull();
    });
  });

  describe('requeueStaleSending', () => {
    it('resets sending rows past the lock timeout to pending', async () => {
      prisma.emailOutbox.updateMany.mockResolvedValue({ count: 3 });
      const count = await service.requeueStaleSending(10 * 60_000);

      expect(count).toBe(3);
      const args = prisma.emailOutbox.updateMany.mock.calls[0][0];
      expect(args.where.status).toBe(OutboxStatus.SENDING);
      expect(args.where.lockedAt).toBeDefined();
      expect(args.data.status).toBe(OutboxStatus.PENDING);
      expect(args.data.lockedAt).toBeNull();
    });

    it('returns 0 when nothing is stale', async () => {
      prisma.emailOutbox.updateMany.mockResolvedValue({ count: 0 });
      expect(await service.requeueStaleSending(10 * 60_000)).toBe(0);
    });
  });

  describe('backoffNextAttempt', () => {
    it('grows exponentially: 30s, 60s, 120s, 240s …', () => {
      const base = Date.now();
      const d1 = backoffNextAttempt(1).getTime() - base;
      const d2 = backoffNextAttempt(2).getTime() - base;
      const d3 = backoffNextAttempt(3).getTime() - base;
      expect(d1).toBeGreaterThanOrEqual(30_000 - 500);
      expect(d2).toBeGreaterThanOrEqual(60_000 - 500);
      expect(d3).toBeGreaterThanOrEqual(120_000 - 500);
    });

    it('caps the backoff at 1 hour', () => {
      const base = Date.now();
      const far = backoffNextAttempt(20).getTime() - base;
      expect(far).toBeLessThanOrEqual(60 * 60_000 + 1000);
    });
  });

  describe('countByStatus', () => {
    it('counts rows for the given status', async () => {
      prisma.emailOutbox.count.mockResolvedValue(5);
      const count = await service.countByStatus(OutboxStatus.PENDING);
      expect(count).toBe(5);
      expect(prisma.emailOutbox.count).toHaveBeenCalledWith({ where: { status: OutboxStatus.PENDING } });
    });
  });

  it('normalizeEmail is applied at enqueue (recipient canonicalization)', () => {
    expect(normalizeEmail('  Jane@Example.com ')).toBe('jane@example.com');
  });
});