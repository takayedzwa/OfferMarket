import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationEventType } from '../../../modules/notifications/notification.types';

/**
 * Mock PrismaService for AdminService.createStaffUser. The method runs inside
 * $transaction, so $transaction invokes the callback with a mock tx carrying
 * its own `user` and `adminAction` models. `bcrypt.hash` is mocked at the
 * module level (see jest.mock below) to avoid the real KDF cost in tests.
 */
class MockPrismaService {
  $transaction = jest.fn(async (fn: (tx: any) => Promise<any>) => {
    const tx = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      adminAction: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    this._lastTx = tx;
    return fn(tx);
  });
  _lastTx: any = null;
}

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('AdminService — createStaffUser', () => {
  let service: AdminService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = new MockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const adminCaller = { id: 'admin-1', role: 'ADMIN' };
  const newUser = {
    id: 'user-2',
    email: 'staff@example.com',
    role: 'SUPPORT',
    emailVerified: true,
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+31612345678',
  };

  const validDto = {
    email: 'staff@example.com',
    password: 'StrongPass1',
    role: 'SUPPORT' as const,
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+31612345678',
  };

  it('creates a SUPPORT user with name/phone and writes an audit trail when an ADMIN calls it', async () => {
    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(adminCaller) // creator is admin
            .mockResolvedValueOnce(null),       // email not taken
          create: jest.fn().mockResolvedValue(newUser),
        },
        adminAction: { create: jest.fn().mockResolvedValue({}) },
      };
      prisma._lastTx = tx;
      return fn(tx);
    });

    const result = await service.createStaffUser(validDto, 'admin-1');

    // Public shape only — never passwordHash/twoFactorSecret.
    expect(result).toEqual({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      emailVerified: newUser.emailVerified,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
    });

    // user.create receives the name/phone fields.
    expect(prisma._lastTx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: validDto.email,
          role: 'SUPPORT',
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+31612345678',
        }),
      }),
    );

    // Audit row recorded with the creator and the new role/name/phone.
    const auditCreate = prisma._lastTx.adminAction.create.mock.calls[0][0];
    expect(auditCreate.data).toEqual(
      expect.objectContaining({
        actorId: 'admin-1',
        action: 'STAFF_USER_CREATED',
        entityType: 'user',
        entityId: newUser.id,
        details: {
          role: 'SUPPORT',
          email: newUser.email,
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+31612345678',
        },
      }),
    );
  });

  it('rejects creation by a non-admin caller (defense-in-depth)', async () => {
    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValueOnce({ id: 'support-1', role: 'SUPPORT' }),
          create: jest.fn(),
        },
        adminAction: { create: jest.fn() },
      };
      prisma._lastTx = tx;
      return fn(tx);
    });

    await expect(
      service.createStaffUser({ ...validDto, role: 'SUPPORT' }, 'support-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma._lastTx.user.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate email', async () => {
    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(adminCaller)
            .mockResolvedValueOnce({ id: 'existing', email: 'staff@example.com' }),
          create: jest.fn(),
        },
        adminAction: { create: jest.fn() },
      };
      prisma._lastTx = tx;
      return fn(tx);
    });

    await expect(
      service.createStaffUser(validDto, 'admin-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma._lastTx.user.create).not.toHaveBeenCalled();
  });

  it('rejects a common-but-regex-valid password (Password1)', async () => {
    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(adminCaller)
            .mockResolvedValueOnce(null),
          create: jest.fn(),
        },
        adminAction: { create: jest.fn() },
      };
      prisma._lastTx = tx;
      return fn(tx);
    });

    await expect(
      service.createStaffUser({ ...validDto, password: 'Password1', role: 'ADMIN' }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma._lastTx.user.create).not.toHaveBeenCalled();
  });

  it('maps a Prisma P2002 on phone to a clean BadRequestException', async () => {
    const p2002 = Object.assign(new Error('Unique constraint failed'), {
      code: 'P2002',
      meta: { target: ['phone'] },
    });

    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        user: {
          findUnique: jest.fn()
            .mockResolvedValueOnce(adminCaller)
            .mockResolvedValueOnce(null),
          create: jest.fn().mockRejectedValue(p2002),
        },
        adminAction: { create: jest.fn() },
      };
      prisma._lastTx = tx;
      return fn(tx);
    });

    await expect(
      service.createStaffUser(validDto, 'admin-1'),
    ).rejects.toThrow(BadRequestException);

    // No audit row should be written when the create failed.
    expect(prisma._lastTx.adminAction.create).not.toHaveBeenCalled();
  });
});
/**
 * Mock PrismaService for the worker credential-review methods
 * (verifyCertification / rejectCertification / listPendingCertifications).
 */
