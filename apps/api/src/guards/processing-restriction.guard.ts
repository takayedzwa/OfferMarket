import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Reflector } from '@nestjs/core';

/**
 * Processing Restriction Guard (GDPR Article 18)
 *
 * Blocks processing operations for users who have exercised their right
 * to restrict processing. When a user's processingRestricted flag is true,
 * only read (GET) operations are allowed — no writes, updates, or deletions.
 *
 * This guard checks the *acting* user only. A guard cannot generically know
 * which other user a request targets, so when a write endpoint processes a
 * *different* user's data (e.g. an employer making an offer to a worker, a
 * user messaging another participant), the target subject's restriction must
 * be checked explicitly in the service via `assertTargetProcessingNotRestricted`
 * (see src/common/utils/processing-restriction.ts).
 *
 * Routes exempt from this guard can be marked with @SkipProcessingRestrictionCheck()
 * decorator. Privacy-related endpoints (consent withdrawal, restriction removal)
 * must be exempt so users can lift their own restriction. This decorator is
 * intended ONLY for privacy self-service routes; it must not be applied to
 * general write endpoints (see the guard spec's invariant test).
 *
 * Usage: Apply globally or to specific controllers/modules.
 */

export const SKIP_PROCESSING_RESTRICTION_KEY = 'skipProcessingRestriction';

@Injectable()
export class ProcessingRestrictionGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    // No user context (public endpoints) — allow through
    if (!user?.id) {
      return true;
    }

    // Check if this route is exempt from restriction checks
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_PROCESSING_RESTRICTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipCheck) {
      return true;
    }

    // Only block write operations (POST, PUT, PATCH, DELETE)
    const method = request.method?.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    // Check if user has processing restriction active
    const flags = await this.prisma.userGdprFlags.findUnique({
      where: { userId: user.id },
    });

    if (flags?.processingRestricted) {
      throw new ForbiddenException(
        'Your account has a processing restriction in place (GDPR Article 18). ' +
        'Only read operations are permitted until the restriction is lifted. ' +
        'You can remove the restriction from your Privacy Dashboard.',
      );
    }

    return true;
  }
}