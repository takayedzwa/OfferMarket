import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { ERROR_CODES } from '../../i18n/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkersService } from '../workers/workers.service';
import { AuthService } from '../auth/auth.service';
import { Availability, ProfileVisibility } from '@prisma/client';
import { InternalCreateWorkerDto, InternalUpsertProfileDto, InternalActivateWorkerDto } from './dto/internal-worker.dto';

/**
 * InternalWorkersService — the acquisition boundary's write/read path.
 *
 * Reuses existing domain services exclusively (no parallel domain logic):
 *  - account creation → AuthService.registerWorkerFromAcquisition
 *  - profile creation → WorkersService.createWorkerProfile (with the optional
 *    acquisition opts that record provenance) + updateWorkerProfile
 *  - audit → AuditLog rows, written directly like every other service
 *
 * Idempotency contract for `createWorker`:
 *  1. same `idempotencyKey` → replay the original create (HTTP 200-style
 *     `replayed: true`), no duplicate account
 *  2. same `phone` already has a worker → also a replay (phone is the true
 *     identity of a WhatsApp contact; the DB-level unique on the idempotency
 *     key additionally collapses concurrent creates — the caller surfaces
 *     P2002 as a replay too)
 *  3. same `phone` with NO worker → 409 (a non-acquisition account exists)
 */
export interface RequestMeta {
  ipAddress?: string;
  requestId?: string;
  userAgent?: string;
}

export interface InternalWorkerReference {
  workerId: string;
  availability: string;
  profileVisibility: string;
  isProfileComplete: boolean;
  profileCompletenessPct: number;
}

@Injectable()
export class InternalWorkersService {
  private readonly logger = new Logger(InternalWorkersService.name);

  constructor(
    private prisma: PrismaService,
    private workersService: WorkersService,
    private authService: AuthService,
  ) {}

  // ============================================================================
  // CREATE WORKER (account + initial profile) — idempotent
  // ============================================================================

