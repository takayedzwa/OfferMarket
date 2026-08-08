/**
 * Stable backend error codes.
 *
 * The backend throws NestJS exceptions carrying `{ code, message, params }`.
 * The `code` is a stable, language-agnostic string (dot-notation, lowercase
 * snake_case) that the frontend maps to a translated user-facing string via the
 * `errors` next-intl namespace. The English `message` is always included as a
 * fallback so un-updated clients and English users still see a specific message.
 *
 * Convention: `<module>.<identifier>` — e.g. `auth.invalid_credentials`,
 * `offer.employer_not_verified`, `guard.admin_required`.
 *
 * To migrate a new throw site:
 *   throw new BadRequestException({
 *     code: ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED,
 *     message: 'Email already registered',            // English fallback
 *     params: { field: 'email' },                       // optional, for ICU interpolation
 *   });
 *
 * Then add the matching key to `apps/web/src/messages/{en,nl}/errors.json`.
 * The Phase 5 CI missing-key guard fails the build if a code used here lacks a
 * translation in every locale.
 *
 * NOTE: codes are also used as string literals at throw sites that import this
 * map. Keep the values stable forever — they are the contract with the frontend.
 */

export const ERROR_CODES = {
  // --- auth.service.ts ---
  AUTH_EMAIL_ALREADY_REGISTERED: 'auth.email_already_registered',
  AUTH_PHONE_ALREADY_REGISTERED: 'auth.phone_already_registered',
  AUTH_PASSWORD_TOO_COMMON: 'auth.password_too_common',
  AUTH_INVALID_ADMIN_CODE: 'auth.invalid_admin_code',
  AUTH_ADMIN_ONLY_CREATE_SUPPORT: 'auth.admin_only_create_support',
  AUTH_KVK_ALREADY_EXISTS: 'auth.kvk_already_exists',
  AUTH_INVALID_CREDENTIALS: 'auth.invalid_credentials',
  AUTH_ACCOUNT_DELETED: 'auth.account_deleted',
  AUTH_ACCOUNT_BANNED: 'auth.account_banned',
  AUTH_ACCOUNT_SUSPENDED: 'auth.account_suspended',
  AUTH_VERIFICATION_CODE_REQUIRED: 'auth.verification_code_required',
  AUTH_VERIFICATION_CODE_NONE: 'auth.verification_code_none',
  AUTH_VERIFICATION_CODE_INVALID: 'auth.verification_code_invalid',
  AUTH_REFRESH_TOKEN_REQUIRED: 'auth.refresh_token_required',
  AUTH_REFRESH_TOKEN_INVALID: 'auth.refresh_token_invalid',
  AUTH_TOKEN_TYPE_INVALID: 'auth.token_type_invalid',
  AUTH_REFRESH_TOKEN_REVOKED: 'auth.refresh_token_revoked',
  AUTH_USER_NOT_FOUND: 'auth.user_not_found',
  AUTH_RESET_TOKEN_INVALID: 'auth.reset_token_invalid',
  AUTH_RESET_TOKEN_EXPIRED: 'auth.reset_token_expired',
  AUTH_RESET_TOKEN_USED: 'auth.reset_token_used',

  // --- jwt.strategy.ts ---
  AUTH_TOKEN_REVOKED: 'auth.token_revoked',

  // --- offers.service.ts ---
  OFFER_EMPLOYER_NOT_FOUND: 'offer.employer_not_found',
  OFFER_EMPLOYER_NOT_VERIFIED: 'offer.employer_not_verified',
  OFFER_WORKER_NOT_FOUND: 'offer.worker_not_found',
  OFFER_CANNOT_MAKE_OFFER: 'offer.cannot_make_offer',
  OFFER_WORKER_NOT_VISIBLE: 'offer.worker_not_visible',
  OFFER_WORKER_NOT_VISIBLE_TO_YOU: 'offer.worker_not_visible_to_you',
  OFFER_WORKER_MAX_ACTIVE_OFFERS: 'offer.worker_max_active_offers',
  OFFER_DUPLICATE_TO_WORKER: 'offer.duplicate_offer_to_worker',
  OFFER_WORKER_PROFILE_NOT_FOUND: 'offer.worker_profile_not_found',
  OFFER_NOT_FOUND: 'offer.not_found',
  OFFER_NOT_AUTHORIZED_VIEW: 'offer.not_authorized_view',
  OFFER_NOT_AUTHORIZED_UPDATE: 'offer.not_authorized_update',
  OFFER_CANNOT_UPDATE_STATUS: 'offer.cannot_update_status',
  OFFER_NOT_AUTHORIZED_SUBMIT: 'offer.not_authorized_submit',
  OFFER_CANNOT_SUBMIT_STATUS: 'offer.cannot_submit_status',
  OFFER_NO_VERSION_SUBMIT: 'offer.no_version_submit',
  OFFER_NOT_AUTHORIZED_ACCEPT: 'offer.not_authorized_accept',
  OFFER_CANNOT_ACCEPT_STATE: 'offer.cannot_accept_state',
  OFFER_EXPIRED: 'offer.expired',
  OFFER_NOT_AUTHORIZED: 'offer.not_authorized',
  OFFER_CANNOT_REJECT_STATE: 'offer.cannot_reject_state',
  OFFER_CANNOT_COUNTER_STATE: 'offer.cannot_counter_state',
  OFFER_NO_VERSION_COUNTER: 'offer.no_version_counter',
  OFFER_SALARY_MAX_BELOW_MIN: 'offer.salary_max_below_min',
  OFFER_SALARY_RANGE_TOO_WIDE: 'offer.salary_range_too_wide',
  OFFER_NOT_AUTHORIZED_WITHDRAW: 'offer.not_authorized_withdraw',
  OFFER_CANNOT_WITHDRAW_STATE: 'offer.cannot_withdraw_state',

  // --- guards ---
  GUARD_NOT_AUTHENTICATED: 'guard.not_authenticated',
  GUARD_ROLES_REQUIRED: 'guard.roles_required',
  GUARD_ADMIN_REQUIRED: 'guard.admin_required',
  GUARD_SUPPORT_REQUIRED: 'guard.support_required',
  GUARD_PROCESSING_RESTRICTED: 'guard.processing_restricted',

  // --- generic / filter-emitted ---
  ERROR_INTERNAL: 'error.internal',
  ERROR_NETWORK: 'error.network',
  ERROR_UNKNOWN: 'error.unknown',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Shape thrown by migrated sites. The AllExceptionsFilter forwards this as the
 * response body (plus `statusCode`).
 */
export interface LocalizedExceptionPayload {
  code: string;
  message: string;
  params?: Record<string, unknown>;
}