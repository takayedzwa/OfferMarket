import { LogTransport } from '../transports/log.transport';
import type { EmailMessage } from '../email-message';

const sampleMsg = (overrides: Partial<EmailMessage> = {}): EmailMessage => ({
  to: 'user@example.com',
  from: 'noreply@offermarket.nl',
  subject: 'Subject',
  html: '<html></html>',
  text: 'Body text',
  category: 'notification',
  emailType: 'notification',
  locale: 'en',
  tags: ['notification'],
  ...overrides,
});

describe('LogTransport', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('captures sent mail in the outbox in non-production and resolves synchronously', async () => {
    process.env.NODE_ENV = 'test';
    const transport = new LogTransport();
    const before = transport.outbox.length;

    const result = await transport.send(sampleMsg({ to: 'a@b.test', subject: 'Hi' }));

    expect(result).toEqual({ providerMessageId: 'log', status: 'sent' });
    expect(transport.outbox.length).toBe(before + 1);
    const entry = transport.outbox[transport.outbox.length - 1];
    expect(entry.to).toBe('a@b.test');
    expect(entry.subject).toBe('Hi');
    expect(entry.text).toBe('Body text');
    expect(entry.sentAt).toBeInstanceOf(Date);
  });

  it('drops mail in production (no outbox capture) and resolves without throwing', async () => {
    process.env.NODE_ENV = 'production';
    const transport = new LogTransport();
    const before = transport.outbox.length;

    const result = await transport.send(sampleMsg());

    expect(result).toEqual({ providerMessageId: '', status: 'sent' });
    expect(transport.outbox.length).toBe(before); // nothing captured
  });
});