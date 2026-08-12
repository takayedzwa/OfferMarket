import { IsString, IsOptional, IsBoolean, IsEnum, IsObject, Matches } from 'class-validator';
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

  /**
   * Server-generated object key returned by POST /uploads/verification-document.
   * The service validates this starts with `verification/{employerId}/` before
   * persisting — a client must not supply an arbitrary URL or another
   * employer's prefix.
   */
  @IsString()
  key: string;

  /** Client-computed SHA-256 of the uploaded file, for integrity tracking. */
  @IsString()
  fileHash: string;

  /**
   * MIME type of the uploaded file. The allow-list is enforced here (regex) and
   * re-checked in the service for defense in depth. Stored on the document row
   * so the audit trail reflects what was actually uploaded.
   */
  @IsString()
  @Matches(/^(application\/pdf|image\/png|image\/jpeg|image\/webp)$/, {
    message:
      'mimeType must be one of: application/pdf, image/png, image/jpeg, image/webp',
  })
  mimeType: string;

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

export class ReviewVerificationDocumentDto {
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
