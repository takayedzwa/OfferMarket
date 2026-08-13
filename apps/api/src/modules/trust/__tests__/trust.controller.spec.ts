import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TrustController } from '../trust.controller';
import { TrustService } from '../trust.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

describe('TrustController — employer self-service verification', () => {
  let controller: TrustController;
  let trustService: {
    submitEmployerVerification: jest.Mock;
    submitEmployerDocument: jest.Mock;
    reviewEmployerDocument: jest.Mock;
  };
  let prisma: { employer: { findUnique: jest.Mock } };

  beforeEach(async () => {
    trustService = {
      submitEmployerVerification: jest.fn().mockResolvedValue({ ok: true }),
      submitEmployerDocument: jest.fn().mockResolvedValue({ ok: true }),
      reviewEmployerDocument: jest.fn().mockResolvedValue({ ok: true }),
    };
    prisma = {
      employer: { findUnique: jest.fn() },
    };

    const module = await Test.createTestingModule({
      controllers: [TrustController],
      providers: [
        { provide: TrustService, useValue: trustService },
        { provide: PrismaService, useValue: prisma },
        Reflector,
      ],
    }).compile();

    controller = module.get(TrustController);
  });

  it('submitEmployerVerification resolves the employer from the JWT and rejects a path-param mismatch (IDOR)', async () => {
    // JWT says employer-a; caller tries to act on employer-b via the path.
    prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a' });

    await expect(
      controller.submitEmployerVerification('employer-b', {} as any, { user: { id: 'user-from-jwt' } }),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.employer.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-from-jwt' },
      select: { id: true },
    });
    expect(trustService.submitEmployerVerification).not.toHaveBeenCalled();
  });

  it('submitEmployerVerification forwards the JWT-owned employerId when the path matches', async () => {
    prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a' });
    const dto = { kvkNumber: '12345678' };

    await controller.submitEmployerVerification('employer-a', dto as any, {
      user: { id: 'user-from-jwt' },
    });

    expect(trustService.submitEmployerVerification).toHaveBeenCalledWith('employer-a', dto);
  });

  it('submitEmployerDocument rejects a path-param mismatch and does not call the service', async () => {
    prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a' });

    await expect(
      controller.submitEmployerDocument('employer-b', {} as any, { user: { id: 'user-from-jwt' } }),
    ).rejects.toThrow(ForbiddenException);

    expect(trustService.submitEmployerDocument).not.toHaveBeenCalled();
  });

  it('submitEmployerDocument passes the verified user id (not undefined) as the audit actor', async () => {
    // Regression: previously req.user?.userId was passed, but the JWT strategy
    // populates req.user.id (no userId field), so performedBy was logged as
    // undefined.
    prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a' });
    const dto = {
      documentType: 'BUSINESS_LICENSE',
      key: 'verification/employer-a/uuid-x.pdf',
      fileHash: 'abc123',
      mimeType: 'application/pdf',
    };

    await controller.submitEmployerDocument('employer-a', dto as any, {
      user: { id: 'user-from-jwt' },
    });

    expect(trustService.submitEmployerDocument).toHaveBeenCalledWith(
      'employer-a',
      dto,
      'user-from-jwt',
    );
  });

  it('reviewEmployerDocument forwards employerId, documentId, dto, and the admin user id', async () => {
    const dto = { isApproved: true, notes: 'Looks legit' };

    await controller.reviewEmployerDocument('employer-a', 'doc-1', dto as any, {
      user: { id: 'admin-from-jwt' },
    });

    expect(trustService.reviewEmployerDocument).toHaveBeenCalledWith(
      'employer-a',
      'doc-1',
      dto,
      'admin-from-jwt',
    );
  });
});