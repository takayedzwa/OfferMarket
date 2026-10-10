import { IsString, IsOptional, IsEmail, IsIn, IsInstance, IsNotEmpty, MinLength, MaxLength, Matches, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Availability, ProfileVisibility } from '@prisma/client';
import { UpdateWorkerDto } from '../../workers/dto/worker.dto';

/**
 * DTOs for the internal acquisition boundary (/api/v1/internal/workers).
 *
 * The caller is the offermarket-ai-acquisition service. Contract-level rules:
 *  - `phone` is E.164 and REQUIRED (it is the natural identity of a WhatsApp contact)
 *  - `idempotencyKey` is REQUIRED on create — the AI service generates one per
 *    onboarding conversation; retries of the same call must reuse the same key
 *  - free-text AI answers must ALREADY be mapped by the AI service to
 *    canonical values (specializations must use OfferMarket enum values);
 *    this boundary validates, it does not interpret
 */

const AVAILABILITY_VALUES = Object.values(Availability);
const PROFILE_VISIBILITY_VALUES = Object.values(ProfileVisibility);

/**
 * Reuses the worker self-service UpdateWorkerDto validation wholesale so the
 * acquisition profile can never drift from the business rules that apply to a
 * worker editing their own profile (same caps, same enum allowlists, same
 * completeness recalculation downstream in WorkersService.updateWorkerProfile).
 */
export class InternalUpsertProfileDto extends UpdateWorkerDto {}

export class InternalActivateWorkerDto {
  // Optional per the boundary contract — an empty body means "both defaults"
  // (IMMEDIATE / ALL_VERIFIED, applied in the service).
  @IsOptional()
  @IsString()
  // typeof guard: a non-string value must reach IsString and become a clean
  // 400, not crash the transform with "toUpperCase is not a function" (500).
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(AVAILABILITY_VALUES)
  availability?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsIn(PROFILE_VISIBILITY_VALUES)
  profileVisibility?: string;
}

export class InternalCreateWorkerDto {
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'phone must be E.164 (e.g. +31612345678)' })
  phone: string;

  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @IsNotEmpty()
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  /** Only sent if the worker actually gave a real email during onboarding. */
  @IsOptional()
  @IsEmail()
  email?: string;

  /** Provenance, e.g. "AI_ACQUISITION". Stored on the Worker row. */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;

  /**
   * Ad platform (META today; GOOGLE/TIKTOK/ORGANIC later) and the ad-object
   * names the webhook doesn't carry — ids below are always present when the
   * worker came from a Meta ad; names whenever the caller has them (prompt 9).
   */
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @MaxLength(32)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  campaignName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  adSetName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  adName?: string;

  /** Meta Click-to-WhatsApp attribution (values, not names). */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  campaignId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  adId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  adSetId?: string;

  /** Initial profile payload (same shape as the worker self-service UPDATE dto). */
  @IsOptional()
  @IsInstance(InternalUpsertProfileDto)
  @ValidateNested()
  @Type(() => InternalUpsertProfileDto)
  profile?: InternalUpsertProfileDto;
}