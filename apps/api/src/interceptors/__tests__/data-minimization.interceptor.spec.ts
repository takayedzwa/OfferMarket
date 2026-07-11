import { DataMinimizationInterceptor } from '../data-minimization.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('DataMinimizationInterceptor', () => {
  let interceptor: DataMinimizationInterceptor;

  const createMockContext = (headers: Record<string, string> = {}) => {
    const mockRequest = {
      headers,
      path: '/api/v1/users',
    };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (data: any) => ({
    handle: () => of(data),
  }) as CallHandler;

  beforeEach(() => {
    interceptor = new DataMinimizationInterceptor();
  });

  // ===========================================================================
  // NEVER_EXPOSE_FIELDS stripping
  // ===========================================================================
  describe('never-expose fields stripping', () => {
    it('should strip passwordHash from response', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        email: 'test@example.com',
        passwordHash: '$2b$10$hash',
        name: 'Test',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.passwordHash).toBeUndefined();
        expect(result.email).toBe('test@example.com');
        expect(result.name).toBe('Test');
        done();
      });
    });

    it('should strip twoFactorSecret from response', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        twoFactorSecret: 'secret123',
        email: 'test@example.com',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.twoFactorSecret).toBeUndefined();
        expect(result.email).toBe('test@example.com');
        done();
      });
    });

    it('should strip lastLoginIp from response', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        lastLoginIp: '192.168.1.100',
        email: 'test@example.com',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.lastLoginIp).toBeUndefined();
        done();
      });
    });

    it('should strip resetPasswordToken and resetPasswordExpires', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        resetPasswordToken: 'token123',
        resetPasswordExpires: new Date(),
        email: 'test@example.com',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.resetPasswordToken).toBeUndefined();
        expect(result.resetPasswordExpires).toBeUndefined();
        done();
      });
    });

    it('should strip emailVerificationToken from response', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        emailVerificationToken: 'verify-token',
        email: 'test@example.com',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.emailVerificationToken).toBeUndefined();
        done();
      });
    });

    it('should strip refreshToken from response', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        refreshToken: 'rt-abc123',
        email: 'test@example.com',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.refreshToken).toBeUndefined();
        done();
      });
    });

    it('should strip all NEVER_EXPOSE_FIELDS simultaneously', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hash',
        twoFactorSecret: 'secret',
        lastLoginIp: '1.2.3.4',
        resetPasswordToken: 'token',
        resetPasswordExpires: new Date(),
        emailVerificationToken: 'verify',
        refreshToken: 'rt',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.passwordHash).toBeUndefined();
        expect(result.twoFactorSecret).toBeUndefined();
        expect(result.lastLoginIp).toBeUndefined();
        expect(result.resetPasswordToken).toBeUndefined();
        expect(result.resetPasswordExpires).toBeUndefined();
        expect(result.emailVerificationToken).toBeUndefined();
        expect(result.refreshToken).toBeUndefined();
        expect(result.email).toBe('test@example.com');
        done();
      });
    });
  });

  // ===========================================================================
  // Date serialization
  // ===========================================================================
  describe('Date serialization', () => {
    it('should convert Date objects to ISO strings', (done) => {
      const date = new Date('2026-07-11T12:00:00.000Z');
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        createdAt: date,
        name: 'Test',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.createdAt).toBe('2026-07-11T12:00:00.000Z');
        expect(typeof result.createdAt).toBe('string');
        // Must never be {} — the bug we fixed
        expect(result.createdAt).not.toEqual({});
        done();
      });
    });

    it('should convert nested Date objects recursively', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        profile: {
          updatedAt: new Date('2026-07-11T12:00:00.000Z'),
          name: 'Test',
        },
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.profile.updatedAt).toBe('2026-07-11T12:00:00.000Z');
        done();
      });
    });

    it('should handle null date fields', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        withdrawnAt: null,
        expiresAt: null,
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.withdrawnAt).toBeNull();
        expect(result.expiresAt).toBeNull();
        done();
      });
    });
  });

  // ===========================================================================
  // Role-based minimization
  // ===========================================================================
  describe('role-based minimization', () => {
    it('should strip USER_SENSITIVE_FIELDS for non-admin users', (done) => {
      const ctx = createMockContext({ 'x-user-role': 'WORKER' });
      const next = createMockCallHandler({
        id: '1',
        email: 'test@example.com',
        twoFactorEnabled: true,
        phoneVerified: true,
        emailVerified: true,
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.twoFactorEnabled).toBeUndefined();
        expect(result.phoneVerified).toBeUndefined();
        expect(result.emailVerified).toBeUndefined();
        expect(result.email).toBe('test@example.com');
        done();
      });
    });

    it('should NOT strip USER_SENSITIVE_FIELDS for admin users', (done) => {
      const ctx = createMockContext({ 'x-user-role': 'ADMIN' });
      const next = createMockCallHandler({
        id: '1',
        email: 'test@example.com',
        twoFactorEnabled: true,
        phoneVerified: true,
        emailVerified: true,
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.twoFactorEnabled).toBe(true);
        expect(result.phoneVerified).toBe(true);
        expect(result.emailVerified).toBe(true);
        done();
      });
    });

    it('should strip WORKER_SENSITIVE_FIELDS for non-admin users', (done) => {
      const ctx = createMockContext({ 'x-user-role': 'WORKER' });
      const next = createMockCallHandler({
        id: '1',
        userId: 'user-1',
        immigrationConsentGiven: true,
        immigrationConsentAt: '2026-01-01',
        deletedAt: null,
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.userId).toBeUndefined();
        expect(result.immigrationConsentGiven).toBeUndefined();
        expect(result.immigrationConsentAt).toBeUndefined();
        done();
      });
    });

    it('should strip EMPLOYER_SENSITIVE_FIELDS for non-employer users', (done) => {
      const ctx = createMockContext({ 'x-user-role': 'WORKER' });
      const next = createMockCallHandler({
        id: '1',
        userId: 'user-1',
        vatNumber: 'NL123',
        billingEmail: 'billing@example.com',
        registeredAddress: '123 St',
        businessAddress: '456 Ave',
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.vatNumber).toBeUndefined();
        expect(result.billingEmail).toBeUndefined();
        expect(result.registeredAddress).toBeUndefined();
        expect(result.businessAddress).toBeUndefined();
        done();
      });
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================
  describe('edge cases', () => {
    it('should handle arrays of objects', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler([
        { id: '1', passwordHash: 'hash', name: 'A' },
        { id: '2', passwordHash: 'hash2', name: 'B' },
      ]);

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result).toHaveLength(2);
        expect(result[0].passwordHash).toBeUndefined();
        expect(result[1].passwordHash).toBeUndefined();
        expect(result[0].name).toBe('A');
        done();
      });
    });

    it('should preserve primitive values', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        name: 'Test',
        age: 30,
        active: true,
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.name).toBe('Test');
        expect(result.age).toBe(30);
        expect(result.active).toBe(true);
        done();
      });
    });

    it('should preserve Buffer objects', (done) => {
      const buf = Buffer.from('test');
      const ctx = createMockContext();
      const next = createMockCallHandler({
        id: '1',
        data: buf,
      });

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result.data).toBe(buf);
        done();
      });
    });

    it('should handle empty object', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler({});

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result).toEqual({});
        done();
      });
    });

    it('should handle null input', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler(null);

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should handle undefined input', (done) => {
      const ctx = createMockContext();
      const next = createMockCallHandler(undefined);

      interceptor.intercept(ctx, next).subscribe((result) => {
        expect(result).toBeUndefined();
        done();
      });
    });
  });
});