  async createWorker(dto: InternalCreateWorkerDto, meta: RequestMeta = {}) {
    // 1. Replay by idempotency key (the caller's dedupe identity).
    const byKey = dto.idempotencyKey
      ? await this.prisma.worker.findUnique({
          where: { acquisitionIdempotencyKey: dto.idempotencyKey },
          include: { user: true },
        })
      : null;
    if (byKey) {
      this.logger.log(`Replaying internal worker create for idempotencyKey=${dto.idempotencyKey}`);
      return this.toReference(byKey, { replayed: true });
    }

    // 2. Replay by phone — the WhatsApp identity always wins over the key
    //    (a caller could theoretically re-run onboarding with a new key).
    const byPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone }, include: { worker: true } });
    if (byPhone) {
      if (!byPhone.worker) {
        throw new ConflictException({
          code: ERROR_CODES.INTERNAL_WORKER_PHONE_CONFLICT,
          message: 'An account with this phone number already exists (not an acquisition worker)',
        });
      }
      this.logger.log(`Replaying internal worker create for existing phone`);
      return this.toReference(byPhone.worker, { replayed: true });
    }

    // 3. Account (trust checks happen inside AuthService).
    const { user } = await this.authService.registerWorkerFromAcquisition({
      phone: dto.phone,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      ipAddress: meta.ipAddress,
    });

    // 4. Initial profile. Atomicity of account ↔ profile would require a
    // transaction spanning two services, so we compensate instead: if the
    // profile fails, the just-created account is removed rather than left as
    // a credentialless orphan a retry can never resolve.
    let worker;
    try {
      worker = await this.workersService.createWorkerProfile(user.id, (dto.profile ?? {}) as any, {
        acquisition: {
          idempotencyKey: dto.idempotencyKey,
          source: dto.source ?? 'AI_ACQUISITION',
          platform: dto.platform,
          campaignId: dto.campaignId,
          campaignName: dto.campaignName,
          adId: dto.adId,
          adName: dto.adName,
          adSetId: dto.adSetId,
          adSetName: dto.adSetName,
        },
      });
    } catch (error: any) {
      // Concurrent create that lost the race on the unique idempotency key —
      // resolve to the winner instead of blowing up the caller's retry.
      if (error?.code === 'P2002') {
        const winner = await this.prisma.worker.findUnique({
          where: { acquisitionIdempotencyKey: dto.idempotencyKey },
        });
        if (winner) return this.toReference(winner, { replayed: true });
      }
      try {
        await this.prisma.user.delete({ where: { id: user.id } });
      } catch (cleanupError) {
        this.logger.error(`CRITICAL: acquisition account ${user.id} left without worker profile after failed profile create: ${cleanupError}`);
      }
      throw error;
    }

    // 5. Audit (best-effort, consistent with the rest of the codebase: audit
    //    rows are written inline in services, but must never fail the business
    //    operation itself).
    await this.writeAudit('INTERNAL_ACQUISITION_WORKER_CREATED', {
      userId: user.id,
      userEmail: user.email,
      entityId: worker.id,
      details: {
        workerId: worker.publicId,
        acquisitionSource: worker.acquisitionSource,
        acquisitionPlatform: worker.acquisitionPlatform,
        campaignId: dto.campaignId,
        campaignName: dto.campaignName,
        adId: dto.adId,
        adName: dto.adName,
        adSetId: dto.adSetId,
        adSetName: dto.adSetName,
        idempotencyKey: dto.idempotencyKey,
      },
      meta,
    });

    return this.toReference(worker, { replayed: false });
  }

  // ============================================================================
  // GET WORKER PROFILE (whitelisted view for the acquisition service)
  // ============================================================================

  async getWorkerProfile(publicId: string) {
    const worker = await this.resolveWorkerByPublicId(publicId);
    const full = await this.workersService.getPrivateProfile(worker.userId);

    // Whitelist — do not leak DB internals (ids, raw postalCode, deletedAt,
    // regionId) across the service boundary. Mirrors buildAnonymousProfile
    // discipline, but for the worker's own data.
    return {
      workerId: full.publicId,
      availability: full.availability,
      profileVisibility: full.profileVisibility,
      isProfileComplete: full.isProfileComplete,
      profileCompletenessPct: full.profileCompletenessPct,
      primaryTrade: full.primaryTrade,
      specializations: full.specializations,
      yearsOfExperience: full.yearsOfExperience,
      headline: full.headline,
      summary: full.summary,
      employmentTypes: full.employmentTypes,
      workAuthorization: full.workAuthorization,
      certifications: (full.certifications ?? []).map(c => ({ name: c.name, verificationStatus: c.verificationStatus })),
      languages: (full.languages ?? []).map(l => ({ language: l.language, level: l.level })),
      skills: (full.skills ?? []).map(s => ({ name: s.skill?.name, level: s.level })),
      updatedAt: full.updatedAt,
    };
  }

  // ============================================================================
  // UPSERT WORKER PROFILE (partial update, business rules from WorkersService)
  // ============================================================================

  async upsertWorkerProfile(publicId: string, dto: InternalUpsertProfileDto, meta: RequestMeta = {}) {
    const worker = await this.resolveWorkerByPublicId(publicId);
    const updated = await this.workersService.updateWorkerProfile(worker.userId, dto);

    await this.writeAudit('INTERNAL_ACQUISITION_PROFILE_UPDATED', {
      userId: worker.userId,
      entityId: worker.id,
      details: {
        workerId: worker.publicId,
        fields: Object.keys(dto ?? {}).filter(k => (dto as any)[k] !== undefined),
      },
      meta,
    });

    return {
      workerId: updated.publicId,
      isProfileComplete: updated.isProfileComplete,
      profileCompletenessPct: updated.profileCompletenessPct,
      availability: updated.availability,
      profileVisibility: updated.profileVisibility,
    };
  }

  // ============================================================================
  // ACTIVATE WORKER PROFILE
  // ============================================================================

  /**
   * Activation has no dedicated state in the domain model — it is the
   * combination of `availability` (leaving NOT_AVAILABLE) and
   * `profileVisibility` (leaving HIDDEN/SELECTED_COMPANIES). Defaults make an
   * activated worker IMMEDIATE-available to all verified employers, which is
   * what the acquisition funnel means by "PROFILE_ACTIVATED".
   */
  async activateWorker(publicId: string, dto: InternalActivateWorkerDto = {}, meta: RequestMeta = {}) {
    const worker = await this.resolveWorkerByPublicId(publicId);

    const updated = await this.prisma.worker.update({
      where: { id: worker.id },
      data: {
        availability: (dto.availability as Availability) ?? Availability.IMMEDIATE,
        profileVisibility: (dto.profileVisibility as ProfileVisibility) ?? ProfileVisibility.ALL_VERIFIED,
      },
    });

    await this.writeAudit('INTERNAL_ACQUISITION_PROFILE_ACTIVATED', {
      userId: worker.userId,
      entityId: worker.id,
      details: {
        workerId: worker.publicId,
        availability: updated.availability,
        profileVisibility: updated.profileVisibility,
      },
      meta,
    });

    return {
      workerId: updated.publicId,
      availability: updated.availability,
      profileVisibility: updated.profileVisibility,
    };
  }

  // ============================================================================
  // helpers
  // ============================================================================

  private async resolveWorkerByPublicId(publicId: string) {
    if (!publicId?.trim()) {
      throw new NotFoundException({ code: ERROR_CODES.INTERNAL_WORKER_NOT_FOUND, message: 'Worker not found' });
    }
    const worker = await this.prisma.worker.findUnique({ where: { publicId: publicId.trim() } });
    if (!worker || worker.deletedAt) {
      throw new NotFoundException({ code: ERROR_CODES.INTERNAL_WORKER_NOT_FOUND, message: 'Worker not found' });
    }
    return worker;
  }

  /** Response contract for create replies: ids + activation state only. */
  private toReference(worker: { publicId: string; availability: string; profileVisibility: string; isProfileComplete: boolean; profileCompletenessPct: number }, opts: { replayed: boolean }) {
    return {
      workerId: worker.publicId,
      availability: worker.availability,
      profileVisibility: worker.profileVisibility,
      isProfileComplete: worker.isProfileComplete,
      profileCompletenessPct: worker.profileCompletenessPct,
      replayed: opts.replayed,
    };
  }

  private async writeAudit(
    action: string,
    args: { userId?: string; userEmail?: string; entityId?: string; details: object; meta: RequestMeta },
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: args.userId,
          userEmail: args.userEmail,
          userRole: 'WORKER',
          action,
          entityType: 'Worker',
          entityId: args.entityId,
          changes: args.details as any,
          ipAddress: args.meta.ipAddress,
          userAgent: args.meta.userAgent,
          requestId: args.meta.requestId,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to write audit log for ${action}: ${e}`);
    }
  }
}