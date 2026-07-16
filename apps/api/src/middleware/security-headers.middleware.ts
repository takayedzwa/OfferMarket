import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * SECURITY HEADERS MIDDLEWARE
 *
 * Adds GDPR-relevant security headers to all responses:
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Enables browser XSS filter
 * - Referrer-Policy: Limits referrer data leakage
 * - Content-Security-Policy: Prevents injection attacks (nonce-based)
 * - Strict-Transport-Security: Forces HTTPS
 * - Permissions-Policy: Restricts browser features
 *
 * GDPR relevance:
 * - These headers protect personal data from injection/XSS attacks
 * - Referrer-Policy limits data shared with third parties during navigation
 * - HSTS ensures data in transit is always encrypted
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Prevent MIME type sniffing — ensures browsers respect declared content types
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking — OfferMarket should not be embedded in iframes
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable browser XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Limit referrer data — only send origin to cross-origin destinations
    // This prevents personal data in URLs from leaking to third parties
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Force HTTPS for all future requests (1 year max-age, include subdomains)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

    // Restrict browser features — disable features not needed for our app
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    );

    // Generate a nonce for this request to use in CSP and inline scripts
    const nonce = Buffer.from(require('crypto').randomBytes(16)).toString('base64');

    // Make the nonce available to the frontend via a response header
    // The frontend can read this and add it to inline script/style tags
    res.setHeader('X-CSP-Nonce', nonce);

    // Content Security Policy — restrict resource loading to prevent XSS
    // Uses nonce-based CSP instead of unsafe-inline/unsafe-eval where possible.
    // NOTE: 'unsafe-eval' is still required for Next.js runtime chunks.
    // In production, consider moving all inline scripts to external files
    // to remove 'unsafe-eval' entirely.
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://eu.posthog.com https://*.posthog.com`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.posthog.com wss://*.posthog.com https://api.stripe.com",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
      ].join('; '),
    );

    // Cross-Origin policies for enhanced security
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    next();
  }
}