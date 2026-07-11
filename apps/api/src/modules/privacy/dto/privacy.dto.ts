import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateIf } from 'class-validator';
import { ConsentType, LegalBasis, DataSubjectRequestType, ExportFormat } from '@prisma/client';

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
}

// ============================================================================
// RECTIFICATION DTOs
// ============================================================================

export class RectificationRequestDto {
  @IsString()
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
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  remediationSteps?: string;
}

export class UpdateBreachNotificationDto {
  @IsOptional()
  @IsString()
  status?: string;

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