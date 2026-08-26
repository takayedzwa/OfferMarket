import { EmailDispatcher } from '../dispatcher/email-dispatcher.service';
import { EmailError } from '../email.errors';
import type { EmailConfig } from '../email-config';
import type { EmailMessage } from '../email-message';
import type { EmailTransport } from '../transports/email.transport';
import { OutboxStatus } from '../dispatcher/email-outbox.service';

// Mocks for the dispatcher's collaborators. The outbox + gate are replaced
// wholesale so the test drives the state machine; prisma is only used for the
// notification.findUnique render lookup.
function makeMocks() {
  const outbox = {
    requeueStaleSending: jest.fn().mockResolvedValue(0),
    claimNextBatch: jest.fn().mockResolvedValue([]),
    markSent: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
    markSuppressed: jest.fn().mockResolvedValue(undefined),
    scheduleRetry: jest.fn().mockResolvedValue(undefined),
    countByStatus: jest.fn().mockResolvedValue(0),
  };
  const gate = { canSend: jest.fn().mockResolvedValue({ ok: true }) };
  const prisma = { notification: { findUnique: jest.fn() } };
  const send = jest.fn().mockResolvedValue({ providerMessageId: 'brevo-1', status: 'sent' });
  const transport = { name: 'fake', send } as unknown as EmailTransport;
  const config: EmailConfig = {
    provider: 'brevo',
    fromEmail: 'noreply@offermarket.nl',
    fromName: 'OfferMarket',
    replyTo: undefined,
    brevo: { apiKey: 'k', apiBase: 'https://api.brevo.com/v3', maxRetries: 0 },
    outboxDispatcherEnabled: true,
  };
  return { outbox, gate, prisma, transport, send, config };
}

function makeDispatcher(mocks: ReturnType<typeof makeMocks>) {
  return new EmailDispatcher(
    mocks.prisma as any,
    mocks.outbox as any,
    mocks.gate as any,
    mocks.transport,
    mocks.config,
  );
}

const row = (overrides: Partial<any> = {}) => ({
  id: 'outbox-1',
  notificationId: 'notif-1',
  userId: 'user-1',
  toEmail: 'jane@example.com',
  emailType: 'notification',
  category: 'notification',
  locale: 'en',
  ...overrides,
});

