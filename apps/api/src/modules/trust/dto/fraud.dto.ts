import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, Max, IsObject, IsArray } from 'class-validator';
import { SuspiciousActivityType, FraudIndicatorType, SeverityLevel, ActivityStatus, DuplicateMatchType } from '@prisma/client';

// ============================================================================
// SUSPICIOUS ACTIVITY DTOs
// ============================================================================

export class ReportSuspiciousActivityDto {
  @IsEnum(['USER', 'WORKER', 'EMPLOYER', 'OFFER', 'CONVERSATION'])
  entityType: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(['RAPID_ACCOUNT_CREATION', 'MULTIPLE_FAILED_LOGINS', 'UNUSUAL_LOGIN_LOCATION', 'BULK_DATA_ACCESS', 'RATE_LIMIT_EXCEEDED', 'PAYMENT_ANOMALY', 'PROFILE_MANIPULATION', 'MESSAGE_SPAM', 'FAKE_DOCUMENT_UPLOAD', 'IDENTITY_MISMATCH', 'DUPLICATE_ACCOUNT', 'BOT_BEHAVIOR', 'CIRCUMVENTION_ATTEMPT', 'DATA_SCRAPING'])
  activityType: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  severity?: SeverityLevel;

  @IsString()
  description: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  fingerprint?: string;
}

export class ReviewSuspiciousActivityDto {
  @IsEnum(['NEW', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE', 'RESOLVED', 'ESCALATED'])
  status: string;

  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @IsString()
  @IsOptional()
  actionTaken?: string;

  @IsBoolean()
  @IsOptional()
  isFalsePositive?: boolean;
}

// ============================================================================
// FRAUD INDICATOR DTOs
// ============================================================================

export class CreateFraudIndicatorDto {
  @IsEnum(['USER', 'WORKER', 'EMPLOYER', 'OFFER', 'CONVERSATION'])
  entityType: string;

  @IsString()
  entityId: string;

  @IsEnum(['DOCUMENT_FRAUD', 'IDENTITY_FRAUD', 'PAYMENT_FRAUD', 'ACCOUNT_TAKEOVER', 'SYNTHETIC_IDENTITY', 'BUSINESS_FRAUD', 'REVIEW_MANIPULATION', 'OFFER_FRAUD'])
  indicatorType: string;

  @IsString()
  description: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity: SeverityLevel;

  @IsBoolean()
  @IsOptional()
  isConfirmed?: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceScore?: number;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

export class UpdateFraudIndicatorDto {
  @IsBoolean()
  @IsOptional()
  isConfirmed?: boolean;

  @IsBoolean()
  @IsOptional()
  isFalsePositive?: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceScore?: number;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

// ============================================================================
// DUPLICATE ACCOUNT DTOs
// ============================================================================

export class DuplicateAccountMatchDto {
  @IsString()
  primaryUserId: string;

  @IsString()
  suspectedUserId: string;

  @IsEnum(['EMAIL', 'PHONE', 'IP_ADDRESS', 'DEVICE_FINGERPRINT', 'DOCUMENT_NUMBER', 'ADDRESS', 'NAME_SIMILARITY', 'COMPOSITE'])
  matchType: string;

  @IsArray()
  matchFields: string[];

  @IsInt()
  @Min(0)
  @Max(100)
  confidenceScore: number;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;
}

export class ReviewDuplicateAccountDto {
  @IsBoolean()
  isConfirmed: boolean;

  @IsBoolean()
  @IsOptional()
  isFalsePositive?: boolean;

  @IsString()
  @IsOptional()
  actionTaken?: string;
}

// ============================================================================
// BLACKLIST DTOs
// ============================================================================

export class AddToBlacklistDto {
  @IsEnum(['USER', 'WORKER', 'EMPLOYER', 'OFFER', 'CONVERSATION'])
  entityType: string;

  @IsString()
  entityId: string;

  @IsString()
  reason: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity: SeverityLevel;

  @IsString()
  source: string;

  @IsObject()
  @IsOptional()
  evidence?: Record<string, any>;

  @IsString()
  @IsOptional()
  expiresAt?: string;
}

export class ReviewBlacklistEntryDto {
  @IsBoolean()
  isActive: boolean;

  @IsString()
  @IsOptional()
  reviewNotes?: string;
}

// ============================================================================
// FRAUD PREVENTION RESPONSE DTOs
// ============================================================================

export class SuspiciousActivityResponseDto {
  id: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  activityType: string;
  severity: SeverityLevel;
  riskScore: number;
  description: string;
  status: string;
  isFalsePositive: boolean;
  createdAt: Date;
  reviewedAt?: Date;
  actionTaken?: string;
}

export class FraudIndicatorResponseDto {
  id: string;
  entityType: string;
  entityId: string;
  indicatorType: string;
  description: string;
  severity: SeverityLevel;
  isConfirmed: boolean;
  isFalsePositive: boolean;
  confidenceScore: number;
  createdAt: Date;
}

export class DuplicateAccountResponseDto {
  id: string;
  primaryUserId: string;
  suspectedUserId: string;
  matchType: string;
  matchFields: string[];
  confidenceScore: number;
  isConfirmed: boolean;
  isFalsePositive: boolean;
  actionTaken?: string;
  createdAt: Date;
}

export class BlacklistEntryResponseDto {
  id: string;
  entityType: string;
  entityId: string;
  reason: string;
  severity: SeverityLevel;
  source: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export class FraudReportResponseDto {
  totalActivities: number;
  newActivities: number;
  confirmedFraud: number;
  falsePositives: number;
  activities: SuspiciousActivityResponseDto[];
  indicators: FraudIndicatorResponseDto[];
  blacklistCount: number;
}
