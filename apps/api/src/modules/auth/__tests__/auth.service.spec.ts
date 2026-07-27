import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TrustService } from '../../trust/trust.service';
import { MailService } from '../../mail/mail.service';

/**
 * Mock PrismaService. `sendVerificationCode` uses the top-level `user` and
 * `verificationCode` models; `registerWorker` runs inside `$transaction`, so
 * $transaction invokes the callback with a mock tx that carries its own
 * `user` model (reusing the pattern from offers.service.spec.ts).
 */
class MockPrismaService {
  // Top-level models (used outside transactions)
  user = { findUnique: jest.fn(), create: jest.fn() };
  verificationCode = { deleteMany: jest.fn(), create: jest.fn() };

  // Transaction delegate — passes a mock tx with its own user model.
  $transaction = jest.fn(async (fn: (tx: any) => Promise<any>) => {
    const tx = {
      user: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
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
        { provide: TrustService, useValue: { detectRapidAccountCreation: jest.fn() } },
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
  });
});