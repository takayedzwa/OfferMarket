import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, Min, Matches } from 'class-validator';
import { REFERRAL_QUALIFICATION_RULES } from '../referral-settings';

/**
 * Partial, admin-only update of the referral program configuration. Fields are
 * merged over the stored config server-side (updateSettings), so submitting a
 * partial object never resets an omitted field — and the admin console can
 * show a validated form per field.
 */
export class UpdateReferralSettingsDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  rewardsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  recurringRewards?: boolean;

  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  threshold?: number;

  @IsString()
  @Length(1, 64)
  @IsOptional()
  rewardType?: string;

  /** Integer minor units (e.g. 2500 = €25.00) — same convention as billing. */
  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  @IsOptional()
  rewardAmountMinor?: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'rewardCurrency must be a 3-letter ISO 4217 code (e.g. EUR)' })
  @IsOptional()
  rewardCurrency?: string;

  @IsIn(REFERRAL_QUALIFICATION_RULES)
  @IsOptional()
  qualificationRule?: string;
}

/** Shared reason payload for admin referral actions (invalidate / cancel). */
export class ReferralActionDto {
  @IsString()
  @Length(0, 500)
  @IsOptional()
  reason?: string;
}