class MockCredentialPrismaService {
  certification = {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  adminAction = {
    create: jest.fn().mockResolvedValue({}),
  };
}

describe('AdminService — worker credential review', () => {
  let service: AdminService;
  let prisma: MockCredentialPrismaService;
  let eventEmitter: { emit: jest.Mock };
  const adminUserId = 'admin-1';

  const pendingCert = {
    id: 'cert-1',
    name: 'BIG-registratie',
    verificationStatus: 'PENDING',
    profileId: 'worker-1',
    profile: { user: { id: 'user-1' } },
  };

  beforeEach(async () => {
    prisma = new MockCredentialPrismaService();
    eventEmitter = { emit: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();
    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listPendingCertifications', () => {
    it('returns pending certifications with their worker and pagination', async () => {
      prisma.certification.findMany.mockResolvedValue([pendingCert]);
      prisma.certification.count.mockResolvedValue(1);

      const result = await service.listPendingCertifications(2, 20);

      expect(prisma.certification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { verificationStatus: 'PENDING' },
          skip: 20,
          take: 20,
        }),
      );
      expect(result.certifications).toEqual([pendingCert]);
      expect(result.pagination).toEqual({ page: 2, limit: 20, total: 1, totalPages: 1 });
    });
  });

  describe('verifyCertification', () => {
    it('moves a PENDING certification to VERIFIED and writes an audit row', async () => {
      prisma.certification.findUnique.mockResolvedValue(pendingCert);
      prisma.certification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.verifyCertification('cert-1', adminUserId, 'checked BIG-register');

      expect(prisma.certification.updateMany).toHaveBeenCalledWith({
        where: { id: 'cert-1', verificationStatus: 'PENDING' },
        data: expect.objectContaining({
          verificationStatus: 'VERIFIED',
          verifiedBy: adminUserId,
          verificationMethod: 'MANUAL_REVIEW',
        }),
      });
      expect(prisma.adminAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: adminUserId,
            action: 'CREDENTIAL_VERIFIED',
            entityType: 'certification',
          }),
        }),
      );
      expect(result).toEqual({ success: true, message: 'Certification verified' });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.CREDENTIAL_REVIEWED,
        expect.objectContaining({
          workerUserId: 'user-1',
          certificationName: 'BIG-registratie',
          approved: true,
        }),
      );
    });

    it('does not forward admin notes into the worker notification', async () => {
      prisma.certification.findUnique.mockResolvedValue(pendingCert);
      prisma.certification.updateMany.mockResolvedValue({ count: 1 });

      await service.verifyCertification('cert-1', adminUserId, 'internal annotation');

      const [, payload] = eventEmitter.emit.mock.calls[0];
      expect(payload.reason).toBeUndefined();
    });

    it('throws BadRequest when the certification is no longer PENDING', async () => {
      prisma.certification.findUnique.mockResolvedValue({
        ...pendingCert,
        verificationStatus: 'VERIFIED',
      });
      prisma.certification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.verifyCertification('cert-1', adminUserId),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.adminAction.create).not.toHaveBeenCalled();
    });

    it('throws NotFound for an unknown certification', async () => {
      prisma.certification.findUnique.mockResolvedValue(null);
      await expect(
        service.verifyCertification('missing', adminUserId),
      ).rejects.toThrow();
    });
  });

  describe('rejectCertification', () => {
    it('moves a PENDING certification to REVOKED and records the reason', async () => {
      prisma.certification.findUnique.mockResolvedValue(pendingCert);
      prisma.certification.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.rejectCertification('cert-1', adminUserId, 'not in BIG-register');

      expect(prisma.certification.updateMany).toHaveBeenCalledWith({
        where: { id: 'cert-1', verificationStatus: 'PENDING' },
        data: { verificationStatus: 'REVOKED' },
      });
      expect(prisma.adminAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREDENTIAL_REJECTED',
            details: expect.objectContaining({ reason: 'not in BIG-register' }),
          }),
        }),
      );
      expect(result).toEqual({ success: true, message: 'Certification rejected' });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.CREDENTIAL_REVIEWED,
        expect.objectContaining({
          workerUserId: 'user-1',
          approved: false,
          reason: 'not in BIG-register',
        }),
      );
    });

    it('throws BadRequest when the certification is no longer PENDING', async () => {
      prisma.certification.findUnique.mockResolvedValue({
        ...pendingCert,
        verificationStatus: 'EXPIRED',
      });
      prisma.certification.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.rejectCertification('cert-1', adminUserId, 'reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
