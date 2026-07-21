import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateIf, IsIn } from 'class-validator';
import { ConsentType, LegalBasis, DataSubjectRequestType, ExportFormat, BreachSeverity, BreachStatus } from '@prisma/client';

// ============================================================================
// CONSENT DTOs
// ============================================================================

export class RecordConsentDto {
  @IsEnum(ConsentType)
  consentType!: ConsentType;

  @IsEnum(LegalBasis)
  legalBasis!: LegalBasis;

  @IsString()
  version!: string;

  @IsBoolean()
  granted!: boolean;
}

export class WithdrawConsentDto {
  @IsEnum(ConsentType)
  consentType!: ConsentType;
}

// ============================================================================
// DATA SUBJECT REQUEST DTOs
// ============================================================================

export class CreateDataSubjectRequestDto {
  @IsEnum(DataSubjectRequestType)
  requestType!: DataSubjectRequestType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ProcessDataSubjectRequestDto {
  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

// ============================================================================
// DATA EXPORT DTOs
// ============================================================================

export class CreateDataExportDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dataCategories?: string[];
}

// ============================================================================
// DATA DELETION DTOs
// ============================================================================

export class CreateDataDeletionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ConfirmDataDeletionDto {
  @IsString()
  requestId!: string;
}

// ============================================================================
// PROCESSING RESTRICTION DTOs
// ============================================================================

export class SetProcessingRestrictionDto {
  @IsBoolean()
  restricted!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ============================================================================
// RECTIFICATION DTOs
// ============================================================================

export class RectificationRequestDto {
  @IsString()
  @IsIn(['email', 'phone', 'headline', 'summary', 'postalCode', 'companyName', 'website'])
  field!: string;

  @IsString()
  correctedValue!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ============================================================================
// BREACH NOTIFICATION DTOs (Admin)
// ============================================================================

export class CreateBreachNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  affectedDataCategories!: string[];

  @IsOptional()
  @IsEnum(BreachSeverity)
  severity?: BreachSeverity;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  remediationSteps?: string;
}

export class UpdateBreachNotificationDto {
  @IsOptional()
  @IsEnum(BreachStatus)
  status?: BreachStatus;

  @IsOptional()
  @IsString()
  containedAt?: string;

  @IsOptional()
  @IsString()
  reportedToAuthorityAt?: string;

  @IsOptional()
  @IsString()
  reportedToUsersAt?: string;

  @IsOptional()
  @IsString()
  authorityReference?: string;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  remediationSteps?: string;
}

// ============================================================================
// AUTOMATED DECISION OBJECTION DTO (GDPR Article 22)
// ============================================================================

export class AutomatedDecisionObjectionDto {
  @IsString()
  decisionType!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsBoolean()
  requestHumanReview?: boolean;
}