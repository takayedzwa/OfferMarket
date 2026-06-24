/**
 * DTO for rating response - includes computed fields
 */
export class RatingResponseDto {
  id: string;
  offerId: string;
  employerId: string;
  raterId: string;
  ratingOverall: number;
  ratingInterviewExperience: number | null;
  ratingTransparency: number | null;
  ratingCommunication: number | null;
  ratingOfferAccuracy: number | null;
  ratingWorkLifeBalance: number | null;
  wouldWorkAgain: boolean | null;
  reviewText: string | null;
  reviewTitle: string | null;
  isPublished: boolean;
  isVerifiedHire: boolean;
  flaggedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Computed fields
  employerName?: string;
  employerTradeName?: string;
  jobTitle?: string;
  ratingAge?: string;
}

/**
 * DTO for employer rating statistics
 */
export class EmployerRatingStatsDto {
  employerId: string;
  totalRatings: number;
  averageOverall: number;
  averageInterviewExperience: number | null;
  averageTransparency: number | null;
  averageCommunication: number | null;
  averageOfferAccuracy: number | null;
  averageWorkLifeBalance: number | null;
  wouldWorkAgainPercentage: number | null;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  trustScore: number;
  trustScoreGrade: string;
}

/**
 * DTO for trust score response
 */
export class TrustScoreResponseDto {
  employerId: string;
  trustScore: number;
  trustScoreGrade: string;
  trustScoreBreakdown: {
    ratingComponent: number;
    verificationComponent: number;
    activityComponent: number;
    consistencyComponent: number;
  };
  factors: {
    positive: string[];
    negative: string[];
  };
  lastUpdated: Date;
}
