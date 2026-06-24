import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RatingsService } from '../ratings.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Mock Prisma Service for unit tests
 */
class MockPrismaService {
  rating = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  };

  worker = {
    findUnique: jest.fn()
  };

  employer = {
    findUnique: jest.fn(),
    update: jest.fn()
  };

  offer = {
    findUnique: jest.fn()
  };

  $transaction = jest.fn(async (fn) => {
    // Create a mock transaction context that includes this for nested calls
    const mockTx = {
      rating: this.rating,
      worker: this.worker,
      employer: this.employer,
      offer: this.offer,
      notification: { create: jest.fn() }
    };
    return fn(mockTx);
  });
}

describe('RatingsService', () => {
  let service: RatingsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = new MockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        { provide: PrismaService, useValue: prisma }
      ]
    }).compile();

    service = module.get<RatingsService>(RatingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // CREATE RATING TESTS
  // ============================================================================

  describe('createRating', () => {
    const mockUserId = 'user-123';
    const mockWorkerId = 'worker-456';
    const mockEmployerId = 'employer-789';
    const mockOfferId = 'offer-abc';

    const mockWorker = {
      id: mockWorkerId,
      userId: mockUserId
    };

    const mockOffer = {
      id: mockOfferId,
      workerId: mockWorkerId,
      employerId: mockEmployerId,
      status: 'ACCEPTED'
    };

    const createRatingDto = {
      offerId: mockOfferId,
      ratingOverall: 4,
      ratingInterviewExperience: 5,
      ratingTransparency: 4,
      ratingCommunication: 5,
      ratingOfferAccuracy: 4,
      ratingWorkLifeBalance: 3,
      wouldWorkAgain: true,
      reviewText: 'Great experience overall',
      reviewTitle: 'Professional team'
    };

    it('should create a rating successfully', async () => {
      // Arrange
      prisma.worker.findUnique.mockResolvedValue(mockWorker);
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.rating.findUnique.mockResolvedValue(null); // No existing rating
      prisma.rating.create.mockResolvedValue({
        id: 'rating-new',
        ...createRatingDto,
        raterId: mockUserId,
        employerId: mockEmployerId,
        isPublished: true,
        isVerifiedHire: true
      });
      prisma.employer.update.mockResolvedValue({});
      // Mock for getEmployerRatingStats call during aggregate update
      prisma.rating.findMany.mockResolvedValue([]);
      prisma.employer.findUnique.mockResolvedValue({
        id: mockEmployerId,
        verificationStatus: 'BASIC_VERIFIED',
        ratings: [],
        offersSent: []
      });

      // Act
      const result = await service.createRating(mockUserId, createRatingDto);

      // Assert
      expect(prisma.worker.findUnique).toHaveBeenCalledWith({ where: { userId: mockUserId } });
      expect(prisma.offer.findUnique).toHaveBeenCalledWith({
        where: { id: mockOfferId },
        include: { employer: true }
      });
      expect(prisma.rating.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          offerId: mockOfferId,
          raterId: mockUserId,
          employerId: mockEmployerId,
          ratingOverall: 4,
          isPublished: true,
          isVerifiedHire: true
        }),
        include: expect.any(Object)
      });
      expect(result.ratingOverall).toBe(4);
      expect(result.isVerifiedHire).toBe(true);
    });

    it('should throw NotFoundException when worker not found', async () => {
      // Arrange
      prisma.worker.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow(NotFoundException);
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow('Worker profile not found');
    });

    it('should throw NotFoundException when offer not found', async () => {
      // Arrange
      prisma.worker.findUnique.mockResolvedValue(mockWorker);
      prisma.offer.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow(NotFoundException);
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow('Offer not found');
    });

    it('should throw ForbiddenException when user did not receive the offer', async () => {
      // Arrange
      const otherWorker = { id: 'other-worker', userId: 'other-user' };
      prisma.worker.findUnique.mockResolvedValue(otherWorker);
      prisma.offer.findUnique.mockResolvedValue(mockOffer);

      // Act & Assert
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow(ForbiddenException);
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow('Not authorized to rate this offer');
    });

    it('should throw BadRequestException when rating already exists for offer', async () => {
      // Arrange
      prisma.worker.findUnique.mockResolvedValue(mockWorker);
      prisma.offer.findUnique.mockResolvedValue(mockOffer);
      prisma.rating.findUnique.mockResolvedValue({ id: 'existing-rating' });

      // Act & Assert
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow(BadRequestException);
      await expect(service.createRating(mockUserId, createRatingDto))
        .rejects
        .toThrow('You have already rated this offer');
    });

    it('should set isVerifiedHire to true for ACCEPTED offers', async () => {
      // Arrange
      const acceptedOffer = { ...mockOffer, status: 'ACCEPTED' };
      prisma.worker.findUnique.mockResolvedValue(mockWorker);
      prisma.offer.findUnique.mockResolvedValue(acceptedOffer);
      prisma.rating.findUnique.mockResolvedValue(null);
      prisma.rating.create.mockResolvedValue({ isVerifiedHire: true });
      prisma.employer.update.mockResolvedValue({});
      prisma.rating.findMany.mockResolvedValue([]);
      prisma.employer.findUnique.mockResolvedValue({
        id: mockEmployerId,
        verificationStatus: 'BASIC_VERIFIED',
        ratings: [],
        offersSent: []
      });

      // Act
      await service.createRating(mockUserId, createRatingDto);

      // Assert
      expect(prisma.rating.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerifiedHire: true
          })
        })
      );
    });

    it('should set isVerifiedHire to false for REJECTED offers', async () => {
      // Arrange
      const rejectedOffer = { ...mockOffer, status: 'REJECTED' };
      prisma.worker.findUnique.mockResolvedValue(mockWorker);
      prisma.offer.findUnique.mockResolvedValue(rejectedOffer);
      prisma.rating.findUnique.mockResolvedValue(null);
      prisma.rating.create.mockResolvedValue({ isVerifiedHire: false });
      prisma.employer.update.mockResolvedValue({});
      prisma.rating.findMany.mockResolvedValue([]);
      prisma.employer.findUnique.mockResolvedValue({
        id: mockEmployerId,
        verificationStatus: 'BASIC_VERIFIED',
        ratings: [],
        offersSent: []
      });

      // Act
      await service.createRating(mockUserId, createRatingDto);

      // Assert
      expect(prisma.rating.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerifiedHire: false
          })
        })
      );
    });
  });

  // ============================================================================
  // UPDATE RATING TESTS
  // ============================================================================

  describe('updateRating', () => {
    const mockUserId = 'user-123';
    const mockRatingId = 'rating-456';

    const mockRating = {
      id: mockRatingId,
      raterId: mockUserId,
      employerId: 'employer-789',
      ratingOverall: 3,
      reviewText: 'Original review'
    };

    const updateDto = {
      ratingOverall: 5,
      reviewText: 'Updated review'
    };

    it('should update a rating successfully', async () => {
      // Arrange
      prisma.rating.findUnique.mockResolvedValue(mockRating);
      prisma.rating.update.mockResolvedValue({
        ...mockRating,
        ...updateDto
      });
      prisma.employer.update.mockResolvedValue({});
      prisma.rating.findMany.mockResolvedValue([]);
      prisma.employer.findUnique.mockResolvedValue({
        id: mockRating.employerId,
        verificationStatus: 'BASIC_VERIFIED',
        ratings: [],
        offersSent: []
      });

      // Act
      const result = await service.updateRating(mockRatingId, mockUserId, updateDto);

      // Assert
      expect(prisma.rating.findUnique).toHaveBeenCalledWith({ where: { id: mockRatingId } });
      expect(prisma.rating.update).toHaveBeenCalledWith({
        where: { id: mockRatingId },
        data: updateDto,
        include: expect.any(Object)
      });
      expect(result.ratingOverall).toBe(5);
      expect(result.reviewText).toBe('Updated review');
    });

    it('should throw NotFoundException when rating not found', async () => {
      // Arrange
      prisma.rating.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateRating(mockRatingId, mockUserId, updateDto))
        .rejects
        .toThrow(NotFoundException);
      await expect(service.updateRating(mockRatingId, mockUserId, updateDto))
        .rejects
        .toThrow('Rating not found');
    });

    it('should throw ForbiddenException when user is not the rater', async () => {
      // Arrange
      const otherRating = { ...mockRating, raterId: 'other-user' };
      prisma.rating.findUnique.mockResolvedValue(otherRating);

      // Act & Assert
      await expect(service.updateRating(mockRatingId, mockUserId, updateDto))
        .rejects
        .toThrow(ForbiddenException);
      await expect(service.updateRating(mockRatingId, mockUserId, updateDto))
        .rejects
        .toThrow('Not authorized to update this rating');
    });
  });

  // ============================================================================
  // GET EMPLOYER RATINGS TESTS
  // ============================================================================

  describe('getEmployerRatings', () => {
    const mockEmployerId = 'employer-123';

    const mockRatings = [
      {
        id: 'rating-1',
        employerId: mockEmployerId,
        raterId: 'user-1',
        ratingOverall: 5,
        reviewText: 'Excellent!',
        reviewTitle: 'Great company',
        isPublished: true,
        isVerifiedHire: true,
        createdAt: new Date('2026-06-01'),
        rater: { id: 'user-1-full' },
        offer: { jobTitle: 'Software Engineer', publicId: 'OFF-2026-001', status: 'ACCEPTED' }
      },
      {
        id: 'rating-2',
        employerId: mockEmployerId,
        raterId: 'user-2',
        ratingOverall: 3,
        reviewText: 'Average experience',
        reviewTitle: null,
        isPublished: true,
        isVerifiedHire: false,
        createdAt: new Date('2026-06-10'),
        rater: { id: 'user-2-full' },
        offer: { jobTitle: 'Designer', publicId: 'OFF-2026-002', status: 'REJECTED' }
      }
    ];

    it('should return only published ratings', async () => {
      // Arrange
      prisma.rating.findMany.mockResolvedValue(mockRatings);

      // Act
      const result = await service.getEmployerRatings(mockEmployerId, 20, 0);

      // Assert
      expect(prisma.rating.findMany).toHaveBeenCalledWith({
        where: {
          employerId: mockEmployerId,
          isPublished: true
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0
      });
      expect(result).toHaveLength(2);
    });

    it('should anonymize rater identities', async () => {
      // Arrange
      prisma.rating.findMany.mockResolvedValue(mockRatings);

      // Act
      const result = await service.getEmployerRatings(mockEmployerId, 20, 0);

      // Assert
      expect(result[0].rater.id).toBe('user-1...');
      expect(result[1].rater.id).toBe('user-2...');
    });
  });

  // ============================================================================
  // GET EMPLOYER RATING STATS TESTS
  // ============================================================================

  describe('getEmployerRatingStats', () => {
    const mockEmployerId = 'employer-123';

    it('should return default stats when no ratings exist', async () => {
      // Arrange
      prisma.rating.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getEmployerRatingStats(mockEmployerId);

      // Assert
      expect(result.totalRatings).toBe(0);
      expect(result.averageOverall).toBe(0);
      expect(result.trustScore).toBe(50);
      expect(result.trustScoreGrade).toBe('N/A');
    });

    it('should calculate correct average ratings', async () => {
      // Arrange
      const mockRatings = [
        { ratingOverall: 5, ratingInterviewExperience: 5, ratingTransparency: 4, ratingCommunication: 5, ratingOfferAccuracy: 4, ratingWorkLifeBalance: 3, wouldWorkAgain: true, createdAt: new Date() },
        { ratingOverall: 3, ratingInterviewExperience: 3, ratingTransparency: 3, ratingCommunication: 4, ratingOfferAccuracy: 3, ratingWorkLifeBalance: 2, wouldWorkAgain: false, createdAt: new Date() },
        { ratingOverall: 4, ratingInterviewExperience: 4, ratingTransparency: 5, ratingCommunication: 4, ratingOfferAccuracy: 5, ratingWorkLifeBalance: 4, wouldWorkAgain: true, createdAt: new Date() }
      ];
      prisma.rating.findMany.mockResolvedValue(mockRatings);
      prisma.employer.findUnique.mockResolvedValue({
        id: mockEmployerId,
        verificationStatus: 'BASIC_VERIFIED',
        ratings: mockRatings,
        offersSent: [{ status: 'ACCEPTED', submittedAt: new Date(), acceptedAt: new Date() }]
      });

      // Act
      const result = await service.getEmployerRatingStats(mockEmployerId);

      // Assert
      expect(result.totalRatings).toBe(3);
      expect(result.averageOverall).toBe(4); // (5+3+4)/3 = 4
      expect(result.ratingDistribution).toEqual({
        5: 1,
        4: 1,
        3: 1,
        2: 0,
        1: 0
      });
      expect(result.wouldWorkAgainPercentage).toBe(67); // 2/3 = 66.67% -> 67
    });
  });

  // ============================================================================
  // TRUST SCORE CALCULATION TESTS
  // ============================================================================

  describe('calculateTrustScore', () => {
    const mockEmployerId = 'employer-123';

    const mockEmployer = {
      id: mockEmployerId,
      verificationStatus: 'BASIC_VERIFIED' as const,
      ratings: [],
      offersSent: []
    };

    it('should return trust score breakdown for employer', async () => {
      // Arrange
      prisma.employer.findUnique.mockResolvedValue({
        ...mockEmployer,
        ratings: [
          { ratingOverall: 5, isVerifiedHire: true, wouldWorkAgain: true, createdAt: new Date() },
          { ratingOverall: 4, isVerifiedHire: true, wouldWorkAgain: true, createdAt: new Date() },
          { ratingOverall: 5, isVerifiedHire: false, wouldWorkAgain: true, createdAt: new Date() }
        ],
        offersSent: [
          { status: 'ACCEPTED', submittedAt: new Date(), acceptedAt: new Date() },
          { status: 'REJECTED', submittedAt: new Date(), rejectedAt: new Date() }
        ]
      });

      // Act
      const result = await service.calculateTrustScore(mockEmployerId);

      // Assert
      expect(result).toHaveProperty('trustScore');
      expect(result).toHaveProperty('trustScoreGrade');
      expect(result).toHaveProperty('trustScoreBreakdown');
      expect(result.trustScoreBreakdown).toHaveProperty('ratingComponent');
      expect(result.trustScoreBreakdown).toHaveProperty('verificationComponent');
      expect(result.trustScoreBreakdown).toHaveProperty('activityComponent');
      expect(result.trustScoreBreakdown).toHaveProperty('consistencyComponent');
      expect(result).toHaveProperty('factors');
      expect(result.factors).toHaveProperty('positive');
      expect(result.factors).toHaveProperty('negative');
    });

    it('should give high verification score for PREMIUM_VERIFIED employers', async () => {
      // Arrange
      prisma.employer.findUnique.mockResolvedValue({
        ...mockEmployer,
        verificationStatus: 'PREMIUM_VERIFIED',
        ratings: [{ ratingOverall: 5, isVerifiedHire: true, wouldWorkAgain: true, createdAt: new Date() }],
        offersSent: [{ status: 'ACCEPTED', submittedAt: new Date(), acceptedAt: new Date() }]
      });

      // Act
      const result = await service.calculateTrustScore(mockEmployerId);

      // Assert
      expect(result.trustScoreBreakdown.verificationComponent).toBe(100);
    });

    it('should give low verification score for REJECTED employers', async () => {
      // Arrange
      prisma.employer.findUnique.mockResolvedValue({
        ...mockEmployer,
        verificationStatus: 'REJECTED',
        ratings: [{ ratingOverall: 5, isVerifiedHire: true, wouldWorkAgain: true, createdAt: new Date() }],
        offersSent: [{ status: 'ACCEPTED', submittedAt: new Date(), acceptedAt: new Date() }]
      });

      // Act
      const result = await service.calculateTrustScore(mockEmployerId);

      // Assert
      expect(result.trustScoreBreakdown.verificationComponent).toBe(10);
    });

    it('should calculate trust score grade correctly', async () => {
      const testCases = [
        { score: 95, expectedGrade: 'A+' },
        { score: 85, expectedGrade: 'A' },
        { score: 75, expectedGrade: 'B' },
        { score: 65, expectedGrade: 'C' },
        { score: 50, expectedGrade: 'D' },
        { score: 30, expectedGrade: 'F' }
      ];

      for (const { score, expectedGrade } of testCases) {
        // Mock to return a specific score
        jest.spyOn(service as any, 'calculateTrustScore').mockImplementationOnce(async () => ({
          employerId: mockEmployerId,
          trustScore: score,
          trustScoreGrade: expectedGrade,
          trustScoreBreakdown: {
            ratingComponent: 80,
            verificationComponent: 70,
            activityComponent: 60,
            consistencyComponent: 50
          },
          factors: { positive: [], negative: [] },
          lastUpdated: new Date()
        }));

        const result = await service.calculateTrustScore(mockEmployerId);
        expect(result.trustScoreGrade).toBe(expectedGrade);
      }
    });

    it('should identify positive factors for good employers', async () => {
      // Arrange
      prisma.employer.findUnique.mockResolvedValue({
        ...mockEmployer,
        verificationStatus: 'PREMIUM_VERIFIED',
        ratings: Array(30).fill({ ratingOverall: 5, isVerifiedHire: true, wouldWorkAgain: true, createdAt: new Date() }),
        offersSent: Array(50).fill({ status: 'ACCEPTED', submittedAt: new Date(), acceptedAt: new Date() })
      });

      // Act
      const result = await service.calculateTrustScore(mockEmployerId);

      // Assert
      expect(result.factors.positive.length).toBeGreaterThan(0);
      expect(result.factors.positive).toContain('Premium verified employer');
    });

    it('should identify negative factors for employers with no reviews', async () => {
      // Arrange
      prisma.employer.findUnique.mockResolvedValue({
        ...mockEmployer,
        ratings: [],
        offersSent: []
      });

      // Act
      const result = await service.calculateTrustScore(mockEmployerId);

      // Assert
      expect(result.factors.negative).toContain('No reviews yet');
    });
  });

  // ============================================================================
  // HELPER METHOD TESTS
  // ============================================================================

  describe('calculateAverage', () => {
    it('should calculate average correctly', () => {
      const numbers = [5, 4, 3, 4, 5];
      const result = (service as any).calculateAverage(numbers);
      expect(result).toBe(4.2);
    });

    it('should return null for empty array', () => {
      const result = (service as any).calculateAverage([]);
      expect(result).toBe(null);
    });

    it('should handle single element', () => {
      const result = (service as any).calculateAverage([5]);
      expect(result).toBe(5);
    });
  });
});