describe('EmailDispatcher', () => {
  let mocks: ReturnType<typeof makeMocks>;
  let dispatcher: EmailDispatcher;

  beforeEach(() => {
    mocks = makeMocks();
    dispatcher = makeDispatcher(mocks);
  });

  afterEach(() => jest.clearAllMocks());

  describe('pump', () => {
    it('requeues stale sending then claims a batch; empty batch is a no-op', async () => {
      await dispatcher.pump();
      expect(mocks.outbox.requeueStaleSending).toHaveBeenCalledTimes(1);
      expect(mocks.outbox.claimNextBatch).toHaveBeenCalledWith(25);
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it('renders from the notification, sends, and marks sent on success', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row()]);
      mocks.prisma.notification.findUnique.mockResolvedValue({
        notificationType: 'offer_received',
        title: 'New offer',
        body: 'You have an offer',
        actionUrl: '/offers/1',
      });

      await dispatcher.pump();

      expect(mocks.gate.canSend).toHaveBeenCalledWith({
        userId: 'user-1',
        toEmail: 'jane@example.com',
        category: 'notification',
        notificationType: 'offer_received',
      });
      expect(mocks.send).toHaveBeenCalledTimes(1);
      const sent = (mocks.send.mock.calls[0] as any[])[0] as EmailMessage;
      expect(sent.to).toBe('jane@example.com');
      expect(sent.subject).toBe('New offer');
      expect(sent.tags).toEqual(['notification']);
      expect(mocks.outbox.markSent).toHaveBeenCalledWith('outbox-1', 'brevo-1');
      expect(mocks.outbox.scheduleRetry).not.toHaveBeenCalled();
    });

    it('marks failed when the source notification no longer exists', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row()]);
      mocks.prisma.notification.findUnique.mockResolvedValue(null);

      await dispatcher.pump();

      expect(mocks.outbox.markFailed).toHaveBeenCalledWith('outbox-1', 'source notification no longer exists');
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it('marks failed when a claimed row has no notificationId (cannot reconstruct)', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row({ notificationId: null })]);

      await dispatcher.pump();

      expect(mocks.outbox.markFailed).toHaveBeenCalledWith('outbox-1', 'no notification intent to render');
      expect(mocks.prisma.notification.findUnique).not.toHaveBeenCalled();
    });

    it('marks failed (terminal) when the delivery gate blocks the recipient', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row()]);
      mocks.prisma.notification.findUnique.mockResolvedValue({
        notificationType: 'offer_received',
        title: 't',
        body: 'b',
        actionUrl: '/x',
      });
      mocks.gate.canSend.mockResolvedValue({ ok: false, reason: 'processing_restricted' });

      await dispatcher.pump();

      expect(mocks.outbox.markFailed).toHaveBeenCalledWith('outbox-1', 'delivery blocked: processing_restricted');
      expect(mocks.outbox.markSuppressed).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it('marks suppressed (terminal) when the gate reports a suppressed address', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row()]);
      mocks.prisma.notification.findUnique.mockResolvedValue({
        notificationType: 'offer_received',
        title: 't',
        body: 'b',
        actionUrl: '/x',
      });
      mocks.gate.canSend.mockResolvedValue({ ok: false, reason: 'suppressed' });

      await dispatcher.pump();

      expect(mocks.outbox.markSuppressed).toHaveBeenCalledWith('outbox-1', 'address suppressed');
      expect(mocks.outbox.markFailed).not.toHaveBeenCalled();
      expect(mocks.send).not.toHaveBeenCalled();
    });

    it('marks failed on a permanent EmailError (4xx)', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row()]);
      mocks.prisma.notification.findUnique.mockResolvedValue({
        notificationType: 'offer_received',
        title: 't',
        body: 'b',
        actionUrl: '/x',
      });
      const permanent = new EmailError('permanent', 'brevo', 400, 'Brevo 400');
      mocks.send.mockRejectedValueOnce(permanent);

      await dispatcher.pump();

      expect(mocks.outbox.markFailed).toHaveBeenCalledTimes(1);
      expect(mocks.outbox.scheduleRetry).not.toHaveBeenCalled();
    });

    it('schedules a retry on a retryable EmailError (5xx)', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row()]);
      mocks.prisma.notification.findUnique.mockResolvedValue({
        notificationType: 'offer_received',
        title: 't',
        body: 'b',
        actionUrl: '/x',
      });
      const retryable = new EmailError('retryable', 'brevo', 503, 'Brevo 503');
      mocks.send.mockRejectedValueOnce(retryable);

      await dispatcher.pump();

      expect(mocks.outbox.scheduleRetry).toHaveBeenCalledTimes(1);
      expect(mocks.outbox.markFailed).not.toHaveBeenCalled();
    });

    it('schedules a retry on an unknown (non-EmailError) failure', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([row()]);
      mocks.prisma.notification.findUnique.mockResolvedValue({
        notificationType: 'offer_received',
        title: 't',
        body: 'b',
        actionUrl: '/x',
      });
      mocks.send.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await dispatcher.pump();

      expect(mocks.outbox.scheduleRetry).toHaveBeenCalledTimes(1);
    });

    it('processes every row independently — one failure does not abort the batch', async () => {
      mocks.outbox.claimNextBatch.mockResolvedValue([
        row({ id: 'a', notificationId: 'missing' }),
        row({ id: 'b' }),
      ]);
      mocks.prisma.notification.findUnique
        .mockResolvedValueOnce(null) // row a: notification gone → fail
        .mockResolvedValueOnce({ notificationType: 'offer_received', title: 't', body: 'b', actionUrl: '/x' }); // row b: ok

      await dispatcher.pump();

      expect(mocks.outbox.markFailed).toHaveBeenCalledWith('a', 'source notification no longer exists');
      expect(mocks.outbox.markSent).toHaveBeenCalledWith('b', 'brevo-1');
    });
  });

  describe('tick (re-entrancy + enabled guard)', () => {
    it('skips when disabled', async () => {
      mocks.config.outboxDispatcherEnabled = false;
      dispatcher = makeDispatcher(mocks);
      await dispatcher.tick();
      expect(mocks.outbox.claimNextBatch).not.toHaveBeenCalled();
    });

    it('skips a concurrent tick while a pump is running', async () => {
      // Make the first pump block until we release it.
      let release!: () => void;
      const blocked = new Promise<void>((r) => (release = r));
      mocks.outbox.claimNextBatch.mockImplementationOnce(async () => {
        await blocked;
        return [];
      });

      const first = dispatcher.tick();
      // Second tick fired while the first pump is still awaiting claimNextBatch.
      await dispatcher.tick();
      // Only one claim call so far (the second tick was skipped).
      expect(mocks.outbox.claimNextBatch).toHaveBeenCalledTimes(1);

      release!();
      await first;
      expect(mocks.outbox.claimNextBatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('countByStatus', () => {
    it('delegates to the outbox service', async () => {
      mocks.outbox.countByStatus.mockResolvedValue(3);
      const count = await dispatcher.countByStatus(OutboxStatus.SENT);
      expect(count).toBe(3);
      expect(mocks.outbox.countByStatus).toHaveBeenCalledWith(OutboxStatus.SENT);
    });
  });
});