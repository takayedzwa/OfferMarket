import { loadEmailConfig } from '../email-config';

const baseEnv = { NODE_ENV: 'test' } as NodeJS.ProcessEnv;

describe('loadEmailConfig', () => {
  it('defaults to the log provider when EMAIL_PROVIDER is unset', () => {
    const cfg = loadEmailConfig({ ...baseEnv });
    expect(cfg.provider).toBe('log');
    expect(cfg.brevo).toBeNull();
    expect(cfg.fromEmail).toBe('noreply@offermarket.eu');
    expect(cfg.fromName).toBe('OfferMarket');
  });

  it('selects brevo with the api key + base url from env', () => {
    const cfg = loadEmailConfig({
      ...baseEnv,
      EMAIL_PROVIDER: 'brevo',
      BREVO_API_KEY: 'secret-key',
      BREVO_API_BASE: 'https://api.brevo.com/v3',
      EMAIL_FROM_EMAIL: 'hello@offermarket.nl',
      EMAIL_FROM_NAME: 'OfferMarket',
      EMAIL_REPLY_TO: 'support@offermarket.nl',
    });
    expect(cfg.provider).toBe('brevo');
    expect(cfg.brevo).toEqual({
      apiKey: 'secret-key',
      apiBase: 'https://api.brevo.com/v3',
      maxRetries: 0,
    });
    expect(cfg.fromEmail).toBe('hello@offermarket.nl');
    expect(cfg.replyTo).toBe('support@offermarket.nl');
  });

  it('falls back to SES_FROM_EMAIL when EMAIL_FROM_EMAIL is unset', () => {
    const cfg = loadEmailConfig({ ...baseEnv, SES_FROM_EMAIL: 'legacy@offermarket.nl' });
    expect(cfg.fromEmail).toBe('legacy@offermarket.nl');
  });

  it('parses BREVO_MAX_RETRIES and clamps negatives to 0', () => {
    const cfg = loadEmailConfig({
      ...baseEnv,
      EMAIL_PROVIDER: 'brevo',
      BREVO_API_KEY: 'k',
      BREVO_MAX_RETRIES: '3',
    });
    expect(cfg.brevo?.maxRetries).toBe(3);

    const cfgNeg = loadEmailConfig({
      ...baseEnv,
      EMAIL_PROVIDER: 'brevo',
      BREVO_API_KEY: 'k',
      BREVO_MAX_RETRIES: '-2',
    });
    expect(cfgNeg.brevo?.maxRetries).toBe(0);
  });

  it('falls back to log when brevo is selected without an api key in non-production', () => {
    const cfg = loadEmailConfig({ ...baseEnv, EMAIL_PROVIDER: 'brevo' });
    expect(cfg.provider).toBe('log');
    expect(cfg.brevo).toBeNull();
  });

  it('throws in production when brevo is selected without an api key', () => {
    expect(() =>
      loadEmailConfig({ NODE_ENV: 'production', EMAIL_PROVIDER: 'brevo' }),
    ).toThrow(/BREVO_API_KEY/);
  });

  it('throws on an unknown provider', () => {
    expect(() => loadEmailConfig({ ...baseEnv, EMAIL_PROVIDER: 'ses' })).toThrow(
      /Invalid EMAIL_PROVIDER/,
    );
  });

  it('does not throw in production when provider is log (preserves legacy warn-and-drop behavior)', () => {
    expect(() => loadEmailConfig({ NODE_ENV: 'production' })).not.toThrow();
  });
});