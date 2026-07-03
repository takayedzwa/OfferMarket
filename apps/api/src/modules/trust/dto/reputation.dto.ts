import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, Max, IsObject, IsNumber } from 'class-validator';

// ============================================================================
// REPUTATION SCORING DTOs
// ============================================================================

export class ReputationScoreFactorsDto {
  @IsInt()
  @Min(0)
  @Max(100)
  verificationScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  behaviorScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  reputationScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  activityScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  consistencyScore?: number;
}

export class CalculateReputationScoreDto {
  @IsString()
  @IsOptional()
  employerId?: string;

  @IsString()
  @IsOptional()
  workerId?: string;

  @IsObject()
  @IsOptional()
  customWeights?: Record<string, number>;
}

export class ReputationScoreResponseDto {
  entityId: string;
  entityType: 'WORKER' | 'EMPLOYER';
  overallScore: number;
  scoreGrade: string;
  scoreBreakdown: {
    verificationScore: number;
    behaviorScore: number;
    reputationScore: number;
    activityScore: number;
    consistencyScore: number;
  };
  riskAdjustedScore: number;
  factors: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  history: Array<{
    date: Date;
    score: number;
    change: number;
    reason: string;
  }>;
  lastCalculatedAt: Date;
}

export class ReputationHistoryResponseDto {
  entityId: string;
  history: Array<{
    date: Date;
    overallScore: number;
    scoreGrade: string;
    verificationScore?: number;
    behaviorScore?: number;
    reputationScore?: number;
    change?: number;
    reason?: string;
  }>;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  averageScore: number;
  volatility: number;
}

// ============================================================================
// EMPLOYER REPUTATION DTOs
// ============================================================================

export class EmployerReputationDto {
  employerId: string;
  companyName: string;
  overallScore: number;
  scoreGrade: string;
  verificationLevel: string;
  totalOffers: number;
  acceptanceRate: number;
  avgResponseTimeHours: number;
  totalRatings: number;
  averageRating: number;
  wouldWorkAgainPercentage: number;
  riskLevel: string;
  flags: string[];
  lastActiveAt: Date;
}

// ============================================================================
// WORKER REPUTATION DTOs
// ============================================================================

export class WorkerReputationDto {
  workerId: string;
  publicId: string;
  overallScore: number;
  scoreGrade: string;
  verificationLevel: string;
  totalOffersReceived: number;
  acceptanceRate: number;
  avgResponseTimeHours: number;
  totalRatings: number;
  averageRating: number;
  riskLevel: string;
  flags: string[];
  lastActiveAt: Date;
}

// ============================================================================
// SCORE UPDATE DTOs
// ============================================================================

export class UpdateReputationScoreDto {
  @IsInt()
  @Min(0)
  @Max(100)
  overallScore: number;

  @IsString()
  @IsOptional()
  scoreGrade?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  employerScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  workerScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  verificationScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  behaviorScore?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  reputationScore?: number;

  @IsObject()
  @IsOptional()
  factors?: Record<string, any>;

  @IsString()
  @IsOptional()
  reason?: string;
}
