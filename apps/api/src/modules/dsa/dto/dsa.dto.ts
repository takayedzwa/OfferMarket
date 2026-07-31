import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsObject,
  IsArray,
  IsDateString,
} from 'class-validator';
import {
  ContentReportTarget,
  ContentReportCategory,
  ContentReportPriority,
  ContentReportAssessment,
  ContentReportAction,
  ContentReportResolution,
  ContentRestrictionType,
  DecisionSource,
  AppealStatus,
  DSAComplaintType,
  MisuseType,
  WarningLevel,
} from '@prisma/client';

// ============================================================================
// Content Report DTOs — DSA Art. 16: Notice-and-Action
// ============================================================================

export class CreateContentReportDto {
  @IsEnum(ContentReportTarget)
  targetType!: ContentReportTarget;

  @IsString()
  targetId!: string;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsEnum(ContentReportCategory)
  category!: ContentReportCategory;

  @IsString()
  @IsOptional()
  illegalContentType?: string;

  @IsString()
  explanation!: string;

  @IsBoolean()
  @IsOptional()
  goodFaithDeclaration?: boolean;

  @IsObject()
  @IsOptional()
  evidence?: Record<string, any>;

  @IsString()
  @IsOptional()
  reporterEmail?: string;
}

export class AssessContentReportDto {
  @IsEnum(ContentReportAssessment)
  assessmentResult!: ContentReportAssessment;

  @IsString()
  @IsOptional()
  assessmentNotes?: string;

  @IsEnum(ContentReportPriority)
  @IsOptional()
  priority?: ContentReportPriority;
}

export class TakeActionDto {
  @IsEnum(ContentReportAction)
  actionTaken!: ContentReportAction;

  @IsObject()
  @IsOptional()
  actionDetails?: Record<string, any>;
}

export class ResolveContentReportDto {
  @IsEnum(ContentReportResolution)
  resolution!: ContentReportResolution;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

export class EscalateToAuthoritiesDto {
  @IsString()
  @IsOptional()
  authorityReferralNotes?: string;
}

export class FlagMisuseDto {
  @IsEnum(MisuseType)
  misuseType!: MisuseType;

  @IsString()
  description!: string;

  @IsEnum(WarningLevel)
  @IsOptional()
  warningLevel?: WarningLevel;
}

// ============================================================================
// Statement of Reasons DTOs — DSA Art. 17
// ============================================================================

export class CreateStatementOfReasonsDto {
  @IsEnum(ContentRestrictionType)
  restrictionType!: ContentRestrictionType;

  @IsString()
  @IsOptional()
  restrictedContentId?: string;

  @IsString()
  @IsOptional()
  restrictedContentType?: string;

  @IsArray()
  @IsString({ each: true })
  reasons!: string[];

  @IsString()
  detailedExplanation!: string;

  @IsEnum(DecisionSource)
  decisionSource!: DecisionSource;

  @IsString()
  @IsOptional()
  legalBasis?: string;

  @IsString()
  @IsOptional()
  contractualBasis?: string;

  @IsString()
  @IsOptional()
  territorialScope?: string;

  @IsString()
  @IsOptional()
  restrictionDuration?: string;

  @IsString()
  @IsOptional()
  notificationMethod?: string;

  @IsBoolean()
  @IsOptional()
  automatedMeans?: boolean;
}

// ============================================================================
// DSA Complaint DTOs — DSA Art. 20
// ============================================================================

export class CreateDSAComplaintDto {
  @IsEnum(DSAComplaintType)
  complaintType!: DSAComplaintType;

  @IsString()
  description!: string;

  @IsString()
  @IsOptional()
  resolutionSought?: string;

  @IsString()
  @IsOptional()
  contentReportId?: string;

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsString()
  @IsOptional()
  relatedEntityId?: string;
}

export class ComplaintMessageDto {
  @IsString()
  content!: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;

  @IsObject()
  @IsOptional()
  attachments?: Record<string, any>;
}

// ============================================================================
// Appeal DTOs — DSA Art. 20(4)
// ============================================================================

export class AppealDecisionDto {
  @IsEnum(AppealStatus)
  appealStatus!: AppealStatus;

  @IsString()
  @IsOptional()
  appealDecision?: string;
}

// ============================================================================
// Transparency Report DTOs — DSA Art. 15/24
// ============================================================================

export class GenerateTransparencyReportDto {
  // A-M7: validate the date format at the boundary so malformed input is
  // rejected as 400 instead of bubbling up as a Prisma error. The controller
  // additionally enforces periodEnd >= periodStart.
  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}