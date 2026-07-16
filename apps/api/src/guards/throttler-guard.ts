import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard that applies rate limits uniformly.
 *
 * All users are subject to rate limits:
 * - Default: 100 requests per minute
 * - Auth endpoints (login/register): 5 requests per minute
 *
 * Admin-only endpoints that need higher limits can use @SkipThrottle().
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // No role-based exemptions — all users are subject to rate limits.
    // Admin-only endpoints that need higher limits can use @SkipThrottle().
    return false;
  }
}