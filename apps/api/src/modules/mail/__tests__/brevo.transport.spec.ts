import { BrevoError, BrevoTimeoutError } from '@getbrevo/brevo';
import type { BrevoClient } from '@getbrevo/brevo';
import { BrevoTransport } from '../transports/brevo.transport';
import type { EmailConfig } from '../email-config';
import type { EmailMessage } from '../email-message';
import { EmailError } from '../email.errors';

// A minimal fake BrevoClient: only the surface BrevoTransport touches.
type SendTransacResult = { messageId?: string; messageIds?: string[] };
function fakeClient(send: (req: unknown) => Promise<SendTransacResult>): BrevoClient {
  return { transactionalEmails: { sendTransacEmail: send } } as unknown as BrevoClient;
}

const brevoConfig: EmailConfig = {
  provider: 'brevo',
  fromEmail: 'noreply@offermarket.nl',
  fromName: 'OfferMarket',
  replyTo: undefined,
  brevo: { apiKey: 'k', apiBase: 'https://api.brevo.com/v3', maxRetries: 0 },
  outboxDispatcherEnabled: false,
};

const sampleMsg = (overrides: Partial<EmailMessage> = {}): EmailMessage => ({
  to: 'user@example.com',
  from: 'noreply@offermarket.nl',
  fromName: 'OfferMarket',
  subject: 'Subject',
  html: '<html></html>',
  text: 'Body',
  category: 'authentication',
  emailType: 'email_verification',
  locale: 'en',
  tags: ['email_verification'],
  ...overrides,
});

describe('BrevoTransport', () => {
  it('builds the Brevo request from the EmailMessage and returns the messageId', async () => {
    let captured: any = undefined;
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async (req) => {
        captured = req;
        return { messageId: '<brevo-id-1>' };
      }),
    );

    const result = await transport.send(sampleMsg({ to: 'Jane@Example.com', toName: 'Jane' }));

    expect(result).toEqual({ providerMessageId: '<brevo-id-1>', status: 'sent' });
    expect(captured.sender).toEqual({ email: 'noreply@offermarket.nl', name: 'OfferMarket' });
    expect(captured.to).toEqual([{ email: 'Jane@Example.com', name: 'Jane' }]);
    expect(captured.subject).toBe('Subject');
    expect(captured.htmlContent).toBe('<html></html>');
    expect(captured.textContent).toBe('Body');
    expect(captured.tags).toEqual(['email_verification']);
    expect(captured.replyTo).toBeUndefined();
  });

  it('forwards replyTo when present on the message', async () => {
    let captured: any = undefined;
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async (req) => {
        captured = req;
        return { messageId: 'id' };
      }),
    );
    await transport.send(sampleMsg({ replyTo: 'support@offermarket.nl' }));
    expect(captured.replyTo).toEqual({ email: 'support@offermarket.nl' });
  });

  it('falls back to messageIds[0] when messageId is absent', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => ({ messageIds: ['<id-a>', '<id-b>'] })),
    );
    const result = await transport.send(sampleMsg());
    expect(result.providerMessageId).toBe('<id-a>');
  });

  it('maps 429 to a retryable error', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => {
        throw new BrevoError({ message: 'rate limited', statusCode: 429 });
      }),
    );
    await expect(transport.send(sampleMsg())).rejects.toMatchObject({
      name: 'EmailError',
      kind: 'retryable',
      httpStatus: 429,
    });
  });

  it('maps a 5xx to a retryable error', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => {
        throw new BrevoError({ message: 'boom', statusCode: 503 });
      }),
    );
    await expect(transport.send(sampleMsg())).rejects.toMatchObject({ kind: 'retryable' });
  });

  it('maps a 4xx (400) to a permanent error', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => {
        throw new BrevoError({ message: 'bad', statusCode: 400 });
      }),
    );
    await expect(transport.send(sampleMsg())).rejects.toMatchObject({
      kind: 'permanent',
      httpStatus: 400,
    });
  });

  it('maps 401 (auth) to a permanent error', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => {
        throw new BrevoError({ message: 'unauthorized', statusCode: 401 });
      }),
    );
    await expect(transport.send(sampleMsg())).rejects.toMatchObject({ kind: 'permanent' });
  });

  it('maps a timeout to a retryable error', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => {
        throw new BrevoTimeoutError('timed out');
      }),
    );
    await expect(transport.send(sampleMsg())).rejects.toMatchObject({
      kind: 'retryable',
      providerCode: 'timeout',
    });
  });

  it('maps a network/unknown error to retryable with a sanitized message', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => {
        throw new Error('fetch failed: ECONNREFUSED');
      }),
    );
    await expect(transport.send(sampleMsg())).rejects.toMatchObject({
      kind: 'retryable',
      providerCode: 'network',
    });
    // Ensure EmailError is the concrete type, not just a match.
    try {
      await transport.send(sampleMsg());
    } catch (e) {
      expect(e).toBeInstanceOf(EmailError);
      expect((e as EmailError).safeMessage).toBe('fetch failed: ECONNREFUSED');
    }
  });

  it('does not leak the raw BrevoError body into safeMessage', async () => {
    const transport = new BrevoTransport(
      brevoConfig,
      fakeClient(async () => {
        throw new BrevoError({
          message: 'invalid recipient',
          statusCode: 400,
          body: { email: 'someone@example.com', secret: 'should-not-leak' },
        });
      }),
    );
    try {
      await transport.send(sampleMsg());
    } catch (e) {
      const err = e as EmailError;
      expect(err.kind).toBe('permanent');
      expect(err.safeMessage).toBe('Brevo 400');
      expect(err.safeMessage).not.toContain('should-not-leak');
    }
  });

  it('throws when constructed with a non-brevo config', () => {
    expect(() =>
      new BrevoTransport({ provider: 'log', fromEmail: '', fromName: '', brevo: null, outboxDispatcherEnabled: false }),
    ).toThrow(/Brevo config/);
  });

  it('constructs the real SDK client when none is injected (no network call at construction)', () => {
    // No fake client → BrevoTransport builds a real BrevoClient. Construction
    // must not perform I/O, so this is safe to run offline.
    expect(() => new BrevoTransport(brevoConfig)).not.toThrow();
  });
});