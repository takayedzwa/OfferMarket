import { SecurityHeadersMiddleware } from '../security-headers.middleware';
import { Request, Response, NextFunction } from 'express';

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new SecurityHeadersMiddleware();
    mockRequest = {};
    const headers: Record<string, string> = {};
    mockResponse = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
        return mockResponse as Response;
      }),
      getHeader: jest.fn((name: string) => headers[name]),
    } as unknown as Partial<Response>;
    mockNext = jest.fn();
  });

  // Helper to get the value set for a header
  const getHeader = (name: string): string | undefined => {
    const calls = (mockResponse.setHeader as jest.Mock).mock.calls;
    const call = calls.find((c: string[]) => c[0] === name);
    return call ? call[1] : undefined;
  };

  it('should set X-Content-Type-Options to nosniff', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(getHeader('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should set X-Frame-Options to DENY', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(getHeader('X-Frame-Options')).toBe('DENY');
  });

  it('should set X-XSS-Protection to 1; mode=block', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(getHeader('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('should set Referrer-Policy to strict-origin-when-cross-origin', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(getHeader('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('should set Strict-Transport-Security with 1-year max-age, includeSubDomains, and preload', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    const hsts = getHeader('Strict-Transport-Security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });

  it('should set Permissions-Policy disabling camera, microphone, geolocation, payment, USB', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    const pp = getHeader('Permissions-Policy');
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
    expect(pp).toContain('payment=()');
    expect(pp).toContain('usb=()');
  });

  it('should set Content-Security-Policy with required directives', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    const csp = getHeader('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('should include PostHog and Stripe in CSP connect-src', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    const csp = getHeader('Content-Security-Policy');
    expect(csp).toContain('https://*.posthog.com');
    expect(csp).toContain('wss://*.posthog.com');
    expect(csp).toContain('https://api.stripe.com');
  });

  it('should set Cross-Origin-Opener-Policy to same-origin', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(getHeader('Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('should set Cross-Origin-Resource-Policy to same-origin', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(getHeader('Cross-Origin-Resource-Policy')).toBe('same-origin');
  });

  it('should set Cross-Origin-Embedder-Policy to require-corp', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(getHeader('Cross-Origin-Embedder-Policy')).toBe('require-corp');
  });

  it('should call next() to pass the request through', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should set all expected headers (total count)', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    // 11 headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
    // Referrer-Policy, Strict-Transport-Security, Permissions-Policy,
    // X-CSP-Nonce, Content-Security-Policy, Cross-Origin-Opener-Policy,
    // Cross-Origin-Resource-Policy, Cross-Origin-Embedder-Policy
    expect(mockResponse.setHeader).toHaveBeenCalledTimes(11);
  });
});