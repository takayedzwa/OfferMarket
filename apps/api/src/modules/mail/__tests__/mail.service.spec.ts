import { MailService } from '../mail.service';

describe('MailService (i18n)', () => {
  let service: MailService;

  beforeEach(() => {
    service = new MailService();
  });

  function last() {
    return service.outbox[service.outbox.length - 1];
  }

  it('renders the verification email in Dutch when locale=nl', () => {
    service.sendVerificationCode('a@b.test', '123456', 'EMAIL', 'nl');
    const m = last();
    expect(m.to).toBe('a@b.test');
    expect(m.subject).toBe('Verifieer je OfferMarket-e-mailadres');
    expect(m.text).toContain('123456');
  });

  it('renders the verification email in English by default (no locale)', () => {
    service.sendVerificationCode('a@b.test', '123456', 'EMAIL');
    const m = last();
    expect(m.subject).toBe('Verify your OfferMarket email');
    expect(m.text).toContain('123456');
  });

  it('embeds the verify link + code when verifyUrl is provided', () => {
    const url = 'https://offermarket.eu/verify-email?token=abc';
    service.sendVerificationCode('a@b.test', '123456', 'EMAIL', 'en', url);
    const m = last();
    expect(m.subject).toBe('Verify your OfferMarket email');
    expect(m.text).toContain(url);
    expect(m.text).toContain('123456');
  });

  it('renders the phone verification subject for PHONE type', () => {
    service.sendVerificationCode('a@b.test', '123456', 'PHONE', 'nl');
    expect(last().subject).toBe('Je OfferMarket-telefoonverificatiecode');
  });

  it('renders the password-reset email localized and embeds the reset URL', () => {
    const url = 'https://app.test/reset-password?token=abc';
    service.sendPasswordReset('a@b.test', url, 'nl');
    const m = last();
    expect(m.subject).toBe('Stel je OfferMarket-wachtwoord opnieuw in');
    expect(m.text).toContain(url);
  });

  it('drops mail with an empty recipient without throwing', () => {
    expect(() => service.sendVerificationCode('', '123456', 'EMAIL', 'nl')).not.toThrow();
    expect(service.outbox.length).toBe(0);
  });
});