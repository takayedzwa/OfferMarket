import { Injectable, NotFoundException, BadRequestException, BadRequestException as BadRequestExceptionAlias } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { CreateEmployerProfileDto } from './dto/create-employer-profile.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

/**
 * SECURITY (E-C2): The complete allowlist of fields an employer may write to
 * their own profile. Verification, reputation, and billing fields are excluded
 * so an employer can never self-verify or inflate their reputation score.
 */
const EMPLOYER_UPDATABLE_FIELDS = [
  'companyName',
  'companyTradeName',
  'kvkNumber',
  'vatNumber',
  'companySize',
  'industry',
  'foundedYear',
  'registeredAddress',
  'businessAddress',
  'website',
  'phone',
  'billingEmail',
] as const;

@Injectable()
export class EmployersService {
  constructor(
    private prisma: PrismaService,
    private ratingsService: RatingsService
  ) {}

  async createEmployerProfile(userId: string, createDto: CreateEmployerProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      // Verify KvK number is unique
      const existing = await tx.employer.findUnique({
        where: { kvkNumber: createDto.kvkNumber }
      });

      if (existing) {
        throw new BadRequestException('An employer with this KvK number already exists');
      }

      // SECURITY (E-C2): Build the create payload explicitly from allowlisted
      // fields only — never spread the DTO. verificationStatus, billingStatus
      // and subscriptionPlan are set server-side to their defaults.
      // registeredAddress/businessAddress are Json columns — pass plain
      // objects (spread off the DTO instances) so Prisma accepts them as
      // InputJsonValue. When businessAddress is absent, omit it (undefined)
      // rather than passing `null`, which the nullable Json input rejects.
      const employer = await tx.employer.create({
        data: {
          userId,
          companyName: createDto.companyName,
          companyTradeName: createDto.companyTradeName,
          kvkNumber: createDto.kvkNumber,
          vatNumber: createDto.vatNumber,
          companySize: createDto.companySize,
          industry: createDto.industry,
          foundedYear: createDto.foundedYear,
          registeredAddress: { ...createDto.registeredAddress },
          businessAddress: createDto.businessAddress
            ? { ...createDto.businessAddress }
            : undefined,
          website: createDto.website,
          phone: createDto.phone,
          billingEmail: createDto.billingEmail,
          verificationStatus: 'PENDING',
          billingStatus: 'active',
          subscriptionPlan: 'pay_per_intro'
        }
      });

      return employer;
    });
  }

  async getEmployerProfile(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    // Get reputation data
    const ratingStats = await this.ratingsService.getEmployerRatingStats(employer.id);
    const trustScoreData = await this.ratingsService.calculateTrustScore(employer.id);

    return {
      ...employer,
      reputation: {
        trustScore: ratingStats.trustScore,
        trustScoreGrade: ratingStats.trustScoreGrade,
        averageRating: ratingStats.averageOverall,
        totalRatings: ratingStats.totalRatings,
        wouldWorkAgainPercentage: ratingStats.wouldWorkAgainPercentage,
        breakdown: trustScoreData.trustScoreBreakdown,
        factors: trustScoreData.factors
      }
    };
  }

  async updateEmployerProfile(userId: string, updateDto: UpdateEmployerProfileDto) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId }
    });

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    // SECURITY (E-C2): Only copy allowlisted fields into the update payload.
    // Defense-in-depth on top of the DTO + global whitelist pipe: even if a
    // protected field (verificationStatus, verifiedAt, reputationScore,
    // billingStatus, subscriptionPlan, creditBalance, totalOffersSent,
    // totalHires, offerAcceptanceRate) reached the service, it is dropped here
    // and never passed to prisma.employer.update.
    const data: Record<string, unknown> = {};
    for (const field of EMPLOYER_UPDATABLE_FIELDS) {
      if (updateDto[field] !== undefined) {
        // Address fields are Json columns — store them as plain objects, not
        // DTO class instances, so Prisma accepts them as InputJsonValue.
        if (field === 'registeredAddress' || field === 'businessAddress') {
          data[field] = { ...updateDto[field] };
        } else {
          data[field] = updateDto[field];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return employer;
    }

    return this.prisma.employer.update({
      where: { userId },
      data,
    });
  }

  async getVerificationStatus(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationStatus: true,
        verifiedAt: true,
        companyName: true
      }
    });

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    return {
      status: employer.verificationStatus,
      verifiedAt: employer.verifiedAt,
      companyName: employer.companyName
    };
  }

  // ============================================================================
  // PUBLIC REPUTATION ENDPOINTS
  // ============================================================================

  /**
   * Get public reputation data for an employer by ID
   */
  async getEmployerReputation(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      select: {
        id: true,
        companyName: true,
        companyTradeName: true,
        verificationStatus: true,
        reputationScore: true,
        offerAcceptanceRate: true,
        avgResponseTimeHours: true,
        totalHires: true
      }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const ratingStats = await this.ratingsService.getEmployerRatingStats(employerId);
    const trustScoreData = await this.ratingsService.calculateTrustScore(employerId);

    return {
      ...employer,
      reputation: {
        trustScore: ratingStats.trustScore,
        trustScoreGrade: ratingStats.trustScoreGrade,
        averageRating: ratingStats.averageOverall,
        totalRatings: ratingStats.totalRatings,
        wouldWorkAgainPercentage: ratingStats.wouldWorkAgainPercentage,
        ratingDistribution: ratingStats.ratingDistribution,
        breakdown: trustScoreData.trustScoreBreakdown,
        factors: trustScoreData.factors
      }
    };
  }

  /**
   * Get published ratings for an employer
   */
  async getEmployerRatings(employerId: string, limit: number = 20, offset: number = 0) {
    return this.ratingsService.getEmployerRatings(employerId, limit, offset);
  }
}
