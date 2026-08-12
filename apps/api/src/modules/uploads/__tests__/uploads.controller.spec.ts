import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadsController } from '../uploads.controller';
import { StorageService } from '../../storage/storage.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('UploadsController', () => {
  let controller: UploadsController;
  let storage: Partial<StorageService>;
  let prisma: { employer: { findUnique: jest.Mock } };

  beforeEach(async () => {
    storage = {
      isAllowedMime: ((mime: string) =>
        ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(mime)) as StorageService['isAllowedMime'],
      createPresignedUpload: jest.fn().mockResolvedValue({
        url: 'https://s3.example/post',
        fields: { key: 'verification/employer-1/uuid-kvk.pdf', 'Content-Type': 'application/pdf' },
        key: 'verification/employer-1/uuid-kvk.pdf',
        fileUrl: 'https://bucket.s3.region.amazonaws.com/verification/employer-1/uuid-kvk.pdf',
        expiresAt: new Date('2026-08-02T13:30:00.000Z'),
        maxFileSize: 10 * 1024 * 1024,
      }),
    };
    prisma = {
      employer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'employer-1' }),
      },
    };

    const module = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        { provide: StorageService, useValue: storage },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get(UploadsController);
  });

  it('presigns an upload for the employer resolved from the JWT', async () => {
    const result = await controller.presignVerificationDocument(
      { user: { id: 'user-from-jwt' } },
      { fileName: 'kvk.pdf', mimeType: 'application/pdf' },
    );

    // Employer resolved from the JWT subject — never from the body.
    expect(prisma.employer.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-from-jwt' },
      select: { id: true },
    });
    expect(storage.createPresignedUpload).toHaveBeenCalledWith({
      employerId: 'employer-1',
      fileName: 'kvk.pdf',
      mimeType: 'application/pdf',
    });
    expect(result.key).toContain('verification/employer-1/');
  });

  it('rejects an unsupported MIME type even if the DTO somehow let it through', async () => {
    await expect(
      controller.presignVerificationDocument(
        { user: { id: 'user-from-jwt' } },
        { fileName: 'evil.exe', mimeType: 'application/octet-stream' },
      ),
    ).rejects.toThrow(BadRequestException);

    expect(storage.createPresignedUpload).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when the authenticated user has no employer profile', async () => {
    prisma.employer.findUnique.mockResolvedValue(null);

    await expect(
      controller.presignVerificationDocument(
        { user: { id: 'user-without-employer' } },
        { fileName: 'kvk.pdf', mimeType: 'application/pdf' },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});