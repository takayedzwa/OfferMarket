import { IsString, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { VerificationLevel, RiskLevel, DocumentType } from '@prisma/client';

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

export class VerificationLevelResponseDto {
  level: VerificationLevel;
  requirements: string[];
  benefits: string[];
}
