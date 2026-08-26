import { Test, TestingModule } from '@nestjs/testing';
import { SuppressionReason } from '@prisma/client';
import { EMAIL_CONFIG_TOKEN } from '../mail.tokens';
import type { EmailConfig } from '../email-config';
import { EmailDeliveryGate } from '../dispatcher/email-delivery-gate';
import { BrevoWebhookController } from '../webhooks/brevo-webhook.controller';

const SECRET = 'test-shared-secret-do-not-use-in-prod';

function baseConfig(overrides: Partial<EmailConfig> = {}): EmailConfig {
  return {
    provider: 'brevo',
    fromEmail: 'noreply@offermarket.nl',
    fromName: 'OfferMarket',
    replyTo: undefined,
    brevo: { apiKey: 'k', apiBase: 'https://api.brevo.com/v3', maxRetries: 0 },
    outboxDispatcherEnabled: true,
    brevoWebhookSecret: SECRET,
    ...overrides,
  };
}

describe('BrevoWebhookController', () => {
  let controller: BrevoWebhookController;
  let gate: { suppress: jest.Mock };

  beforeEach(async () => {
    gate = { suppress: jest.fn().mockResolvedValue(undefined) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrevoWebhookController],
      providers: [
        { provide: EmailDeliveryGate, useValue: gate },
        { provide: EMAIL_CONFIG_TOKEN, useValue: baseConfig() },
      ],
    }).compile();
    controller = module.get(BrevoWebhookController);
  });

  afterEach(() => jest.clearAllMocks());

  const req = (body: any) => ({ body });

  describe('authentication', () => {
    it('rejects a wrong secret with 401 and records nothing', async () => {
      await expect(controller.handle('wrong', req({ event: 'hard_bounce', email: 'a@b.test' })))
        .rejects.toThrow();
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('rejects an empty secret with 401', async () => {
      await expect(controller.handle('', req({ event: 'hard_bounce', email: 'a@b.test' })))
        .rejects.toThrow();
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('rejects everything when the webhook secret is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [BrevoWebhookController],
        providers: [
          { provide: EmailDeliveryGate, useValue: gate },
          { provide: EMAIL_CONFIG_TOKEN, useValue: baseConfig({ brevoWebhookSecret: undefined }) },
        ],
      }).compile();
      const noSecretController = module.get(BrevoWebhookController);

      await expect(noSecretController.handle(SECRET, req({ event: 'hard_bounce', email: 'a@b.test' })))
        .rejects.toThrow();
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('does not leak timing on secret length (a prefix of the secret is rejected)', async () => {
      await expect(controller.handle(SECRET.slice(0, 3), req({ event: 'hard_bounce', email: 'a@b.test' })))
        .rejects.toThrow();
      expect(gate.suppress).not.toHaveBeenCalled();
    });
  });

  describe('event → suppression mapping', () => {
    it('maps hard_bounce → HARD_BOUNCE', async () => {
      await controller.handle(SECRET, req({ event: 'hard_bounce', email: 'Bounced@Example.com', messageId: '<mid-1>' }));
      expect(gate.suppress).toHaveBeenCalledWith('Bounced@Example.com', SuppressionReason.HARD_BOUNCE, null, '<mid-1>');
    });

    it('maps spam → COMPLAINT', async () => {
      await controller.handle(SECRET, req({ event: 'spam', email: 'a@b.test' }));
      expect(gate.suppress).toHaveBeenCalledWith('a@b.test', SuppressionReason.COMPLAINT, null, null);
    });

    it('maps blocked → BLOCKED', async () => {
      await controller.handle(SECRET, req({ event: 'blocked', email: 'a@b.test' }));
      expect(gate.suppress).toHaveBeenCalledWith('a@b.test', SuppressionReason.BLOCKED, null, null);
    });

    it('maps invalid_email → INVALID', async () => {
      await controller.handle(SECRET, req({ event: 'invalid_email', email: 'a@b.test' }));
      expect(gate.suppress).toHaveBeenCalledWith('a@b.test', SuppressionReason.INVALID, null, null);
    });

    it('captures a numeric id as brevoEventId', async () => {
      await controller.handle(SECRET, req({ event: 'hard_bounce', email: 'a@b.test', id: 12345 }));
      expect(gate.suppress).toHaveBeenCalledWith('a@b.test', SuppressionReason.HARD_BOUNCE, '12345', null);
    });

    it('accepts snake_case message_id', async () => {
      await controller.handle(SECRET, req({ event: 'hard_bounce', email: 'a@b.test', message_id: '<mid-2>' }));
      expect(gate.suppress).toHaveBeenCalledWith('a@b.test', SuppressionReason.HARD_BOUNCE, null, '<mid-2>');
    });
  });

  describe('ignored events', () => {
    it('acknowledges soft_bounce without recording a suppression', async () => {
      await controller.handle(SECRET, req({ event: 'soft_bounce', email: 'a@b.test' }));
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('acknowledges unsubscribed without recording a suppression (consent concern, not suppression)', async () => {
      await controller.handle(SECRET, req({ event: 'unsubscribed', email: 'a@b.test' }));
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('acknowledges delivered / opened / clicked', async () => {
      await controller.handle(SECRET, req({ event: 'delivered', email: 'a@b.test' }));
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('skips an event with no email', async () => {
      await controller.handle(SECRET, req({ event: 'hard_bounce' }));
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('skips an event with an unknown event name', async () => {
      await controller.handle(SECRET, req({ event: 'some_new_event', email: 'a@b.test' }));
      expect(gate.suppress).not.toHaveBeenCalled();
    });
  });

  describe('payload shapes', () => {
    it('handles a batched array of events', async () => {
      await controller.handle(SECRET, req([
        { event: 'hard_bounce', email: 'a@b.test' },
        { event: 'spam', email: 'c@d.test' },
        { event: 'delivered', email: 'e@f.test' },
      ]));
      expect(gate.suppress).toHaveBeenCalledTimes(2);
      expect(gate.suppress).toHaveBeenNthCalledWith(1, 'a@b.test', SuppressionReason.HARD_BOUNCE, null, null);
      expect(gate.suppress).toHaveBeenNthCalledWith(2, 'c@d.test', SuppressionReason.COMPLAINT, null, null);
    });

    it('handles an empty body (Brevo occasionally sends empty)', async () => {
      await controller.handle(SECRET, req(undefined));
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('handles a batched array that is empty', async () => {
      await controller.handle(SECRET, req([]));
      expect(gate.suppress).not.toHaveBeenCalled();
    });

    it('acknowledges the whole batch even when one event fails to suppress', async () => {
      gate.suppress.mockRejectedValueOnce(new Error('db blip')).mockResolvedValue(undefined);
      await controller.handle(SECRET, req([
        { event: 'hard_bounce', email: 'a@b.test' }, // fails
        { event: 'blocked', email: 'c@d.test' }, // ok
      ]));
      expect(gate.suppress).toHaveBeenCalledTimes(2);
      // No throw — the batch is acknowledged so Brevo does not retry the whole thing.
    });
  });
});