import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// ============================================================================
// STORAGE MODULE
// ----------------------------------------------------------------------------
// Provides the dependency-free StorageService (presigned S3 URLs). Imported
// by any module that needs direct-to-S3 uploads (currently UploadsModule).
// ============================================================================

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}