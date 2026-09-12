import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * WORKER CREDENTIAL REVIEW DTOs
 *
 * Nurses (and future regulated trades) declare credentials as Certifications
 * (BIG-registration, VOG, professional liability insurance). Admins review
 * them via POST /admin/certifications/:id/verify and /reject.
 */
export class VerifyCredentialDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectCredentialDto {
  @IsString()
  @MinLength(1)
  reason: string;
}