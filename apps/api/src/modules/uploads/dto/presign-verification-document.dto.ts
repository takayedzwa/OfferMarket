import { IsString, Length, Matches } from 'class-validator';

// ============================================================================
// PRESIGN VERIFICATION DOCUMENT DTO
// ----------------------------------------------------------------------------
// Validated at the boundary by the global ValidationPipe (whitelist +
// forbidNonWhitelisted), so only `fileName` and `mimeType` are accepted. The
// MIME allow-list is enforced both here (regex) and again in StorageService /
// the controller for defense in depth.
// ============================================================================

export class PresignVerificationDocumentDto {
  @IsString()
  @Length(1, 200)
  fileName: string;

  @IsString()
  @Matches(/^(application\/pdf|image\/png|image\/jpeg|image\/webp)$/, {
    message:
      'mimeType must be one of: application/pdf, image/png, image/jpeg, image/webp',
  })
  mimeType: string;
}