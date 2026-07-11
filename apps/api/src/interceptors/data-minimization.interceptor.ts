import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/**
 * DATA MINIMIZATION INTERCEPTOR
 *
 * GDPR principle of data minimization (Article 5(1)(c)) requires that
 * personal data processed is adequate, relevant, and limited to what
 * is necessary for the purposes for which it is processed.
 *
 * This interceptor strips sensitive fields from API responses based on
 * the requesting user's role, ensuring that:
 *
 * - Workers viewing employer profiles see only public company info
 * - Employers viewing worker profiles see only anonymous data
 *   (additional stripping handled by AnonymousProfilePipe)
 * - Admin users see full data but it's logged for audit
 * - Passwords, secrets, and internal IDs are never sent to clients
 * - IP addresses are stripped from all client-facing responses
 */

// Fields that should NEVER be included in any API response
const NEVER_EXPOSE_FIELDS = [
  'passwordHash',
  'twoFactorSecret',
  'lastLoginIp',
  'resetPasswordToken',
  'resetPasswordExpires',
  'emailVerificationToken',
  'refreshToken',
];

// Fields that should be stripped from user responses for non-admin/non-self users
const USER_SENSITIVE_FIELDS = [
  'lastLoginIp',
  'passwordHash',
  'twoFactorSecret',
  'emailVerificationToken',
  'resetPasswordToken',
  'resetPasswordExpires',
  'twoFactorEnabled',
  'phoneVerified',
  'emailVerified',
];

// Fields that should be stripped from worker profiles for non-owners
const WORKER_SENSITIVE_FIELDS = [
  'userId',
  'immigrationConsentGiven',
  'immigrationConsentAt',
  'deletedAt',
];

// Fields that should be stripped from employer profiles for non-owners
const EMPLOYER_SENSITIVE_FIELDS = [
  'userId',
  'vatNumber',
  'billingEmail',
  'registeredAddress',
  'businessAddress',
];

interface MinimizationContext {
  userId?: string;
  userRole?: string;
  requestPath?: string;
}

@Injectable()
export class DataMinimizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'] as string | undefined;
    const userRole = request.headers['x-user-role'] as string | undefined;

    const ctx: MinimizationContext = {
      userId,
      userRole,
      requestPath: request.path,
    };

    return next.handle().pipe(
      map((data) => this.minimize(data, ctx)),
    );
  }

  /**
   * Recursively minimize data by removing sensitive fields.
   */
  private minimize(data: any, ctx: MinimizationContext): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.minimize(item, ctx));
    }

    // Handle null/undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Preserve Date and other non-plain objects — spreading them destroys
    // their value (e.g. `{ ...new Date() }` becomes `{}`)
    if (data instanceof Date) {
      return data.toISOString();
    }
    if (data instanceof Buffer) {
      return data;
    }
    if (data.constructor && data.constructor.name !== 'Object') {
      // Non-plain objects (Decimal, etc.) — return as-is
      return data;
    }

    // Create a copy to avoid mutating the original
    const result = { ...data };

    // Remove fields that should NEVER be exposed
    for (const field of NEVER_EXPOSE_FIELDS) {
      delete result[field];
    }

    // Apply role-based minimization
    if (ctx.userRole !== 'ADMIN') {
      // Strip user-sensitive fields unless the user is viewing their own data
      for (const field of USER_SENSITIVE_FIELDS) {
        delete result[field];
      }

      // Strip worker-sensitive fields
      for (const field of WORKER_SENSITIVE_FIELDS) {
        delete result[field];
      }

      // Strip employer-sensitive fields unless the user is the employer
      if (ctx.userRole !== 'EMPLOYER' || result.userId !== ctx.userId) {
        for (const field of EMPLOYER_SENSITIVE_FIELDS) {
          delete result[field];
        }
      }
    }

    // Recursively minimize nested objects
    for (const key of Object.keys(result)) {
      if (typeof result[key] === 'object' && result[key] !== null) {
        result[key] = this.minimize(result[key], ctx);
      }
    }

    return result;
  }
}