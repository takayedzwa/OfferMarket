import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ERROR_CODES } from '../i18n/error-codes';

/**
 * VerifiedEmailGuard — blocks unverified users from transactional actions.
 *
 * Registration creates an account with `emailVerified: false` and issues valid
 * JWTs; without this guard the only thing keeping an unverified user out of the
 * marketplace was a client-side redirect. This guard moves that gate to the
 * server: it rejects any request whose authenticated user has not verified
 * their email, returning 403 `AUTH_EMAIL_NOT_VERIFIED`.
 *
 * It must run AFTER `JwtAuthGuard` (which populates `req.user`) — compose it as
 * `@UseGuards(JwtAuthGuard, VerifiedEmailGuard, ...)`. Apply it selectively to
 * transactional routes (offers, messaging, ratings, identity-doc upload). Do
 * NOT apply it to auth/verify/read/profile-onboarding endpoints, or an
 * unverified user could never get unblocked.
 *
 * Admin/support users are auto-verified at creation (`emailVerified: true`) so
 * they pass without special-casing.
 */
@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: ERROR_CODES.GUARD_NOT_AUTHENTICATED,
        message: 'User not authenticated',
      });
    }

    if (user.emailVerified !== true) {
      throw new ForbiddenException({
        code: ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
        message: 'Email verification is required to perform this action.',
      });
    }

    return true;
  }
}