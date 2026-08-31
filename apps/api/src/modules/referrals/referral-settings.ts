// ============================================================================
// REFERRAL PROGRAM SETTINGS
// ============================================================================
// The referral program is configured through the generic AdminSettings store
// (key/value JSON) under the single key below — one atomic row, one knob, no
// hardcoded €25/5-referral constant. An admin updates it from the admin
// console (PATCH /admin/referrals/settings) without a code deployment.
//
// Money is integer minor units (amountMinor, e.g. cents) — same convention as
// the billing settings (introduction_fee_cents). Never floats.

export const REFERRAL_SETTINGS_KEY = 'referral_program';

/**
 * Qualification rules a referral must satisfy before it counts toward the
 * threshold. Only `email_verified` is implemented (the same gate the platform
 * already applies to transactional actions — see VerifiedEmailGuard); the rule
 * is a validated settings enum so future rules can be added without touching
 * the settings shape.
 */
export const REFERRAL_QUALIFICATION_RULES = ['email_verified'] as const;
export type ReferralQualificationRule = (typeof REFERRAL_QUALIFICATION_RULES)[number];

export interface ReferralProgramSettings {
  /** Enable the whole program (attribution + dashboard). */
  enabled: boolean;
  /** Enable reward issuance (referrals still tracked when off). */
  rewardsEnabled: boolean;
  /** Issue a new reward every `threshold` successful referrals. */
  recurringRewards: boolean;
  /** Successful referrals required per reward. */
  threshold: number;
  /** Free-form reward descriptor ('gift_card' initially; not a vendor). */
  rewardType: string;
  /** Integer minor units (e.g. 2500 = €25.00). */
  rewardAmountMinor: number;
  /** ISO 4217 code (EUR initially; business logic stays currency-agnostic). */
  rewardCurrency: string;
  rule: ReferralQualificationRule;
}

/** Initial configuration: 5 successful referrals → €25 gift card, recurring. */
export const DEFAULT_REFERRAL_SETTINGS: ReferralProgramSettings = {
  enabled: true,
  rewardsEnabled: true,
  recurringRewards: true,
  threshold: 5,
  rewardType: 'gift_card',
  rewardAmountMinor: 2500,
  rewardCurrency: 'EUR',
  rule: 'email_verified',
};

const MAX_THRESHOLD = 1000;
const MAX_AMOUNT_MINOR = 1_000_000_000; // sanity bound; admins can still go big
const MAX_CURRENCY_LENGTH = 3;

// Field-by-field validation with per-field fallback: one bad field in the JSON
// blob degrades to its default instead of breaking the whole program. The
// admin console validates strictly on write; this parser only guards reads.
export function parseReferralSettings(value: unknown): ReferralProgramSettings {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_REFERRAL_SETTINGS };
  }

  const raw = value as Record<string, unknown>;
  const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
  const int = (v: unknown, fallback: number) =>
    Number.isInteger(v) ? (v as number) : fallback;

  const threshold = int(raw.threshold, DEFAULT_REFERRAL_SETTINGS.threshold);

  const currency =
    typeof raw.rewardCurrency === 'string' &&
    /^[A-Z]{3}$/.test(raw.rewardCurrency)
      ? raw.rewardCurrency
      : DEFAULT_REFERRAL_SETTINGS.rewardCurrency;

  const rule =
    typeof raw.qualificationRule === 'string' &&
    (REFERRAL_QUALIFICATION_RULES as readonly string[]).includes(raw.qualificationRule)
      ? (raw.qualificationRule as ReferralQualificationRule)
      : DEFAULT_REFERRAL_SETTINGS.rule;

  return {
    enabled: bool(raw.enabled, DEFAULT_REFERRAL_SETTINGS.enabled),
    rewardsEnabled: bool(raw.rewardsEnabled, DEFAULT_REFERRAL_SETTINGS.rewardsEnabled),
    recurringRewards: bool(raw.recurringRewards, DEFAULT_REFERRAL_SETTINGS.recurringRewards),
    // A threshold below 1 would mint a reward per referral — clamp to 1.
    threshold: Math.min(Math.max(threshold, 1), MAX_THRESHOLD),
    rewardType:
      typeof raw.rewardType === 'string' && raw.rewardType.trim().length > 0 && raw.rewardType.length <= 64
        ? raw.rewardType.trim()
        : DEFAULT_REFERRAL_SETTINGS.rewardType,
    rewardAmountMinor: Math.min(
      Math.max(int(raw.rewardAmountMinor, DEFAULT_REFERRAL_SETTINGS.rewardAmountMinor), 1),
      MAX_AMOUNT_MINOR,
    ),
    rewardCurrency: currency,
    rule,
  };
}