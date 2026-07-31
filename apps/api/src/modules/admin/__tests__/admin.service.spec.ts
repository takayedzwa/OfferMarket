import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../../prisma/prisma.service';

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
        adminId: 'admin-1',
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