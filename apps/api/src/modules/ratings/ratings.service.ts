import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { EmployerRatingStatsDto, TrustScoreResponseDto } from './dto/rating-response.dto';

/**
 * RATINGS SERVICE
 *
 * Handles employer reputation management:
 * - Workers can rate employers after receiving offers
 * - Ratings cover: interview experience, transparency, communication, offer accuracy, work-life balance
 * - Trust score is calculated from multiple factors
 */
@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // CREATE RATING
  // ============================================================================

  /**
   * Create a new employer rating
   *
   * Requirements:
   * - Worker must have received the offer
   * - Can only rate once per offer
   * - Rating is published immediately (can be flagged later)
   */
  async createRating(userId: string, createRatingDto: CreateRatingDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify worker exists
      const worker = await tx.worker.findUnique({
        where: { userId }
      });

      if (!worker) {
        throw new NotFoundException('Worker profile not found');
      }

      // 2. Verify offer exists and belongs to this worker
      const offer = await tx.offer.findUnique({
        where: { id: createRatingDto.offerId },
        include: { employer: true }
      });

      if (!offer) {
        throw new NotFoundException('Offer not found');
      }

      if (offer.workerId !== worker.id) {
        throw new ForbiddenException('Not authorized to rate this offer');
      }

      // 3. Check if rating already exists for this offer
      const existingRating = await tx.rating.findUnique({
        where: { offerId: createRatingDto.offerId }
      });

      if (existingRating) {
        throw new BadRequestException('You have already rated this offer');
      }

      // 4. Verify offer has reached a terminal state (accepted, rejected, withdrawn, expired)
      // Allow rating for any viewed/submitted offer as well for broader feedback
      const canRateStatuses = ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED', 'VIEWED', 'SUBMITTED'];
      if (!canRateStatuses.includes(offer.status)) {
        throw new BadRequestException('Can only rate offers that have been viewed or reached a final status');
      }

      // 5. Create the rating
      const rating = await tx.rating.create({
        data: {
          offerId: createRatingDto.offerId,
          raterId: worker.userId,
          employerId: offer.employerId,
          ratingOverall: createRatingDto.ratingOverall,
          ratingInterviewExperience: createRatingDto.ratingInterviewExperience,
          ratingTransparency: createRatingDto.ratingTransparency,
          ratingCommunication: createRatingDto.ratingCommunication,
          ratingOfferAccuracy: createRatingDto.ratingOfferAccuracy,
          ratingWorkLifeBalance: createRatingDto.ratingWorkLifeBalance,
          wouldWorkAgain: createRatingDto.wouldWorkAgain,
          reviewText: createRatingDto.reviewText,
          reviewTitle: createRatingDto.reviewTitle,
          isPublished: true,
          isVerifiedHire: offer.status === 'ACCEPTED'
        },
        include: {
          employer: true,
          offer: {
            select: {
              jobTitle: true,
              publicId: true
            }
          }
        }
      });

      // 6. Update employer's aggregate stats
      await this.updateEmployerAggregateStats(tx, offer.employerId);

      return rating;
    });
  }

  // ============================================================================
  // UPDATE RATING
  // ============================================================================

  /**
   * Update an existing rating
   * Only the original rater can update their rating
   */
  async updateRating(ratingId: string, userId: string, updateRatingDto: UpdateRatingDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find the rating
      const rating = await tx.rating.findUnique({
        where: { id: ratingId }
      });

      if (!rating) {
        throw new NotFoundException('Rating not found');
      }

      // 2. Verify the user is the rater
      if (rating.raterId !== userId) {
        throw new ForbiddenException('Not authorized to update this rating');
      }

      // 3. Update the rating
      const updatedRating = await tx.rating.update({
        where: { id: ratingId },
        data: updateRatingDto,
        include: {
          employer: true,
          offer: {
            select: {
              jobTitle: true,
              publicId: true
            }
          }
        }
      });

      // 4. Update employer's aggregate stats
      await this.updateEmployerAggregateStats(tx, rating.employerId);

      return updatedRating;
    });
  }

  // ============================================================================
  // GET RATINGS
  // ============================================================================

  /**
   * Get ratings for a specific employer (public view)
   * Only returns published ratings
   */
  async getEmployerRatings(employerId: string, limit: number = 20, offset: number = 0) {
    const ratings = await this.prisma.rating.findMany({
      where: {
        employerId,
        isPublished: true
      },
      include: {
        offer: {
          select: {
            jobTitle: true,
            publicId: true,
            status: true
          }
        },
        rater: {
          select: {
            id: true,
            // Don't expose rater identity fully - anonymize
            email: false
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Anonymize raters for privacy
    const anonymizedRatings = ratings.map(r => ({
      ...r,
      rater: {
        id: r.rater.id.substring(0, 6) + '...' // Show partial ID only
      },
      createdAt: r.createdAt,
      reviewTitle: r.reviewTitle,
      reviewText: r.reviewText,
      ratingOverall: r.ratingOverall,
      ratingInterviewExperience: r.ratingInterviewExperience,
      ratingTransparency: r.ratingTransparency,
      ratingCommunication: r.ratingCommunication,
      ratingOfferAccuracy: r.ratingOfferAccuracy,
      ratingWorkLifeBalance: r.ratingWorkLifeBalance,
      wouldWorkAgain: r.wouldWorkAgain,
      isVerifiedHire: r.isVerifiedHire
    }));

    return anonymizedRatings;
  }

  /**
   * Get rating statistics for an employer
   */
  async getEmployerRatingStats(employerId: string): Promise<EmployerRatingStatsDto> {
    const ratings = await this.prisma.rating.findMany({
      where: {
        employerId,
        isPublished: true
      },
      select: {
        ratingOverall: true,
        ratingInterviewExperience: true,
        ratingTransparency: true,
        ratingCommunication: true,
        ratingOfferAccuracy: true,
        ratingWorkLifeBalance: true,
        wouldWorkAgain: true
      }
    });

    const totalRatings = ratings.length;

    if (totalRatings === 0) {
      return {
        employerId,
        totalRatings: 0,
        averageOverall: 0,
        averageInterviewExperience: null,
        averageTransparency: null,
        averageCommunication: null,
        averageOfferAccuracy: null,
        averageWorkLifeBalance: null,
        wouldWorkAgainPercentage: null,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        trustScore: 50, // Default score for new employers
        trustScoreGrade: 'N/A'
      };
    }

    // Calculate averages
    const averageOverall = this.calculateAverage(ratings.map(r => r.ratingOverall));
    const averageInterviewExperience = this.calculateAverage(
      ratings.filter(r => r.ratingInterviewExperience !== null).map(r => r.ratingInterviewExperience!)
    );
    const averageTransparency = this.calculateAverage(
      ratings.filter(r => r.ratingTransparency !== null).map(r => r.ratingTransparency!)
    );
    const averageCommunication = this.calculateAverage(
      ratings.filter(r => r.ratingCommunication !== null).map(r => r.ratingCommunication!)
    );
    const averageOfferAccuracy = this.calculateAverage(
      ratings.filter(r => r.ratingOfferAccuracy !== null).map(r => r.ratingOfferAccuracy!)
    );
    const averageWorkLifeBalance = this.calculateAverage(
      ratings.filter(r => r.ratingWorkLifeBalance !== null).map(r => r.ratingWorkLifeBalance!)
    );

    // Calculate wouldWorkAgain percentage
    const wouldWorkAgainRatings = ratings.filter(r => r.wouldWorkAgain !== null);
    const wouldWorkAgainPercentage = wouldWorkAgainRatings.length > 0
      ? (wouldWorkAgainRatings.filter(r => r.wouldWorkAgain).length / wouldWorkAgainRatings.length) * 100
      : null;

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      distribution[r.ratingOverall as keyof typeof distribution]++;
    });

    // Calculate trust score
    const trustScoreData = await this.calculateTrustScore(employerId);

    return {
      employerId,
      totalRatings,
      averageOverall: averageOverall !== null ? Math.round(averageOverall * 10) / 10 : 0,
      averageInterviewExperience: averageInterviewExperience !== null ? Math.round(averageInterviewExperience * 10) / 10 : null,
      averageTransparency: averageTransparency !== null ? Math.round(averageTransparency * 10) / 10 : null,
      averageCommunication: averageCommunication !== null ? Math.round(averageCommunication * 10) / 10 : null,
      averageOfferAccuracy: averageOfferAccuracy !== null ? Math.round(averageOfferAccuracy * 10) / 10 : null,
      averageWorkLifeBalance: averageWorkLifeBalance !== null ? Math.round(averageWorkLifeBalance * 10) / 10 : null,
      wouldWorkAgainPercentage: wouldWorkAgainPercentage !== null ? Math.round(wouldWorkAgainPercentage) : null,
      ratingDistribution: distribution,
      trustScore: trustScoreData.trustScore,
      trustScoreGrade: trustScoreData.trustScoreGrade
    };
  }

  /**
   * Get user's own ratings
   */
  async getMyRatings(userId: string) {
    return this.prisma.rating.findMany({
      where: { raterId: userId },
      include: {
        employer: {
          select: {
            companyName: true,
            companyTradeName: true
          }
        },
        offer: {
          select: {
            jobTitle: true,
            publicId: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single rating by ID
   */
  async getRatingById(ratingId: string, userId?: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: ratingId },
      include: {
        employer: {
          select: {
            companyName: true,
            companyTradeName: true
          }
        },
        offer: {
          select: {
            jobTitle: true,
            publicId: true
          }
        }
      }
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    // Only show unpublished ratings to the rater
    if (!rating.isPublished && rating.raterId !== userId) {
      throw new ForbiddenException('Rating not found');
    }

    return rating;
  }

  // ============================================================================
  // TRUST SCORE CALCULATION
  // ============================================================================

  /**
   * Calculate trust score for an employer
   *
   * Trust Score Components (0-100 scale):
   * - Rating Component (40%): Based on average ratings and recency
   * - Verification Component (25%): Based on verification status
   * - Activity Component (20%): Based on response time and activity
   * - Consistency Component (15%): Based on rating consistency and volume
   *
   * Score Grades:
   * - 90-100: Excellent (A+)
   * - 80-89: Very Good (A)
   * - 70-79: Good (B)
   * - 60-69: Fair (C)
   * - 40-59: Poor (D)
   * - 0-39: Very Poor (F)
   */
  async calculateTrustScore(employerId: string): Promise<TrustScoreResponseDto> {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        ratings: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' }
        },
        offersSent: {
          select: {
            status: true,
            submittedAt: true,
            acceptedAt: true,
            rejectedAt: true
          }
        }
      }
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const ratings = employer.ratings;
    const totalRatings = ratings.length;

    // ==========================================================================
    // COMPONENT 1: RATING COMPONENT (40%)
    // ==========================================================================
    let ratingComponent = 50; // Default middle score

    if (totalRatings > 0) {
      // Base score from average rating (0-5 scale -> 0-100)
      const averageRating = ratings.reduce((sum, r) => sum + r.ratingOverall, 0) / totalRatings;
      const baseRatingScore = (averageRating / 5) * 100;

      // Recency bonus - more recent ratings weighted higher
      const now = Date.now();
      const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);
      const recentRatings = ratings.filter(r => r.createdAt.getTime() > sixMonthsAgo);
      const recencyWeight = recentRatings.length / totalRatings;
      const recencyBonus = recencyWeight * 20; // Up to 20 bonus points

      // Verified hire ratings bonus
      const verifiedRatings = ratings.filter(r => r.isVerifiedHire);
      const verifiedBonus = Math.min(verifiedRatings.length * 2, 10); // Up to 10 bonus points

      ratingComponent = Math.min(100, baseRatingScore + recencyBonus + verifiedBonus);
    }

    // ==========================================================================
    // COMPONENT 2: VERIFICATION COMPONENT (25%)
    // ==========================================================================
    let verificationComponent = 20; // Base score for having a profile

    switch (employer.verificationStatus) {
      case 'PREMIUM_VERIFIED':
        verificationComponent = 100;
        break;
      case 'BASIC_VERIFIED':
        verificationComponent = 70;
        break;
      case 'PENDING':
        verificationComponent = 40;
        break;
      case 'REJECTED':
        verificationComponent = 10;
        break;
    }

    // ==========================================================================
    // COMPONENT 3: ACTIVITY COMPONENT (20%)
    // ==========================================================================
    let activityComponent = 50; // Default

    const offers = employer.offersSent;
    const totalOffers = offers.length;

    if (totalOffers > 0) {
      // Acceptance rate factor (0-25 points)
      const acceptedCount = offers.filter(o => o.status === 'ACCEPTED').length;
      const acceptanceRate = acceptedCount / totalOffers;
      const acceptanceScore = acceptanceRate * 25;

      // Response activity - based on offer submission recency (0-25 points)
      const mostRecentOffer = offers.reduce((latest, o) =>
        o.submittedAt && (!latest || o.submittedAt > latest) ? o.submittedAt : latest,
        null as Date | null
      );

      let recencyScore = 0;
      if (mostRecentOffer) {
        const daysSinceLastOffer = (Date.now() - mostRecentOffer.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastOffer < 7) recencyScore = 25;
        else if (daysSinceLastOffer < 30) recencyScore = 20;
        else if (daysSinceLastOffer < 90) recencyScore = 15;
        else if (daysSinceLastOffer < 180) recencyScore = 10;
        else recencyScore = 5;
      }

      // Volume factor (0-25 points) - more offers = more data points
      let volumeScore = 0;
      if (totalOffers >= 50) volumeScore = 25;
      else if (totalOffers >= 20) volumeScore = 20;
      else if (totalOffers >= 10) volumeScore = 15;
      else if (totalOffers >= 5) volumeScore = 10;
      else if (totalOffers >= 1) volumeScore = 5;

      activityComponent = acceptanceScore + recencyScore + volumeScore;
    }

    // ==========================================================================
    // COMPONENT 4: CONSISTENCY COMPONENT (15%)
    // ==========================================================================
    let consistencyComponent = 50; // Default

    if (totalRatings > 0) {
      // Rating variance - lower variance = more consistent (0-50 points)
      const averageRating = ratings.reduce((sum, r) => sum + r.ratingOverall, 0) / totalRatings;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r.ratingOverall - averageRating, 2), 0) / totalRatings;
      const stdDev = Math.sqrt(variance);

      // Low stdDev = consistent ratings
      let consistencyScore = 0;
      if (stdDev <= 0.5) consistencyScore = 50;
      else if (stdDev <= 1.0) consistencyScore = 40;
      else if (stdDev <= 1.5) consistencyScore = 30;
      else if (stdDev <= 2.0) consistencyScore = 20;
      else consistencyScore = 10;

      // Volume confidence - more ratings = more reliable (0-50 points)
      let volumeConfidence = 0;
      if (totalRatings >= 100) volumeConfidence = 50;
      else if (totalRatings >= 50) volumeConfidence = 45;
      else if (totalRatings >= 25) volumeConfidence = 40;
      else if (totalRatings >= 10) volumeConfidence = 30;
      else if (totalRatings >= 5) volumeConfidence = 20;
      else if (totalRatings >= 1) volumeConfidence = 10;

      consistencyComponent = consistencyScore + volumeConfidence;
    }

    // ==========================================================================
    // FINAL TRUST SCORE CALCULATION
    // ==========================================================================
    const trustScore = Math.round(
      (ratingComponent * 0.40) +
      (verificationComponent * 0.25) +
      (activityComponent * 0.20) +
      (consistencyComponent * 0.15)
    );

    // Determine grade
    let trustScoreGrade: string;
    if (trustScore >= 90) trustScoreGrade = 'A+';
    else if (trustScore >= 80) trustScoreGrade = 'A';
    else if (trustScore >= 70) trustScoreGrade = 'B';
    else if (trustScore >= 60) trustScoreGrade = 'C';
    else if (trustScore >= 40) trustScoreGrade = 'D';
    else trustScoreGrade = 'F';

    // Identify positive and negative factors
    const positive: string[] = [];
    const negative: string[] = [];

    if (ratingComponent >= 70) positive.push('High average ratings from workers');
    else negative.push('Below average worker ratings');

    if (employer.verificationStatus === 'PREMIUM_VERIFIED') positive.push('Premium verified employer');
    else if (employer.verificationStatus === 'BASIC_VERIFIED') positive.push('Verified employer');
    else if (employer.verificationStatus === 'PENDING') negative.push('Verification pending');
    else if (employer.verificationStatus === 'REJECTED') negative.push('Verification rejected');

    if (totalRatings >= 25) positive.push(`${totalRatings} verified reviews`);
    else if (totalRatings === 0) negative.push('No reviews yet');

    const wouldWorkAgainCount = ratings.filter(r => r.wouldWorkAgain === true).length;
    if (totalRatings > 0 && wouldWorkAgainCount / totalRatings >= 0.8) {
      positive.push('High percentage would work again');
    }

    return {
      employerId,
      trustScore,
      trustScoreGrade,
      trustScoreBreakdown: {
        ratingComponent: Math.round(ratingComponent),
        verificationComponent: Math.round(verificationComponent),
        activityComponent: Math.round(activityComponent),
        consistencyComponent: Math.round(consistencyComponent)
      },
      factors: {
        positive,
        negative
      },
      lastUpdated: new Date()
    };
  }

  // ============================================================================
  // ADMIN: FLAG/UNFLAG RATING
  // ============================================================================

  /**
   * Flag a rating for review (admin function)
   */
  async flagRating(ratingId: string, adminUserId: string) {
    return this.prisma.rating.update({
      where: { id: ratingId },
      data: { flaggedAt: new Date() }
    });
  }

  /**
   * Unflag a rating (admin function)
   */
  async unflagRating(ratingId: string) {
    return this.prisma.rating.update({
      where: { id: ratingId },
      data: { flaggedAt: null }
    });
  }

  /**
   * Toggle rating publication status (admin function)
   */
  async toggleRatingPublication(ratingId: string, isPublished: boolean) {
    return this.prisma.rating.update({
      where: { id: ratingId },
      data: { isPublished }
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Update employer's aggregate rating statistics
   */
  private async updateEmployerAggregateStats(tx: any, employerId: string) {
    const stats = await this.getEmployerRatingStats(employerId);

    await tx.employer.update({
      where: { id: employerId },
      data: {
        reputationScore: stats.trustScore
      }
    });
  }

  /**
   * Calculate average of an array of numbers
   */
  private calculateAverage(numbers: number[]): number | null {
    if (numbers.length === 0) return null;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}
