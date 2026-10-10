import { UnauthorizedException } from '@nestjs/common';
import { InternalApiKeyGuard } from '../internal-api-key.guard';

// canActivate is synchronous — assert via sync throw/return, not promises.
function ctx(headers: Record<string, string | undefined> = {}) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as any;
}

describe('InternalApiKeyGuard', () => {
  const ORIGINAL = process.env.INTERNAL_API_KEY;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.INTERNAL_API_KEY;
    else process.env.INTERNAL_API_KEY = ORIGINAL;
  });

  it('rejects every call when the secret is not configured (fail-closed)', () => {
    process.env.INTERNAL_API_KEY = '';
    expect(() => new InternalApiKeyGuard().canActivate(ctx({ 'x-api-key': 'anything' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects calls when the env var is undefined', () => {
    delete process.env.INTERNAL_API_KEY;
    expect(() => new InternalApiKeyGuard().canActivate(ctx())).toThrow(UnauthorizedException);
  });

  it('rejects calls with a missing header', () => {
    process.env.INTERNAL_API_KEY = 'secret-value';
    expect(() => new InternalApiKeyGuard().canActivate(ctx())).toThrow(UnauthorizedException);
  });

  it('rejects a wrong secret', () => {
    process.env.INTERNAL_API_KEY = 'secret-value';
    expect(() => new InternalApiKeyGuard().canActivate(ctx({ 'x-api-key': 'wrong-value' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a wrong-length secret without the compare throwing on buffer length', () => {
    process.env.INTERNAL_API_KEY = 'secret-value';
    expect(() => new InternalApiKeyGuard().canActivate(ctx({ 'x-api-key': 'short' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts the correct secret', () => {
    process.env.INTERNAL_API_KEY = 'secret-value';
    expect(new InternalApiKeyGuard().canActivate(ctx({ 'x-api-key': 'secret-value' }))).toBe(true);
  });
});