import 'reflect-metadata';
import { BadRequestException, ValidationPipe, ArgumentMetadata } from '@nestjs/common';
import { CreateEmployerProfileDto } from '../dto/create-employer-profile.dto';
import { UpdateEmployerProfileDto } from '../dto/update-employer-profile.dto';

/**
 * E-C5: employer profile DTO validation. Mirrors the global ValidationPipe
 * configuration from main.ts (whitelist + forbidNonWhitelisted + transform) so
 * these tests exercise the exact boundary the API enforces at runtime.
 */
describe('Employer profile DTO validation', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  const validCreate = {
    companyName: 'Acme BV',
    kvkNumber: '12345678',
    registeredAddress: {
      street: 'Keizersgracht',
      houseNumber: '1',
      postalCode: '1011AA',
      city: 'Amsterdam',
      country: 'NL',
    },
  };

  const transform = (metatype: any, value: any) =>
    pipe.transform(value, { type: 'body', metatype, data: '' } as ArgumentMetadata);

  // --------------------------------------------------------------------------
  // CreateEmployerProfileDto
  // --------------------------------------------------------------------------

  describe('CreateEmployerProfileDto', () => {
    it('accepts a valid payload', async () => {
      await expect(transform(CreateEmployerProfileDto, validCreate)).resolves.toBeDefined();
    });

    it('rejects a KvK number that is not exactly 8 digits', async () => {
      await expect(
        transform(CreateEmployerProfileDto, { ...validCreate, kvkNumber: '1234567' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        transform(CreateEmployerProfileDto, { ...validCreate, kvkNumber: '123456789' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        transform(CreateEmployerProfileDto, { ...validCreate, kvkNumber: 'ABCDEFGH' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a company name that is too short or too long', async () => {
      await expect(
        transform(CreateEmployerProfileDto, { ...validCreate, companyName: 'A' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        transform(CreateEmployerProfileDto, { ...validCreate, companyName: 'x'.repeat(101) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid Dutch VAT number', async () => {
      await expect(
        transform(CreateEmployerProfileDto, { ...validCreate, vatNumber: '123456789' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid postal code in the registered address', async () => {
      await expect(
        transform(CreateEmployerProfileDto, {
          ...validCreate,
          registeredAddress: { ...validCreate.registeredAddress, postalCode: '0000' },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an unknown company size bucket', async () => {
      await expect(
        transform(CreateEmployerProfileDto, { ...validCreate, companySize: 'gigantic' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('strips/rejects protected fields an employer must not set (forbidNonWhitelisted)', async () => {
      // verificationStatus is not a whitelisted property of the DTO, so the
      // global pipe rejects the payload outright — boundary-level defence for
      // E-C2 on top of the service-side allowlist.
      await expect(
        transform(CreateEmployerProfileDto, {
          ...validCreate,
          verificationStatus: 'PREMIUM_VERIFIED',
          reputationScore: 99,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // --------------------------------------------------------------------------
  // UpdateEmployerProfileDto (every field optional)
  // --------------------------------------------------------------------------

  describe('UpdateEmployerProfileDto', () => {
    it('accepts an empty partial (all fields optional)', async () => {
      await expect(transform(UpdateEmployerProfileDto, {})).resolves.toBeDefined();
    });

    it('accepts a valid partial update', async () => {
      await expect(
        transform(UpdateEmployerProfileDto, { companyName: 'Acme renamed', industry: 'Tech' }),
      ).resolves.toBeDefined();
    });

    it('rejects an invalid KvK number on update', async () => {
      await expect(
        transform(UpdateEmployerProfileDto, { kvkNumber: '12' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects protected fields on update (forbidNonWhitelisted)', async () => {
      await expect(
        transform(UpdateEmployerProfileDto, {
          companyName: 'Acme',
          verificationStatus: 'PREMIUM_VERIFIED',
          verifiedAt: '2024-01-01',
          reputationScore: 99,
          billingStatus: 'waived',
          subscriptionPlan: 'enterprise',
          creditBalance: 1000000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});