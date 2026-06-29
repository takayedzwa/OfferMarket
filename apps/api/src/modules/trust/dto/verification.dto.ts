import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, Max, IsObject } from 'class-validator';
import { VerificationLevel, RiskLevel, DocumentType, BackgroundCheckStatus, ReferenceCheckStatus } from '@prisma/client';

// ============================================================================
// EMPLOYER VERIFICATION DTOs
// ============================================================================

export class SubmitEmployerVerificationDto {
  @IsString()
  kvkNumber?: string;

  @IsString()
  vatNumber?: string;

  @IsObject()
  @IsOptional()
  companyData?: {
    companyName: string;
    registeredAddress: {
      street: string;
      houseNumber: string;
      postalCode: string;
      city: string;
      country: string;
    };
    foundedYear?: number;
    industry?: string;
  };
}

export class SubmitEmployerDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @IsOptional()
  documentSubtype?: string;

  @IsString()
  fileUrl: string;

  @IsString()
  @IsOptional()
  fileHash?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReviewEmployerVerificationDto {
  @IsEnum(VerificationLevel)
  verificationLevel: VerificationLevel;

  @IsBoolean()
  isApproved: boolean;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ============================================================================
// WORKER VERIFICATION DTOs
// ============================================================================

export class SubmitWorkerVerificationDto {
  @IsString()
  @IsOptional()
  identityMethod?: string;

  @IsObject()
  @IsOptional()
  identityData?: {
    documentType: string;
    documentNumber?: string;
    fullName?: string;
    dateOfBirth?: string;
    nationality?: string;
    expiryDate?: string;
  };

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;
}

export class SubmitWorkerDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @IsOptional()
  documentSubtype?: string;

  @IsString()
  fileUrl: string;

  @IsString()
  @IsOptional()
  fileHash?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SubmitBackgroundCheckDto {
  @IsString()
  @IsOptional()
  provider?: string;

  @IsObject()
  @IsOptional()
  checkData?: Record<string, any>;
}

export class SubmitReferenceCheckDto {
  @IsString()
  referenceType: 'PROFESSIONAL' | 'PERSONAL' | 'EMPLOYMENT';

  @IsString()
  referenceName: string;

  @IsString()
  @IsOptional()
  referenceContact?: string;

  @IsObject()
  @IsOptional()
  checkData?: Record<string, any>;
}

export class ReviewWorkerVerificationDto {
  @IsEnum(VerificationLevel)
  verificationLevel: VerificationLevel;

  @IsBoolean()
  isApproved: boolean;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

// ============================================================================
// IDENTITY VERIFICATION DTOs
// ============================================================================

export class InitiateIdentityCheckDto {
  @IsEnum(['DOCUMENT_VERIFICATION', 'FACIAL_RECOGNITION', 'LIVENESS_CHECK', 'ADDRESS_VERIFICATION', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION'])
  checkType: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;
}

export class SubmitIdentityCheckResultDto {
  @IsEnum(['PASS', 'FAIL', 'UNCERTAIN', 'ERROR'])
  result: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  confidenceScore?: number;

  @IsString()
  @IsOptional()
  failureReason?: string;

  @IsObject()
  @IsOptional()
  responsePayload?: Record<string, any>;
}

// ============================================================================
// VERIFICATION RESPONSE DTOs
// ============================================================================

export class EmployerVerificationResponseDto {
  employerId: string;
  kvkVerified: boolean;
  kvkVerifiedAt?: Date;
  vatVerified: boolean;
  vatVerifiedAt?: Date;
  companyVerified: boolean;
  documentVerified: boolean;
  verificationLevel: VerificationLevel;
  riskLevel: RiskLevel;
  riskScore: number;
  lastReviewAt?: Date;
  rejectionReason?: string;
  documents: Array<{
    id: string;
    documentType: DocumentType;
    status: string;
    verifiedAt?: Date;
  }>;
  logs: Array<{
    action: string;
    newStatus: string;
    reason?: string;
    createdAt: Date;
  }>;
}

export class WorkerVerificationResponseDto {
  workerId: string;
  identityVerified: boolean;
  identityVerifiedAt?: Date;
  identityMethod?: string;
  documentVerified: boolean;
  backgroundCheckStatus: BackgroundCheckStatus;
  referenceCheckStatus: ReferenceCheckStatus;
  certificationVerified: boolean;
  verificationLevel: VerificationLevel;
  riskLevel: RiskLevel;
  riskScore: number;
  lastReviewAt?: Date;
  rejectionReason?: string;
  documents: Array<{
    id: string;
    documentType: DocumentType;
    status: string;
    verifiedAt?: Date;
  }>;
  identityChecks: Array<{
    id: string;
    checkType: string;
    status: string;
    result?: string;
    confidenceScore?: number;
    checkedAt?: Date;
  }>;
}

export class VerificationLevelResponseDto {
  level: VerificationLevel;
  requirements: string[];
  benefits: string[];
}
