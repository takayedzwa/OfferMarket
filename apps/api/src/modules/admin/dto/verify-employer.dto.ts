import { IsString, IsOptional, MinLength } from 'class-validator';

/**
 * DTO for POST /admin/employers/:id/verify.
 * A-H4: previously the controller read @Body('notes') directly with no
 * validation class. The existing VerifyEmployerDto was defined but unused and
 * its fields did not match the endpoint — redefined here to validate the
 * actual body shape.
 */
export class VerifyEmployerDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for POST /admin/employers/:id/reject.
 * A rejection reason is required so the audit trail records why an employer
 * was denied verification.
 */
export class RejectEmployerDto {
  @IsString()
  @MinLength(1)
  reason: string;
}