import { OpsAlertService } from '../ops-alert.service';
import { LogTransport, SentMail } from '../transports/log.transport';
import { defaultEmailConfig } from '../email-config';

// ============================================================================
// OPS ALERT SERVICE — concierge verification SLA (E10)
// - New-employer signup alert reaches the ops mailbox with company + KvK.
// - Alert failures never throw.
// - Weekly sweep summaries pending employers; sends nothing when none.
// - OPS_ALERTS_ENABLED=false disables the sweep.
// ============================================================================

function makeService(transport: LogTransport, prisma?: unknown): OpsAlertService {
  return new OpsAlertService(transport, defaultEmailConfig(), prisma as undefined);
}

function withEnv(env: Record<string, string | undefined>, fn: () => Promise<void> | void) {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return Promise.resolve(fn()).finally(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
}

describe('OpsAlertService', () => {
  let transport: LogTransport;

  beforeEach(() => {
    transport = new LogTransport();
  });

  it('alerts ops about a new employer with company, KvK and the SLA expectation', async () => {
    await withEnv({ OPS_ALERT_EMAIL: 'ops@offermarket.eu' }, async () => {
      const service = makeService(transport);
      await service.notifyNewEmployer({
        companyName: 'Test Installatie BV',
        kvkNumber: '12345678',
        email: 'owner@test-installatie.nl',
      });

      const sent: SentMail[] = transport.outbox;
      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe('ops@offermarket.eu');
      expect(sent[0].subject).toContain('Test Installatie BV');
      expect(sent[0].text).toContain('KvK: 12345678');
      expect(sent[0].text).toContain('owner@test-installatie.nl');
      expect(sent[0].text).toContain('4 working hours');
    });
  });

  it('falls back to the default ops mailbox and never throws when the transport fails', async () => {
    await withEnv({ OPS_ALERT_EMAIL: undefined }, async () => {
      const failingTransport = new LogTransport();
      jest
        .spyOn(failingTransport, 'send')
        .mockRejectedValueOnce(new Error('provider down'));
      const service = makeService(failingTransport);

      await expect(
        service.notifyNewEmployer({
          companyName: 'Failing BV',
          kvkNumber: '87654321',
          email: 'owner@failing.nl',
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('sweep summarises pending employers older than 24h', async () => {
    const pending = [
      {
        companyName: 'Pend BV',
        kvkNumber: '11111111',
        createdAt: new Date('2025-11-01T10:00:00Z'),
        user: { email: 'pend@bv.nl' },
      },
      {
        companyName: 'Pend2 BV',
        kvkNumber: '22222222',
        createdAt: new Date('2025-11-02T10:00:00Z'),
        user: { email: 'pend2@bv.nl' },
      },
    ];
    const prisma = {
      employer: {
        findMany: jest.fn().mockResolvedValue(pending),
      },
    };
    const service = makeService(transport, prisma);
    await service.weeklyUnverifiedSweep();

    expect((prisma as { employer: { findMany: jest.Mock } }).employer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ verificationStatus: 'PENDING' }),
      }),
    );
    expect(transport.outbox).toHaveLength(1);
    expect(transport.outbox[0].text).toContain('Pend BV');
    expect(transport.outbox[0].text).toContain('Pend2 BV');
    expect(transport.outbox[0].text).toContain('2 employer(s)');
  });

  it('sweep sends nothing when no employer is pending', async () => {
    const prisma = { employer: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = makeService(transport, prisma);
    await service.weeklyUnverifiedSweep();
    expect(transport.outbox).toHaveLength(0);
  });

  it('sweep is disabled by OPS_ALERTS_ENABLED=false', async () => {
    await withEnv({ OPS_ALERTS_ENABLED: 'false' }, async () => {
      const prisma = { employer: { findMany: jest.fn() } };
      const service = makeService(transport, prisma);
      await service.weeklyUnverifiedSweep();
      expect(prisma.employer.findMany).not.toHaveBeenCalled();
      expect(transport.outbox).toHaveLength(0);
    });
  });
});
