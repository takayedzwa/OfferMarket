import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Availability, ProfileVisibility, SkillLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWorkerDto, UpdateWorkerDto } from './dto/worker.dto';

/**
 * WORKERS SERVICE
 *
 * Core primitive: ANONYMOUS WORKER PROFILES
 *
 * This service enforces:
 * 1. Worker identity is NEVER exposed to employers
 * 2. Only region-level location is shown
 * 3. Identity is only revealed when worker accepts an offer
 */

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // CREATE WORKER PROFILE
  // ============================================================================

  async createWorkerProfile(userId: string, createDto: CreateWorkerDto) {
    return this.prisma.$transaction(async (tx) => {
      // Generate anonymous public ID
      const publicId = await this.generateWorkerPublicId(tx);

      // Calculate profile completeness
      const completeness = this.calculateCompleteness(createDto);

      const worker = await tx.worker.create({
        data: {
          userId,
          publicId,
          regionId: createDto.regionId,
          country: createDto.country || 'NL',
          yearsOfExperience: createDto.yearsOfExperience,
          primaryTrade: createDto.primaryTrade,
          availability: createDto.availability as Availability || Availability.NOT_AVAILABLE,
          noticePeriodDays: createDto.noticePeriodDays,
          desiredSalaryMin: createDto.desiredSalaryMin,
          desiredSalaryMax: createDto.desiredSalaryMax,
          desiredHourlyRate: createDto.desiredHourlyRate,
          employmentTypes: createDto.employmentTypes || [],
          travelDistanceKm: createDto.travelDistanceKm || 30,
          workSchedulePrefs: createDto.workSchedulePrefs || [],
          industryPrefs: createDto.industryPrefs || [],
          careerPriorities: createDto.careerPriorities || [],
          profileVisibility: createDto.profileVisibility as ProfileVisibility || ProfileVisibility.ALL_VERIFIED,
          isProfileComplete: completeness >= 90,
          profileCompletenessPct: completeness
        },
        include: {
          region: true
        }
      });

      return worker;
    });
  }

  // ============================================================================
  // GET WORKER PROFILE (Private - for the worker themselves)
  // ============================================================================

  /**
   * Get worker's own profile with ALL data
   *
   * This is what the worker sees when editing their profile
   */
  async getPrivateProfile(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      include: {
        region: true,
        skills: {
          include: {
            skill: true
          }
        },
        certifications: true,
        blockedCompanies: {
          include: {
            employer: {
              select: {
                id: true,
                companyName: true
              }
            }
          }
        }
      }
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    // Don't return sensitive fields in the response
    const { deletedAt, ...profile } = worker;

    return profile;
  }

  // ============================================================================
  // GET PUBLIC PROFILE (What employers see - ANONYMOUS)
  // ============================================================================

  /**
   * Get worker profile for employer viewing
   *
   * CRITICAL: This strips ALL identifying information
   * - No name, email, phone
   * - No exact address (region only)
   * - No current employer
   * - Only verified certifications shown
   */
  async getPublicProfile(publicId: string, viewerEmployerId?: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { publicId },
      include: {
        region: true,
        skills: {
          include: {
            skill: true
          }
        },
        certifications: {
          where: { verificationStatus: 'VERIFIED' }
        }
      }
    });

    if (!worker || worker.deletedAt) {
      throw new NotFoundException('Profile not found');
    }

    // CRITICAL: Check if this employer is blocked
    if (viewerEmployerId) {
      const isBlocked = await this.prisma.blockedCompany.findFirst({
        where: {
          workerId: worker.id,
          employerId: viewerEmployerId
        }
      });

      if (isBlocked) {
        // Return generic "not found" to avoid revealing the block
        throw new NotFoundException('Profile not found');
      }
    }

    // CRITICAL: Verify worker's visibility settings
    if (worker.profileVisibility === 'HIDDEN') {
      throw new NotFoundException('Profile not found');
    }

    if (worker.profileVisibility === 'SELECTED_COMPANIES') {
      // Would need to check if employer is in allowed list
      throw new NotFoundException('Profile not found');
    }

    // TRANSFORM: Strip ALL identifying information
    const {
      userId,        // REMOVE
      postalCode,    // REMOVE (encrypted anyway)
      deletedAt,     // REMOVE
      ...publicProfile
    } = worker;

    // Build anonymous profile
    return {
      // Anonymous identifier
      publicId: publicProfile.publicId,

      // Location (region only, never exact)
      region: {
        name: publicProfile.region?.name || 'Netherlands',
        province: publicProfile.region?.province,
        type: publicProfile.region?.type
      },

      // Experience
      yearsOfExperience: publicProfile.yearsOfExperience,
      primaryTrade: publicProfile.primaryTrade,

      // Skills (no identifying details)
      skills: worker.skills.map(s => ({
        name: s.skill.name,
        level: s.level,
        yearsOfExperience: s.yearsOfExperience,
        isCertified: s.isVerified
      })),

      // Certifications (verified only)
      certifications: worker.certifications.map(c => ({
        name: c.name,
        isValid: !c.validUntil || c.validUntil > new Date(),
        validUntil: c.validUntil
      })),

      // Availability
      availability: publicProfile.availability,

      // Preferences (no identifying info)
      desiredSalaryRange: {
        min: publicProfile.desiredSalaryMin,
        max: publicProfile.desiredSalaryMax
      },
      employmentTypes: publicProfile.employmentTypes,
      travelDistanceKm: publicProfile.travelDistanceKm,
      workSchedulePrefs: publicProfile.workSchedulePrefs,
      industryPrefs: publicProfile.industryPrefs,
      careerPriorities: publicProfile.careerPriorities,

      // Profile quality signals
      profileCompletenessPct: publicProfile.profileCompletenessPct,
      reputationScore: publicProfile.reputationScore,
      lastActive: publicProfile.updatedAt,

      // EXPLICITLY DOCUMENT WHAT'S HIDDEN
      _meta: {
        identityRevealed: false,
        identityRevealedOn: 'offer_acceptance',
        hidden: {
          name: 'REDACTED',
          email: 'REDACTED',
          phone: 'REDACTED',
          exactAddress: 'REDACTED',
          currentEmployer: 'REDACTED'
        }
      }
    };
  }

  // ============================================================================
  // UPDATE WORKER PROFILE
  // ============================================================================

  async updateWorkerProfile(userId: string, updateDto: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId }
    });

    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    // Recalculate completeness
    const currentData = await this.getPrivateProfile(userId);
    const newData = { ...currentData, ...updateDto };
    const completeness = this.calculateCompleteness(newData);

    return this.prisma.worker.update({
      where: { userId },
      data: {
        regionId: updateDto.regionId,
        yearsOfExperience: updateDto.yearsOfExperience,
        primaryTrade: updateDto.primaryTrade,
        availability: updateDto.availability as Availability,
        noticePeriodDays: updateDto.noticePeriodDays,
        desiredSalaryMin: updateDto.desiredSalaryMin,
        desiredSalaryMax: updateDto.desiredSalaryMax,
        desiredHourlyRate: updateDto.desiredHourlyRate,
        employmentTypes: updateDto.employmentTypes,
        travelDistanceKm: updateDto.travelDistanceKm,
        workSchedulePrefs: updateDto.workSchedulePrefs,
        industryPrefs: updateDto.industryPrefs,
        careerPriorities: updateDto.careerPriorities,
        profileVisibility: updateDto.profileVisibility as ProfileVisibility,
        isProfileComplete: completeness >= 90,
        profileCompletenessPct: completeness
      }
    });
  }

  // ============================================================================
  // BLOCK COMPANY (Worker Privacy Control)
  // ============================================================================

  async blockCompany(workerId: string, employerId: string, reason?: string) {
    // Verify worker exists
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Verify employer exists
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    // Create or update block
    return this.prisma.blockedCompany.upsert({
      where: {
        workerId_employerId: {
          workerId,
          employerId
        }
      },
      create: {
        workerId,
        employerId,
        reason
      },
      update: {
        reason
      }
    });
  }

  async unblockCompany(workerId: string, employerId: string) {
    return this.prisma.blockedCompany.delete({
      where: {
        workerId_employerId: {
          workerId,
          employerId
        }
      }
    });
  }

  async getBlockedCompanies(workerId: string) {
    return this.prisma.blockedCompany.findMany({
      where: { workerId },
      include: {
        employer: {
          select: {
            id: true,
            companyName: true,
            companyTradeName: true
          }
        }
      }
    });
  }

  // ============================================================================
  // UPDATE PROFILE VISIBILITY
  // ============================================================================

  async updateVisibility(workerId: string, visibility: 'ALL_VERIFIED' | 'SELECTED_COMPANIES' | 'HIDDEN') {
    return this.prisma.worker.update({
      where: { id: workerId },
      data: { profileVisibility: visibility }
    });
  }

  // ============================================================================
  // DELETE WORKER PROFILE (Soft Delete)
  // ============================================================================

  async deleteWorkerProfile(workerId: string) {
    return this.prisma.worker.update({
      where: { id: workerId },
      data: {
        deletedAt: new Date(),
        profileVisibility: 'HIDDEN'
      }
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async generateWorkerPublicId(tx: any): Promise<string> {
    const lastWorker = await tx.worker.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let sequence = 1;
    if (lastWorker && lastWorker.publicId) {
      const lastNum = parseInt(lastWorker.publicId.replace('Profile #', ''));
      sequence = lastNum + 1;
    }

    return `Profile #${sequence}`;
  }

  private calculateCompleteness(data: any): number {
    let score = 0;

    // Basic info (20 points)
    if (data.yearsOfExperience) score += 5;
    if (data.primaryTrade) score += 5;
    if (data.availability) score += 5;
    if (data.desiredSalaryMin && data.desiredSalaryMax) score += 5;

    // Skills (25 points)
    const skillCount = data.skills?.length || 0;
    if (skillCount >= 5) score += 25;
    else if (skillCount >= 3) score += 15;
    else if (skillCount >= 1) score += 5;

    // Certifications (20 points)
    const certCount = data.certifications?.length || 0;
    if (certCount >= 2) score += 20;
    else if (certCount >= 1) score += 10;

    // Preferences (20 points)
    if (data.employmentTypes?.length) score += 5;
    if (data.workSchedulePrefs?.length) score += 5;
    if (data.industryPrefs?.length) score += 5;
    if (data.careerPriorities?.length) score += 5;

    // Profile settings (15 points)
    if (data.travelDistanceKm) score += 5;
    if (data.noticePeriodDays) score += 5;
    if (data.profileVisibility) score += 5;

    return Math.min(score, 100);
  }
}
