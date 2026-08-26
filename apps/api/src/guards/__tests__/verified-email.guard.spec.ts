import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { VerifiedEmailGuard } from '../verified-email.guard';

/**
 * Minimal execution-context stub: lets a test set `request.user` and read
 * the guard's decision/throw.
 */
function makeContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('VerifiedEmailGuard', () => {
  let guard: VerifiedEmailGuard;

  beforeEach(() => {
    guard = new VerifiedEmailGuard();
  });

  it('allows an authenticated user with a verified email', () => {
    expect(guard.canActivate(makeContext({ id: 'u1', emailVerified: true }))).toBe(true);
  });

  it('blocks an unverified user with 403 AUTH_EMAIL_NOT_VERIFIED', () => {
    expect(() => guard.canActivate(makeContext({ id: 'u1', emailVerified: false }))).toThrow(
      ForbiddenException,
    );
    try {
      guard.canActivate(makeContext({ id: 'u1', emailVerified: false }));
    } catch (e: any) {
      expect(e.response?.code).toBe('auth.email_not_verified');
    }
  });

  it('blocks when emailVerified is missing (defensive — treat as unverified)', () => {
    expect(() => guard.canActivate(makeContext({ id: 'u1' }))).toThrow(ForbiddenException);
  });

  it('blocks when there is no authenticated user (GUARD_NOT_AUTHENTICATED)', () => {
    expect(() => guard.canActivate(makeContext(null))).toThrow(ForbiddenException);
    try {
      guard.canActivate(makeContext(null));
    } catch (e: any) {
      expect(e.response?.code).toBe('guard.not_authenticated');
    }
  });

  it('allows admin/support users (auto-verified at creation → emailVerified true)', () => {
    expect(guard.canActivate(makeContext({ id: 'a1', role: 'ADMIN', emailVerified: true }))).toBe(true);
  });
});