import { SetMetadata } from '@nestjs/common';
import { SKIP_PROCESSING_RESTRICTION_KEY } from '../guards/processing-restriction.guard';

/**
 * Mark a route as exempt from the ProcessingRestrictionGuard.
 *
 * Apply to privacy-related endpoints that users must be able to call
 * even when processing is restricted (e.g., lifting the restriction,
 * withdrawing consent, requesting data export).
 *
 * @example
 * @SkipProcessingRestrictionCheck()
 * @Delete('consents/:consentType')
 * async withdrawConsent() { ... }
 */
export const SkipProcessingRestrictionCheck = () =>
  SetMetadata(SKIP_PROCESSING_RESTRICTION_KEY, true);