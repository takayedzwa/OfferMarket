import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { ERROR_CODES } from '../i18n/error-codes';

/**
 * InternalApiKeyGuard — service-to-service authentication for the acquisition
 * boundary (/api/v1/internal/...).
 *
 * This is NOT a JWT/JWT-role route: the caller is another backend service
 * (offermarket-ai-acquisition), not a user. The authentication model follows
 * the Brevo webhook precedent (brevo-webhook.controller.ts): one long random
 * shared secret from env (`INTERNAL_API_KEY`), compared timing-safe. When the
 * env var is unset/empty the guard rejects EVERY call — the boundary is OFF by
 * default and can never be accidentally open in production.
 *
 * Config in the caller: send `x-api-key: <INTERNAL_API_KEY>` on every request.
 *
 * Note: it deliberately checks `process.env` directly (the same idiom used by
 * jwt.strategy.ts / mail/email-config.ts) so the guard has no injectable
 * dependencies and works in unit tests without modules.
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request?.headers?.['x-api-key'];
    const expected = process.env.INTERNAL_API_KEY;

    // No secret configured → treat as unauthorized (fail-closed). Mirrors the
    // Brevo webhook: an empty BREVO_WEBHOOK_SECRET disables the endpoint.
    if (!expected) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INTERNAL_UNAUTHORIZED,
        message: 'Internal API key not configured',
      });
    }

    if (typeof provided !== 'string' || !provided) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INTERNAL_UNAUTHORIZED,
        message: 'Missing or invalid internal API key',
      });
    }

    // Constant-time compare; timingSafeEqual throws on length mismatch, so
    // guard lengths first (mismatched length → reject directly).
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedException({
        code: ERROR_CODES.INTERNAL_UNAUTHORIZED,
        message: 'Missing or invalid internal API key',
      });
    }

    return true;
  }
}