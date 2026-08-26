import {
  buildEmailMessage,
  escapeHtml,
  renderNotificationEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
  textToHtml,
} from '../email-renderer';
import type { EmailConfig } from '../email-config';

const senderConfig: EmailConfig = {
  provider: 'log',
  fromEmail: 'noreply@offermarket.nl',
  fromName: 'OfferMarket',
  replyTo: 'support@offermarket.nl',
  brevo: null,
  outboxDispatcherEnabled: false,
};

describe('email-renderer', () => {
  describe('renderVerificationEmail', () => {
    it('renders the EMAIL verification subject + body with the code', () => {
      const r = renderVerificationEmail('123456', 'EMAIL', 'nl');
      expect(r.subject).toBe('Verifieer je OfferMarket-e-mailadres');
      expect(r.text).toContain('123456');
    });

    it('renders the EMAIL body with link + code when verifyUrl is given', () => {
      const url = 'https://offermarket.eu/verify-email?token=abc';
      const r = renderVerificationEmail('123456', 'EMAIL', 'en', url);
      expect(r.subject).toBe('Verify your OfferMarket email');
      expect(r.text).toContain(url);
      expect(r.text).toContain('123456');
    });

    it('renders the PHONE verification subject for PHONE type', () => {
      const r = renderVerificationEmail('123456', 'PHONE', 'nl');
      expect(r.subject).toBe('Je OfferMarket-telefoonverificatiecode');
    });

    it('falls back to English for an unknown locale', () => {
      const r = renderVerificationEmail('123456', 'EMAIL', 'xx');
      expect(r.subject).toBe('Verify your OfferMarket email');
    });
  });

  describe('renderPasswordResetEmail', () => {
    it('embeds the reset URL and localizes the subject', () => {
      const url = 'https://app.test/reset-password?token=abc';
      const r = renderPasswordResetEmail(url, 'nl');
      expect(r.subject).toBe('Stel je OfferMarket-wachtwoord opnieuw in');
      expect(r.text).toContain(url);
    });
  });

  describe('renderNotificationEmail', () => {
    it('localizes the framing and includes the open label when actionUrl is set', () => {
      const r = renderNotificationEmail('Title', 'Body', '/offers/1', 'nl');
      expect(r.subject).toBe('Title');
      expect(r.text).toContain('Title');
      expect(r.text).toContain('Body');
      expect(r.text).toContain('Openen: /offers/1');
      expect(r.text).toContain('— OfferMarket');
    });

    it('omits the open link when actionUrl is empty (English framing fallback)', () => {
      const r = renderNotificationEmail('Title', 'Body', '', 'en');
      expect(r.text).not.toContain('Open:');
      expect(r.text).toContain('— OfferMarket');
    });
  });

  describe('buildEmailMessage', () => {
    it('normalizes the recipient, resolves the locale, and wraps text as HTML', () => {
      const msg = buildEmailMessage(
        {
          to: 'Jane@Example.com',
          subject: 'Subject',
          text: 'Body <with> tags',
          emailType: 'notification',
          category: 'notification',
          locale: 'nl',
        },
        senderConfig,
      );
      expect(msg.to).toBe('jane@example.com');
      expect(msg.from).toBe('noreply@offermarket.nl');
      expect(msg.fromName).toBe('OfferMarket');
      expect(msg.replyTo).toBe('support@offermarket.nl');
      expect(msg.locale).toBe('nl');
      expect(msg.tags).toEqual(['notification']);
      expect(msg.html).toContain('&lt;with&gt;'); // text escaped into HTML
      expect(msg.text).toBe('Body <with> tags'); // plain text unchanged
    });

    it('falls back to the default locale for an unsupported locale', () => {
      const msg = buildEmailMessage(
        { to: 'a@b.test', subject: 's', text: 't', emailType: 'notification', category: 'notification', locale: 'xx' },
        senderConfig,
      );
      expect(msg.locale).toBe('en');
    });

    it('honors a custom tags list', () => {
      const msg = buildEmailMessage(
        {
          to: 'a@b.test',
          subject: 's',
          text: 't',
          emailType: 'notification',
          category: 'notification',
          tags: ['notification', 'offer'],
        },
        senderConfig,
      );
      expect(msg.tags).toEqual(['notification', 'offer']);
    });
  });

  describe('textToHtml / escapeHtml', () => {
    it('escapes ampersands and angle brackets', () => {
      expect(escapeHtml('a & <b> c')).toBe('a &amp; &lt;b&gt; c');
    });

    it('wraps text in an HTML envelope', () => {
      const html = textToHtml('hi & <there>');
      expect(html).toMatch(/^<html><body><pre/);
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;there&gt;');
    });
  });
});