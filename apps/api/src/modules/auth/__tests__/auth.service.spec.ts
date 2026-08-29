import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrustService } from '../../trust/trust.service';
import { MailService } from '../../mail/mail.service';
import { ReferralsService } from '../../referrals/referrals.service';

/**
 * Mock PrismaService. `sendVerificationCode` uses the top-level `user` and
 * `verificationCode` models; `registerWorker` runs inside `$transaction`, so
 * $transaction invokes the callback with a mock tx that carries its own
 * `user` model (reusing the pattern from offers.service.spec.ts).
 */
class MockPrismaService {
  // Top-level models (used outside transactions)
  user = { findUnique: jest.fn(), create: jest.fn(), update: jest.fn().mockResolvedValue(undefined) };
  verificationCode = { deleteMany: jest.fn(), create: jest.fn(), findFirst: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
  // Top-level refreshToken — used by login (user already persisted). MUST NOT
  // be touched from inside a registration transaction (the user row is not
  // committed yet, so an insert here would violate RefreshToken_userId_fkey).
  refreshToken = { create: jest.fn().mockResolvedValue(undefined) };

  // Transaction delegate — passes a mock tx with its own user + refreshToken
  // models.
  $transaction = jest.fn(async (fn: (tx: any) => Promise<any>) => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
      refreshToken: { create: jest.fn().mockResolvedValue(undefined) },
    };
    return fn(tx);
  });
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let mailService: { sendVerificationCode: jest.Mock; sendPasswordReset: jest.Mock; sendNotification: jest.Mock };

  beforeEach(async () => {
    prisma = new MockPrismaService();
    mailService = {
      sendVerificationCode: jest.fn(),
      sendPasswordReset: jest.fn(),
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        // Referral lifecycle hooks are injected into AuthService (attribution at
        // signup, qualification on email verification) — mocked here; the
        // referral engine itself is covered by referrals.service.spec.ts.
        { provide: ReferralsService, useValue: {
          attributeReferral: jest.fn().mockResolvedValue(undefined),
          recordQualification: jest.fn().mockResolvedValue(undefined),
        } },
        { provide: TrustService, useValue: {
          detectRapidAccountCreation: jest.fn(),
          isBlacklisted: jest.fn().mockResolvedValue(false),
          checkSuspiciousLogin: jest.fn().mockResolvedValue({ riskScore: 0, isSuspicious: false }),
          reportSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
        } },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Common-password blocklist: a password that satisfies the DTO regex (upper,
  // lower, digit, 8+) but is trivially guessable (e.g. "Password1") must be
  // rejected at the service layer — the regex alone is not enough.
  // =========================================================================
  describe('registerWorker — common-password rejection', () => {
    it('rejects a regex-satisfying but common password (Password1)', async () => {
      // "Password1" satisfies PASSWORD_REGEX (8+, upper, lower, digit) but is
      // in the common-password blocklist, so it must be rejected before the
      // account is created.
      await expect(service.registerWorker('new@test.com', 'Password1')).rejects.toThrow(
        BadRequestException,
      );
      // The rejection happens inside the transaction (after the email-exists
      // lookup), so $transaction was entered but no user.create occurred.
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // registerWorker — refresh-token storage must run on the transaction client.
  // Regression: storeRefreshToken previously used the standalone PrismaClient
  // (`this.prisma`) while the user row was created inside `$transaction` and
  // not yet committed. The refreshToken insert referenced an uncommitted user
  // id, violating RefreshToken_userId_fkey, which rolled the whole registration
  // back and surfaced as a 500.
  // =========================================================================
  describe('registerWorker — refresh token stored on the transaction', () => {
    it('creates the refresh token via tx (not the standalone prisma client)', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'user-new',
            email: 'new@test.com',
            role: 'WORKER',
            emailVerified: false,
          }),
        },
        refreshToken: { create: jest.fn().mockResolvedValue(undefined) },
      };
      prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(tx));

      const result = await service.registerWorker('new@test.com', 'C0rrect-Horse-Battery!9q');

      // A refresh token row was created on the transaction client…
      expect(tx.refreshToken.create).toHaveBeenCalledTimes(1);
      expect(tx.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-new' }) }),
      );
      // …and NOT on the standalone prisma client (which would hit a FK
      // violation because the user row is uncommitted on that connection).
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();

      // The caller still receives the generated token pair.
      expect(result.tokens.accessToken).toEqual(expect.any(String));
      expect(result.tokens.refreshToken).toEqual(expect.any(String));
    });
  });

  // =========================================================================
  // registerWorker then login in the same second: the refresh-token JWT must
  // carry a unique jti so two consecutive generateTokens calls produce
  // distinct tokens (and therefore distinct tokenHash values). Without jti,
  // jwt.sign is deterministic per (payload, secret, second), so a registration
  // immediately followed by a login issued an identical refresh token and the
  // second storeRefreshToken insert violated the tokenHash unique constraint
  // (500).
  // =========================================================================
  describe('registerWorker + login — refresh token uniqueness', () => {
    it('issues distinct refresh-token hashes across registration and login in the same second', async () => {
      const email = 'uniq@test.com';
      const password = 'C0rrect-Horse-Battery!9q';
      const passwordHash = await bcrypt.hash(password, 10);

      // Registration inside a transaction.
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'user-uniq',
            email,
            role: 'WORKER',
            emailVerified: false,
          }),
        },
        refreshToken: { create: jest.fn().mockResolvedValue(undefined) },
      };
      prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(tx));
      await service.registerWorker(email, password);

      // Login immediately after (same wall-clock second, no ipAddress so the
      // trust/suspicious-login checks are skipped).
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uniq',
        email,
        role: 'WORKER',
        emailVerified: false,
        passwordHash,
        deletedAt: null,
        status: 'ACTIVE',
      });
      await service.login(email, password);

      // The two stored refresh-token hashes MUST differ — otherwise a same-
      // second register+login collides on the tokenHash unique constraint.
      const regHash = tx.refreshToken.create.mock.calls[0][0].data.tokenHash;
      const loginHash = prisma.refreshToken.create.mock.calls[0][0].data.tokenHash;
      expect(regHash).not.toBe(loginHash);
    });
  });

  // =========================================================================
  // registerEmployer — KvK duplicate race: two concurrent registrations with
  // the same KvK number both pass the findUnique check; the DB @unique
  // constraint on kvkNumber rejects the second create with Prisma P2002. The
  // service must map that to a clean 400, not an unhandled 500.
  // =========================================================================
  describe('registerEmployer — KvK duplicate race (P2002)', () => {
    it('maps a Prisma P2002 on kvkNumber to a clean BadRequestException', async () => {
      const p2002 = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
        meta: { target: ['kvkNumber'] },
      });
      prisma.$transaction.mockRejectedValueOnce(p2002);

      // P2002 on kvkNumber maps to a coded BadRequestException so the frontend
      // can translate it via the `errors` namespace (i18n). Assert on the
      // response payload rather than Error.message (which is `[object Object]`
      // for object-payload exceptions).
      const kvkErr = await service
        .registerEmployer('race@test.com', 'C0rrect-Horse-Battery!9q', '', {
          name: 'Acme',
          kvkNumber: '12345678',
        })
        .catch((e: unknown) => e);
      expect(kvkErr).toBeInstanceOf(BadRequestException);
      expect((kvkErr as BadRequestException).getResponse()).toEqual(
        expect.objectContaining({
          code: 'auth.kvk_already_exists',
          message: 'Company with this KvK number already exists',
        }),
      );

      // Non-P2002 errors re-throw unchanged.
      prisma.$transaction.mockRejectedValueOnce(new Error('something else'));
      await expect(
        service.registerEmployer('race2@test.com', 'C0rrect-Horse-Battery!9q', '', {
          name: 'Acme',
          kvkNumber: '87654321',
        }),
      ).rejects.toThrow('something else');
    });
  });

  // =========================================================================
  // Registration now sends an email verification code AFTER the registration
  // transaction commits. sendVerificationCode runs on the standalone Prisma
  // client (not tx), so it must see the committed user row. The dispatch is
  // best-effort: a mail/DB failure must never roll back or fail a registration
  // that already succeeded — the user can resend from the verify-email UI.
  // =========================================================================
  describe('registration — sends email verification code after commit', () => {
    it('registerWorker dispatches a 6-digit EMAIL code via MailService once committed', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'user-new',
            email: 'new@test.com',
            role: 'WORKER',
            emailVerified: false,
          }),
        },
        refreshToken: { create: jest.fn().mockResolvedValue(undefined) },
      };
      prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(tx));
      // sendVerificationCode looks up the (now committed) user on the
      // standalone client to read its email + preferredLocale.
      prisma.user.findUnique.mockResolvedValue({
        email: 'new@test.com',
        phone: null,
        preferredLocale: 'nl',
      });

      const result = await service.registerWorker('new@test.com', 'C0rrect-Horse-Battery!9q');

      expect(mailService.sendVerificationCode).toHaveBeenCalledTimes(1);
      const [to, code, type, locale] = mailService.sendVerificationCode.mock.calls[0];
      expect(to).toBe('new@test.com');
      expect(type).toBe('EMAIL');
      expect(locale).toBe('nl');
      expect(code).toMatch(/^\d{6}$/);
      // The registration result is still returned unchanged.
      expect(result.tokens.accessToken).toEqual(expect.any(String));
    });

    it('registerEmployer dispatches an EMAIL code via MailService once committed', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'user-emp',
            email: 'emp@test.com',
            role: 'EMPLOYER',
            emailVerified: false,
          }),
        },
        employer: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'emp-1', userId: 'user-emp' }),
        },
        employerVerification: { create: jest.fn().mockResolvedValue(undefined) },
        refreshToken: { create: jest.fn().mockResolvedValue(undefined) },
      };
      prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(tx));
      prisma.user.findUnique.mockResolvedValue({
        email: 'emp@test.com',
        phone: '+31612345678',
        preferredLocale: 'en',
      });

      const result = await service.registerEmployer(
        'emp@test.com',
        'C0rrect-Horse-Battery!9q',
        '+31612345678',
        { name: 'Acme', kvkNumber: '12345678' },
      );

      expect(mailService.sendVerificationCode).toHaveBeenCalledTimes(1);
      const [to, , type] = mailService.sendVerificationCode.mock.calls[0];
      expect(to).toBe('emp@test.com');
      expect(type).toBe('EMAIL');
      expect(result.tokens.accessToken).toEqual(expect.any(String));
    });

    it('does not fail registerWorker when the verification email send throws (best-effort)', async () => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 'user-new',
            email: 'new@test.com',
            role: 'WORKER',
            emailVerified: false,
          }),
        },
        refreshToken: { create: jest.fn().mockResolvedValue(undefined) },
      };
      prisma.$transaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => fn(tx));
      prisma.user.findUnique.mockResolvedValue({
        email: 'new@test.com',
        phone: null,
        preferredLocale: 'en',
      });
      mailService.sendVerificationCode.mockImplementation(() => {
        throw new Error('SMTP down');
      });

      const result = await service.registerWorker('new@test.com', 'C0rrect-Horse-Battery!9q');
      // Registration succeeded despite the mail failure.
      expect(result.tokens.accessToken).toEqual(expect.any(String));
      expect(mailService.sendVerificationCode).toHaveBeenCalledTimes(1);
    });

    it('does not send a verification email when registration rolls back (common password)', async () => {
      await expect(service.registerWorker('new@test.com', 'Password1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // sendVerificationCode: the raw code MUST NOT be returned in the API
  // response. It is delivered via the MailService (email side channel).
  // =========================================================================
  describe('sendVerificationCode — no code leak', () => {
    it('delivers the code via MailService and returns no raw code', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'worker@test.com', phone: null });
      prisma.verificationCode.deleteMany.mockResolvedValue(undefined);
      prisma.verificationCode.create.mockResolvedValue(undefined);

      const result = await service.sendVerificationCode('user-1', 'EMAIL');

      // The response carries a message but NEVER the raw code.
      expect(result).not.toHaveProperty('code');
      expect(typeof (result as any).message).toBe('string');
      // The code is delivered via the mail service, with the user's email and
      // a 6-digit numeric code.
      expect(mailService.sendVerificationCode).toHaveBeenCalledTimes(1);
      const [to, code, type] = mailService.sendVerificationCode.mock.calls[0];
      expect(to).toBe('worker@test.com');
      expect(type).toBe('EMAIL');
      expect(code).toMatch(/^\d{6}$/);
    });

    it('still succeeds (no throw) when the user has no email on file', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: null, phone: null });
      prisma.verificationCode.deleteMany.mockResolvedValue(undefined);
      prisma.verificationCode.create.mockResolvedValue(undefined);

      const result = await service.sendVerificationCode('user-1', 'EMAIL');
      expect(result).not.toHaveProperty('code');
      // No delivery attempted when there is no address, but the code is still
      // persisted for later verification.
      expect(mailService.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('EMAIL stores a hashed magic-link token + verifyUrl and never persists the raw token', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'worker@test.com', phone: null });
      prisma.verificationCode.deleteMany.mockResolvedValue(undefined);
      prisma.verificationCode.create.mockResolvedValue(undefined);

      await service.sendVerificationCode('user-1', 'EMAIL');

      // The persisted row carries both a codeHash and a tokenHash; the raw
      // 6-digit code and raw token only ever appear in the mailService call,
      // never in the prisma create payload.
      const createArg = prisma.verificationCode.create.mock.calls[0][0];
      expect(createArg.data).toHaveProperty('codeHash');
      expect(createArg.data).toHaveProperty('tokenHash');
      expect(createArg.data.tokenHash).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
      expect(createArg.data.codeHash).not.toEqual(createArg.data.tokenHash);

      const [, , , , verifyUrl] = mailService.sendVerificationCode.mock.calls[0];
      expect(verifyUrl).toMatch(/\/verify-email\?token=[0-9a-f]{64}$/);
      // The raw token in the URL must NOT equal the stored hash.
      expect(createArg.data.tokenHash).not.toEqual(verifyUrl.split('token=')[1]);
    });

    it('PHONE does not store a tokenHash and passes no verifyUrl', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: null, phone: '+31612345678' });
      prisma.verificationCode.deleteMany.mockResolvedValue(undefined);
      prisma.verificationCode.create.mockResolvedValue(undefined);

      await service.sendVerificationCode('user-1', 'PHONE');

      const createArg = prisma.verificationCode.create.mock.calls[0][0];
      expect(createArg.data.tokenHash).toBeNull();
      const callArgs = mailService.sendVerificationCode.mock.calls[0];
      expect(callArgs[4]).toBeNull(); // no verifyUrl for PHONE
    });
  });

  // =========================================================================
  // verifyEmailByToken: the magic-link path. Token-authenticated (no JWT) —
  // the row's userId is trusted from the token match. Single-use (row delete
  // invalidates the OTP on the same row too). Expiry-enforced.
  // =========================================================================
  describe('verifyEmailByToken — magic link', () => {
    it('verifies the email when a valid non-expired token row exists', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue({ id: 'vc-1', userId: 'user-9' });

      const result = await service.verifyEmailByToken('a-valid-token');

      expect(result).toEqual({ success: true });
      // Looked up by the token's SHA-256 hash, with an unexpired window.
      const where = prisma.verificationCode.findFirst.mock.calls[0][0].where;
      expect(where.type).toBe('EMAIL');
      expect(where.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(where.expiresAt).toBeDefined();
      // Single-use: the row is deleted and the user is marked verified.
      expect(prisma.verificationCode.delete).toHaveBeenCalledWith({ where: { id: 'vc-1' } });
      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-9' }, data: { emailVerified: true } });
    });

    it('rejects an empty token', async () => {
      await expect(service.verifyEmailByToken('')).rejects.toThrow(BadRequestException);
      expect(prisma.verificationCode.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an invalid / expired / already-used token (no matching row)', async () => {
      prisma.verificationCode.findFirst.mockResolvedValue(null);
      await expect(service.verifyEmailByToken('stale-or-wrong')).rejects.toThrow(BadRequestException);
      expect(prisma.verificationCode.delete).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});