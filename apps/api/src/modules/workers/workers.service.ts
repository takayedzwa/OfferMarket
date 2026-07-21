import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Availability, ProfileVisibility, SkillLevel, EmploymentType, WorkScheduleType, IndustryType, CareerPriority, Specialization, WorkAuthorization } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegionsService } from '../common/regions.service';
import { CreateWorkerDto, UpdateWorkerDto, CreateProfileSkillDto, UpdateProfileSkillDto, CreateCertificationDto, UpdateCertificationDto, CreateWorkerLanguageDto, UpdateWorkerLanguageDto, CreateEducationDto, UpdateEducationDto, CreateProjectExperienceDto, UpdateProjectExperienceDto } from './dto/worker.dto';

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
  // GET AVAILABLE TRADES
  // ============================================================================

  async getAvailableTrades() {
    const trades = [
      { value: 'Electrician', label: 'Electrician', available: true },
      { value: 'Industrial Electrician', label: 'Industrial Electrician', available: true },
      { value: 'Maintenance Electrician', label: 'Maintenance Electrician', available: true },
      { value: 'Residential Electrician', label: 'Residential Electrician', available: true },
      { value: 'Commercial Electrician', label: 'Commercial Electrician', available: true },
      { value: 'Electrical Technician', label: 'Electrical Technician', available: true },
      { value: 'HVAC Technician', label: 'HVAC Technician', available: false, comingSoon: true },
      { value: 'Solar Installer', label: 'Solar Installer', available: false, comingSoon: true },
      { value: 'Plumber', label: 'Plumber', available: false, comingSoon: true },
      { value: 'Maintenance Technician', label: 'Maintenance Technician', available: false, comingSoon: true },
      { value: 'Logistics Worker', label: 'Logistics Worker', available: false, comingSoon: true },
    ];

    return {
      trades,
      currentlyAvailable: trades.filter(t => t.available),
      comingSoon: trades.filter(t => t.comingSoon)
    };
  }

  // ============================================================================
  // GET AVAILABLE SPECIALIZATIONS
  // ============================================================================

  async getAvailableSpecializations() {
    return Object.values(Specialization).map(s => ({
      value: s,
      label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }));
  }

  // ============================================================================
  // SEARCH WORKERS (For Employers - Anonymous Profiles)
  // ============================================================================

  async searchWorkers(filters: {
    trade?: string;
    regionId?: string;
    availability?: string;
    minExperience?: number;
    maxExperience?: number;
    specializations?: string[];
    hasDrivingLicense?: boolean;
    workAuthorization?: string;
    skillIds?: string[];
    certificationNames?: string[];
    languageMinLevel?: { language: string; level: string };
    languageFilter?: { language: string };
    employmentTypes?: string[];
    page?: number;
    limit?: number;
    employerId?: string;
  }) {
    const {
      trade,
      regionId,
      availability,
      minExperience,
      maxExperience,
      specializations,
      hasDrivingLicense,
      workAuthorization,
      skillIds,
      certificationNames,
      languageMinLevel,
      languageFilter,
      employmentTypes,
      page = 1,
      limit = 20,
      employerId,
    } = filters;

    const where: any = {
      deletedAt: null,
    };

    // SECURITY: Exclude workers who have blocked the searching employer.
    // This prevents employers from finding workers who have explicitly
    // blocked them, even if the worker's profile visibility is ALL_VERIFIED.
    if (employerId) {
      where.blockedCompanies = {
        none: { employerId },
      };
    }

    // Visibility filter: show ALL_VERIFIED workers, plus SELECTED_COMPANIES workers
    // that have explicitly granted visibility to this employer.
    if (employerId) {
      where.OR = [
        { profileVisibility: 'ALL_VERIFIED' },
        {
          profileVisibility: 'SELECTED_COMPANIES',
          visibleCompanies: {
            some: { employerId },
          },
        },
      ];
    } else {
      // No employer context — only show ALL_VERIFIED workers
      where.profileVisibility = 'ALL_VERIFIED';
    }

    if (trade) {
      where.primaryTrade = trade;
    }

    if (regionId) {
      // Resolve hierarchical region: find workers in the region itself,
      // its descendants (province → cities), and its ancestors (city → province → country).
      // This ensures city-level searches find province-level workers and vice versa.
      const regionsService = new RegionsService(this.prisma);
      const [descendantIds, ancestorIds] = await Promise.all([
        regionsService.getDescendantIds(regionId),
        regionsService.getAncestorIds(regionId),
      ]);
      where.regionId = { in: [...new Set([...descendantIds, ...ancestorIds])] };
    }

    if (availability) {
      where.availability = availability;
    }

    if (minExperience !== undefined || maxExperience !== undefined) {
      where.yearsOfExperience = {};
      if (minExperience !== undefined) {
        where.yearsOfExperience.gte = minExperience;
      }
      if (maxExperience !== undefined) {
        where.yearsOfExperience.lte = maxExperience;
      }
    }

    if (specializations && specializations.length > 0) {
      where.specializations = { hasEvery: specializations };
    }

    if (hasDrivingLicense !== undefined) {
      where.hasDrivingLicense = hasDrivingLicense;
    }

    if (workAuthorization) {
      where.workAuthorization = workAuthorization;
    }

    if (skillIds && skillIds.length > 0) {
      where.skills = {
        some: {
          skillId: { in: skillIds }
        }
      };
    }

    if (certificationNames && certificationNames.length > 0) {
      where.certifications = {
        some: {
          name: { in: certificationNames },
          verificationStatus: 'VERIFIED'
        }
      };
    }

    if (languageMinLevel) {
      const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'];
      const minIdx = levelOrder.indexOf(languageMinLevel.level);
      if (minIdx >= 0) {
        const qualifyingLevels = levelOrder.slice(minIdx);
        where.languages = {
          some: {
            language: { equals: languageMinLevel.language, mode: 'insensitive' },
            level: { in: qualifyingLevels }
          }
        };
      }
    } else if (languageFilter) {
      // Language-only filter: match workers who speak the language at any level
      where.languages = {
        some: {
          language: { equals: languageFilter.language, mode: 'insensitive' },
        }
      };
    }

    if (employmentTypes && employmentTypes.length > 0) {
      where.employmentTypes = { hasEvery: employmentTypes };
    }

    const [workers, total] = await Promise.all([
      this.prisma.worker.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          region: true,
          skills: {
            include: {
              skill: true
            }
          },
          certifications: {
            where: { verificationStatus: 'VERIFIED' }
          },
          languages: true,
          education: true,
          projectExperiences: true,
        },
        orderBy: { updatedAt: 'desc' }
      }),
      this.prisma.worker.count({ where })
    ]);

    // Transform to anonymous profiles
    const anonymousWorkers = workers.map(worker => this.buildAnonymousProfile(worker));

    return {
      workers: anonymousWorkers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ============================================================================
  // CREATE WORKER PROFILE
  // ============================================================================

  async createWorkerProfile(userId: string, createDto: CreateWorkerDto) {
    // Check if worker profile already exists for this user
    const existing = await this.prisma.worker.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('Worker profile already exists for this user');
    }

    return this.prisma.$transaction(async (tx) => {
      // Generate anonymous public ID
      const publicId = await this.generateWorkerPublicId(tx);

      // Calculate profile completeness
      const completeness = this.calculateCompleteness(createDto);

      // Validate regionId references an existing Region
      let regionId: string | null = null;
      if (createDto.regionId && createDto.regionId.trim()) {
        const regionExists = await tx.region.findUnique({ where: { id: createDto.regionId } });
        if (regionExists) {
          regionId = createDto.regionId;
        }
      }

      const worker = await tx.worker.create({
        data: {
          userId,
          publicId,
          regionId,
          country: createDto.country || 'NL',
          yearsOfExperience: createDto.yearsOfExperience,
          primaryTrade: createDto.primaryTrade,
          headline: createDto.headline,
          summary: createDto.summary,
          specializations: (createDto.specializations || []) as Specialization[],
          availability: createDto.availability as Availability || Availability.NOT_AVAILABLE,
          noticePeriodDays: createDto.noticePeriodDays,
          desiredSalaryMin: createDto.desiredSalaryMin,
          desiredSalaryMax: createDto.desiredSalaryMax,
          desiredHourlyRate: createDto.desiredHourlyRate,
          employmentTypes: (createDto.employmentTypes || []) as EmploymentType[],
          travelDistanceKm: createDto.travelDistanceKm || 30,
          hasDrivingLicense: createDto.hasDrivingLicense || false,
          hasOwnVehicle: createDto.hasOwnVehicle || false,
          workAuthorization: createDto.workAuthorization as WorkAuthorization || null,
          workSchedulePrefs: (createDto.workSchedulePrefs || []) as WorkScheduleType[],
          industryPrefs: (createDto.industryPrefs || []) as IndustryType[],
          careerPriorities: (createDto.careerPriorities || []) as CareerPriority[],
          profileVisibility: createDto.profileVisibility as ProfileVisibility || ProfileVisibility.ALL_VERIFIED,
          isProfileComplete: completeness >= 90,
          profileCompletenessPct: completeness,
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
        languages: true,
        education: true,
        projectExperiences: true,
        blockedCompanies: {
          include: {
            employer: {
              select: {
                id: true,
                companyName: true
              }
            }
          }
        },
        visibleCompanies: {
          include: {
            employer: {
              select: {
                id: true,
                companyName: true,
                companyTradeName: true
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

    // Add computed badges
    return {
      ...profile,
      badges: this.computeBadges(worker),
    };
  }

  // ============================================================================
  // GET PUBLIC PROFILE (What employers see - ANONYMOUS)
  // ============================================================================

  async getPublicProfile(publicId: string, viewerEmployerId?: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { publicId: String(publicId) },
      include: {
        region: true,
        skills: {
          include: {
            skill: true
          }
        },
        certifications: {
          where: { verificationStatus: 'VERIFIED' }
        },
        languages: true,
        education: true,
        projectExperiences: true,
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
        throw new NotFoundException('Profile not found');
      }
    }

    // CRITICAL: Verify worker's visibility settings
    if (worker.profileVisibility === 'HIDDEN') {
      throw new NotFoundException('Profile not found');
    }

    if (worker.profileVisibility === 'SELECTED_COMPANIES') {
      // Worker has selected specific companies that can view their profile.
      // Only allow access if the viewer is one of those companies.
      if (!viewerEmployerId) {
        throw new NotFoundException('Profile not found');
      }

      const isVisible = await this.prisma.visibleCompany.findUnique({
        where: {
          workerId_employerId: {
            workerId: worker.id,
            employerId: viewerEmployerId,
          },
        },
      });

      if (!isVisible) {
        throw new NotFoundException('Profile not found');
      }
    }

    return this.buildAnonymousProfile(worker);
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
    const safetyScore = await this.calculateSafetyScore(worker.id);

    // Handle regionId - validate it references an existing Region, otherwise null
    let regionId: string | null = null;
    if (updateDto.regionId && updateDto.regionId.trim()) {
      const regionExists = await this.prisma.region.findUnique({ where: { id: updateDto.regionId } });
      if (regionExists) {
        regionId = updateDto.regionId;
      }
      // If region doesn't exist, leave as null (don't throw - just ignore invalid IDs)
    }

    // Build update data, only including fields that are defined
    const updateData: any = {};
    if (updateDto.regionId !== undefined) updateData.regionId = regionId;
    if (updateDto.postalCode !== undefined) updateData.postalCode = updateDto.postalCode;
    if (updateDto.yearsOfExperience !== undefined) updateData.yearsOfExperience = updateDto.yearsOfExperience;
    if (updateDto.primaryTrade !== undefined) updateData.primaryTrade = updateDto.primaryTrade;
    if (updateDto.headline !== undefined) updateData.headline = updateDto.headline;
    if (updateDto.summary !== undefined) updateData.summary = updateDto.summary;
    if (updateDto.specializations !== undefined) updateData.specializations = updateDto.specializations as Specialization[];
    if (updateDto.availability !== undefined) updateData.availability = updateDto.availability as Availability;
    if (updateDto.noticePeriodDays !== undefined) updateData.noticePeriodDays = updateDto.noticePeriodDays;
    if (updateDto.desiredSalaryMin !== undefined) updateData.desiredSalaryMin = updateDto.desiredSalaryMin;
    if (updateDto.desiredSalaryMax !== undefined) updateData.desiredSalaryMax = updateDto.desiredSalaryMax;
    if (updateDto.desiredHourlyRate !== undefined) updateData.desiredHourlyRate = updateDto.desiredHourlyRate;
    if (updateDto.employmentTypes !== undefined) updateData.employmentTypes = updateDto.employmentTypes as EmploymentType[];
    if (updateDto.travelDistanceKm !== undefined) updateData.travelDistanceKm = updateDto.travelDistanceKm;
    if (updateDto.hasDrivingLicense !== undefined) updateData.hasDrivingLicense = updateDto.hasDrivingLicense;
    if (updateDto.hasOwnVehicle !== undefined) updateData.hasOwnVehicle = updateDto.hasOwnVehicle;
    if (updateDto.workAuthorization !== undefined) updateData.workAuthorization = updateDto.workAuthorization as WorkAuthorization;
    if (updateDto.workSchedulePrefs !== undefined) updateData.workSchedulePrefs = updateDto.workSchedulePrefs as WorkScheduleType[];
    if (updateDto.industryPrefs !== undefined) updateData.industryPrefs = updateDto.industryPrefs as IndustryType[];
    if (updateDto.careerPriorities !== undefined) updateData.careerPriorities = updateDto.careerPriorities as CareerPriority[];
    if (updateDto.profileVisibility !== undefined) updateData.profileVisibility = updateDto.profileVisibility as ProfileVisibility;
    updateData.isProfileComplete = completeness >= 90;
    updateData.profileCompletenessPct = completeness;
    updateData.safetyScore = safetyScore;

    return this.prisma.worker.update({
      where: { userId },
      data: updateData
    });
  }

  // ============================================================================
  // PROFILE SKILL CRUD
  // ============================================================================

  async addProfileSkill(userId: string, dto: CreateProfileSkillDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    // Resolve skillId: either provided directly, or look up/create by name
    let skillId = dto.skillId;
    if (!skillId && dto.name) {
      // Try to find an existing skill by name (case-insensitive)
      const existingSkill = await this.prisma.skill.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' } },
      });
      if (existingSkill) {
        skillId = existingSkill.id;
      } else {
        // Create a new skill entry in the catalog
        const newSkill = await this.prisma.skill.create({
          data: { name: dto.name, slug: dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), category: 'Other', isActive: true },
        });
        skillId = newSkill.id;
      }
    }

    if (!skillId) throw new BadRequestException('Either skillId or name is required');

    // Verify skill exists
    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw new NotFoundException('Skill not found');

    // Check for duplicate
    const existing = await this.prisma.profileSkill.findUnique({
      where: { profileId_skillId: { profileId: worker.id, skillId } }
    });
    if (existing) throw new BadRequestException('Skill already added to profile');

    const profileSkill = await this.prisma.profileSkill.create({
      data: {
        profileId: worker.id,
        skillId,
        level: dto.level as SkillLevel,
        yearsOfExperience: dto.yearsOfExperience,
        certificationNumber: dto.certificationNumber,
        certifiedBy: dto.certifiedBy,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        isPrimary: dto.isPrimary || false,
      },
      include: { skill: true }
    });

    await this.recalculateCompleteness(userId);
    return profileSkill;
  }

  async updateProfileSkill(userId: string, skillEntryId: string, dto: UpdateProfileSkillDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.profileSkill.findFirst({
      where: { id: skillEntryId, profileId: worker.id }
    });
    if (!existing) throw new NotFoundException('Profile skill not found');

    const updateData: any = {};
    if (dto.level !== undefined) updateData.level = dto.level as SkillLevel;
    if (dto.yearsOfExperience !== undefined) updateData.yearsOfExperience = dto.yearsOfExperience;
    if (dto.certificationNumber !== undefined) updateData.certificationNumber = dto.certificationNumber;
    if (dto.certifiedBy !== undefined) updateData.certifiedBy = dto.certifiedBy;
    if (dto.validUntil !== undefined) updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.isPrimary !== undefined) updateData.isPrimary = dto.isPrimary;

    const result = await this.prisma.profileSkill.update({
      where: { id: skillEntryId },
      data: updateData,
      include: { skill: true }
    });

    await this.recalculateCompleteness(userId);
    return result;
  }

  async removeProfileSkill(userId: string, skillEntryId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.profileSkill.findFirst({
      where: { id: skillEntryId, profileId: worker.id }
    });
    if (!existing) throw new NotFoundException('Profile skill not found');

    await this.prisma.profileSkill.delete({ where: { id: skillEntryId } });
    await this.recalculateCompleteness(userId);
    return { deleted: true };
  }

  // ============================================================================
  // CERTIFICATION CRUD
  // ============================================================================

  async addCertification(userId: string, dto: CreateCertificationDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const certification = await this.prisma.certification.create({
      data: {
        profileId: worker.id,
        skillId: dto.skillId || null,
        name: dto.name,
        certificationNumber: dto.certificationNumber,
        issuingBody: dto.issuingBody,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        isLifetime: dto.isLifetime || false,
        documentUrl: dto.documentUrl,
      }
    });

    await this.recalculateCompleteness(userId);
    await this.recalculateSafetyScore(userId);
    return certification;
  }

  async updateCertification(userId: string, certificationId: string, dto: UpdateCertificationDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.certification.findFirst({
      where: { id: certificationId, profileId: worker.id }
    });
    if (!existing) throw new NotFoundException('Certification not found');

    const updateData: any = {};
    if (dto.skillId !== undefined) updateData.skillId = dto.skillId;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.certificationNumber !== undefined) updateData.certificationNumber = dto.certificationNumber;
    if (dto.issuingBody !== undefined) updateData.issuingBody = dto.issuingBody;
    if (dto.issuedAt !== undefined) updateData.issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : null;
    if (dto.validFrom !== undefined) updateData.validFrom = dto.validFrom ? new Date(dto.validFrom) : null;
    if (dto.validUntil !== undefined) updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.isLifetime !== undefined) updateData.isLifetime = dto.isLifetime;
    if (dto.documentUrl !== undefined) updateData.documentUrl = dto.documentUrl;

    const result = await this.prisma.certification.update({
      where: { id: certificationId },
      data: updateData,
    });

    await this.recalculateCompleteness(userId);
    await this.recalculateSafetyScore(userId);
    return result;
  }

  async removeCertification(userId: string, certificationId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.certification.findFirst({
      where: { id: certificationId, profileId: worker.id }
    });
    if (!existing) throw new NotFoundException('Certification not found');

    await this.prisma.certification.delete({ where: { id: certificationId } });
    await this.recalculateCompleteness(userId);
    await this.recalculateSafetyScore(userId);
    return { deleted: true };
  }

  // ============================================================================
  // LANGUAGE CRUD
  // ============================================================================

  async addLanguage(userId: string, dto: CreateWorkerLanguageDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const language = await this.prisma.workerLanguage.create({
      data: {
        workerId: worker.id,
        language: dto.language,
        level: dto.level,
      }
    });

    await this.recalculateCompleteness(userId);
    return language;
  }

  async updateLanguage(userId: string, languageId: string, dto: UpdateWorkerLanguageDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.workerLanguage.findFirst({
      where: { id: languageId, workerId: worker.id }
    });
    if (!existing) throw new NotFoundException('Language entry not found');

    return this.prisma.workerLanguage.update({
      where: { id: languageId },
      data: { level: dto.level }
    });
  }

  async removeLanguage(userId: string, languageId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.workerLanguage.findFirst({
      where: { id: languageId, workerId: worker.id }
    });
    if (!existing) throw new NotFoundException('Language entry not found');

    await this.prisma.workerLanguage.delete({ where: { id: languageId } });
    await this.recalculateCompleteness(userId);
    return { deleted: true };
  }

  // ============================================================================
  // EDUCATION CRUD
  // ============================================================================

  async addEducation(userId: string, dto: CreateEducationDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const education = await this.prisma.education.create({
      data: {
        workerId: worker.id,
        qualification: dto.qualification,
        institution: dto.institution,
        country: dto.country || 'NL',
        yearCompleted: dto.yearCompleted,
      }
    });

    await this.recalculateCompleteness(userId);
    return education;
  }

  async updateEducation(userId: string, educationId: string, dto: UpdateEducationDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.education.findFirst({
      where: { id: educationId, workerId: worker.id }
    });
    if (!existing) throw new NotFoundException('Education entry not found');

    const updateData: any = {};
    if (dto.qualification !== undefined) updateData.qualification = dto.qualification;
    if (dto.institution !== undefined) updateData.institution = dto.institution;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.yearCompleted !== undefined) updateData.yearCompleted = dto.yearCompleted;

    return this.prisma.education.update({
      where: { id: educationId },
      data: updateData,
    });
  }

  async removeEducation(userId: string, educationId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.education.findFirst({
      where: { id: educationId, workerId: worker.id }
    });
    if (!existing) throw new NotFoundException('Education entry not found');

    await this.prisma.education.delete({ where: { id: educationId } });
    await this.recalculateCompleteness(userId);
    return { deleted: true };
  }

  // ============================================================================
  // PROJECT EXPERIENCE CRUD
  // ============================================================================

  async addProjectExperience(userId: string, dto: CreateProjectExperienceDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const project = await this.prisma.projectExperience.create({
      data: {
        workerId: worker.id,
        projectType: dto.projectType,
        industry: dto.industry,
        durationMonths: dto.durationMonths,
        responsibilities: dto.responsibilities || [],
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        description: dto.description,
      }
    });

    await this.recalculateCompleteness(userId);
    return project;
  }

  async updateProjectExperience(userId: string, projectId: string, dto: UpdateProjectExperienceDto) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.projectExperience.findFirst({
      where: { id: projectId, workerId: worker.id }
    });
    if (!existing) throw new NotFoundException('Project experience not found');

    const updateData: any = {};
    if (dto.projectType !== undefined) updateData.projectType = dto.projectType;
    if (dto.industry !== undefined) updateData.industry = dto.industry;
    if (dto.durationMonths !== undefined) updateData.durationMonths = dto.durationMonths;
    if (dto.responsibilities !== undefined) updateData.responsibilities = dto.responsibilities;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.description !== undefined) updateData.description = dto.description;

    return this.prisma.projectExperience.update({
      where: { id: projectId },
      data: updateData,
    });
  }

  async removeProjectExperience(userId: string, projectId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) throw new NotFoundException('Worker profile not found');

    const existing = await this.prisma.projectExperience.findFirst({
      where: { id: projectId, workerId: worker.id }
    });
    if (!existing) throw new NotFoundException('Project experience not found');

    await this.prisma.projectExperience.delete({ where: { id: projectId } });
    await this.recalculateCompleteness(userId);
    return { deleted: true };
  }

  // ============================================================================
  // GET SKILLS CATALOG
  // ============================================================================

  async getSkillsCatalog(category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;

    return this.prisma.skill.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  // ============================================================================
  // BLOCK COMPANY (Worker Privacy Control)
  // ============================================================================

  async blockCompany(workerId: string, employerId: string, reason?: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

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

  async updateVisibility(userId: string, visibility: 'ALL_VERIFIED' | 'SELECTED_COMPANIES' | 'HIDDEN') {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }
    return this.prisma.worker.update({
      where: { id: worker.id },
      data: { profileVisibility: visibility }
    });
  }

  // ============================================================================
  // VISIBLE COMPANIES (SELECTED_COMPANIES Visibility)
  // ============================================================================

  async addVisibleCompany(userId: string, employerId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId }
    });
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    return this.prisma.visibleCompany.upsert({
      where: {
        workerId_employerId: {
          workerId: worker.id,
          employerId
        }
      },
      create: {
        workerId: worker.id,
        employerId
      },
      update: {}
    });
  }

  async removeVisibleCompany(userId: string, employerId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.prisma.visibleCompany.delete({
      where: {
        workerId_employerId: {
          workerId: worker.id,
          employerId
        }
      }
    });
  }

  async getVisibleCompanies(userId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) {
      throw new NotFoundException('Worker profile not found');
    }

    return this.prisma.visibleCompany.findMany({
      where: { workerId: worker.id },
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
  // HELPER: Build Anonymous Profile
  // ============================================================================

  private buildAnonymousProfile(worker: any) {
    const {
      userId,
      postalCode,
      deletedAt,
      ...publicProfile
    } = worker;

    // Build headline: auto-generate if not set
    const headline = publicProfile.headline || this.generateHeadline(worker);

    return {
      publicId: publicProfile.publicId,
      headline,
      summary: publicProfile.summary || null,
      region: publicProfile.region ? {
        name: publicProfile.region.name,
        province: publicProfile.region.province,
        type: publicProfile.region.type
      } : null,
      yearsOfExperience: publicProfile.yearsOfExperience,
      primaryTrade: publicProfile.primaryTrade,
      specializations: publicProfile.specializations || [],
      skills: (worker.skills || []).map((s: any) => ({
        id: s.id,
        name: s.skill.name,
        level: s.level,
        yearsOfExperience: s.yearsOfExperience,
        isCertified: s.isVerified,
        isPrimary: s.isPrimary,
      })),
      certifications: (worker.certifications || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        issuingBody: c.issuingBody,
        isValid: !c.validUntil || c.validUntil > new Date() || c.isLifetime,
        validUntil: c.validUntil,
        isLifetime: c.isLifetime,
      })),
      languages: (worker.languages || []).map((l: any) => ({
        language: l.language,
        level: l.level,
      })),
      education: (worker.education || []).map((e: any) => ({
        id: e.id,
        qualification: e.qualification,
        institution: e.institution,
        country: e.country,
        yearCompleted: e.yearCompleted,
      })),
      projectExperiences: (worker.projectExperiences || []).map((p: any) => ({
        id: p.id,
        projectType: p.projectType,
        industry: p.industry,
        durationMonths: p.durationMonths,
        responsibilities: p.responsibilities,
        startDate: p.startDate,
        endDate: p.endDate,
        description: p.description,
      })),
      availability: publicProfile.availability,
      hasDrivingLicense: publicProfile.hasDrivingLicense,
      hasOwnVehicle: publicProfile.hasOwnVehicle,
      travelDistanceKm: publicProfile.travelDistanceKm,
      // GDPR Article 9: workAuthorization reveals immigration status (special category data).
      // Only exposed if worker has given explicit consent (immigrationConsentGiven === true).
      // Employers can filter by a binary "hasWorkAuthorization" boolean instead.
      workAuthorization: worker.immigrationConsentGiven ? publicProfile.workAuthorization : null,
      hasWorkAuthorization: !!publicProfile.workAuthorization,
      desiredSalaryRange: {
        min: publicProfile.desiredSalaryMin,
        max: publicProfile.desiredSalaryMax
      },
      employmentTypes: publicProfile.employmentTypes,
      workSchedulePrefs: publicProfile.workSchedulePrefs,
      industryPrefs: publicProfile.industryPrefs,
      careerPriorities: publicProfile.careerPriorities,
      profileCompletenessPct: publicProfile.profileCompletenessPct,
      reputationScore: publicProfile.reputationScore,
      safetyScore: publicProfile.safetyScore,
      badges: this.computeBadges(worker),
      lastActive: publicProfile.updatedAt,
      _meta: {
        identityRevealed: false,
        identityRevealedOn: 'offer_acceptance',
        hidden: {
          name: 'REDACTED',
          email: 'REDACTED',
          phone: 'REDACTED',
          exactAddress: 'REDACTED',
          currentEmployer: 'REDACTED',
          workAuthorizationDetail: 'REDACTED'
        }
      }
    };
  }

  // ============================================================================
  // HELPER: Generate Professional Headline
  // ============================================================================

  private generateHeadline(worker: any): string {
    const parts: string[] = [];

    if (worker.primaryTrade) {
      parts.push(worker.primaryTrade);
    }

    if (worker.specializations && worker.specializations.length > 0) {
      parts.push(worker.specializations[0].replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
    }

    if (worker.certifications && worker.certifications.length > 0) {
      const verifiedCerts = worker.certifications.filter((c: any) => c.verificationStatus === 'VERIFIED');
      if (verifiedCerts.length > 0) {
        parts.push(verifiedCerts[0].name);
      }
    }

    if (worker.yearsOfExperience) {
      parts.push(`${worker.yearsOfExperience} Years Experience`);
    }

    return parts.join(' | ') || 'Worker';
  }

  // ============================================================================
  // HELPER: Compute Profile Badges
  // ============================================================================

  private computeBadges(worker: any): string[] {
    const badges: string[] = [];

    // Certification-based badges
    if (worker.certifications) {
      const verifiedCerts = worker.certifications.filter((c: any) =>
        c.verificationStatus === 'VERIFIED' || c.isVerified === true
      );
      const certNames = verifiedCerts.map((c: any) => c.name);

      if (certNames.some((n: string) => n.includes('NEN 3140') || n.includes('NEN3140'))) {
        badges.push('NEN_3140_CERTIFIED');
      }
      if (certNames.some((n: string) => n.includes('VCA'))) {
        badges.push('VCA_CERTIFIED');
      }
      if (certNames.some((n: string) => n.includes('NEN 1010') || n.includes('NEN1010'))) {
        badges.push('NEN_1010_CERTIFIED');
      }
      if (certNames.some((n: string) => n.includes('First Aid') || n.includes('BHV') || n.includes('EHBO'))) {
        badges.push('FIRST_AID_CERTIFIED');
      }
      if (verifiedCerts.length >= 2) {
        badges.push('MULTIPLE_CERTIFIED');
      }
    }

    // Experience badges
    if (worker.yearsOfExperience >= 10) badges.push('SENIOR_EXPERT');
    else if (worker.yearsOfExperience >= 5) badges.push('EXPERIENCED');

    // Specialization badges
    if (worker.specializations) {
      if (worker.specializations.includes('INDUSTRIAL_INSTALLATIONS')) badges.push('INDUSTRIAL_SPECIALIST');
      if (worker.specializations.includes('PLC_SYSTEMS')) badges.push('PLC_SPECIALIST');
      if (worker.specializations.includes('SOLAR_PV')) badges.push('SOLAR_SPECIALIST');
      if (worker.specializations.includes('RENEWABLE_ENERGY')) badges.push('RENEWABLE_SPECIALIST');
    }

    // Availability badges
    if (worker.availability === 'IMMEDIATE') badges.push('AVAILABLE_IMMEDIATELY');

    // Mobility badges
    if (worker.hasDrivingLicense) badges.push('DRIVING_LICENCE_B');
    if (worker.hasOwnVehicle) badges.push('OWN_VEHICLE');

    // Language badges
    if (worker.languages) {
      const dutch = worker.languages.find((l: any) => l.language === 'Dutch');
      if (dutch && ['B2', 'C1', 'C2', 'NATIVE'].includes(dutch.level)) {
        badges.push('DUTCH_B2');
      }
      const english = worker.languages.find((l: any) => l.language === 'English');
      if (english && ['B2', 'C1', 'C2', 'NATIVE'].includes(english.level)) {
        badges.push('ENGLISH_B2');
      }
    }

    // Work authorization badges
    if (worker.workAuthorization === 'EU_CITIZEN') badges.push('EU_CITIZEN');
    if (worker.workAuthorization === 'DUTCH_WORK_PERMIT') badges.push('WORK_PERMIT_VALID');

    // Verification badge
    if (worker.certifications?.some((c: any) => c.verificationStatus === 'VERIFIED')) {
      badges.push('VERIFIED_CREDENTIALS');
    }

    return badges;
  }

  // ============================================================================
  // HELPER: Calculate Safety Score
  // ============================================================================

  private async calculateSafetyScore(workerId: string): Promise<number> {
    let score = 0;

    // VCA certification: 30 points
    const vcaCerts = await this.prisma.certification.count({
      where: {
        profileId: workerId,
        name: { contains: 'VCA', mode: 'insensitive' },
        verificationStatus: 'VERIFIED',
      }
    });
    if (vcaCerts > 0) score += 30;

    // NEN certifications: 20 points each, max 40
    const nenCerts = await this.prisma.certification.count({
      where: {
        profileId: workerId,
        name: { contains: 'NEN', mode: 'insensitive' },
        verificationStatus: 'VERIFIED',
      }
    });
    score += Math.min(nenCerts * 20, 40);

    // First Aid / BHV: 10 points
    const firstAidCerts = await this.prisma.certification.count({
      where: {
        profileId: workerId,
        OR: [
          { name: { contains: 'First Aid', mode: 'insensitive' } },
          { name: { contains: 'BHV', mode: 'insensitive' } },
        ],
        verificationStatus: 'VERIFIED',
      }
    });
    if (firstAidCerts > 0) score += 10;

    // Driving licence: 10 points
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });
    if (worker?.hasDrivingLicense) score += 10;

    // Incident-free bonus (based on reputation): 10 points if reputation >= 70
    if (worker && worker.reputationScore >= 70) score += 10;

    return Math.min(score, 100);
  }

  // ============================================================================
  // HELPER: Recalculate Completeness
  // ============================================================================

  private async recalculateCompleteness(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      include: {
        skills: true,
        certifications: true,
        languages: true,
        education: true,
        projectExperiences: true,
      }
    });

    if (!worker) return;

    const completeness = this.calculateCompleteness(worker);

    await this.prisma.worker.update({
      where: { userId },
      data: {
        isProfileComplete: completeness >= 90,
        profileCompletenessPct: completeness,
      }
    });
  }

  // ============================================================================
  // HELPER: Recalculate Safety Score
  // ============================================================================

  private async recalculateSafetyScore(userId: string) {
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (!worker) return;

    const safetyScore = await this.calculateSafetyScore(worker.id);

    await this.prisma.worker.update({
      where: { userId },
      data: { safetyScore }
    });
  }

  // ============================================================================
  // HELPER: Calculate Completeness
  // ============================================================================

  private calculateCompleteness(data: any): number {
    let score = 0;

    // Basic info (15 points)
    if (data.yearsOfExperience) score += 3;
    if (data.primaryTrade) score += 3;
    if (data.availability) score += 3;
    if (data.headline) score += 3;
    if (data.desiredSalaryMin && data.desiredSalaryMax) score += 3;

    // Specializations (5 points)
    if (data.specializations?.length) score += 5;

    // Skills (15 points)
    const skillCount = data.skills?.length || 0;
    if (skillCount >= 5) score += 15;
    else if (skillCount >= 3) score += 10;
    else if (skillCount >= 1) score += 5;

    // Certifications (15 points)
    const certCount = data.certifications?.length || 0;
    if (certCount >= 2) score += 15;
    else if (certCount >= 1) score += 8;

    // Languages (5 points)
    if (data.languages?.length) score += 5;

    // Education (5 points)
    if (data.education?.length) score += 5;

    // Project experience (10 points)
    if (data.projectExperiences?.length) score += 10;

    // Preferences (15 points)
    if (data.employmentTypes?.length) score += 4;
    if (data.workSchedulePrefs?.length) score += 4;
    if (data.industryPrefs?.length) score += 4;
    if (data.careerPriorities?.length) score += 3;

    // Mobility & authorization (10 points)
    if (data.hasDrivingLicense) score += 3;
    if (data.travelDistanceKm) score += 2;
    if (data.workAuthorization) score += 3;
    if (data.summary) score += 2;

    // Settings (5 points)
    if (data.noticePeriodDays !== undefined) score += 2;
    if (data.profileVisibility) score += 3;

    return Math.min(score, 100);
  }

  // ============================================================================
  // HELPER: Generate Worker Public ID
  // ============================================================================

  private async generateWorkerPublicId(tx: any): Promise<string> {
    const lastWorker = await tx.worker.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let sequence = 1;
    if (lastWorker && lastWorker.publicId) {
      const match = lastWorker.publicId.match(/(\d+)$/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `W-${String(sequence).padStart(6, '0')}`;
  }
}