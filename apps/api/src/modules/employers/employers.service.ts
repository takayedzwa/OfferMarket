import { Injectable, NotFoundException, BadRequestException, BadRequestException as BadRequestExceptionAlias } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';

@Injectable()
export class EmployersService {
  constructor(
    private prisma: PrismaService,
    private ratingsService: RatingsService
  ) {}

  async createEmployerProfile(userId: string, createDto: any) {
    return this.prisma.$transaction(async (tx) => {
      // Verify KvK number is unique
      const existing = await tx.employer.findUnique({
        where: { kvkNumber: createDto.kvkNumber }
      });

      if (existing) {
        throw new BadRequestException('An employer with this KvK number already exists');
      }

      // Ensure registeredAddress is a proper JSON object
      const registeredAddress = typeof createDto.registeredAddress === 'string'
        ? JSON.parse(createDto.registeredAddress)
        : createDto.registeredAddress;

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
          registeredAddress: registeredAddress || {
            street: '',
            houseNumber: '',
            postalCode: '',
            city: '',
            country: 'NL'
          },
          businessAddress: createDto.businessAddress ? (
            typeof createDto.businessAddress === 'string'
              ? JSON.parse(createDto.businessAddress)
              : createDto.businessAddress
          ) : null,
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

  async updateEmployerProfile(userId: string, updateDto: any) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId }
    });

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    return this.prisma.employer.update({
      where: { userId },
      data: updateDto
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
