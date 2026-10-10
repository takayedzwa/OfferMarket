import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InternalActivateWorkerDto, InternalCreateWorkerDto } from '../dto/internal-worker.dto';

/**
 * Boundary DTO validation (prompt 7 contract, positive + negative): what the
 * acquisition service may and may not send. These mirror the ValidationPipe
 * (whitelist + forbidNonWhitelisted) rules at the controller edge; keeping
 * them here pins the contract independently of Nest wiring.
 */

async function validated(dtoClass: new () => unknown, body: Record<string, unknown>): Promise<{ value: unknown; errors: string[] }> {
  const value = plainToInstance(dtoClass as never, body, { excludeExtraneousValues: false });
  const violations = await validate(value as never);
  return { value, errors: violations.map((v) => v.property) };
}

describe('InternalActivateWorkerDto', () => {
  it('positive: an empty body is valid — both fields are optional defaults', async () => {
    const { errors } = await validated(InternalActivateWorkerDto, {});
    expect(errors).toEqual([]);
  });

  it('positive: canonical enum values validate', async () => {
    const { errors } = await validated(InternalActivateWorkerDto, {
      availability: 'IMMEDIATE',
      profileVisibility: 'ALL_VERIFIED',
    });
    expect(errors).toEqual([]);
  });

  it('positive: lowercase values are accepted via toUpperCase transform', async () => {
    const { value, errors } = await validated(InternalActivateWorkerDto, {
      availability: 'immediate',
      profileVisibility: 'all_verified',
    });
    expect(errors).toEqual([]);
    expect((value as InternalActivateWorkerDto).availability).toBe('IMMEDIATE');
    expect((value as InternalActivateWorkerDto).profileVisibility).toBe('ALL_VERIFIED');
  });

  it('negative: an unknown availability value is rejected', async () => {
    const { errors } = await validated(InternalActivateWorkerDto, { availability: 'NOPE' });
    expect(errors).toContain('availability');
  });

  it('negative: an unknown profileVisibility value is rejected', async () => {
    const { errors } = await validated(InternalActivateWorkerDto, { profileVisibility: 'EVERYONE' });
    expect(errors).toContain('profileVisibility');
  });

  it('negative: a non-string availability is rejected', async () => {
    const { errors } = await validated(InternalActivateWorkerDto, { availability: 123 });
    expect(errors).toContain('availability');
  });
});

describe('InternalCreateWorkerDto', () => {
  const base = {
    phone: '+31612345678',
    idempotencyKey: '11111111-1111-1111-1111-111111111111',
  };

  it('positive: the minimal required payload (phone + idempotencyKey) validates', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, { ...base });
    expect(errors).toEqual([]);
  });

  it('positive: the full acquisition payload (including nested profile) validates', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, {
      ...base,
      firstName: 'Jaap',
      email: 'jaap@example.nl',
      source: 'AI_ACQUISITION',
      platform: 'META',
      campaignId: '771',
      adSetId: '1202',
      adId: '3',
      profile: {
        specializations: ['SOLAR_PV'],
        availability: 'IMMEDIATE',
        yearsOfExperience: 3,
      },
    });
    expect(errors).toEqual([]);
  });

  it('negative: phone is required', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, {
      idempotencyKey: base.idempotencyKey,
    });
    expect(errors).toContain('phone');
  });

  it('negative: a non-E.164 phone is rejected', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, { ...base, phone: '0612345678' });
    expect(errors).toContain('phone');
  });

  it('negative: idempotencyKey is required and must be at least 8 chars', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, { phone: base.phone });
    expect(errors).toContain('idempotencyKey');

    const again = await validated(InternalCreateWorkerDto, { ...base, idempotencyKey: 'short' });
    expect(again.errors).toContain('idempotencyKey');
  });

  it('negative: a malformed email is rejected', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, { ...base, email: 'not-an-email' });
    expect(errors).toContain('email');
  });

  it('negative: an invalid enum inside the nested profile is rejected', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, {
      ...base,
      profile: { specializations: ['NOT_A_TRADE'] },
    });
    // The nested violation surfaces on the parent's `profile` property.
    expect(errors).toContain('profile');
  });

  it('negative: availability inside the nested profile is enum-checked too', async () => {
    const { errors } = await validated(InternalCreateWorkerDto, {
      ...base,
      profile: { availability: 'WHENEVER' },
    });
    expect(errors).toContain('profile');
  });
});