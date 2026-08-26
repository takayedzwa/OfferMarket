import { Test, TestingModule } from '@nestjs/testing';
import { ConsentStatus, SuppressionReason } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailDeliveryGate, GateContext } from '../dispatcher/email-delivery-gate';
import { NotificationEventType } from '../../notifications/notification.types';

class MockPrismaService {
  userGdprFlags = { findUnique: jest.fn() };
  emailSuppression = { findFirst: jest.fn(), upsert: jest.fn() };
  consent = { findFirst: jest.fn() };
}

describe('EmailDeliveryGate', () => {
  let gate: EmailDeliveryGate;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = new MockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailDeliveryGate, { provide: PrismaService, useValue: prisma }],
    }).compile();
    gate = module.get(EmailDeliveryGate);
  });

  afterEach(() => jest.clearAllMocks());

  const notSuppressed = () => prisma.emailSuppression.findFirst.mockResolvedValue(null);
  const noFlags = () => prisma.userGdprFlags.findUnique.mockResolvedValue(null);
  const restricted = () =>
    prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: true });
  const noConsent = () => prisma.consent.findFirst.mockResolvedValue(null);

  describe('canSend — suppression', () => {
    it('blocks a suppressed address (any reason) before anything else', async () => {
      prisma.emailSuppression.findFirst.mockResolvedValue({ reason: SuppressionReason.HARD_BOUNCE });
      const decision = await gate.canSend({
        userId: 'u1',
        toEmail: 'Bounced@Example.com',
        category: 'notification',
      });
      expect(decision).toEqual({ ok: false, reason: 'suppressed' });
      // Normalized lookup.
      expect(prisma.emailSuppression.findFirst).toHaveBeenCalledWith({
        where: { email: 'bounced@example.com' },
        select: { reason: true },
      });
      // Short-circuits: consent + flags never queried.
      expect(prisma.consent.findFirst).not.toHaveBeenCalled();
      expect(prisma.userGdprFlags.findUnique).not.toHaveBeenCalled();
    });

    it('does not query suppression when toEmail is absent', async () => {
      noConsent();
      noFlags();
      const decision = await gate.canSend({ userId: 'u1', category: 'notification' });
      expect(decision.ok).toBe(true);
      expect(prisma.emailSuppression.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('canSend — required categories (authentication / transactional)', () => {
    it('always allows authentication emails (skips consent + GDPR) when not suppressed', async () => {
      notSuppressed();
      const decision = await gate.canSend({ userId: 'u1', toEmail: 'a@b.test', category: 'authentication' });
      expect(decision).toEqual({ ok: true });
      expect(prisma.consent.findFirst).not.toHaveBeenCalled();
      expect(prisma.userGdprFlags.findUnique).not.toHaveBeenCalled();
    });

    it('blocks authentication emails to a suppressed address (a bounce is a bounce)', async () => {
      prisma.emailSuppression.findFirst.mockResolvedValue({ reason: SuppressionReason.INVALID });
      expect(await gate.canSend({ userId: 'u1', toEmail: 'a@b.test', category: 'authentication' })).toEqual({
        ok: false,
        reason: 'suppressed',
      });
    });
  });

  describe('canSend — notification category consent (opt-out default)', () => {
    const notifCtx = (overrides: Partial<GateContext> = {}): GateContext => ({
      userId: 'u1',
      toEmail: 'a@b.test',
      category: 'notification',
      notificationType: 'offer_received',
      ...overrides,
    });

    it('allows when no consent row exists (opt-out default: ON)', async () => {
      notSuppressed();
      noConsent();
      noFlags();
      expect(await gate.canSend(notifCtx())).toEqual({ ok: true });
    });

    it('allows when the latest EMAIL_NOTIFICATIONS consent is GIVEN', async () => {
      notSuppressed();
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.GIVEN });
      noFlags();
      expect(await gate.canSend(notifCtx())).toEqual({ ok: true });
    });

    it('blocks when the latest EMAIL_NOTIFICATIONS consent is WITHDRAWN', async () => {
      notSuppressed();
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.WITHDRAWN });
      const decision = await gate.canSend(notifCtx());
      expect(decision).toEqual({ ok: false, reason: 'no_consent' });
      expect(prisma.userGdprFlags.findUnique).not.toHaveBeenCalled();
    });

    it('blocks when the latest EMAIL_NOTIFICATIONS consent is REVOKED', async () => {
      notSuppressed();
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.REVOKED });
      expect(await gate.canSend(notifCtx())).toEqual({ ok: false, reason: 'no_consent' });
    });

    it('allows an EXPIRED consent (opt-out default — expiry does not turn emails off)', async () => {
      notSuppressed();
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.EXPIRED });
      noFlags();
      expect(await gate.canSend(notifCtx())).toEqual({ ok: true });
    });
  });

  describe('canSend — marketing category consent (opt-in required)', () => {
    const mktCtx = (): GateContext => ({ userId: 'u1', toEmail: 'a@b.test', category: 'marketing' });

    it('blocks when there is no MARKETING consent (no explicit opt-in)', async () => {
      notSuppressed();
      noConsent();
      expect(await gate.canSend(mktCtx())).toEqual({ ok: false, reason: 'no_consent' });
    });

    it('blocks when MARKETING consent is WITHDRAWN', async () => {
      notSuppressed();
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.WITHDRAWN });
      expect(await gate.canSend(mktCtx())).toEqual({ ok: false, reason: 'no_consent' });
    });

    it('allows only when MARKETING consent is GIVEN', async () => {
      notSuppressed();
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.GIVEN });
      noFlags();
      expect(await gate.canSend(mktCtx())).toEqual({ ok: true });
    });
  });

  describe('canSend — GDPR Article 18 restriction', () => {
    const notifCtx = (overrides: Partial<GateContext> = {}): GateContext => ({
      userId: 'u1',
      toEmail: 'a@b.test',
      category: 'notification',
      notificationType: 'offer_received',
      ...overrides,
    });

    it('blocks a restricted recipient for a regular notification', async () => {
      notSuppressed();
      noConsent();
      restricted();
      expect(await gate.canSend(notifCtx())).toEqual({ ok: false, reason: 'processing_restricted' });
    });

    it('allows a restricted recipient for a legally-required breach notification', async () => {
      notSuppressed();
      noConsent();
      restricted();
      expect(await gate.canSend(notifCtx({ notificationType: NotificationEventType.BREACH_NOTIFICATION }))).toEqual({
        ok: true,
      });
    });

    it('skips the flags query when userId is null', async () => {
      notSuppressed();
      noConsent();
      const decision = await gate.canSend(notifCtx({ userId: null }));
      expect(decision).toEqual({ ok: true });
      expect(prisma.userGdprFlags.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('hasEmailConsent (enqueue-time, consent-only)', () => {
    it('always returns true for required categories without querying', async () => {
      expect(await gate.hasEmailConsent('u1', 'authentication')).toBe(true);
      expect(await gate.hasEmailConsent('u1', 'transactional')).toBe(true);
      expect(prisma.consent.findFirst).not.toHaveBeenCalled();
    });

    it('returns true for notification when no consent row (opt-out default)', async () => {
      noConsent();
      expect(await gate.hasEmailConsent('u1', 'notification')).toBe(true);
    });

    it('returns false for notification when consent is WITHDRAWN', async () => {
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.WITHDRAWN });
      expect(await gate.hasEmailConsent('u1', 'notification')).toBe(false);
    });

    it('returns false for marketing without explicit GIVEN consent', async () => {
      noConsent();
      expect(await gate.hasEmailConsent('u1', 'marketing')).toBe(false);
      prisma.consent.findFirst.mockResolvedValue({ status: ConsentStatus.GIVEN });
      expect(await gate.hasEmailConsent('u1', 'marketing')).toBe(true);
    });

    it('queries the latest consent (ordered by createdAt desc)', async () => {
      noConsent();
      await gate.hasEmailConsent('u1', 'notification');
      expect(prisma.consent.findFirst).toHaveBeenCalledWith({
        where: { userId: 'u1', consentType: 'EMAIL_NOTIFICATIONS' },
        orderBy: { createdAt: 'desc' },
        select: { status: true },
      });
    });
  });

  describe('suppress + isSuppressed', () => {
    it('upserts a suppression row keyed by normalized email + reason', async () => {
      prisma.emailSuppression.upsert.mockResolvedValue({});
      await gate.suppress('Bounced@Example.com', SuppressionReason.HARD_BOUNCE, 'evt-1', '<mid>');

      expect(prisma.emailSuppression.upsert).toHaveBeenCalledWith({
        where: { email_reason: { email: 'bounced@example.com', reason: SuppressionReason.HARD_BOUNCE } },
        update: { brevoEventId: 'evt-1', providerMessageId: '<mid>' },
        create: {
          email: 'bounced@example.com',
          reason: SuppressionReason.HARD_BOUNCE,
          brevoEventId: 'evt-1',
          providerMessageId: '<mid>',
        },
      });
    });

    it('isSuppressed returns true when a suppression row exists', async () => {
      prisma.emailSuppression.findFirst.mockResolvedValue({ reason: SuppressionReason.COMPLAINT });
      expect(await gate.isSuppressed('a@b.test')).toBe(true);
    });

    it('isSuppressed returns false when no row exists', async () => {
      prisma.emailSuppression.findFirst.mockResolvedValue(null);
      expect(await gate.isSuppressed('a@b.test')).toBe(false);
    });
  });
});