import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { ProcessingRestrictionGuard, SKIP_PROCESSING_RESTRICTION_KEY } from '../processing-restriction.guard';
import * as fs from 'fs';
import * as path from 'path';

// Builds a minimal ExecutionContext around a request shape.
function ctx(method: string, user: any, skip = false) {
  const request: any = { method, user };
  const handler = skip ? () => {} : () => {};
  const reflector = new Reflector();
  if (skip) {
    Reflect.defineMetadata(SKIP_PROCESSING_RESTRICTION_KEY, true, handler);
  }
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => class {},
  } as any;
}

describe('ProcessingRestrictionGuard', () => {
  let prisma: { userGdprFlags: { findUnique: jest.Mock } };
  let guard: ProcessingRestrictionGuard;

  beforeEach(() => {
    prisma = { userGdprFlags: { findUnique: jest.fn() } };
    guard = new ProcessingRestrictionGuard(prisma as any, new Reflector());
  });

  it('allows public requests with no user context', async () => {
    await expect(guard.canActivate(ctx('POST', undefined))).resolves.toBe(true);
    expect(prisma.userGdprFlags.findUnique).not.toHaveBeenCalled();
  });

  it('allows GET (read) for a restricted user', async () => {
    prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: true });
    await expect(guard.canActivate(ctx('GET', { id: 'u1' }))).resolves.toBe(true);
    expect(prisma.userGdprFlags.findUnique).not.toHaveBeenCalled();
  });

  it('blocks POST for a restricted user', async () => {
    prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: true });
    await expect(guard.canActivate(ctx('POST', { id: 'u1' }))).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.userGdprFlags.findUnique).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
  });

  it('allows POST for a non-restricted user', async () => {
    prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: false });
    await expect(guard.canActivate(ctx('POST', { id: 'u1' }))).resolves.toBe(true);
  });

  it('allows POST for a restricted user when the route is exempt (@SkipProcessingRestrictionCheck)', async () => {
    prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: true });
    await expect(guard.canActivate(ctx('POST', { id: 'u1' }, true))).resolves.toBe(true);
    expect(prisma.userGdprFlags.findUnique).not.toHaveBeenCalled();
  });

  // Defense-in-depth invariant: the skip decorator must only appear on privacy
  // self-service routes. A mis-applied decorator on a general write route
  // would silently exempt it from the GDPR Article 18 restriction. Only
  // controllers can apply it, so the scan is restricted to *.controller.ts.
  it('does not use @SkipProcessingRestrictionCheck outside the privacy controller', () => {
    const srcRoot = path.join(__dirname, '..', '..');
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
          walk(full);
        } else if (entry.name.endsWith('.controller.ts')) {
          const text = fs.readFileSync(full, 'utf8');
          if (text.includes('@SkipProcessingRestrictionCheck')) {
            const rel = path.relative(srcRoot, full);
            if (!rel.includes('privacy/privacy.controller.ts')) {
              offenders.push(rel);
            }
          }
        }
      }
    };
    walk(srcRoot);
    expect(offenders).toEqual([]);
  });
});