import { IsOptional, Matches } from 'class-validator';

/**
 * Optional referral code on registration DTOs. Validated for shape only — the
 * service silently ignores unknown/invalid codes so the register endpoint can
 * never be used to probe which codes exist. Normalized (trim + upper-case) in
 * the service before lookup.
 */
export const REFERRAL_CODE_REGEX = /^[A-HJ-NP-Z2-9]{10}$/;

export class RegisterReferralCodeDto {
  @Matches(REFERRAL_CODE_REGEX, {
    message: 'referralCode must be 10 characters from the referral alphabet',
  })
  @IsOptional()
  referralCode?: string;
}